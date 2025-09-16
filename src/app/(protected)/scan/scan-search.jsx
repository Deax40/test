"use client";

import { useCallback, useEffect, useRef, useState } from 'react';

export default function ScanSearch({ initialHash }) {
  const formRef = useRef(null);
  const inputRef = useRef(null);
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const animationRef = useRef(null);
  const detectorRef = useRef(null);

  const [hash, setHash] = useState(initialHash ?? '');
  const [cameraSupported, setCameraSupported] = useState(false);
  const [detectorSupported, setDetectorSupported] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [cameraError, setCameraError] = useState('');

  useEffect(() => {
    setHash(initialHash ?? '');
    if (inputRef.current) {
      inputRef.current.value = initialHash ?? '';
    }
  }, [initialHash]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const hasMediaDevices = !!navigator?.mediaDevices?.getUserMedia;
    const hasBarcodeDetector = 'BarcodeDetector' in window;

    setCameraSupported(hasMediaDevices);
    setDetectorSupported(hasBarcodeDetector);
  }, []);

  const stopScanning = useCallback(() => {
    setScanning(false);
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.srcObject = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  }, []);

  const handleDetection = useCallback(
    (value) => {
      if (!value) {
        return;
      }

      const sanitized = value.trim();
      if (!sanitized) {
        return;
      }

      stopScanning();
      setHash(sanitized);
      if (inputRef.current) {
        inputRef.current.value = sanitized;
      }

      // Submit the form to refresh server data for the detected hash.
      if (formRef.current) {
        if (typeof formRef.current.requestSubmit === 'function') {
          formRef.current.requestSubmit();
        } else {
          formRef.current.submit();
        }
      }
    },
    [stopScanning],
  );

  const scanFrame = useCallback(async () => {
    if (!videoRef.current || !detectorRef.current) {
      return;
    }

    try {
      const barcodes = await detectorRef.current.detect(videoRef.current);
      if (barcodes.length > 0) {
        handleDetection(barcodes[0]?.rawValue ?? '');
        return;
      }
    } catch (error) {
      console.error('Échec de la lecture du QR code', error);
    }

    animationRef.current = requestAnimationFrame(scanFrame);
  }, [handleDetection]);

  const startScanning = useCallback(async () => {
    setCameraError('');

    if (!cameraSupported) {
      setCameraError("La caméra n'est pas disponible sur cet appareil.");
      return;
    }

    if (!detectorSupported) {
      setCameraError("La lecture automatique de QR code n'est pas prise en charge par ce navigateur.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' },
        },
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      if (!detectorRef.current && typeof window !== 'undefined' && 'BarcodeDetector' in window) {
        detectorRef.current = new window.BarcodeDetector({ formats: ['qr_code'] });
      }

      setScanning(true);
      animationRef.current = requestAnimationFrame(scanFrame);
    } catch (error) {
      console.error('Impossible de démarrer la caméra', error);
      setCameraError("Impossible d'accéder à la caméra. Vérifiez les permissions du navigateur.");
      stopScanning();
    }
  }, [cameraSupported, detectorSupported, scanFrame, stopScanning]);

  useEffect(() => () => stopScanning(), [stopScanning]);

  return (
    <section style={{ marginTop: 24, display: 'flex', flexWrap: 'wrap', gap: 24 }}>
      <form
        ref={formRef}
        method="get"
        style={{ flex: '1 1 300px', display: 'flex', flexDirection: 'column', gap: 12 }}
      >
        <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span style={{ fontWeight: 600 }}>Hash du QR code</span>
          <input
            ref={inputRef}
            type="text"
            name="hash"
            value={hash}
            onChange={(event) => setHash(event.target.value)}
            placeholder="Collez ou scannez le hash"
            style={{ padding: '10px 12px', borderRadius: 8, border: '1px solid #d1d5db' }}
            required
          />
        </label>

        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <button
            type="submit"
            style={{
              background: '#2563eb',
              color: '#fff',
              padding: '12px 18px',
              borderRadius: 8,
              border: 'none',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Rechercher
          </button>

          <button
            type="button"
            onClick={scanning ? stopScanning : startScanning}
            style={{
              background: scanning ? '#9ca3af' : '#047857',
              color: '#fff',
              padding: '12px 18px',
              borderRadius: 8,
              border: 'none',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            {scanning ? 'Arrêter le scan' : 'Scanner via caméra'}
          </button>
        </div>

        <p style={{ color: '#4b5563', fontSize: 14 }}>
          Vous pouvez saisir manuellement le hash ou utiliser la caméra pour remplir le champ automatiquement.
        </p>
      </form>

      <div style={{ flex: '1 1 260px', maxWidth: 360 }}>
        <div
          style={{
            position: 'relative',
            borderRadius: 12,
            border: '1px solid #d1d5db',
            overflow: 'hidden',
            background: '#111827',
            minHeight: 240,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {scanning ? (
            <video
              ref={videoRef}
              muted
              playsInline
              autoPlay
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : (
            <div style={{ padding: 24, textAlign: 'center', color: '#e5e7eb' }}>
              <p style={{ marginBottom: 12, fontWeight: 600 }}>Mode caméra inactif</p>
              <p style={{ fontSize: 14, lineHeight: 1.5 }}>
                Cliquez sur « Scanner via caméra » pour activer la prévisualisation et détecter automatiquement les QR codes.
              </p>
            </div>
          )}
          {scanning && (
            <div
              style={{
                position: 'absolute',
                inset: 16,
                border: '2px solid rgba(34,197,94,0.8)',
                borderRadius: 16,
                pointerEvents: 'none',
              }}
            />
          )}
        </div>

        {!cameraSupported && (
          <p style={{ color: '#b91c1c', marginTop: 12 }}>
            La caméra n'est pas détectée sur cet appareil. Utilisez la saisie manuelle.
          </p>
        )}

        {cameraSupported && !detectorSupported && (
          <p style={{ color: '#b45309', marginTop: 12 }}>
            Ce navigateur ne prend pas encore en charge la lecture automatique des QR codes. Saisissez le hash manuellement.
          </p>
        )}

        {cameraError && (
          <p style={{ color: '#b91c1c', marginTop: 12 }}>{cameraError}</p>
        )}

        {scanning && (
          <p style={{ color: '#059669', marginTop: 12, fontSize: 14 }}>
            Alignez le QR code dans le cadre. Le hash sera rempli automatiquement dès qu'il sera reconnu.
          </p>
        )}
      </div>
    </section>
  );
}

