'use client';

import { use, useCallback, useState } from 'react';
import { ChatMessage } from '@/app/schema';
import {
  HypergraphSpaceProvider,
  useCreateEntity,
  useUpdateEntity,
  useDeleteEntity,
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
  const updateMessage = useUpdateEntity(ChatMessage);
  const deleteMessage = useDeleteEntity();
  const [isGenerating, setIsGenerating] = useState(false);
  const [streamingMessageId, setStreamingMessageId] = useState<string | null>(null);

  const handleGenerateAIResponse = useCallback(async (userMessage: ChatMessage) => {
    if (isGenerating) return;
    
    setIsGenerating(true);
    
    try {
      // Create a placeholder AI message immediately
      const aiMessageId = uuidv4();
      const aiMessage = createMessage({
        id: aiMessageId,
        content: "", // Empty content initially
        role: "assistant",
        createdAt: new Date(),
        conversationId: userMessage.conversationId,
        parentMessageId: userMessage.id, // Connect to the user message
        position: (messages?.length || 0) + 1,
      });

      setStreamingMessageId(aiMessageId);

      // Call the AI API with streaming
      const response = await fetch('/api/ai-response', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage.content,
          conversationHistory: messages?.slice(-5) // Last 5 messages for context
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Handle streaming response
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let accumulatedContent = '';

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          
          if (done) break;
          
          const chunk = decoder.decode(value, { stream: true });
          accumulatedContent += chunk;
          
          // Update the AI message with accumulated content
          updateMessage(aiMessageId, {
            content: accumulatedContent
          });
        }
      }
      
    } catch (error) {
      console.error('Error generating AI response:', error);
      
      // Update the AI message with error content
      if (streamingMessageId) {
        updateMessage(streamingMessageId, {
          content: 'Sorry, I encountered an error while generating a response. Please try again.'
        });
      }
    } finally {
      setIsGenerating(false);
      setStreamingMessageId(null);
    }
  }, [createMessage, updateMessage, messages, isGenerating, streamingMessageId]);

  const handleEditMessage = useCallback((messageId: string, newContent: string, newRole?: 'user' | 'assistant') => {
    try {
      const updateData: any = { content: newContent };
      if (newRole) {
        updateData.role = newRole;
      }
      
      updateMessage(messageId, updateData);
      console.log(`Updated message: ${messageId}`);
    } catch (error) {
      console.error('Error updating message:', error);
      alert('Error updating message');
    }
  }, [updateMessage]);

  const handleDeleteMessage = useCallback((messageId: string) => {
    if (window.confirm('Are you sure you want to delete this message?')) {
      try {
        deleteMessage(messageId);
        console.log(`Deleted message: ${messageId}`);
      } catch (error) {
        console.error('Error deleting message:', error);
        alert('Error deleting message');
      }
    }
  }, [deleteMessage]);

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
          onEditMessage={handleEditMessage}
          onDeleteMessage={handleDeleteMessage}
        />
      </div>
    </div>
  );
} 