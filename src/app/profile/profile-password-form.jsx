'use client';

import { useEffect, useState } from 'react';
import { useFormState, useFormStatus } from 'react-dom';

import { changePasswordAction } from '@/app/actions/profile.js';

const initialState = { status: 'idle', message: null };

export default function ProfilePasswordForm() {
  const [state, formAction] = useFormState(changePasswordAction, initialState);
  const [resetKey, setResetKey] = useState(0);

  useEffect(() => {
    if (state?.status === 'success') {
      setResetKey((prev) => prev + 1);
    }
  }, [state]);

  return (
    <form
      key={resetKey}
      action={formAction}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
        padding: '24px 28px',
        borderRadius: 18,
        background: '#f8fafc',
        border: '1px solid #e2e8f0',
        maxWidth: 520,
      }}
    >
      <PasswordField id="currentPassword" label="Mot de passe actuel" autoComplete="current-password" />
      <PasswordField id="newPassword" label="Nouveau mot de passe" autoComplete="new-password" />
      <PasswordField id="confirmPassword" label="Confirmer le mot de passe" autoComplete="new-password" />

      {state?.message && (
        <p
          style={{
            margin: 0,
            padding: '12px 16px',
            borderRadius: 12,
            background: state.status === 'success' ? '#dcfce7' : '#fee2e2',
            color: state.status === 'success' ? '#166534' : '#991b1b',
          }}
        >
          {state.message}
        </p>
      )}

      <SubmitButton label="Mettre à jour" />
    </form>
  );
}

function PasswordField({ id, label, autoComplete }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label htmlFor={id} style={{ fontWeight: 600 }}>
        {label}
      </label>
      <input id={id} name={id} type="password" autoComplete={autoComplete} required style={inputStyle} />
    </div>
  );
}

function SubmitButton({ label }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      style={{
        padding: '10px 16px',
        borderRadius: 999,
        border: 'none',
        background: '#2563eb',
        color: 'white',
        fontWeight: 600,
        cursor: pending ? 'progress' : 'pointer',
        alignSelf: 'flex-start',
      }}
      disabled={pending}
    >
      {pending ? 'Enregistrement…' : label}
    </button>
  );
}

const inputStyle = {
  borderRadius: 12,
  border: '1px solid #cbd5f5',
  padding: '10px 12px',
  fontSize: '1rem',
  background: 'white',
};
