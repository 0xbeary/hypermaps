'use client';

import { USE_POSTGRES } from '@/lib/config';
import { HypergraphAppProvider } from '@graphprotocol/hypergraph-react';
import { mapping } from './mapping';

const PostgresProvider = ({ children }: { children: React.ReactNode }) => {
  // This will be implemented with a different context for the postgres backend.
  // For now, it just renders the children.
  console.log('Running in Postgres mode');
  return <>{children}</>;
};

export function DataProvider({ children }: { children: React.ReactNode }) {
  if (USE_POSTGRES) {
    return <PostgresProvider>{children}</PostgresProvider>;
  }

  return (
    <HypergraphAppProvider mapping={mapping}>
      {children}
    </HypergraphAppProvider>
  );
} 