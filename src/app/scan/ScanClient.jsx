'use client';

import { useCallback, useState } from 'react';

const emptyForm = {
  contactInfo: '',
  weight: '',
  scheduledAt: '',
  lastUser: '',
  dimensions: ''
};

export default function ScanClient() {
  const [hashInput, setHashInput] = useState('');
  const [activeHash, setActiveHash] = useState(null);
  const [toolName, setToolName] = useState('');
  const [formValues, setFormValues] = useState(emptyForm);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  const resetForm = useCallback(() => {
    setToolName('');
    setFormValues(emptyForm);
    setActiveHash(null);
  }, []);

  const handleLookup = useCallback(
    async (event) => {
      event.preventDefault();
      setError(null);
      setMessage(null);

      const value = hashInput.trim();
      if (!value) {
        setError('Veuillez scanner un QR code valide.');
        return;
      }

      setIsLoading(true);

      try {
        const response = await fetch(`/api/tools/${encodeURIComponent(value)}`);
        if (!response.ok) {
          const data = await response.json().catch(() => ({}));
          throw new Error(data.error ?? 'Outil introuvable.');
        }

        const data = await response.json();
        setToolName(data.name);
        setFormValues({
          contactInfo: data.contactInfo ?? '',
          weight: data.weight ?? '',
          scheduledAt: data.scheduledAt ? data.scheduledAt.slice(0, 10) : '',
          lastUser: data.lastUser ?? '',
          dimensions: data.dimensions ?? ''
        });
        setActiveHash(value);
        setHashInput('');
        setMessage('Outil identifié. Vous pouvez mettre à jour les informations visibles.');
      } catch (lookupError) {
        setError(lookupError.message || 'Impossible de récupérer l\'outil.');
        resetForm();
      } finally {
        setIsLoading(false);
      }
    },
    [hashInput, resetForm]
  );

  const handleChange = useCallback((event) => {
    const { name, value } = event.target;
    setFormValues((prev) => ({ ...prev, [name]: value }));
  }, []);

  const handleUpdate = useCallback(
    async (event) => {
      event.preventDefault();
      if (!activeHash) {
        setError('Veuillez d\'abord scanner un QR code.');
        return;
      }

      setIsSaving(true);
      setError(null);
      setMessage(null);

      try {
        const response = await fetch(`/api/tools/${encodeURIComponent(activeHash)}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contactInfo: formValues.contactInfo,
            weight: formValues.weight,
            scheduledAt: formValues.scheduledAt || null,
            lastUser: formValues.lastUser,
            dimensions: formValues.dimensions
          })
        });

        if (!response.ok) {
          const data = await response.json().catch(() => ({}));
          throw new Error(data.error ?? 'Erreur lors de l\'enregistrement.');
        }

        const updated = await response.json();
        setFormValues({
          contactInfo: updated.contactInfo ?? '',
          weight: updated.weight ?? '',
          scheduledAt: updated.scheduledAt ? updated.scheduledAt.slice(0, 10) : '',
          lastUser: updated.lastUser ?? '',
          dimensions: updated.dimensions ?? ''
        });
        setMessage('Informations mises à jour avec succès.');
      } catch (updateError) {
        setError(updateError.message || 'Impossible d\'enregistrer les modifications.');
      } finally {
        setIsSaving(false);
      }
    },
    [activeHash, formValues]
  );

  return (
    <section style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ padding: 16, border: '1px solid #ddd', borderRadius: 12 }}>
        <h2 style={{ marginTop: 0 }}>Scanner un outil</h2>
        <p style={{ marginTop: 0, color: '#555' }}>
          Scannez un QR code pour identifier un outil. Seules les informations pratiques sont affichées et modifiables. Le hash
          unique reste invisible et uniquement stocké côté serveur.
        </p>

        <form onSubmit={handleLookup} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <label htmlFor="hash" style={{ fontWeight: 600 }}>
            Résultat du scan
          </label>
          <input
            id="hash"
            name="hash"
            type="password"
            value={hashInput}
            onChange={(event) => setHashInput(event.target.value)}
            placeholder="Collez ici la valeur lue par le QR code"
            autoComplete="off"
            style={{ padding: '10px 12px', borderRadius: 8, border: '1px solid #bbb', fontSize: 16 }}
          />
          <button
            type="submit"
            style={{
              padding: '10px 16px',
              borderRadius: 8,
              border: '1px solid #0f62fe',
              background: isLoading ? '#a6c8ff' : '#0f62fe',
              color: '#fff',
              fontWeight: 600,
              cursor: isLoading ? 'wait' : 'pointer'
            }}
            disabled={isLoading}
          >
            {isLoading ? 'Recherche…' : 'Identifier'}
          </button>
        </form>

        {(message || error) && (
          <p style={{ marginBottom: 0, color: error ? '#d70000' : '#0a7e07', fontWeight: 600 }}>
            {error ?? message}
          </p>
        )}
      </div>

      {toolName ? (
        <div style={{ padding: 16, border: '1px solid #ddd', borderRadius: 12, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <h3 style={{ margin: '0 0 4px' }}>{toolName}</h3>
            <p style={{ margin: 0, color: '#555' }}>
              Modifiez les champs visibles puis validez pour enregistrer les changements directement dans la base Common.
            </p>
          </div>

          <form onSubmit={handleUpdate} style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
            <Field
              label="Numéro / e-mail"
              name="contactInfo"
              value={formValues.contactInfo}
              onChange={handleChange}
              placeholder="Ex. 06 12 34 56 78"
            />
            <Field
              label="Poids"
              name="weight"
              value={formValues.weight}
              onChange={handleChange}
              placeholder="Ex. 12 kg"
            />
            <Field
              label="Date (dernière utilisation ou prochain contrôle)"
              name="scheduledAt"
              value={formValues.scheduledAt}
              onChange={handleChange}
              type="date"
            />
            <Field
              label="Dernière personne ayant utilisé l'outil"
              name="lastUser"
              value={formValues.lastUser}
              onChange={handleChange}
              placeholder="Ex. J. Dupont"
            />
            <Field
              label="Dimensions"
              name="dimensions"
              value={formValues.dimensions}
              onChange={handleChange}
              placeholder="Ex. 50 x 20 x 15 cm"
            />
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'flex-start' }}>
              <button
                type="submit"
                style={{
                  padding: '12px 16px',
                  borderRadius: 8,
                  border: '1px solid #0f62fe',
                  background: isSaving ? '#a6c8ff' : '#0f62fe',
                  color: '#fff',
                  fontWeight: 600,
                  cursor: isSaving ? 'wait' : 'pointer'
                }}
                disabled={isSaving}
              >
                {isSaving ? 'Enregistrement…' : 'Valider'}
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div style={{ padding: 16, border: '1px dashed #bbb', borderRadius: 12, color: '#666' }}>
          Scannez un QR code pour afficher et modifier une fiche outil.
        </div>
      )}
    </section>
  );
}

function Field({ label, name, value, onChange, placeholder, type = 'text' }) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <span style={{ fontWeight: 600 }}>{label}</span>
      <input
        name={name}
        value={value}
        onChange={onChange}
        type={type}
        placeholder={placeholder}
        style={{ padding: '10px 12px', borderRadius: 8, border: '1px solid #bbb', fontSize: 15 }}
      />
    </label>
  );
}
