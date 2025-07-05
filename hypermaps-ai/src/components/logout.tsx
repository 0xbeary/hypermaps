'use client';

import { useHypergraphApp, useHypergraphAuth } from '@graphprotocol/hypergraph-react';
import { useRouter } from 'next/navigation';

export function Logout() {
  const { logout } = useHypergraphApp();
  const { authenticated } = useHypergraphAuth();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <button type="button" onClick={handleLogout} disabled={!authenticated}>
      Logout
    </button>
  );
} 