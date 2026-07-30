import React, { useRef, useEffect, useState, useCallback } from 'react';
import { loadFaceModels, detectAndExtractEmbedding, captureFaceImage } from '@/lib/face-utils';
import { Camera, CameraOff, CheckCircle2, AlertCircle, Loader2, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface FaceCaptureProps {
  onCaptured: (data: { imageUrl: string; embedding: number[] }) => void;
  onCancel?: () => void;
}

export function FaceCapture({ onCaptured, onCancel }: FaceCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [mode, setMode] = useState<'camera' | 'upload'>('camera');
  const [status, setStatus] = useState<'loading' | 'camera' | 'detected' | 'captured' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState('');
  const streamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number>(0);
  const [uploadPreview, setUploadPreview] = useState<string | null>(null);
  const [uploadEmbedding, setUploadEmbedding] = useState<number[] | null>(null);
  const [uploadDetecting, setUploadDetecting] = useState(false);

  useEffect(() => {
    if (mode !== 'camera') return;
    let mounted = true;

    async function init() {
      try {
        await loadFaceModels();
        if (!mounted) return;

        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
        });

        if (!mounted) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
        setStatus('camera');
        startDetection();
      } catch (err: any) {
        if (mounted) {
          setStatus('error');
          setErrorMessage(err.message || 'Could not access camera');
        }
      }
    }

    init();

    return () => {
      mounted = false;
      cancelAnimationFrame(animFrameRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, [mode]);

  const startDetection = useCallback(() => {
    const detect = async () => {
      if (!videoRef.current || videoRef.current.readyState < 2) {
        animFrameRef.current = requestAnimationFrame(detect);
        return;
      }

      const result = await detectAndExtractEmbedding(videoRef.current);
      if (result) {
        setStatus('detected');
      } else {
        setStatus('camera');
      }
      animFrameRef.current = requestAnimationFrame(detect);
    };

    animFrameRef.current = requestAnimationFrame(detect);
  }, []);

  const stopCamera = useCallback(() => {
    cancelAnimationFrame(animFrameRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  }, []);

  const handleCapture = async () => {
    if (!videoRef.current) return;

    setStatus('loading');
    cancelAnimationFrame(animFrameRef.current);

    try {
      const result = await detectAndExtractEmbedding(videoRef.current);
      if (!result) {
        setStatus('error');
        setErrorMessage('No face detected. Please position your face in the center of the frame.');
        startDetection();
        return;
      }

      const imageUrl = captureFaceImage(videoRef.current);
      const embedding = Array.from(result.descriptor);

      setStatus('captured');

      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }

      onCaptured({ imageUrl, embedding });
    } catch (err: any) {
      setStatus('error');
      setErrorMessage(err.message || 'Failed to capture face');
      startDetection();
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setErrorMessage('Only PNG, JPG, JPEG, and WEBP images are supported.');
      setUploadDetecting(false);
      return;
    }

    setUploadDetecting(true);
    setErrorMessage('');

    try {
      await loadFaceModels();

      const imageUrl = URL.createObjectURL(file);
      const img = new Image();
      img.crossOrigin = 'anonymous';

      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error('Failed to load image'));
        img.src = imageUrl;
      });

      const result = await detectAndExtractEmbedding(img);

      if (!result) {
        setUploadDetecting(false);
        setErrorMessage('No face detected in the uploaded image. Please upload a clear photo of a face.');
        URL.revokeObjectURL(imageUrl);
        return;
      }

      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Failed to create canvas');
      ctx.drawImage(img, 0, 0);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.85);

      setUploadPreview(dataUrl);
      setUploadEmbedding(Array.from(result.descriptor));
      setUploadDetecting(false);
      URL.revokeObjectURL(imageUrl);
    } catch (err: any) {
      setUploadDetecting(false);
      setErrorMessage(err.message || 'Failed to process image');
    }
  };

  const handleUploadConfirm = () => {
    if (uploadPreview && uploadEmbedding) {
      onCaptured({ imageUrl: uploadPreview, embedding: uploadEmbedding });
    }
  };

  const switchToUpload = () => {
    stopCamera();
    setMode('upload');
    setUploadPreview(null);
    setUploadEmbedding(null);
    setErrorMessage('');
  };

  const switchToCamera = () => {
    setMode('camera');
    setStatus('loading');
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex gap-2 mb-2">
        <Button
          type="button"
          variant={mode === 'camera' ? 'default' : 'outline'}
          size="sm"
          onClick={switchToCamera}
          className={mode === 'camera' ? 'bg-blue-600' : ''}
        >
          <Camera className="w-4 h-4 mr-2" /> Camera
        </Button>
        <Button
          type="button"
          variant={mode === 'upload' ? 'default' : 'outline'}
          size="sm"
          onClick={switchToUpload}
          className={mode === 'upload' ? 'bg-blue-600' : ''}
        >
          <Upload className="w-4 h-4 mr-2" /> Upload Photo
        </Button>
      </div>

      {mode === 'camera' && (
        <>
          <div className="relative w-full max-w-sm aspect-[3/4] rounded-2xl overflow-hidden bg-slate-900 border-2 border-slate-700">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
              style={{ transform: 'scaleX(-1)' }}
            />

            {status === 'loading' && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                <Loader2 className="w-10 h-10 text-white animate-spin" />
              </div>
            )}

            {status === 'error' && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 p-4 text-center">
                <AlertCircle className="w-10 h-10 text-red-400 mb-2" />
                <p className="text-white text-sm">{errorMessage}</p>
              </div>
            )}

            {status === 'detected' && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-48 h-60 border-2 border-emerald-400 rounded-2xl shadow-[0_0_20px_rgba(52,211,153,0.3)]" />
              </div>
            )}

            {status === 'camera' && (
              <div className="absolute bottom-3 left-0 right-0 flex justify-center">
                <span className="text-xs text-amber-300 bg-black/50 px-3 py-1 rounded-full">
                  Position your face in the frame
                </span>
              </div>
            )}
          </div>

          <div className="flex gap-3 w-full max-w-sm">
            {onCancel && (
              <Button variant="outline" onClick={onCancel} className="flex-1">
                Cancel
              </Button>
            )}
            <Button
              onClick={handleCapture}
              disabled={status !== 'detected'}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
            >
              {status === 'captured' ? (
                <><CheckCircle2 className="w-4 h-4 mr-2" /> Captured</>
              ) : status === 'loading' ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Processing...</>
              ) : (
                <><Camera className="w-4 h-4 mr-2" /> Capture Face</>
              )}
            </Button>
          </div>
        </>
      )}

      {mode === 'upload' && (
        <div className="w-full max-w-sm space-y-4">
          {!uploadPreview && (
            <div className="border-2 border-dashed border-slate-300 rounded-2xl p-8 text-center hover:border-blue-400 transition-colors">
              <label className="cursor-pointer flex flex-col items-center gap-3">
                <Upload className="w-10 h-10 text-slate-400" />
                <span className="text-sm text-slate-500">
                  Click to upload a photo (PNG, JPG, JPEG, WEBP)
                </span>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/jpg,image/webp"
                  className="hidden"
                  onChange={handleFileSelect}
                  disabled={uploadDetecting}
                />
              </label>
            </div>
          )}

          {uploadDetecting && (
            <div className="flex flex-col items-center gap-3 py-8">
              <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
              <p className="text-sm text-slate-500">Detecting face...</p>
            </div>
          )}

          {errorMessage && !uploadDetecting && !uploadPreview && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
              <p className="text-sm text-red-700">{errorMessage}</p>
            </div>
          )}

          {uploadPreview && uploadEmbedding && (
            <div className="space-y-4">
              <img
                src={uploadPreview}
                alt="Uploaded face"
                className="w-full rounded-xl border-2 border-emerald-400 shadow-md"
              />
              <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                <span className="text-sm text-emerald-700">Face detected successfully</span>
              </div>
              <div className="flex gap-3">
                {onCancel && (
                  <Button variant="outline" onClick={() => { setUploadPreview(null); setUploadEmbedding(null); setErrorMessage(''); }} className="flex-1">
                    Choose Different
                  </Button>
                )}
                <Button onClick={handleUploadConfirm} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white">
                  <CheckCircle2 className="w-4 h-4 mr-2" /> Use This Photo
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
