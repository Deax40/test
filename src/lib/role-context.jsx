'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';

export const ROLES = {
  TECH: 'tech',
  ADMIN: 'admin',
};

export const ROLE_LABELS = {
  [ROLES.TECH]: 'Technicien',
  [ROLES.ADMIN]: 'Administrateur',
};

const RoleContext = createContext({
  role: ROLES.TECH,
  setRole: () => {},
});

export function RoleProvider({ children }) {
  const [role, setRole] = useState(ROLES.TECH);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem('tool-tracker-role');
      if (stored && Object.values(ROLES).includes(stored)) {
        setRole(stored);
      }
    } catch (error) {
      console.warn('Impossible de lire le rôle stocké:', error);
    }
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem('tool-tracker-role', role);
    } catch (error) {
      console.warn('Impossible d’enregistrer le rôle:', error);
    }
  }, [role]);

  const value = useMemo(() => ({ role, setRole }), [role]);

  return <RoleContext.Provider value={value}>{children}</RoleContext.Provider>;
}

export function useRole() {
  const context = useContext(RoleContext);
  if (!context) {
    throw new Error('useRole doit être utilisé dans un RoleProvider');
  }
  return context;
}
