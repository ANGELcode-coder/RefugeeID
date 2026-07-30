import { Router, type Request, type Response } from "express";
import { z } from "zod";
import rateLimit from "express-rate-limit";
import { requireAuth } from "../middlewares/auth";

const FACE_MATCH_THRESHOLD = 0.6;

const claimLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many claim attempts, please try again later' },
});

const verifyLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many verification attempts, please try again later' },
});

const ClaimSchema = z.object({
  claim_code: z.string().length(8),
  user_id: z.string().uuid(),
  face_embedding: z.array(z.number()).min(128).max(128).optional(),
});

const VerifySchema = z.object({
  claim_code: z.string().length(8).optional(),
  vc_id: z.string().optional(),
  face_embedding: z.array(z.number()).min(128).max(128).optional(),
}).refine((data) => data.claim_code || data.vc_id, {
  message: "claim_code or vc_id is required",
});

function euclideanDistance(a: number[], b: number[]): number {
  let sum = 0;
  for (let i = 0; i < a.length; i++) {
    const diff = a[i] - b[i];
    sum += diff * diff;
  }
  return Math.sqrt(sum);
}

const router = Router();

router.post("/credentials/claim", claimLimiter, requireAuth, async (req: Request, res: Response) => {
  try {
    const parsed = ClaimSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Validation failed', details: parsed.error.issues });
      return;
    }

    const { claim_code, user_id, face_embedding } = parsed.data;
    const code = claim_code.toUpperCase();

    const { data: cred, error: fetchError } = await req.app.locals.supabase
      .from('issued_credentials')
      .select('*')
      .eq('claim_code', code)
      .maybeSingle();

    if (fetchError) throw fetchError;

    if (!cred) {
      res.status(404).json({ error: `No credential found with code "${code}".` });
      return;
    }

    if (cred.subject_user_id) {
      res.status(409).json({ error: 'This code has already been claimed.' });
      return;
    }

    if (new Date(cred.claim_code_expires_at) <= new Date()) {
      res.status(410).json({ error: 'This code has expired.' });
      return;
    }

    if (cred.face_embedding && cred.face_verification_status !== 'verified') {
      if (!face_embedding) {
        res.status(403).json({ error: 'Face verification required', face_required: true });
        return;
      }
      const storedEmbedding: number[] = JSON.parse(cred.face_embedding);
      const distance = euclideanDistance(storedEmbedding, face_embedding);

      if (distance >= FACE_MATCH_THRESHOLD) {
        res.status(403).json({ error: 'Face verification failed', match: false, distance });
        return;
      }
    }

    const { error: updateError } = await req.app.locals.supabase
      .from('issued_credentials')
      .update({
        subject_user_id: user_id,
        claimed_at: new Date().toISOString(),
        face_verification_status: cred.face_embedding ? 'verified' : 'pending',
        updated_at: new Date().toISOString(),
      })
      .eq('id', cred.id);

    if (updateError) throw updateError;

    res.json({
      success: true,
      credential_id: cred.id,
      given_name: cred.given_name,
      family_name: cred.family_name,
    });
  } catch (err: any) {
    res.status(500).json({ error: 'An internal error occurred' });
  }
});

router.post("/credentials/verify", verifyLimiter, requireAuth, async (req: Request, res: Response) => {
  try {
    const parsed = VerifySchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Validation failed', details: parsed.error.issues });
      return;
    }

    const { claim_code, vc_id, face_embedding } = parsed.data;

    let query = req.app.locals.supabase.from('issued_credentials').select('*');

    if (vc_id) {
      query = query.eq('vc_id', vc_id);
    } else if (claim_code) {
      query = query.eq('claim_code', claim_code.toUpperCase());
    }

    const { data: cred, error: fetchError } = await query.maybeSingle();

    if (fetchError) throw fetchError;
    if (!cred) {
      res.status(404).json({ status: 'unknown', error: 'Credential not found' });
      return;
    }

    let faceMatch: boolean | null = null;
    if (cred.face_embedding && face_embedding) {
      const storedEmbedding: number[] = JSON.parse(cred.face_embedding);
      const distance = euclideanDistance(storedEmbedding, face_embedding);
      faceMatch = distance < FACE_MATCH_THRESHOLD;
    }

    const status = cred.status === 'revoked' ? 'revoked' : 'valid';

    res.json({
      status,
      credential: {
        id: cred.id,
        given_name: cred.given_name,
        family_name: cred.family_name,
        case_number: cred.case_number,
        nationality: cred.nationality,
        issuer_did: cred.issuer_did,
        subject_did: cred.subject_did,
        face_image_url: cred.face_image_url,
        face_embedding: cred.face_embedding,
      },
      face_verification: faceMatch !== null ? { match: faceMatch } : null,
      has_face_embedding: !!cred.face_embedding,
    });
  } catch (err: any) {
    res.status(500).json({ error: 'An internal error occurred' });
  }
});

export default router;
