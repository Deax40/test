'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

const initialFormValues = {
  serialNumber: '',
  status: '',
  location: '',
  operator: '',
  note: '',
};

export default function ScanClient({ saveAction }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const detectorRef = useRef(null);
  const intervalRef = useRef(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [scannedHash, setScannedHash] = useState('');
  const [manualHash, setManualHash] = useState('');
  const [tool, setTool] = useState(null);
  const [commonData, setCommonData] = useState(null);
  const [formValues, setFormValues] = useState(initialFormValues);
  const [error, setError] = useState(null);
  const [isFetching, setIsFetching] = useState(false);

  const stopCamera = useCallback(() => {
    if (intervalRef.current) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    detectorRef.current = null;

    const stream = streamRef.current;
    if (stream) {
      for (const track of stream.getTracks()) {
        track.stop();
      }
    }
    streamRef.current = null;

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  }, []);

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  const applyCommonData = useCallback((data) => {
    if (!data) {
      setFormValues(initialFormValues);
      return;
    }
    setFormValues({
      serialNumber: data.serialNumber ?? '',
      status: data.status ?? '',
      location: data.location ?? '',
      operator: data.operator ?? '',
      note: data.note ?? '',
    });
  }, []);

  const lookupTool = useCallback(
    async (hash) => {
      const normalized = (hash || '').trim();
      if (!normalized) {
        setError('Veuillez saisir un hash de QR code.');
        setTool(null);
        setCommonData(null);
        setFormValues(initialFormValues);
        return;
      }

      setIsFetching(true);
      setError(null);
      try {
        const response = await fetch('/api/tools/lookup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ hash: normalized }),
        });

        if (response.status === 404) {
          setTool(null);
          setCommonData(null);
          setFormValues(initialFormValues);
          setError('QR code inconnu. Contactez un administrateur pour l\'enregistrer.');
        } else if (!response.ok) {
          throw new Error(`Erreur ${response.status}`);
        } else {
          const payload = await response.json();
          if (payload.found) {
            setTool(payload.tool);
            setCommonData(payload.common);
            applyCommonData(payload.common);
            setScannedHash(payload.tool.hash);
            setManualHash(payload.tool.hash);
          } else {
            setTool(null);
            setCommonData(null);
            setFormValues(initialFormValues);
            setError('QR code inconnu.');
          }
        }
      } catch (err) {
        console.error(err);
        setError("Impossible de contacter le serveur. Réessayez dans quelques instants.");
      } finally {
        setIsFetching(false);
      }
    },
    [applyCommonData],
  );

  const startCamera = useCallback(async () => {
    if (isCameraActive) return;
    setError(null);

    if (typeof window === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      setError('La capture vidéo n\'est pas supportée par ce navigateur.');
      return;
    }

    if (typeof window.BarcodeDetector === 'undefined') {
      setError('La détection de QR code n\'est pas supportée. Utilisez la saisie manuelle.');
      return;
    }

    try {
      const supportedFormats = typeof window.BarcodeDetector.getSupportedFormats === 'function'
        ? await window.BarcodeDetector.getSupportedFormats()
        : null;
      if (supportedFormats && !supportedFormats.includes('qr_code')) {
        setError('La détection de QR code n\'est pas supportée par ce navigateur.');
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
        audio: false,
      });
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      detectorRef.current = new window.BarcodeDetector({ formats: ['qr_code'] });
      setIsCameraActive(true);

      intervalRef.current = window.setInterval(async () => {
        if (!videoRef.current || !detectorRef.current) return;
        try {
          const detections = await detectorRef.current.detect(videoRef.current);
          if (!detections || detections.length === 0) {
            return;
          }
          const detection = detections[0];
          const value = typeof detection?.rawValue === 'string' ? detection.rawValue : '';
          const normalized = value.trim();
          if (normalized) {
            setScannedHash(normalized);
            setManualHash(normalized);
            lookupTool(normalized);
            stopCamera();
          }
        } catch (error) {
          console.error(error);
        }
      }, 700);
    } catch (err) {
      console.error(err);
      setError("Impossible d'accéder à la caméra. Vérifiez les autorisations de votre navigateur.");
      stopCamera();
    }
  }, [isCameraActive, lookupTool, stopCamera]);

  const handleManualSubmit = useCallback(
    (event) => {
      event.preventDefault();
      lookupTool(manualHash);
    },
    [lookupTool, manualHash],
  );

  const handleInputChange = useCallback((event) => {
    const { name, value } = event.target;
    setFormValues((prev) => ({ ...prev, [name]: value }));
  }, []);

  const lastScanLabel = commonData?.lastScanAt
    ? new Date(commonData.lastScanAt).toLocaleString('fr-FR')
    : 'Jamais';

  return (
    <section style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ display: 'grid', gap: 24, gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
        <div style={panelStyle}>
          <h2 style={panelTitle}>Capture caméra</h2>
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            style={{ width: '100%', borderRadius: 12, background: '#0f172a', minHeight: 220 }}
          />
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <button type="button" onClick={startCamera} style={secondaryButton} disabled={isCameraActive}>
              Activer la caméra
            </button>
            <button type="button" onClick={stopCamera} style={secondaryButton} disabled={!isCameraActive}>
              Arrêter
            </button>
          </div>
          <p style={{ margin: 0, fontSize: '0.9rem', color: '#475569' }}>
            Placez le QR code devant la caméra. Le scan s&apos;arrête automatiquement après détection.
          </p>
        </div>

        <div style={panelStyle}>
          <h2 style={panelTitle}>Recherche manuelle</h2>
          <form onSubmit={handleManualSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span style={{ fontWeight: 600 }}>Hash du QR code</span>
              <input
                value={manualHash}
                onChange={(event) => setManualHash(event.target.value)}
                style={inputStyle}
                placeholder="Hash SHA-256"
              />
            </label>
            <button type="submit" style={secondaryButton}>
              Rechercher
            </button>
          </form>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={{ fontSize: '0.85rem', color: '#475569' }}>Dernier hash détecté</span>
            <code style={codeStyle}>{scannedHash || '—'}</code>
          </div>
        </div>
      </div>

      {isFetching && (
        <div style={{ padding: '10px 16px', borderRadius: 10, background: '#eff6ff', color: '#1d4ed8' }}>
          Recherche de l&apos;outil en cours…
        </div>
      )}

      {error && (
        <div style={{ padding: '10px 16px', borderRadius: 10, background: '#fee2e2', color: '#b91c1c' }}>{error}</div>
      )}

      {tool && (
        <div style={panelStyle}>
          <h2 style={panelTitle}>Outil reconnu</h2>
          <p style={{ margin: 0, fontWeight: 600 }}>{tool.name}</p>
          <code style={codeStyle}>{tool.hash}</code>
          <p style={{ margin: '4px 0 0', fontSize: '0.9rem', color: '#475569' }}>
            Dernier enregistrement : {lastScanLabel}
          </p>
        </div>
      )}

      <form action={saveAction} style={formStyle}>
        <input type="hidden" name="toolId" value={tool?.id ?? ''} />
        <fieldset
          disabled={!tool}
          style={{ border: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 16 }}
        >
          <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
            <label style={fieldLabel}>
              <span>Numéro de série</span>
              <input
                name="serialNumber"
                value={formValues.serialNumber}
                onChange={handleInputChange}
                style={inputStyle}
                placeholder="SN-001234"
              />
            </label>
            <label style={fieldLabel}>
              <span>Statut</span>
              <input
                name="status"
                value={formValues.status}
                onChange={handleInputChange}
                style={inputStyle}
                placeholder="Disponible, En réparation…"
              />
            </label>
          </div>

          <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
            <label style={fieldLabel}>
              <span>Localisation</span>
              <input
                name="location"
                value={formValues.location}
                onChange={handleInputChange}
                style={inputStyle}
                placeholder="Atelier Lyon"
              />
            </label>
            <label style={fieldLabel}>
              <span>Opérateur</span>
              <input
                name="operator"
                value={formValues.operator}
                onChange={handleInputChange}
                style={inputStyle}
                placeholder="Nom du technicien"
              />
            </label>
          </div>

          <label style={fieldLabel}>
            <span>Commentaire</span>
            <textarea
              name="note"
              value={formValues.note}
              onChange={handleInputChange}
              rows={3}
              style={{ ...inputStyle, resize: 'vertical' }}
              placeholder="Observation relevée lors du contrôle"
            />
          </label>
        </fieldset>

        <button type="submit" style={primaryButton} disabled={!tool}>
          Enregistrer et synchroniser
        </button>
      </form>
    </section>
  );
}

const panelStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: 12,
  padding: 20,
  borderRadius: 16,
  border: '1px solid #e2e8f0',
  background: 'white',
  boxShadow: '0 12px 30px rgba(15, 23, 42, 0.08)',
};

const panelTitle = {
  margin: 0,
  fontSize: '1.1rem',
};

const inputStyle = {
  borderRadius: 10,
  border: '1px solid #cbd5f5',
  padding: '10px 12px',
  fontSize: '1rem',
};

const formStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: 16,
  padding: 24,
  borderRadius: 16,
  border: '1px solid #e2e8f0',
  background: 'white',
  boxShadow: '0 16px 35px rgba(15, 23, 42, 0.1)',
};

const secondaryButton = {
  background: '#e2e8f0',
  color: '#1f2937',
  border: 'none',
  borderRadius: 10,
  padding: '10px 16px',
  fontWeight: 600,
  cursor: 'pointer',
};

const primaryButton = {
  alignSelf: 'flex-start',
  background: '#2563eb',
  color: 'white',
  border: 'none',
  borderRadius: 10,
  padding: '12px 20px',
  fontWeight: 600,
  cursor: 'pointer',
};

const fieldLabel = {
  display: 'flex',
  flexDirection: 'column',
  gap: 6,
  fontWeight: 600,
  color: '#1f2937',
};

const codeStyle = {
  padding: '6px 10px',
  background: '#e0f2fe',
  borderRadius: 8,
  fontFamily: 'monospace',
  fontSize: '0.85rem',
};
