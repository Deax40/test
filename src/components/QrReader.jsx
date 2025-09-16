'use client';

import { useEffect, useRef, useState } from 'react';

export default function QrReader({ onDecode, onError }) {
  const videoRef = useRef(null);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    let isMounted = true;
    let animationFrameId;
    let stream;

    async function initialise() {
      if (typeof window === 'undefined' || !('BarcodeDetector' in window)) {
        const message = 'La lecture automatique des QR codes n’est pas supportée par ce navigateur.';
        setErrorMessage(message);
        onError?.(new Error(message));
        return;
      }

      const detector = new window.BarcodeDetector({ formats: ['qr_code'] });

      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        if (!isMounted) return;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }

        const scan = async () => {
          if (!isMounted) return;
          if (videoRef.current && videoRef.current.readyState >= 2) {
            try {
              const barcodes = await detector.detect(videoRef.current);
              if (barcodes.length > 0) {
                onDecode?.(barcodes[0].rawValue);
              }
            } catch (detectError) {
              console.error(detectError);
            }
          }
          animationFrameId = requestAnimationFrame(scan);
        };

        animationFrameId = requestAnimationFrame(scan);
      } catch (error) {
        if (!isMounted) return;
        const message = 'Accès à la caméra refusé ou indisponible. Utilisez la saisie manuelle.';
        setErrorMessage(message);
        onError?.(error);
      }
    }

    initialise();

    return () => {
      isMounted = false;
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [onDecode, onError]);

  return (
    <div className="qr-reader">
      <video ref={videoRef} className="qr-video" muted playsInline />
      {errorMessage && (
        <div className="qr-overlay">
          <p>{errorMessage}</p>
        </div>
      )}
    </div>
  );
}
