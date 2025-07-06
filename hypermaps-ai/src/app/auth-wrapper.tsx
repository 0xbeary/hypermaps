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
  }, [authenticated, pathname, router]);

  if (USE_POSTGRES) {
    // In Postgres mode, we bypass wallet authentication.
    console.log('Postgres mode enabled, bypassing auth.');
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
          <div className="flex justify-between items-center max-w-7xl mx-auto">
            <Link href="/" className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">
                🗺️ <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Hypermaps</span>
              </h1>
            </Link>
            <div className="flex items-center gap-4">
              <Link 
                href="/" 
                className="text-gray-600 hover:text-gray-900 font-medium transition-colors"
              >
                Home
              </Link>
              <Logout />
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
        <div className="flex justify-between items-center max-w-7xl mx-auto">
          <Link href="/" className="flex items-center">
            <h1 className="text-2xl font-bold text-gray-900">
              🗺️ <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Hypermaps</span>
            </h1>
          </Link>
          <div className="flex items-center gap-4">
            <Link 
              href="/" 
              className="text-gray-600 hover:text-gray-900 font-medium transition-colors"
            >
              Home
            </Link>
            <Logout />
          </div>
        </div>
      </div>
      <div className="max-w-7xl mx-auto">
        {children}
      </div>
    </div>
  );
} 