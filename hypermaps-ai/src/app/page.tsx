'use client';

import { useSpaces } from '@graphprotocol/hypergraph-react';
import Link from 'next/link';

export default function HomePage() {
  const { data: publicSpaces, isPending: publicSpacesPending } = useSpaces({ mode: 'public' });
  const { data: privateSpaces, isPending: privateSpacesPending } = useSpaces({ mode: 'private' });

  return (
    <div className="p-2">
      <h3 className="text-xl">Welcome to Hypergraph AI Map!</h3>
      <p className="mt-2">Create node-based conversations with AI using React Flow.</p>
      
      <div className="mt-4">
        <h4 className="text-lg">Public Spaces</h4>
        <ul>
          {publicSpacesPending && <li>Loading public spaces...</li>}
          {!publicSpacesPending && publicSpaces?.length === 0 && <li>No public spaces found</li>}
          {publicSpaces?.map((space) => (
            <li key={space.id} className="mb-2">
              <div className="flex gap-2">
                <Link href={`/public-space/${space.id}`} className="text-blue-600 hover:underline">
                  📄 {space.name}
                </Link>
                <Link href={`/flow-space/${space.id}`} className="text-purple-600 hover:underline">
                  🗺️ Flow View
                </Link>
              </div>
            </li>
          ))}
        </ul>
      </div>
      
      <div className="mt-4">
        <h4 className="text-lg">Private Spaces</h4>
        <ul>
          {privateSpacesPending && <li>Loading private spaces...</li>}
          {!privateSpacesPending && privateSpaces?.length === 0 && <li>No private spaces found</li>}
          {privateSpaces?.map((space) => (
            <li key={space.id} className="mb-2">
              <div className="flex gap-2">
                <Link href={`/private-space/${space.id}`} className="text-blue-600 hover:underline">
                  🔒 {space.name}
                </Link>
                <Link href={`/flow-space/${space.id}`} className="text-purple-600 hover:underline">
                  🗺️ Flow View
                </Link>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
