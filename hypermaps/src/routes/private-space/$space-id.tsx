import { ChatMessage } from '@/schema';
import {
  HypergraphSpaceProvider,
  preparePublish,
  publishOps,
  useCreateEntity,
  useHypergraphApp,
  useQuery,
  useSpace,
  useSpaces,
} from '@graphprotocol/hypergraph-react';
import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';

export const Route = createFileRoute('/private-space/$space-id')({
  component: RouteComponent,
});

function RouteComponent() {
  const { 'space-id': spaceId } = Route.useParams();

  return (
    <HypergraphSpaceProvider space={spaceId}>
      <PrivateSpace />
    </HypergraphSpaceProvider>
  );
}

function PrivateSpace() {
  const { name, ready } = useSpace({ mode: 'private' });
  const { data: messages } = useQuery(ChatMessage, { mode: 'private' });
  const { data: publicSpaces } = useSpaces({ mode: 'public' });
  const [selectedSpace, setSelectedSpace] = useState<string>('');
  const createMessage = useCreateEntity(ChatMessage);
  const [messageContent, setMessageContent] = useState('');
  const [messageRole, setMessageRole] = useState<'user' | 'assistant'>('user');
  const [conversationId, setConversationId] = useState('conv-1');
  const { getSmartSessionClient } = useHypergraphApp();

  // Example messages creation (you might want to remove these or move to a separate function)
  const createExampleMessages = () => {
    // Root message
    const rootMsg = createMessage({
      content: "What is quantum computing?",
      role: "user",
      createdAt: new Date(),
      conversationId: "conv-1",
      parentMessageId: "", // Empty for root
      position: 0,
    });

    // AI response
    const aiResponse = createMessage({
      content: "Quantum computing is a type of computation that harnesses quantum mechanics...",
      role: "assistant", 
      createdAt: new Date(),
      conversationId: "conv-1",
      parentMessageId: rootMsg.id, // Parent reference
      position: 0,
    });

    // Follow-up question
    const followUp = createMessage({
      content: "Can you explain quantum entanglement?",
      role: "user",
      createdAt: new Date(), 
      conversationId: "conv-1",
      parentMessageId: aiResponse.id, // Creates tree branch
      position: 0,
    });
  };

  if (!ready) {
    return <div>Loading...</div>;
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!messageContent.trim()) return;
    
    createMessage({
      content: messageContent,
      role: messageRole,
      createdAt: new Date(),
      conversationId: conversationId,
      parentMessageId: "", // You might want to track parent for tree structure
      position: messages?.length || 0,
    });
    
    setMessageContent('');
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
            <select value={messageRole} onChange={(e) => setMessageRole(e.target.value as 'user' | 'assistant')}>
              <option value="user">User</option>
              <option value="assistant">Assistant</option>
            </select>
          </label>
          
          <label className="flex flex-col">
            <span className="text-sm font-bold">Conversation ID</span>
            <input 
              type="text" 
              value={conversationId} 
              onChange={(e) => setConversationId(e.target.value)}
              placeholder="conv-1"
            />
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
              
              <p className="mb-2">{message.content}</p>
              
              <div className="text-xs text-gray-500 mb-2">
                Conversation: {message.conversationId} | Position: {message.position}
                {message.parentMessageId && (
                  <span> | Parent: {message.parentMessageId.slice(0, 8)}...</span>
                )}
              </div>
              
              <div className="flex gap-2">
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
              </div>
            </li>
          ))}
        </ul>
      </div>
      
      <button 
        onClick={createExampleMessages}
        className="mt-4 bg-gray-500 text-white px-4 py-2 rounded"
      >
        Create Example Messages
      </button>
    </div>
  );
}
