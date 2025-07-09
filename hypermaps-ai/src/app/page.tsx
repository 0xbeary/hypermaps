'use client';

import { useSpaces } from '@graphprotocol/hypergraph-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LinkButton } from '@/components/ui/button';
import { Loading } from '@/components/ui/loading';

export default function HomePage() {
  const { data: publicSpaces, isPending: publicSpacesPending } = useSpaces({ mode: 'public' });
  const { data: privateSpaces, isPending: privateSpacesPending } = useSpaces({ mode: 'private' });

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto px-6 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-6xl font-bold text-gray-900 mb-4">
            🗺️ <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Hypermaps</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8">
            Transform AI conversations into interactive knowledge maps. Create, collaborate, and share visual conversation flows.
          </p>
        </div>

        {/* Spaces Grid */}
        <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
          {/* Public Spaces */}
          <Card padding="lg">
            <CardHeader>
              <div className="flex items-center">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mr-4">
                  <span className="text-2xl">🌐</span>
                </div>
                <div>
                  <CardTitle>Public Spaces</CardTitle>
                  <CardDescription>Explore shared knowledge maps</CardDescription>
                </div>
              </div>
            </CardHeader>
            
            <CardContent>
              <div className="space-y-3">
                {publicSpacesPending && (
                  <Loading size="default" text="Loading public spaces..." className="py-8" />
                )}
                
                {!publicSpacesPending && publicSpaces?.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <span className="text-4xl mb-2 block">🔍</span>
                    No public spaces found
                  </div>
                )}
                
                {publicSpaces?.map((space) => (
                  <div key={space.id} className="group p-4 rounded-xl bg-gray-50 hover:bg-blue-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 group-hover:text-blue-900">{space.name}</h3>
                        <p className="text-sm text-gray-500 mt-1">Public collaboration space</p>
                      </div>
                      <div className="flex gap-2">
                        <LinkButton 
                          href={`/public-space/${space.id}`}
                          variant="default"
                          size="default"
                        >
                          📄 Debug View
                        </LinkButton>
                        <LinkButton 
                          href={`/flow-space/${space.id}`}
                          variant="secondary"
                          size="default"
                        >
                          🗺️ Flow
                        </LinkButton>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Private Spaces */}
          <Card padding="lg">
            <CardHeader>
              <div className="flex items-center">
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mr-4">
                  <span className="text-2xl">🔒</span>
                </div>
                <div>
                  <CardTitle>Private Spaces</CardTitle>
                  <CardDescription>Your secure conversation maps</CardDescription>
                </div>
              </div>
            </CardHeader>
            
            <CardContent>
              <div className="space-y-3">
                {privateSpacesPending && (
                  <Loading variant="primary" size="default" text="Loading private spaces..." className="py-8" />
                )}
                
                {!privateSpacesPending && privateSpaces?.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <span className="text-4xl mb-2 block">🔐</span>
                    No private spaces found
                  </div>
                )}
                
                {privateSpaces?.map((space) => (
                  <div key={space.id} className="group p-4 rounded-xl bg-gray-50 hover:bg-purple-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 group-hover:text-purple-900">{space.name}</h3>
                        <p className="text-sm text-gray-500 mt-1">Private collaboration space</p>
                      </div>
                      <div className="flex gap-2">
                        <LinkButton 
                          href={`/private-space/${space.id}`}
                          variant="secondary"
                          size="default"
                        >
                          🔒 Debug View
                        </LinkButton>
                        <LinkButton 
                          href={`/flow-space/${space.id}`}
                          variant="default"
                          size="default"
                        >
                          🗺️ Flow
                        </LinkButton>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Feature Highlights */}
        <div className="mt-16 grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          <div className="text-center p-6">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">💬</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Interactive Conversations</h3>
            <p className="text-gray-600">Transform AI chats into visual, branching conversation maps</p>
          </div>
          
          <div className="text-center p-6">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">🤝</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Real-time Collaboration</h3>
            <p className="text-gray-600">Work together on conversation maps with live updates</p>
          </div>
          
          <div className="text-center p-6">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">🌐</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Share Knowledge</h3>
            <p className="text-gray-600">Publish your maps on-chain for the world to explore</p>
          </div>
        </div>
      </div>
    </div>
  );
}
