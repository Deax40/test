"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export const dynamic = "force-dynamic";

const CAMERA_UNAVAILABLE_MESSAGE =
  "Impossible d'accéder à la caméra. Vérifie que ton navigateur dispose des permissions nécessaires (HTTPS requis).";

function QrScanner() {
  const videoRef = useRef(null);
  const animationRef = useRef(null);
  const [status, setStatus] = useState("idle");
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [scanToken, setScanToken] = useState(0);

  const reset = useCallback(() => {
    setResult(null);
    setError(null);
    setStatus("idle");
    setScanToken((token) => token + 1);
  }, []);

  useEffect(() => {
    let cancelled = false;
    let stream;
    let detector;

    const stop = () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
        stream = undefined;
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    };

    const detectLoop = async () => {
      const video = videoRef.current;
      if (!video || cancelled) {
        return;
      }

      if (video.readyState < HTMLMediaElement.HAVE_ENOUGH_DATA) {
        animationRef.current = requestAnimationFrame(detectLoop);
        return;
      }

      const { videoWidth, videoHeight } = video;
      if (!videoWidth || !videoHeight) {
        animationRef.current = requestAnimationFrame(detectLoop);
        return;
      }

      if (detector) {
        try {
          const codes = await detector.detect(video);
          if (!cancelled && codes.length > 0 && codes[0].rawValue) {
            setResult(codes[0].rawValue);
            setStatus("found");
            stop();
            cancelled = true;
            return;
          }
        } catch (err) {
          if (!cancelled) {
            console.warn("Échec BarcodeDetector, nouvelle tentative", err);
          }
        }
      }

      animationRef.current = requestAnimationFrame(detectLoop);
    };

    const start = async () => {
      if (!navigator?.mediaDevices?.getUserMedia) {
        setError(CAMERA_UNAVAILABLE_MESSAGE);
        setStatus("error");
        return;
      }

      setStatus("initialising");

      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: "environment" },
          },
        });

        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        const video = videoRef.current;
        if (!video) {
          setError(CAMERA_UNAVAILABLE_MESSAGE);
          setStatus("error");
          stop();
          return;
        }

        video.srcObject = stream;
        video.setAttribute("playsinline", "true");
        video.setAttribute("muted", "true");
        video.setAttribute("autoplay", "true");

        try {
          await video.play();
        } catch (err) {
          console.warn("Impossible de démarrer la vidéo", err);
        }

        if (typeof window !== "undefined" && "BarcodeDetector" in window) {
          try {
            detector = new window.BarcodeDetector({ formats: ["qr_code"] });
          } catch (err) {
            console.warn("Impossible d'initialiser BarcodeDetector", err);
            detector = undefined;
          }
        } else {
          setError(
            "Ton navigateur ne supporte pas la détection de QR (BarcodeDetector). Utilise Chrome, Edge ou un navigateur compatible."
          );
          setStatus("error");
          stop();
          cancelled = true;
          return;
        }

        if (!cancelled) {
          setStatus("scanning");
          animationRef.current = requestAnimationFrame(detectLoop);
        }
      } catch (err) {
        if (!cancelled) {
          console.error("Erreur accès caméra", err);
          setError(
            err instanceof Error ? err.message : CAMERA_UNAVAILABLE_MESSAGE
          );
          setStatus("error");
        }
        stop();
        cancelled = true;
      }
    };

    start();

    return () => {
      cancelled = true;
      stop();
    };
  }, [scanToken]);

  return (
    <section className="scanner">
      <div className="preview">
        <video ref={videoRef} playsInline className="preview__video" muted autoPlay />
        <div className="preview__frame" aria-hidden="true" />
      </div>
      <div className="status" role="status">
        {status === "idle" && <p>Prépare-toi à scanner le QR code.</p>}
        {status === "initialising" && <p>Initialisation de la caméra…</p>}
        {status === "scanning" && (
          <p>
            Place le QR code dans le cadre. L'image n'est plus rechargée à chaque
            détection afin de garder l'aperçu stable.
          </p>
        )}
        {status === "found" && result && (
          <div className="result">
            <p>QR code détecté :</p>
            <pre>{result}</pre>
          </div>
        )}
        {status === "error" && error && <p className="error">{error}</p>}
      </div>
      <div className="actions">
        <button
          type="button"
          onClick={reset}
          disabled={status === "initialising"}
        >
          Relancer le scan
        </button>
      </div>

      <style jsx>{`
        .scanner {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          width: min(480px, 100%);
        }

        .preview {
          position: relative;
          border-radius: 16px;
          overflow: hidden;
          background: #000;
          aspect-ratio: 3 / 4;
        }

        .preview__video {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }

        .preview__frame {
          pointer-events: none;
          position: absolute;
          inset: 0;
          border: 2px solid rgba(255, 255, 255, 0.6);
          border-radius: 16px;
          box-shadow: inset 0 0 0 9999px rgba(0, 0, 0, 0.15);
        }

        .status p {
          margin: 0;
          color: #333;
          font-size: 0.95rem;
        }

        .status .result pre {
          background: #f5f5f5;
          padding: 0.75rem;
          border-radius: 8px;
          overflow-x: auto;
          white-space: pre-wrap;
          word-break: break-word;
        }

        .error {
          color: #c62828;
          font-weight: 600;
        }

        .actions {
          display: flex;
          justify-content: flex-end;
        }

        button {
          border: none;
          border-radius: 999px;
          background: #111827;
          color: #fff;
          padding: 0.5rem 1.25rem;
          font-size: 0.95rem;
          cursor: pointer;
          transition: background 0.2s ease;
        }

        button:hover {
          background: #1f2937;
        }

        button:active {
          background: #0f172a;
        }

        button:disabled {
          background: #9ca3af;
          cursor: not-allowed;
        }
      `}</style>
    </section>
  );
}

export default function Home() {
  return (
    <main className="page">
      <h1>Scanner un QR code</h1>
      <p>
        Scanne un QR code directement dans le navigateur. L&apos;aperçu caméra est
        stabilisé pour éviter les coupures observées précédemment.
      </p>
      <QrScanner />
      <style jsx>{`
        .page {
          padding: min(5vw, 48px);
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
          font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI",
            sans-serif;
        }

        h1 {
          margin: 0;
          font-size: clamp(2rem, 5vw, 2.5rem);
        }

        p {
          margin: 0;
          color: #4b5563;
          font-size: 1rem;
          max-width: 60ch;
        }
      `}</style>
    </main>
  );
}
