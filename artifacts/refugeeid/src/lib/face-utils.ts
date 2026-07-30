import * as faceapi from '@vladmandic/face-api';

let modelsLoaded = false;

export const FACE_MATCH_THRESHOLD = 0.6;

export async function loadFaceModels(): Promise<void> {
  if (modelsLoaded) return;

  const MODEL_URL = '/models/face-api';

  await Promise.all([
    faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
    faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
    faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
  ]);

  modelsLoaded = true;
}

export async function detectAndExtractEmbedding(
  input: HTMLVideoElement | HTMLImageElement | HTMLCanvasElement
): Promise<{ descriptor: Float32Array; detection: faceapi.WithFaceDetection<{}> } | null> {
  const detection = await faceapi
    .detectSingleFace(input, new faceapi.TinyFaceDetectorOptions({ inputSize: 416, scoreThreshold: 0.5 }))
    .withFaceLandmarks()
    .withFaceDescriptor();

  return detection ? { descriptor: detection.descriptor, detection } : null;
}

export async function captureFaceEmbedding(
  input: HTMLVideoElement | HTMLImageElement | HTMLCanvasElement
): Promise<number[] | null> {
  const result = await detectAndExtractEmbedding(input);
  if (!result) return null;
  return Array.from(result.descriptor);
}

export function matchFaces(
  embedding1: number[] | Float32Array,
  embedding2: number[] | Float32Array,
  threshold = FACE_MATCH_THRESHOLD
): { match: boolean; distance: number } {
  const a = new Float32Array(embedding1);
  const b = new Float32Array(embedding2);
  const distance = faceapi.euclideanDistance(a, b);
  return { match: distance < threshold, distance };
}

export function captureFaceImage(
  videoElement: HTMLVideoElement
): string {
  const canvas = document.createElement('canvas');
  canvas.width = videoElement.videoWidth;
  canvas.height = videoElement.videoHeight;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';
  ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL('image/jpeg', 0.85);
}

export function serializeEmbedding(embedding: number[]): string {
  return JSON.stringify(embedding);
}

export function deserializeEmbedding(serialized: string): number[] {
  return JSON.parse(serialized);
}

export function isFaceApiReady(): boolean {
  return modelsLoaded;
}
