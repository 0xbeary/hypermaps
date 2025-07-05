'use client';

import { use, useCallback, useState } from 'react';
import { ChatMessage } from '@/app/schema';
import {
  HypergraphSpaceProvider,
  useCreateEntity,
  useQuery,
  useSpace,
} from '@graphprotocol/hypergraph-react';
import { ChatFlow } from '@/components/flow';
import { v4 as uuidv4 } from 'uuid';

interface FlowSpacePageProps {
  params: Promise<{ 'space-id': string }>;
}

export default function FlowSpacePage({ params }: FlowSpacePageProps) {
  const resolvedParams = use(params);
  const spaceId = resolvedParams['space-id'];

  return (
    <HypergraphSpaceProvider space={spaceId}>
      <FlowSpace />
    </HypergraphSpaceProvider>
  );
}

function FlowSpace() {
  const { name, ready } = useSpace({ mode: 'private' });
  const { data: messages } = useQuery(ChatMessage, { 
    mode: 'private', 
    filter: {
      conversationId: { is: "conv-1" }
    } 
  });
  
  const createMessage = useCreateEntity(ChatMessage);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerateAIResponse = useCallback(async (userMessage: ChatMessage) => {
    if (isGenerating) return;
    
    setIsGenerating(true);
    
    try {
      // Create a placeholder AI message immediately
      const aiMessage = await createMessage({
        id: uuidv4(),
        content: "", // Empty content initially
        role: "assistant",
        createdAt: new Date(),
        conversationId: userMessage.conversationId,
        parentMessageId: userMessage.id, // Connect to the user message
        position: (messages?.length || 0) + 1,
      });

      // Call your AI service (replace with actual API call)
      const response = await fetch('/api/ai-response', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage.content,
          conversationHistory: messages?.slice(-5) // Last 5 messages for context
        })
      });
      
      const aiResponse = await response.json();
      
      // Update the AI message with the actual response
      // You'll need to implement an update method in your hypergraph setup
      await updateMessage(aiMessage.id, {
        content: aiResponse.content
      });
      
    } catch (error) {
      console.error('Error generating AI response:', error);
    } finally {
      setIsGenerating(false);
    }
  }, [createMessage, messages, isGenerating]);

  if (!ready) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg">Loading flow space...</div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      {/* <header className="bg-white shadow-sm border-b p-4">
        <h1 className="text-2xl font-bold text-gray-800">
          🗺️ {name} - Flow View
        </h1>
        <p className="text-gray-600 text-sm">
          Create and connect messages in a visual flow
        </p>
      </header> */}
      
      <div className="flex-1">
        <ChatFlow 
          messages={messages || []} 
          conversationId="conv-1"
          onGenerateAIResponse={handleGenerateAIResponse}
        />
      </div>
    </div>
  );
} 