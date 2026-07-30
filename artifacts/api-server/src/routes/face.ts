import { Router, type Request, type Response } from "express";
import { z } from "zod";
import rateLimit from "express-rate-limit";
import { requireAuth } from "../middlewares/auth";

const FACE_MATCH_THRESHOLD = 0.6;

const faceLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many face verification attempts, please try again later' },
});

const StoreFaceSchema = z.object({
  credential_id: z.string().uuid(),
  face_image_url: z.string().url().optional(),
  face_embedding: z.array(z.number()).min(128).max(128),
});

const VerifyFaceSchema = z.object({
  credential_id: z.string().uuid(),
  live_embedding: z.array(z.number()).min(128).max(128).optional(),
  live_image_base64: z.string().min(1).optional(),
}).refine(
  (data) => data.live_embedding || data.live_image_base64,
  { message: 'Either live_embedding or live_image_base64 must be provided' }
);

function euclideanDistance(a: number[], b: number[]): number {
  let sum = 0;
  for (let i = 0; i < a.length; i++) {
    const diff = a[i] - b[i];
    sum += diff * diff;
  }
  return Math.sqrt(sum);
}

const router = Router();

router.post("/face/store", faceLimiter, requireAuth, async (req: Request, res: Response) => {
  try {
    const parsed = StoreFaceSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Validation failed', details: parsed.error.issues });
      return;
    }

    const { credential_id, face_image_url, face_embedding } = parsed.data;
    const embeddingStr = JSON.stringify(face_embedding);

    const { data, error } = await req.app.locals.supabase
      .from('issued_credentials')
      .update({
        face_image_url: face_image_url || null,
        face_embedding: embeddingStr,
        face_verification_status: 'pending',
        updated_at: new Date().toISOString(),
      })
      .eq('id', credential_id)
      .select('id, face_verification_status')
      .single();

    if (error) throw error;

    return res.json({ success: true, credential: data });
  } catch (err: any) {
    return res.status(500).json({ error: 'An internal error occurred' });
  }
});

router.post("/face/verify", faceLimiter, requireAuth, async (req: Request, res: Response) => {
  try {
    const parsed = VerifyFaceSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Validation failed', details: parsed.error.issues });
      return;
    }

    const { credential_id, live_embedding, live_image_base64 } = parsed.data;

    const { data: cred, error: fetchError } = await req.app.locals.supabase
      .from('issued_credentials')
      .select('face_embedding, face_verification_status')
      .eq('id', credential_id)
      .single();

    if (fetchError || !cred) {
      res.status(404).json({ error: 'Credential not found' });
      return;
    }

    if (!cred.face_embedding) {
      res.status(400).json({ error: 'No face data on file for this credential' });
      return;
    }

    const storedEmbedding: number[] = JSON.parse(cred.face_embedding);

    let comparisonEmbedding: number[];

    if (live_embedding && live_embedding.length >= 128) {
      comparisonEmbedding = live_embedding;
    } else if (live_image_base64) {
      let faceApi: any;
      try {
        faceApi = await import('@vladmandic/face-api');
      } catch {
        res.status(501).json({
          error: 'Server-side face embedding computation not available. Ensure @vladmandic/face-api is installed.',
        });
        return;
      }

      const canvasModule = await import('canvas');
      const { Canvas, Image } = canvasModule;
      faceApi.env.monkeyPatch({ Canvas, Image });

      const modelPath = 'https://vladmandic.github.io/face-api/model/';
      await faceApi.nets.ssdMobilenetv1.loadFromUri(modelPath);
      await faceApi.nets.faceLandmark68Net.loadFromUri(modelPath);
      await faceApi.nets.faceRecognitionNet.loadFromUri(modelPath);

      const img = new Image();
      const base64Data = live_image_base64.replace(/^data:image\/\w+;base64,/, '');
      img.src = Buffer.from(base64Data, 'base64');

      const detection = await faceApi
        .detectSingleFace(img, new faceApi.SsdMobilenetv1Options())
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (!detection) {
        res.status(400).json({ error: 'No face detected in the provided image' });
        return;
      }

      comparisonEmbedding = Array.from(detection.descriptor);
    } else {
      res.status(400).json({ error: 'Either live_embedding or live_image_base64 must be provided' });
      return;
    }

    if (storedEmbedding.length !== comparisonEmbedding.length) {
      res.status(400).json({ error: 'Embedding dimension mismatch' });
      return;
    }

    const distance = euclideanDistance(storedEmbedding, comparisonEmbedding);
    const match = distance < FACE_MATCH_THRESHOLD;
    const confidence = Math.max(0, (1 - distance) * 100);

    await req.app.locals.supabase
      .from('issued_credentials')
      .update({
        face_verification_status: match ? 'verified' : 'failed',
        updated_at: new Date().toISOString(),
      })
      .eq('id', credential_id);

    return res.json({ match, distance, confidence: confidence.toFixed(1) });
  } catch (err: any) {
    return res.status(500).json({ error: 'An internal error occurred' });
  }
});

export default router;
