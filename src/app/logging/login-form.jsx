'use client';

import { useFormState, useFormStatus } from 'react-dom';

import { loginAction } from '@/app/actions/auth.js';

const initialState = { status: 'idle', message: null };

export default function LoginForm({ callbackUrl }) {
  const [state, formAction] = useFormState(loginAction, initialState);

  return (
    <form
      action={formAction}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
        padding: '28px 32px',
        borderRadius: 20,
        background: '#f8fafc',
        border: '1px solid #e2e8f0',
        boxShadow: '0 12px 30px rgba(15, 23, 42, 0.12)',
        maxWidth: 420,
      }}
    >
      <input type="hidden" name="callbackUrl" value={callbackUrl} />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <label htmlFor="email" style={{ fontWeight: 600 }}>
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="prenom.nom@exemple.fr"
          required
          style={inputStyle}
        />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <label htmlFor="password" style={{ fontWeight: 600 }}>
          Mot de passe
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          placeholder="••••••••"
          required
          style={inputStyle}
        />
      </div>

      {state?.message && (
        <p style={{ margin: 0, padding: '12px 16px', background: '#fee2e2', borderRadius: 12, color: '#991b1b' }}>
          {state.message}
        </p>
      )}

      <SubmitButton />

      <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>
        Votre accès est personnel. En cas de perte d&apos;identifiants, contactez un administrateur.
      </p>
    </form>
  );
}

function SubmitButton() {
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
      }}
      disabled={pending}
    >
      {pending ? 'Connexion…' : 'Se connecter'}
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
