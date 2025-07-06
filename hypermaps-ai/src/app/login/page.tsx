'use client';

import { useHypergraphApp } from '@graphprotocol/hypergraph-react';

export default function LoginPage() {
  const { redirectToConnect } = useHypergraphApp();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
      <div className="max-w-md w-full mx-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          {/* Logo and Title */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              🗺️ <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Hypermaps</span>
            </h1>
            <p className="text-gray-600">Connect to start mapping conversations</p>
          </div>

          {/* Login Form */}
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Welcome Back</h2>
              <p className="text-gray-600 mb-6">
                Sign in to access your conversation maps and collaborate with others
              </p>
            </div>

            <button
              onClick={() => {
                redirectToConnect({
                  storage: localStorage,
                  connectUrl: 'https://hypergraph-connect.vercel.app/',
                  successUrl: `${window.location.origin}/authenticate-success`,
                  appId: '93bb8907-085a-4a0e-83dd-62b0dc98e793',
                  redirectFn: (url: URL) => {
                    window.location.href = url.toString();
                  },
                });
              }}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold py-4 px-6 rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              <span className="flex items-center justify-center">
                <span className="mr-2">🔐</span>
                Connect with Hypergraph
              </span>
            </button>

            <div className="text-center text-sm text-gray-500">
              <p>Secure authentication powered by Hypergraph Connect</p>
            </div>
          </div>

          {/* Features */}
          <div className="mt-8 pt-6 border-t border-gray-100">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="text-center">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <span className="text-sm">🔒</span>
                </div>
                <p className="text-gray-600">Secure</p>
              </div>
              <div className="text-center">
                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <span className="text-sm">⚡</span>
                </div>
                <p className="text-gray-600">Fast</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 