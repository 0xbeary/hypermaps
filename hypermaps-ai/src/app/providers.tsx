'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import * as React from 'react';
import { HypergraphAppProvider } from '@graphprotocol/hypergraph-react';
import { mapping } from './mapping';

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = React.useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <HypergraphAppProvider mapping={mapping}>
        {children}
      </HypergraphAppProvider>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
} 