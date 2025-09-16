'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useRole } from '@/lib/role-context.jsx';

export default function RoleGuard({ allowed, children }) {
  const { role } = useRole();
  const router = useRouter();

  const canAccess = allowed.includes(role);

  useEffect(() => {
    if (!canAccess) {
      router.replace('/common');
    }
  }, [canAccess, router]);

  if (!canAccess) {
    return null;
  }

  return children;
}
