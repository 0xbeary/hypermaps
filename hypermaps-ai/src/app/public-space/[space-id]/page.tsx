'use client';

import { ChatMessage } from '@/schema';
import { HypergraphSpaceProvider, useQuery, useSpace } from '@graphprotocol/hypergraph-react';
import { use } from 'react';

interface PublicSpacePageProps {
  params: Promise<{ 'space-id': string }>;
}

export default function PublicSpacePage({ params }: PublicSpacePageProps) {
  const resolvedParams = use(params);
  const spaceId = resolvedParams['space-id'];

  return (
    <HypergraphSpaceProvider space={spaceId}>
      <PublicSpace />
    </HypergraphSpaceProvider>
  );
}

function PublicSpace() {
  const { ready, name } = useSpace({ mode: 'public' });
  const { data: messages } = useQuery(ChatMessage, { mode: 'public' });

  if (!ready) {
    return <div>Loading...</div>;
  }

  // Group messages by conversation for better organization
  const messagesByConversation = messages?.reduce((acc, message) => {
    if (!acc[message.conversationId]) {
      acc[message.conversationId] = [];
    }
    acc[message.conversationId].push(message);
    return acc;
  }, {} as Record<string, ChatMessage[]>) || {};

  // Sort conversations by most recent message
  const sortedConversations = Object.entries(messagesByConversation)
    .sort(([, a], [, b]) => {
      const latestA = Math.max(...a.map(m => m.createdAt.getTime()));
      const latestB = Math.max(...b.map(m => m.createdAt.getTime()));
      return latestB - latestA;
    });

  return (
    <div className="flex flex-col h-screen">
      <h1 className="text-2xl font-bold mb-4">🌐 {name}</h1>
      
      {sortedConversations.length === 0 ? (
        <div className="text-center text-gray-500 mt-8">
          No public messages yet
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto space-y-6">
          {sortedConversations.map(([conversationId, conversationMessages]) => {
            // Sort messages within conversation by position and creation time
            const sortedMessages = conversationMessages.sort((a, b) => {
              if (a.position !== b.position) {
                return a.position - b.position;
              }
              return a.createdAt.getTime() - b.createdAt.getTime();
            });

            return (
              <div key={conversationId} className="border rounded-lg p-4 bg-white shadow-sm">
                <h3 className="text-lg font-semibold mb-3 text-gray-800">
                  💬 Conversation: {conversationId}
                </h3>
                
                <div className="space-y-3">
                  {sortedMessages.map((message) => (
                    <div 
                      key={message.id} 
                      className={`p-3 rounded-lg ${
                        message.role === 'user' 
                          ? 'bg-blue-50 border-l-4 border-blue-400' 
                          : 'bg-green-50 border-l-4 border-green-400'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span className={`text-sm font-bold ${
                          message.role === 'user' ? 'text-blue-600' : 'text-green-600'
                        }`}>
                          {message.role === 'user' ? '👤 User' : '🤖 Assistant'}
                        </span>
                        <span className="text-xs text-gray-500">
                          {message.createdAt.toLocaleString()}
                        </span>
                      </div>
                      
                      <p className="text-gray-800 mb-2">{message.content}</p>
                      
                      <div className="text-xs text-gray-500 flex gap-4">
                        <span>Position: {message.position}</span>
                        {message.parentMessageId && (
                          <span>↳ Reply to: {message.parentMessageId.slice(0, 8)}...</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
} 