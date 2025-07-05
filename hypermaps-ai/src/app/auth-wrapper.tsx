'use client';

import { useHypergraphAuth } from '@graphprotocol/hypergraph-react';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';
import Link from 'next/link';
import { Logout } from '../components/logout';

export function AuthWrapper({ children }: { children: React.ReactNode }) {
  const { authenticated } = useHypergraphAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (pathname.startsWith('/login') || pathname.startsWith('/authenticate-success')) {
      return;
    }

    if (!authenticated) {
      router.push('/login');
    }
  }, [authenticated, router, pathname]);

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