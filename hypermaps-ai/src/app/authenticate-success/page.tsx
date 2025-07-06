'use client';

import { useHypergraphApp } from '@graphprotocol/hypergraph-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect } from 'react';

export default function AuthenticateSuccessPage() {
  const searchParams = useSearchParams();
  const ciphertext = searchParams.get('ciphertext') || '';
  const nonce = searchParams.get('nonce') || '';
  const { processConnectAuthSuccess } = useHypergraphApp();
  const router = useRouter();

  useEffect(() => {
    if (ciphertext && nonce) {
      processConnectAuthSuccess({ storage: localStorage, ciphertext, nonce });
      console.log('redirecting to /');
      router.replace('/');
    }
  }, [ciphertext, nonce, processConnectAuthSuccess, router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
      <div className="max-w-md w-full mx-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100 text-center">
          {/* Logo and Title */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              🗺️ <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Hypermaps</span>
            </h1>
          </div>

          {/* Loading Animation */}
          <div className="space-y-6">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center mx-auto">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
            </div>
            
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Authenticating...</h2>
              <p className="text-gray-600">
                Securely connecting you to your conversation maps
              </p>
            </div>
            
            <div className="flex justify-center space-x-1">
              <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce delay-100"></div>
              <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce delay-200"></div>
            </div>
          </div>

          {/* Success Message */}
          <div className="mt-8 p-4 bg-green-50 rounded-xl border border-green-200">
            <div className="flex items-center justify-center">
              <span className="text-green-600 text-lg mr-2">✅</span>
              <span className="text-green-800 font-medium">Authentication successful!</span>
            </div>
            <p className="text-green-700 text-sm mt-1">Redirecting to your dashboard...</p>
          </div>
        </div>
      </div>
    </div>
  );
} 