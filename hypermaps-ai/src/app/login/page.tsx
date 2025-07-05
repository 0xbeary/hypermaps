'use client';

import { useHypergraphApp } from '@graphprotocol/hypergraph-react';

export default function LoginPage() {
  const { redirectToConnect } = useHypergraphApp();

  return (
    <div className="flex flex-1 justify-center items-center flex-col gap-4">
      <button
        onClick={() => {
          redirectToConnect({
            storage: localStorage,
            // connectUrl: 'http://localhost:5180',
            connectUrl: 'https://hypergraph-connect.vercel.app/',
            successUrl: `${window.location.origin}/authenticate-success`,
            // hardcoded appId for testing
            appId: '93bb8907-085a-4a0e-83dd-62b0dc98e793',
            redirectFn: (url: URL) => {
              window.location.href = url.toString();
            },
          });
        }}
      >
        Authenticate with Connect
      </button>
    </div>
  );
} 