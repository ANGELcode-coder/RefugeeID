import React, { useRef, useEffect, useState, useCallback } from 'react';
import { loadFaceModels, detectAndExtractEmbedding, matchFaces, FACE_MATCH_THRESHOLD } from '@/lib/face-utils';
import { Camera, CheckCircle2, XCircle, Loader2, AlertCircle, ShieldCheck, ShieldX } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface FaceVerifyProps {
  storedEmbedding: number[];
  onResult: (match: boolean, distance: number, liveEmbedding: number[]) => void;
  onCancel?: () => void;
}

export function FaceVerify({ storedEmbedding, onResult, onCancel }: FaceVerifyProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [status, setStatus] = useState<'loading' | 'camera' | 'verifying' | 'match' | 'no_match' | 'error'>('loading');
  const [distance, setDistance] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
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
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  const handleVerify = async () => {
    if (!videoRef.current) return;

    setStatus('verifying');

    try {
      const result = await detectAndExtractEmbedding(videoRef.current);
      if (!result) {
        setStatus('error');
        setErrorMessage('No face detected. Please face the camera directly.');
        return;
      }

      const liveEmbedding = Array.from(result.descriptor);
      const { match, distance: dist } = matchFaces(storedEmbedding, liveEmbedding);
      setDistance(dist);

      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }

      setStatus(match ? 'match' : 'no_match');
      onResult(match, dist, liveEmbedding);
    } catch (err: any) {
      setStatus('error');
      setErrorMessage(err.message || 'Verification failed');
    }
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative w-full max-w-sm aspect-[3/4] rounded-2xl overflow-hidden bg-slate-900 border-2 border-slate-700">
        {status !== 'match' && status !== 'no_match' && (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
            style={{ transform: 'scaleX(-1)' }}
          />
        )}

        {status === 'match' && (
          <div className="w-full h-full flex flex-col items-center justify-center bg-emerald-900/90">
            <ShieldCheck className="w-20 h-20 text-emerald-400 mb-3" />
            <p className="text-emerald-300 font-bold text-xl">Identity Verified</p>
            {distance !== null && (
              <p className="text-emerald-400/70 text-xs mt-1">Match confidence: {((1 - distance) * 100).toFixed(1)}%</p>
            )}
          </div>
        )}

        {status === 'no_match' && (
          <div className="w-full h-full flex flex-col items-center justify-center bg-red-900/90">
            <ShieldX className="w-20 h-20 text-red-400 mb-3" />
            <p className="text-red-300 font-bold text-xl">Face Does Not Match</p>
            {distance !== null && (
              <p className="text-red-400/70 text-xs mt-1">Similarity: {((1 - distance) * 100).toFixed(1)}% (need {((1 - FACE_MATCH_THRESHOLD) * 100).toFixed(0)}%+)</p>
            )}
          </div>
        )}

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

        {status === 'verifying' && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40">
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="w-10 h-10 text-white animate-spin" />
              <p className="text-white text-sm">Verifying identity...</p>
            </div>
          </div>
        )}

        {status === 'camera' && (
          <>
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-48 h-60 border-2 border-blue-400/50 rounded-2xl" />
            </div>
            <div className="absolute bottom-3 left-0 right-0 flex justify-center">
              <span className="text-xs text-blue-300 bg-black/50 px-3 py-1 rounded-full">
                Face the camera directly
              </span>
            </div>
          </>
        )}
      </div>

      <div className="flex gap-3 w-full max-w-sm">
        {onCancel && status !== 'match' && status !== 'no_match' && (
          <Button variant="outline" onClick={onCancel} className="flex-1">
            Cancel
          </Button>
        )}
        {status === 'match' || status === 'no_match' ? (
          <Button
            onClick={onCancel}
            className="flex-1 bg-slate-700 hover:bg-slate-600 text-white"
          >
            Done
          </Button>
        ) : (
          <Button
            onClick={handleVerify}
            disabled={status !== 'camera'}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
          >
            {status === 'verifying' ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Verifying...</>
            ) : (
              <><Camera className="w-4 h-4 mr-2" /> Scan & Verify</>
            )}
          </Button>
        )}
      </div>
    </div>
  );
}
