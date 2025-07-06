'use client';

import { ChatMessage } from '@/app/schema';
import { HypergraphSpaceProvider, useQuery, useSpace } from '@graphprotocol/hypergraph-react';
import { use } from 'react';

interface Props {
  params: Promise<{ 'space-id': string }>;
}

export default function PublicSpacePage({ params }: Props) {
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
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading public space...</p>
        </div>
      </div>
    );
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100 mb-8">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mr-4">
              <span className="text-2xl">🌐</span>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{name}</h1>
              <p className="text-gray-600">Public Conversation Space</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100">
          {sortedConversations.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">🔍</span>
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">No conversations yet</h2>
              <p className="text-gray-600">This public space is waiting for its first conversation map</p>
            </div>
          ) : (
            <div className="p-8">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-bold text-gray-900">Conversations</h2>
                <div className="text-sm text-gray-500">
                  {sortedConversations.length} conversation{sortedConversations.length !== 1 ? 's' : ''}
                </div>
              </div>
              
              <div className="space-y-8">
                {sortedConversations.map(([conversationId, conversationMessages]) => {
                  // Sort messages within conversation by position and creation time
                  const sortedMessages = conversationMessages.sort((a, b) => {
                    if (a.position !== b.position) {
                      return a.position - b.position;
                    }
                    return a.createdAt.getTime() - b.createdAt.getTime();
                  });

                  return (
                    <div key={conversationId} className="bg-gray-50 rounded-2xl p-6 border border-gray-200">
                      <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center mr-3">
                            <span className="text-lg">💬</span>
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">
                              {conversationId}
                            </h3>
                            <p className="text-sm text-gray-500">
                              {sortedMessages.length} message{sortedMessages.length !== 1 ? 's' : ''}
                            </p>
                          </div>
                        </div>
                        <div className="text-sm text-gray-500">
                          {new Date(Math.max(...sortedMessages.map(m => m.createdAt.getTime()))).toLocaleDateString()}
                        </div>
                      </div>
                      
                      <div className="space-y-4">
                        {sortedMessages.map((message) => (
                          <div 
                            key={message.id} 
                            className={`p-4 rounded-xl border-l-4 ${
                              message.role === 'user' 
                                ? 'bg-white border-blue-400' 
                                : 'bg-white border-green-400'
                            }`}
                          >
                            <div className="flex justify-between items-start mb-3">
                              <div className="flex items-center">
                                <span className={`text-sm font-bold ${
                                  message.role === 'user' ? 'text-blue-600' : 'text-green-600'
                                }`}>
                                  {message.role === 'user' ? '👤 User' : '🤖 Assistant'}
                                </span>
                                <span className="ml-3 text-xs text-gray-500">
                                  {message.createdAt.toLocaleString()}
                                </span>
                              </div>
                              <div className="text-xs text-gray-500">
                                #{message.position}
                              </div>
                            </div>
                            
                            <p className="text-gray-800 leading-relaxed">{message.content}</p>
                            
                            {message.parentMessageId && (
                              <div className="text-xs text-gray-500 mt-2 flex items-center">
                                <span className="mr-1">↳</span>
                                Reply to: {message.parentMessageId.slice(0, 8)}...
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 