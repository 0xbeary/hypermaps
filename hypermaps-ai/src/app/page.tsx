'use client';

import { useSpaces } from '@graphprotocol/hypergraph-react';
import { usePostgresSpaces } from './data-provider';
import { USE_POSTGRES } from '@/lib/config';
import Link from 'next/link';

// Component to render spaces from Postgres
function PostgresSpaces({ mode }: { mode: 'public' | 'private' }) {
  const { data: spaces, isPending } = usePostgresSpaces({ mode });

  const title = mode === 'public' ? 'Public Spaces' : 'Private Spaces';
  const linkPrefix = mode === 'public' ? 'public-space' : 'private-space';
  const icon = mode === 'public' ? '📄' : '🔒';

  return (
    <div className="mt-4">
      <h4 className="text-lg">{title}</h4>
      <ul>
        {isPending && <li>Loading {mode} spaces...</li>}
        {!isPending && spaces?.length === 0 && <li>No {mode} spaces found</li>}
        {spaces?.map((space) => (
          <li key={space.id} className="mb-2">
            <div className="flex gap-2">
              <Link href={`/${linkPrefix}/${space.id}`} className="text-blue-600 hover:underline">
                {icon} {space.name}
              </Link>
              <Link href={`/flow-space/${space.id}`} className="text-purple-600 hover:underline">
                🗺️ Flow View
              </Link>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

// Component to render spaces from Hypergraph
function HypergraphSpaces({ mode }: { mode: 'public' | 'private' }) {
  const { data: spaces, isPending } = useSpaces({ mode });

  const title = mode === 'public' ? 'Public Spaces' : 'Private Spaces';
  const linkPrefix = mode === 'public' ? 'public-space' : 'private-space';
  const icon = mode === 'public' ? '📄' : '🔒';

  return (
    <div className="mt-4">
      <h4 className="text-lg">{title}</h4>
      <ul>
        {isPending && <li>Loading {mode} spaces...</li>}
        {!isPending && spaces?.length === 0 && <li>No {mode} spaces found</li>}
        {spaces?.map((space) => (
          <li key={space.id} className="mb-2">
            <div className="flex gap-2">
              <Link href={`/${linkPrefix}/${space.id}`} className="text-blue-600 hover:underline">
                {icon} {space.name}
              </Link>
              <Link href={`/flow-space/${space.id}`} className="text-purple-600 hover:underline">
                🗺️ Flow View
              </Link>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function HomePage() {
  return (
    <div className="p-2">
      <h3 className="text-xl">Welcome to Hypergraph AI Map!</h3>
      <p className="mt-2">Create node-based conversations with AI using React Flow.</p>
      
      {USE_POSTGRES ? (
        <>
          <PostgresSpaces mode="public" />
          <PostgresSpaces mode="private" />
        </>
      ) : (
        <>
          <HypergraphSpaces mode="public" />
          <HypergraphSpaces mode="private" />
        </>
      )}
    </div>
  );
}
