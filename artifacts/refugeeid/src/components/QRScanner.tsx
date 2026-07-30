import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Camera, CameraOff, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface QRScannerProps {
  onScan: (decodedText: string) => void;
  onClose?: () => void;
}

export function QRScanner({ onScan, onClose }: QRScannerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [status, setStatus] = useState<'starting' | 'active' | 'error'>('starting');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    let mounted = true;

    async function start() {
      if (!containerRef.current) return;

      try {
        const scanner = new Html5Qrcode('qr-scanner-container');
        scannerRef.current = scanner;

        await scanner.start(
          { facingMode: 'environment' },
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1.0,
          },
          (decodedText) => {
            if (mounted) {
              onScan(decodedText);
              stopScanner();
            }
          },
          () => {} // ignore errors during scanning
        );

        if (mounted) setStatus('active');
      } catch (err: any) {
        if (mounted) {
          setStatus('error');
          setErrorMessage(err.message || 'Failed to start camera');
        }
      }
    }

    const stopScanner = async () => {
      try {
        if (scannerRef.current?.isScanning) {
          await scannerRef.current.stop();
        }
        scannerRef.current?.clear();
      } catch (_) {}
    };

    start();

    return () => {
      mounted = false;
      stopScanner();
    };
  }, [onScan]);

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative w-full max-w-sm aspect-square rounded-2xl overflow-hidden bg-slate-900 border-2 border-slate-700">
        <div id="qr-scanner-container" ref={containerRef} className="w-full h-full" />

        {status === 'starting' && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60 z-10">
            <div className="flex flex-col items-center gap-2">
              <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-white text-sm">Starting camera...</p>
            </div>
          </div>
        )}

        {status === 'error' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 p-4 text-center z-10">
            <CameraOff className="w-10 h-10 text-red-400 mb-2" />
            <p className="text-white text-sm mb-2">{errorMessage}</p>
            <Button variant="outline" size="sm" onClick={onClose}>Close</Button>
          </div>
        )}

        {status === 'active' && (
          <>
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
              <div className="w-60 h-60 border-2 border-emerald-400 rounded-2xl shadow-[0_0_20px_rgba(52,211,153,0.3)]" />
            </div>
            <div className="absolute bottom-3 left-0 right-0 flex justify-center z-10">
              <span className="text-xs text-emerald-300 bg-black/50 px-3 py-1 rounded-full">
                Point camera at QR code
              </span>
            </div>
          </>
        )}
      </div>

      {onClose && (
        <Button variant="outline" onClick={onClose} className="w-full max-w-sm">
          <X className="w-4 h-4 mr-2" /> Cancel Scanner
        </Button>
      )}
    </div>
  );
}
