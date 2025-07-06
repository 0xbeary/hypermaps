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
  // const createConversation = useCreateEntity(Conversation)
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
  const createExampleMessages = () => {
    // Generate unique conversation ID
    const newConversationId = `conv-${uuidv4()}`;
    
    // Root message
    const rootMsg = createMessage({
      id: uuidv4(),
      content: "What is quantum computing?",
      role: "user",
      createdAt: new Date(),
      conversationId: newConversationId,
      parentMessageId: "",
      position: 0,
      x: 0,
      y: 0,
    });

    // AI response
    const aiResponse = createMessage({
      id: uuidv4(),
      content: "Quantum computing is a type of computation that harnesses quantum mechanics to process information in fundamentally different ways than classical computers. It uses quantum bits (qubits) that can exist in multiple states simultaneously, allowing for parallel processing of vast amounts of data.",
      role: "assistant", 
      createdAt: new Date(),
      conversationId: newConversationId,
      parentMessageId: rootMsg.id,
      position: 1,
      x: 0,
      y: 0,
    });

    // Follow-up question
    const followUp = createMessage({
      id: uuidv4(),
      content: "Can you explain quantum entanglement?",
      role: "user",
      createdAt: new Date(), 
      conversationId: newConversationId,
      parentMessageId: aiResponse.id,
      position: 2,
      x: 0,
      y: 0,
    });

    // Another AI response
    const aiResponse2 = createMessage({
      id: uuidv4(),
      content: "Quantum entanglement is a phenomenon where two or more particles become connected in such a way that the quantum state of each particle cannot be described independently. When particles are entangled, measuring one particle instantly affects the state of the other, regardless of the distance between them.",
      role: "assistant",
      createdAt: new Date(),
      conversationId: newConversationId,
      parentMessageId: followUp.id,
      position: 3,
      x: 0,
      y: 0,
    });

    console.log(`Created example conversation: ${newConversationId}`);
  };

  // Generate random conversation ID
  const generateRandomConversation = () => {
    const randomConvId = `conv-${uuidv4()}`;
    setConversationId(randomConvId);
    console.log(`Generated new conversation ID: ${randomConvId}`);
  };

  if (!ready) {
    return <div>Loading...</div>;
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

  const handleRoleChange = (value: string) => {
    if (value === 'user' || value === 'assistant') {
      setMessageRole(value);
    }
  };

  const handleEditRoleChange = (value: string) => {
    if (value === 'user' || value === 'assistant') {
      setEditingRole(value);
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
    <div className="flex flex-col h-screen">
      <h1 className="text-2xl font-bold">{name}</h1>
      
      <form onSubmit={handleSubmit} className="mb-4">
        <div className="flex flex-col gap-2">
          <label className="flex flex-col">
            <span className="text-sm font-bold">Message Content</span>
            <textarea 
              value={messageContent} 
              onChange={(e) => setMessageContent(e.target.value)}
              rows={3}
              placeholder="Enter your message..."
            />
          </label>
          
          <label className="flex flex-col">
            <span className="text-sm font-bold">Role</span>
            <select value={messageRole} onChange={(e) => handleRoleChange(e.target.value)}>
              <option value="user">User</option>
              <option value="assistant">Assistant</option>
            </select>
          </label>
          
          <label className="flex flex-col">
            <span className="text-sm font-bold">Conversation ID</span>
            <div className="flex gap-2">
              <input 
                type="text" 
                value={conversationId} 
                onChange={(e) => setConversationId(e.target.value)}
                placeholder="conv-1"
                className="flex-1"
              />
              <button 
                type="button"
                onClick={generateRandomConversation}
                className="bg-purple-500 text-white px-3 py-1 rounded text-sm"
              >
                🎲 Random
              </button>
            </div>
          </label>
          
          <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded">
            Create Message
          </button>
        </div>
      </form>

      <div className="flex-1 overflow-y-auto">
        <h2 className="text-lg font-semibold mb-2">Messages</h2>
        <ul className="space-y-2">
          {messages?.map((message) => (
            <li key={message.id} className="border p-3 rounded">
              <div className="flex justify-between items-start mb-2">
                <span className={`text-sm font-bold ${message.role === 'user' ? 'text-blue-600' : 'text-green-600'}`}>
                  {message.role === 'user' ? '👤 User' : '🤖 Assistant'}
                </span>
                <span className="text-xs text-gray-500">
                  {message.createdAt.toLocaleString()}
                </span>
              </div>
              
              {editingMessageId === message.id ? (
                <div className="mb-2">
                  <div className="flex flex-col gap-2">
                    <label className="flex flex-col">
                      <span className="text-sm font-bold">Edit Content</span>
                      <textarea 
                        value={editingContent} 
                        onChange={(e) => setEditingContent(e.target.value)}
                        rows={3}
                        className="border p-2 rounded"
                      />
                    </label>
                    
                    <label className="flex flex-col">
                      <span className="text-sm font-bold">Role</span>
                      <select 
                        value={editingRole} 
                        onChange={(e) => handleEditRoleChange(e.target.value)}
                        className="border p-2 rounded"
                      >
                        <option value="user">User</option>
                        <option value="assistant">Assistant</option>
                      </select>
                    </label>
                    
                    <div className="flex gap-2">
                      <button 
                        onClick={() => handleSaveEdit(message.id)}
                        className="bg-green-500 text-white px-3 py-1 rounded text-sm"
                      >
                        ✓ Save
                      </button>
                      <button 
                        onClick={handleCancelEdit}
                        className="bg-gray-500 text-white px-3 py-1 rounded text-sm"
                      >
                        ✗ Cancel
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="mb-2">{message.content}</p>
              )}
              
              <div className="text-xs text-gray-500 mb-2">
                Conversation: {message.conversationId} | Position: {message.position}
                {message.parentMessageId && (
                  <span> | Parent: {message.parentMessageId.slice(0, 8)}...</span>
                )}
              </div>
              
              <div className="flex gap-2 flex-wrap">
                <select 
                  value={selectedSpace} 
                  onChange={(e) => setSelectedSpace(e.target.value)}
                  className="text-sm"
                >
                  <option value="">Select a space</option>
                  {publicSpaces?.map((space) => (
                    <option key={space.id} value={space.id}>
                      {space.name}
                    </option>
                  ))}
                </select>
                <button 
                  onClick={() => publishToPublicSpace(message)}
                  className="bg-green-500 text-white px-2 py-1 rounded text-sm"
                >
                  Publish
                </button>
                
                {editingMessageId !== message.id && (
                  <>
                    <button 
                      onClick={() => handleEdit(message)}
                      className="bg-blue-500 text-white px-2 py-1 rounded text-sm"
                    >
                      ✏️ Edit
                    </button>
                    <button 
                      onClick={() => handleDelete(message.id)}
                      className="bg-red-500 text-white px-2 py-1 rounded text-sm"
                    >
                      🗑️ Delete
                    </button>
                  </>
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>
      
      <div className="flex gap-2 mt-4">
        <button 
          onClick={createExampleMessages}
          className="bg-gray-500 text-white px-4 py-2 rounded"
        >
          Create Example Messages
        </button>
        <button 
          onClick={generateRandomConversation}
          className="bg-purple-500 text-white px-4 py-2 rounded"
        >
          🎲 Generate Random Conversation ID
        </button>
      </div>
    </div>
  );
} 