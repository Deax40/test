'use client';

import { createContext, useContext, useMemo, useState } from 'react';

const AuthContext = createContext({ session: null, setSession: () => {} });

export function AuthProvider({ initialSession, children }) {
  const [session, setSession] = useState(initialSession ?? null);

  const value = useMemo(() => ({ session, setSession }), [session]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
