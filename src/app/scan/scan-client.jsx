'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

const initialFormState = {
  name: '',
  description: '',
  status: '',
  location: '',
  operator: '',
  note: '',
};

function normalizeValue(value) {
  if (typeof value !== 'string') {
    return '';
  }
  return value;
}

function cleanOptional(value) {
  if (typeof value !== 'string') {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function formatDate(date) {
  if (!date) {
    return '—';
  }
  try {
    return new Date(date).toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch (error) {
    return '—';
  }
}

export default function ScanClient({ currentUser }) {
  const videoRef = useRef(null);
  const [cameraError, setCameraError] = useState(null);
  const [scannerReady, setScannerReady] = useState(false);
  const [scannedHash, setScannedHash] = useState('');
  const [tool, setTool] = useState(null);
  const [formState, setFormState] = useState(initialFormState);
  const [feedback, setFeedback] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingTool, setIsLoadingTool] = useState(false);
  const [manualHash, setManualHash] = useState('');

  const canEdit = useMemo(() => ['ADMIN', 'TECH'].includes(currentUser.role), [currentUser.role]);

  useEffect(() => {
    let stream;
    let cancelled = false;

    async function setupCamera() {
      if (typeof window === 'undefined') {
        return;
      }

      if (!navigator?.mediaDevices?.getUserMedia) {
        setCameraError("La caméra n'est pas disponible sur cet appareil.");
        return;
      }

      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
        });
        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
          setScannerReady(true);
        }
      } catch (error) {
        setCameraError("Impossible d'accéder à la caméra : " + (error?.message ?? 'erreur inconnue'));
      }
    }

    setupCamera();

    return () => {
      cancelled = true;
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const handleDetection = useCallback(
    async (hash) => {
      const trimmed = hash?.trim();
      if (!trimmed) {
        return;
      }
      if (trimmed === scannedHash && tool) {
        return;
      }
      setScannedHash(trimmed);
      setManualHash(trimmed);
      await fetchTool(trimmed);
    },
    [scannedHash, tool]
  );

  useEffect(() => {
    if (!scannerReady || typeof window === 'undefined') {
      return;
    }

    let isCancelled = false;
    let detector;

    async function initDetector() {
      if (!('BarcodeDetector' in window)) {
        setCameraError(
          "Votre navigateur ne supporte pas l'API BarcodeDetector. Utilisez la saisie manuelle ou un navigateur récent."
        );
        return;
      }

      try {
        const formats = await window.BarcodeDetector.getSupportedFormats();
        if (!formats.includes('qr_code')) {
          setCameraError(
            "Le format QR code n'est pas supporté par le lecteur natif de ce navigateur."
          );
          return;
        }

        detector = new window.BarcodeDetector({ formats: ['qr_code'] });
        const scanLoop = async () => {
          if (isCancelled || !videoRef.current) {
            return;
          }
          try {
            const barcodes = await detector.detect(videoRef.current);
            if (barcodes.length > 0) {
              const value = barcodes[0].rawValue;
              await handleDetection(value);
            }
          } catch (error) {
            console.error('Erreur détecteur QR :', error);
          }
          if (!isCancelled) {
            window.setTimeout(scanLoop, 650);
          }
        };
        scanLoop();
      } catch (error) {
        console.error('Impossible d\'initialiser le lecteur QR', error);
        setCameraError("Erreur lors de l'initialisation du lecteur QR : " + (error?.message ?? 'inconnue'));
      }
    }

    initDetector();

    return () => {
      isCancelled = true;
    };
  }, [scannerReady, handleDetection]);

  async function fetchTool(hash) {
    setFeedback(null);
    setIsLoadingTool(true);
    try {
      const response = await fetch(`/api/tools/${encodeURIComponent(hash)}`);
      if (response.status === 404) {
        setTool(null);
        setFormState(initialFormState);
        setFeedback({ status: 'error', message: 'QR code non reconnu.' });
        return;
      }
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data?.error ?? 'Erreur inattendue lors de la récupération des données.');
      }
      const data = await response.json();
      setTool(data.tool);
      setFormState({
        name: normalizeValue(data.tool.name),
        description: normalizeValue(data.tool.description),
        status: normalizeValue(data.tool.status),
        location: normalizeValue(data.tool.location),
        operator: normalizeValue(data.tool.operator),
        note: normalizeValue(data.tool.note),
      });
      setFeedback({ status: 'success', message: 'Outil trouvé. Vous pouvez mettre à jour les informations.' });
    } catch (error) {
      console.error(error);
      setTool(null);
      setFeedback({ status: 'error', message: error?.message ?? 'Erreur réseau.' });
    } finally {
      setIsLoadingTool(false);
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (!tool) {
      return;
    }

    setIsSaving(true);
    setFeedback(null);
    try {
      const payload = {
        name: formState.name.trim(),
        description: cleanOptional(formState.description),
        status: cleanOptional(formState.status),
        location: cleanOptional(formState.location),
        operator: cleanOptional(formState.operator),
        note: cleanOptional(formState.note),
      };

      const response = await fetch(`/api/tools/${encodeURIComponent(tool.hash)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data?.error ?? 'Échec de la mise à jour.');
      }

      setTool(data.tool);
      setFormState({
        name: normalizeValue(data.tool.name),
        description: normalizeValue(data.tool.description),
        status: normalizeValue(data.tool.status),
        location: normalizeValue(data.tool.location),
        operator: normalizeValue(data.tool.operator),
        note: normalizeValue(data.tool.note),
      });
      setFeedback({ status: 'success', message: 'Informations enregistrées.' });
    } catch (error) {
      setFeedback({ status: 'error', message: error?.message ?? 'Impossible de sauvegarder.' });
    } finally {
      setIsSaving(false);
    }
  }

  function handleManualSearch(event) {
    event.preventDefault();
    const hashValue = manualHash.trim();
    if (!hashValue) {
      setFeedback({ status: 'error', message: 'Veuillez saisir un hash avant de lancer la recherche.' });
      return;
    }
    setScannedHash(hashValue);
    fetchTool(hashValue);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <section
        style={{
          display: 'grid',
          gap: 24,
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          alignItems: 'flex-start',
        }}
      >
        <div
          style={{
            position: 'relative',
            borderRadius: 18,
            overflow: 'hidden',
            background: '#0f172a',
            minHeight: 240,
            boxShadow: '0 10px 30px rgba(15, 23, 42, 0.35)',
          }}
        >
          <video
            ref={videoRef}
            muted
            playsInline
            style={{ width: '100%', display: 'block', objectFit: 'cover', minHeight: 240 }}
          />
          {!scannerReady && !cameraError && (
            <div style={overlayStyle}>Initialisation du flux caméra…</div>
          )}
          {cameraError && <div style={overlayStyle}>{cameraError}</div>}
        </div>

        <form
          onSubmit={handleManualSearch}
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
            background: '#f8fafc',
            borderRadius: 16,
            padding: '20px 24px',
            border: '1px solid #e2e8f0',
          }}
        >
          <h2 style={{ margin: 0, fontSize: '1.2rem' }}>Recherche manuelle</h2>
          <p style={{ margin: 0, color: '#475569', fontSize: '0.9rem' }}>
            Utilisez cette option si la caméra n&apos;est pas disponible. Copiez le hash inscrit sur le QR code.
          </p>
          <input
            name="manualHash"
            placeholder="Hash QR code"
            value={manualHash}
            onChange={(event) => setManualHash(event.target.value)}
            style={inputStyle}
            autoComplete="off"
          />
          <button type="submit" style={primaryButtonStyle}>
            Charger l&apos;outil
          </button>
        </form>
      </section>

      {feedback && (
        <div
          style={{
            padding: '14px 18px',
            borderRadius: 12,
            background: feedback.status === 'error' ? '#fee2e2' : '#dcfce7',
            color: feedback.status === 'error' ? '#991b1b' : '#166534',
          }}
        >
          {feedback.message}
        </div>
      )}

      {scannedHash && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <span style={{ fontSize: '0.85rem', color: '#64748b' }}>Hash détecté</span>
          <span style={{ fontFamily: 'monospace', fontSize: '0.95rem', color: '#0f172a' }}>{scannedHash}</span>
        </div>
      )}

      {tool && (
        <form
          onSubmit={handleSubmit}
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
            background: '#f1f5f9',
            borderRadius: 18,
            padding: '24px 28px',
            border: '1px solid rgba(148, 163, 184, 0.35)',
          }}
        >
          <h2 style={{ margin: 0 }}>Informations outil</h2>
          <p style={{ margin: 0, color: '#475569', fontSize: '0.9rem' }}>
            Dernière mise à jour : {formatDate(tool.updatedAt)} · Dernier scan : {formatDate(tool.lastScannedAt)}
          </p>
          {tool.lastScannedBy && (
            <p style={{ margin: 0, color: '#475569', fontSize: '0.9rem' }}>
              Dernière opération par : {tool.lastScannedBy.name || tool.lastScannedBy.email} ({tool.lastScannedBy.role})
            </p>
          )}

          <div style={gridTwoColumns}>
            <div style={fieldColumn}>
              <label style={labelStyle} htmlFor="name">
                Nom
              </label>
              <input
                id="name"
                value={formState.name}
                onChange={(event) => setFormState((prev) => ({ ...prev, name: event.target.value }))}
                style={inputStyle}
                required
                disabled={!canEdit}
              />
            </div>
            <div style={fieldColumn}>
              <label style={labelStyle} htmlFor="status">
                Statut
              </label>
              <input
                id="status"
                value={formState.status}
                onChange={(event) => setFormState((prev) => ({ ...prev, status: event.target.value }))}
                style={inputStyle}
                placeholder="Disponible, En maintenance…"
                disabled={!canEdit}
              />
            </div>
          </div>

          <div style={gridTwoColumns}>
            <div style={fieldColumn}>
              <label style={labelStyle} htmlFor="location">
                Localisation
              </label>
              <input
                id="location"
                value={formState.location}
                onChange={(event) => setFormState((prev) => ({ ...prev, location: event.target.value }))}
                style={inputStyle}
                placeholder="Atelier Paris, Lyon…"
                disabled={!canEdit}
              />
            </div>
            <div style={fieldColumn}>
              <label style={labelStyle} htmlFor="operator">
                Opérateur
              </label>
              <input
                id="operator"
                value={formState.operator}
                onChange={(event) => setFormState((prev) => ({ ...prev, operator: event.target.value }))}
                style={inputStyle}
                placeholder="Nom du technicien"
                disabled={!canEdit}
              />
            </div>
          </div>

          <div style={fieldColumn}>
            <label style={labelStyle} htmlFor="description">
              Description
            </label>
            <textarea
              id="description"
              value={formState.description}
              onChange={(event) => setFormState((prev) => ({ ...prev, description: event.target.value }))}
              style={{ ...inputStyle, minHeight: 90, resize: 'vertical' }}
              placeholder="Description courte de l'outil"
              disabled={!canEdit}
            />
          </div>

          <div style={fieldColumn}>
            <label style={labelStyle} htmlFor="note">
              Commentaire
            </label>
            <textarea
              id="note"
              value={formState.note}
              onChange={(event) => setFormState((prev) => ({ ...prev, note: event.target.value }))}
              style={{ ...inputStyle, minHeight: 80, resize: 'vertical' }}
              placeholder="Observations lors du dernier contrôle"
              disabled={!canEdit}
            />
          </div>

          <button type="submit" style={{ ...primaryButtonStyle, alignSelf: 'flex-start' }} disabled={!canEdit || isSaving}>
            {isSaving ? 'Enregistrement…' : 'Sauvegarder les modifications'}
          </button>
        </form>
      )}

      {isLoadingTool && (
        <div style={{ fontSize: '0.9rem', color: '#475569' }}>Chargement des informations…</div>
      )}
    </div>
  );
}

const overlayStyle = {
  position: 'absolute',
  inset: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  textAlign: 'center',
  padding: '20px',
  color: 'white',
  background: 'rgba(15, 23, 42, 0.72)',
  fontSize: '0.95rem',
};

const inputStyle = {
  borderRadius: 12,
  border: '1px solid #cbd5f5',
  padding: '10px 12px',
  fontSize: '1rem',
  background: 'white',
};

const primaryButtonStyle = {
  padding: '10px 16px',
  borderRadius: 999,
  border: 'none',
  background: '#2563eb',
  color: 'white',
  fontWeight: 600,
  cursor: 'pointer',
};

const gridTwoColumns = {
  display: 'grid',
  gap: 16,
  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
};

const fieldColumn = {
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
};

const labelStyle = {
  fontWeight: 600,
  color: '#1f2937',
};
