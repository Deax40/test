'use client';

import { useCallback, useMemo, useState } from 'react';
import QrReader from '@/components/QrReader.jsx';

const emptyForm = {
  name: '',
  contact: '',
  weight: '',
  referenceDate: '',
  lastUser: '',
  dimensions: '',
  notes: '',
};

function serialisePayload(form) {
  const payload = {
    contact: form.contact?.trim() || null,
    weight: form.weight?.trim() || null,
    referenceDate: form.referenceDate ? new Date(form.referenceDate).toISOString() : null,
    lastUser: form.lastUser?.trim() || null,
    dimensions: form.dimensions?.trim() || null,
    notes: form.notes?.trim() || null,
  };

  const trimmedName = form.name?.trim();
  if (trimmedName) {
    payload.name = trimmedName;
  }

  return payload;
}

function normaliseForm(tool) {
  return {
    name: tool?.name ?? '',
    contact: tool?.contact ?? '',
    weight: tool?.weight ?? '',
    referenceDate: tool?.referenceDate ? tool.referenceDate.slice(0, 10) : '',
    lastUser: tool?.lastUser ?? '',
    dimensions: tool?.dimensions ?? '',
    notes: tool?.notes ?? '',
  };
}

export default function ScanPage() {
  const [form, setForm] = useState(emptyForm);
  const [tool, setTool] = useState(null);
  const [scannedHash, setScannedHash] = useState('');
  const [feedback, setFeedback] = useState({ type: 'info', message: 'Scannez un QR code pour commencer.' });
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [manualHash, setManualHash] = useState('');

  const hasTool = useMemo(() => Boolean(tool), [tool]);

  const loadTool = useCallback(async (hash) => {
    if (!hash) return;
    setIsLoading(true);
    setFeedback({ type: 'info', message: 'Identification en cours…' });
    try {
      const response = await fetch(`/api/tools/${encodeURIComponent(hash)}`);
      if (!response.ok) {
        throw new Error('Outil introuvable');
      }
      const data = await response.json();
      setTool(data);
      setScannedHash(hash);
      setForm(normaliseForm(data));
      setFeedback({ type: 'success', message: 'Outil identifié. Vous pouvez mettre à jour les informations.' });
    } catch (error) {
      console.error(error);
      setTool(null);
      setScannedHash('');
      setFeedback({ type: 'error', message: 'Aucun outil ne correspond à ce QR code.' });
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleScan = useCallback((decodedText) => {
    const hash = decodedText?.trim();
    if (!hash || hash === scannedHash) return;
    loadTool(hash);
  }, [loadTool, scannedHash]);

  const handleFieldChange = (field) => (event) => {
    const { value } = event.target;
    setForm((previous) => ({ ...previous, [field]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!hasTool || !scannedHash) {
      setFeedback({ type: 'error', message: 'Aucun outil sélectionné.' });
      return;
    }
    setIsSaving(true);
    setFeedback({ type: 'info', message: 'Enregistrement en cours…' });
    try {
      const response = await fetch(`/api/tools/${encodeURIComponent(scannedHash)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(serialisePayload(form)),
      });
      if (!response.ok) {
        throw new Error('La mise à jour a échoué');
      }
      const updatedTool = await response.json();
      setTool(updatedTool);
      setForm(normaliseForm(updatedTool));
      setFeedback({ type: 'success', message: 'Modifications enregistrées dans la base Common.' });
    } catch (error) {
      console.error(error);
      setFeedback({ type: 'error', message: 'Impossible d’enregistrer les modifications.' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleManualSubmit = (event) => {
    event.preventDefault();
    const trimmed = manualHash.trim();
    if (!trimmed) {
      setFeedback({ type: 'error', message: 'Entrez un hash à partir d’un QR code valide.' });
      return;
    }
    loadTool(trimmed);
    setManualHash('');
  };

  return (
    <div className="scan-layout">
      <div className="scan-panel">
        <h2>Scanner un outil</h2>
        <p>Autorisez l’accès à la caméra pour détecter automatiquement le QR code lié à l’outil.</p>
        <QrReader
          onDecode={handleScan}
          onError={(error) => {
            console.error(error);
            setFeedback({ type: 'error', message: 'Lecture automatique indisponible. Utilisez la saisie manuelle.' });
          }}
        />
        <form className="manual-input" onSubmit={handleManualSubmit}>
          <label htmlFor="manual-hash">Saisie manuelle (masquée)</label>
          <input
            type="password"
            id="manual-hash"
            placeholder="Coller le code lu depuis le QR"
            value={manualHash}
            onChange={(event) => setManualHash(event.target.value)}
            autoComplete="off"
          />
          <button type="submit" disabled={isLoading}>Identifier</button>
        </form>
        {feedback.type === 'info' && feedback.message && <div className="notice">{feedback.message}</div>}
        {feedback.type === 'error' && feedback.message && <div className="error">{feedback.message}</div>}
        {feedback.type === 'success' && feedback.message && <div className="success">{feedback.message}</div>}
      </div>
      <div className="scan-panel">
        <h2>Informations visibles</h2>
        <form onSubmit={handleSubmit}>
          <label htmlFor="tool-name">Nom de l’outil</label>
          <input
            id="tool-name"
            value={form.name}
            onChange={handleFieldChange('name')}
            placeholder="Nom complet"
            required
            disabled={!hasTool}
          />

          <label htmlFor="tool-contact">Numéro ou e-mail associé</label>
          <input
            id="tool-contact"
            value={form.contact}
            onChange={handleFieldChange('contact')}
            placeholder="contact@exemple.com / numéro"
            disabled={!hasTool}
          />

          <label htmlFor="tool-weight">Poids</label>
          <input
            id="tool-weight"
            value={form.weight}
            onChange={handleFieldChange('weight')}
            placeholder="Ex. 5,4 kg"
            disabled={!hasTool}
          />

          <label htmlFor="tool-date">Date (dernière utilisation / prochain contrôle)</label>
          <input
            id="tool-date"
            type="date"
            value={form.referenceDate}
            onChange={handleFieldChange('referenceDate')}
            disabled={!hasTool}
          />

          <label htmlFor="tool-last-user">Dernière personne</label>
          <input
            id="tool-last-user"
            value={form.lastUser}
            onChange={handleFieldChange('lastUser')}
            placeholder="Nom ou équipe"
            disabled={!hasTool}
          />

          <label htmlFor="tool-dimensions">Dimensions</label>
          <input
            id="tool-dimensions"
            value={form.dimensions}
            onChange={handleFieldChange('dimensions')}
            placeholder="Ex. 120 × 40 × 30 mm"
            disabled={!hasTool}
          />

          <label htmlFor="tool-notes">Notes</label>
          <textarea
            id="tool-notes"
            value={form.notes}
            onChange={handleFieldChange('notes')}
            placeholder="Informations complémentaires visibles"
            disabled={!hasTool}
          />

          <button type="submit" disabled={!hasTool || isSaving}>
            {isSaving ? 'Enregistrement…' : 'Valider'}
          </button>
        </form>
      </div>
    </div>
  );
}
