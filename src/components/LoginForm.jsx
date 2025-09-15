'use client';

import { useFormState, useFormStatus } from 'react-dom';

import { login } from '@/app/actions/auth';

const initialState = { error: null };

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      style={{
        padding: '12px 16px',
        borderRadius: 8,
        border: '1px solid #0f62fe',
        background: pending ? '#a6c8ff' : '#0f62fe',
        color: '#fff',
        fontWeight: 600,
        cursor: pending ? 'wait' : 'pointer'
      }}
      disabled={pending}
    >
      {pending ? 'Connexion…' : 'Se connecter'}
    </button>
  );
}

export default function LoginForm() {
  const [state, formAction] = useFormState(login, initialState);

  return (
    <form action={formAction} style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: 16, border: '1px solid #ccc', borderRadius: 12 }}>
      <label htmlFor="email" style={{ fontWeight: 600 }}>
        Adresse e-mail
      </label>
      <input
        id="email"
        name="email"
        type="email"
        required
        placeholder="prenom.nom@exemple.com"
        autoComplete="email"
        style={{
          padding: '10px 12px',
          borderRadius: 8,
          border: '1px solid #bbb',
          fontSize: 16
        }}
      />
      {state?.error && (
        <p style={{ margin: 0, color: '#d70000', fontSize: 14 }}>{state.error}</p>
      )}
      <SubmitButton />
    </form>
  );
}
