'use client';

import { useHypergraphAuth } from '@graphprotocol/hypergraph-react';
import { usePathname, useRouter } from 'next/navigation';
import { USE_POSTGRES } from '@/lib/config';
import { useEffect } from 'react';
import Link from 'next/link';
import { Logout } from '../components/logout';

export function AuthWrapper({ children }: { children: React.ReactNode }) {
  // Always call hooks at the top level
  const { authenticated } = useHypergraphAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (USE_POSTGRES) {
      return; // Skip auth logic in Postgres mode
    }

    if (!authenticated && pathname !== '/login') {
      router.replace('/login');
      return;
    }

    if (authenticated && pathname === '/login') {
      router.replace('/');
      return;
    }
  }, [authenticated, pathname, router, USE_POSTGRES]);

  if (USE_POSTGRES) {
    // In Postgres mode, we bypass wallet authentication.
    console.log('Postgres mode enabled, bypassing auth.');
    return (
      <div className="min-h-screen bg-gray-900 text-white p-4">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold mb-4">My Hypergraph App</h1>
          <Link href="/">Home</Link>
          <Logout />
        </div>
        {children}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold mb-4">My Hypergraph App</h1>
        <Link href="/">Home</Link>
        <Logout />
      </div>
      {children}
    </div>
  );
} 