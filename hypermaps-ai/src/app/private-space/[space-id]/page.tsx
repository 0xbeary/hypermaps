'use client';

import { 
  ChatMessage, 
  // Conversation 
} from '@/app/schema';
import {
  HypergraphSpaceProvider,
  preparePublish,
  publishOps,
  useCreateEntity,
  useUpdateEntity,
  useDeleteEntity,
  useHypergraphApp,
  useQuery,
  useSpace,
  useSpaces,
} from '@graphprotocol/hypergraph-react';
import { use, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';

interface PrivateSpacePageProps {
  params: Promise<{ 'space-id': string }>;
}

export default function PrivateSpacePage({ params }: PrivateSpacePageProps) {
  const resolvedParams = use(params);
  const spaceId = resolvedParams['space-id'];

  return (
    <HypergraphSpaceProvider space={spaceId}>
      <PrivateSpace />
    </HypergraphSpaceProvider>
  );
}

function PrivateSpace() {
  const { name, ready } = useSpace({ mode: 'private' });
  const { data: messages } = useQuery(ChatMessage, { mode: 'private', filter: {
    conversationId: { is: "conv-1"}
  } });
  const { data: publicSpaces } = useSpaces({ mode: 'public' });
  const [selectedSpace, setSelectedSpace] = useState<string>('');
  const createMessage = useCreateEntity(ChatMessage);
  const updateMessage = useUpdateEntity(ChatMessage);
  const deleteMessage = useDeleteEntity();
  const [messageContent, setMessageContent] = useState('');
  const [messageRole, setMessageRole] = useState<'user' | 'assistant'>('user');
  const [conversationId, setConversationId] = useState('conv-1');
  const { getSmartSessionClient } = useHypergraphApp();

  // Edit mode state
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState('');
  const [editingRole, setEditingRole] = useState<'user' | 'assistant'>('user');

  console.log(messages, 'msgs');
  
  // Example messages creation with UUID

  // Generate random conversation ID
  const generateRandomConversation = () => {
    const randomConvId = `conv-${uuidv4()}`;
    setConversationId(randomConvId);
    console.log(`Generated new conversation ID: ${randomConvId}`);
  };

  if (!ready) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading private space...</p>
        </div>
      </div>
    );
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!messageContent.trim()) return;
    
    createMessage({
      id: uuidv4(),
      content: messageContent,
      role: messageRole,
      createdAt: new Date(),
      conversationId: conversationId,
      parentMessageId: "",
      position: messages?.length || 0,
      x: 0,
      y: 0,
    });
    
    setMessageContent('');
  };

  const handleEdit = (message: ChatMessage) => {
    setEditingMessageId(message.id);
    setEditingContent(message.content);
    setEditingRole(message.role as 'user' | 'assistant');
  };

  const handleSaveEdit = (messageId: string) => {
    if (!editingContent.trim()) return;
    
    try {
      updateMessage(messageId, {
        content: editingContent,
        role: editingRole,
      });
      
      setEditingMessageId(null);
      setEditingContent('');
      setEditingRole('user');
    } catch (error) {
      console.error('Error updating message:', error);
      alert('Error updating message');
    }
  };

  const handleCancelEdit = () => {
    setEditingMessageId(null);
    setEditingContent('');
    setEditingRole('user');
  };

  const handleDelete = (messageId: string) => {
    if (window.confirm('Are you sure you want to delete this message?')) {
      try {
        deleteMessage(messageId);
        console.log(`Deleted message: ${messageId}`);
      } catch (error) {
        console.error('Error deleting message:', error);
        alert('Error deleting message');
      }
    }
  };

 

  const publishToPublicSpace = async (message: ChatMessage) => {
    if (!selectedSpace) {
      alert('No space selected');
      return;
    }
    try {
      const { ops } = await preparePublish({ entity: message, publicSpace: selectedSpace });
      const smartSessionClient = await getSmartSessionClient();
      if (!smartSessionClient) {
        throw new Error('Missing smartSessionClient');
      }
      const publishResult = await publishOps({
        ops,
        space: selectedSpace,
        name: 'Publish Message',
        walletClient: smartSessionClient,
      });
      console.log(publishResult, ops);
      alert('Message published to public space');
    } catch (error) {
      console.error(error);
      alert('Error publishing message to public space');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mr-4">
                <span className="text-2xl">🔒</span>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{name}</h1>
                <p className="text-gray-600">Private Conversation Space</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Create Message Form */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100 sticky top-8">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Create Message</h2>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Message Content
                  </label>
                  <textarea 
                    value={messageContent} 
                    onChange={(e) => setMessageContent(e.target.value)}
                    rows={4}
                    placeholder="Enter your message..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Role
                  </label>
                  <select 
                    value={messageRole} 
                    onChange={(e) => setMessageRole(e.target.value as 'user' | 'assistant')}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="user">👤 User</option>
                    <option value="assistant">🤖 Assistant</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Conversation ID
                  </label>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      value={conversationId} 
                      onChange={(e) => setConversationId(e.target.value)}
                      placeholder="conv-1"
                      className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                    <button 
                      type="button"
                      onClick={generateRandomConversation}
                      className="px-4 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors"
                    >
                      🎲
                    </button>
                  </div>
                </div>
                
                <button 
                  type="submit" 
                  className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold py-3 px-6 rounded-xl hover:from-purple-700 hover:to-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  Create Message
                </button>
              </form>
            </div>
          </div>

          {/* Messages List */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Messages</h2>
              
              {messages && messages.length > 0 ? (
                <div className="space-y-4">
                  {messages.map((message) => (
                    <div key={message.id} className={`p-4 rounded-xl border-l-4 ${
                      message.role === 'user' 
                        ? 'bg-blue-50 border-blue-400' 
                        : 'bg-green-50 border-green-400'
                    }`}>
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
                      </div>
                      
                      {editingMessageId === message.id ? (
                        <div className="space-y-3">
                          <textarea 
                            value={editingContent} 
                            onChange={(e) => setEditingContent(e.target.value)}
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          />
                          <div className="flex gap-2">
                            <button 
                              onClick={() => handleSaveEdit(message.id)}
                              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                            >
                              ✓ Save
                            </button>
                            <button 
                              onClick={handleCancelEdit}
                              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm"
                            >
                              ✗ Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <p className="text-gray-800 mb-3 leading-relaxed">{message.content}</p>
                          
                          <div className="flex flex-wrap gap-2 items-center">
                            <select 
                              value={selectedSpace} 
                              onChange={(e) => setSelectedSpace(e.target.value)}
                              className="text-sm px-3 py-1 border border-gray-300 rounded-lg"
                            >
                              <option value="">Select space to publish</option>
                              {publicSpaces?.map((space) => (
                                <option key={space.id} value={space.id}>
                                  {space.name}
                                </option>
                              ))}
                            </select>
                            <button 
                              onClick={() => publishToPublicSpace(message)}
                              className="px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                            >
                              📤 Publish
                            </button>
                            <button 
                              onClick={() => handleEdit(message)}
                              className="px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                            >
                              ✏️ Edit
                            </button>
                            <button 
                              onClick={() => handleDelete(message.id)}
                              className="px-3 py-1 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
                            >
                              🗑️ Delete
                            </button>
                          </div>
                          
                          <div className="text-xs text-gray-500 mt-2 flex gap-4">
                            <span>Conv: {message.conversationId}</span>
                            <span>Pos: {message.position}</span>
                            {message.parentMessageId && (
                              <span>Parent: {message.parentMessageId.slice(0, 8)}...</span>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <span className="text-4xl mb-4 block">💬</span>
                  <p>No messages yet. Create your first message to get started!</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 