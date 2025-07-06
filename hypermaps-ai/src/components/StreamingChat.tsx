'use client';

import { useChat } from '@ai-sdk/react';
import { useCallback, useState } from 'react';
import { ChatMessage } from '@/app/schema';
import { useCreateEntity } from '@graphprotocol/hypergraph-react';
import { v4 as uuidv4 } from 'uuid';

// Custom hook for unified streaming approach
export function useStreamingChat(conversationId: string, existingMessages: ChatMessage[]) {
  const createMessage = useCreateEntity(ChatMessage);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  // Convert hypergraph messages to AI SDK format
  const convertToAIMessages = useCallback((messages: ChatMessage[]) => {
    return messages?.map(msg => ({
      id: msg.id,
      role: msg.role as 'user' | 'assistant',
      content: msg.content,
    })) || [];
  }, []);

  const { 
    messages, 
    input, 
    handleInputChange, 
    handleSubmit, 
    isLoading,
    append,
    error,
  } = useChat({
    api: '/api/ai-response',
    initialMessages: convertToAIMessages(existingMessages),
    onFinish: async (message) => {
      // Save the AI response to hypergraph
      console.log('AI response finished:', message);
      
      try {
        const newMessage = createMessage({
          id: message.id,
          content: message.content,
          role: 'assistant',
          createdAt: new Date(),
          conversationId,
          parentMessageId: '', // Set based on your logic
          position: existingMessages.length + 1,
        });
        
        console.log('Saved AI message to hypergraph:', newMessage);
        
        // Clear any previous errors on successful completion
        setErrorMessage(null);
        setRetryCount(0);
      } catch (error) {
        console.error('Error saving AI message:', error);
        setErrorMessage('Failed to save message. Please try again.');
      }
    },
    onError: (error) => {
      console.error('Streaming error:', error);
      
      // Set user-friendly error messages based on error type
      if (error.message.includes('rate limit')) {
        setErrorMessage('Rate limit exceeded. Please wait a moment and try again.');
      } else if (error.message.includes('API key')) {
        setErrorMessage('Authentication error. Please check your API configuration.');
      } else if (error.message.includes('model')) {
        setErrorMessage('AI model is currently unavailable. Please try again later.');
      } else if (error.message.includes('network') || error.message.includes('fetch')) {
        setErrorMessage('Network error. Please check your connection and try again.');
      } else {
        setErrorMessage('An unexpected error occurred. Please try again.');
      }
    },
  });

  // Function to generate AI response for flow-space
  const generateAIResponse = useCallback(async (userMessage: ChatMessage) => {
    if (isLoading) return;
    
    try {
      setErrorMessage(null); // Clear previous errors
      
      await append({
        role: 'user',
        content: userMessage.content,
      });
    } catch (error) {
      console.error('Error generating AI response:', error);
      setErrorMessage('Failed to send message. Please try again.');
    }
  }, [append, isLoading]);

  // Retry function for failed requests
  const retryLastMessage = useCallback(async () => {
    if (retryCount >= 3) {
      setErrorMessage('Maximum retry attempts reached. Please try again later.');
      return;
    }
    
    const lastUserMessage = messages.filter(m => m.role === 'user').pop();
    if (lastUserMessage) {
      setRetryCount(prev => prev + 1);
      // Convert UIMessage to ChatMessage format for retry
      const chatMessage = {
        id: lastUserMessage.id,
        content: lastUserMessage.content,
        role: lastUserMessage.role as 'user' | 'assistant',
        createdAt: new Date(),
        conversationId,
        parentMessageId: '',
        position: 0,
      };
      await generateAIResponse(chatMessage);
    }
  }, [messages, generateAIResponse, retryCount, conversationId]);

  // Clear error function
  const clearError = useCallback(() => {
    setErrorMessage(null);
    setRetryCount(0);
  }, []);

  return {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
    generateAIResponse,
    error: errorMessage || error,
    retryLastMessage,
    clearError,
    canRetry: retryCount < 3,
  };
}

interface StreamingChatProps {
  conversationId: string;
  existingMessages: ChatMessage[];
}

export function StreamingChat({ 
  conversationId, 
  existingMessages 
}: StreamingChatProps) {
  const createMessage = useCreateEntity(ChatMessage);

  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
    error,
    retryLastMessage,
    clearError,
    canRetry,
  } = useStreamingChat(conversationId, existingMessages);

  // Custom submit handler to save user messages to hypergraph
  const handleCustomSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!input.trim()) return;
    
    // Clear any existing errors
    clearError();
    
    // Create user message in hypergraph first
    const userMessageId = uuidv4();
    try {
      const userMessage = createMessage({
        id: userMessageId,
        content: input,
        role: 'user',
        createdAt: new Date(),
        conversationId,
        parentMessageId: '',
        position: existingMessages.length,
      });
      
      console.log('Saved user message to hypergraph:', userMessage);
      
      // Then trigger the AI SDK's submit with the message
      handleSubmit(e);
      
    } catch (error) {
      console.error('Error saving user message:', error);
    }
  }, [input, createMessage, conversationId, existingMessages.length, handleSubmit, clearError]);

  return (
    <div className="flex flex-col h-full max-w-2xl mx-auto">
      {/* Messages display */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`p-3 rounded-lg ${
              message.role === 'user'
                ? 'bg-blue-100 ml-auto max-w-xs'
                : 'bg-gray-100 mr-auto max-w-xs'
            }`}
          >
            <div className="text-sm font-semibold mb-1">
              {message.role === 'user' ? '👤 You' : '🤖 AI'}
            </div>
            <div className="text-sm whitespace-pre-wrap">
              {message.content}
            </div>
          </div>
        ))}
        
        {/* Loading indicator */}
        {isLoading && (
          <div className="bg-gray-100 mr-auto max-w-xs p-3 rounded-lg">
            <div className="text-sm font-semibold mb-1">🤖 AI</div>
            <div className="flex items-center gap-2">
              <div className="animate-spin w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
              <span className="text-sm text-gray-600">Thinking...</span>
            </div>
          </div>
        )}

        {/* Error display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mr-auto max-w-md">
            <div className="flex items-start gap-2">
              <div className="text-red-500 text-sm">⚠️</div>
              <div>
                <div className="text-sm font-semibold text-red-800 mb-1">Error</div>
                <div className="text-sm text-red-700 mb-3">{error instanceof Error ? error.message : error}</div>
                <div className="flex gap-2">
                  <button
                    onClick={clearError}
                    className="px-3 py-1 bg-red-100 text-red-700 text-xs rounded hover:bg-red-200"
                  >
                    Dismiss
                  </button>
                  {canRetry && (
                    <button
                      onClick={retryLastMessage}
                      className="px-3 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600"
                    >
                      Retry
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input form */}
      <form onSubmit={handleCustomSubmit} className="p-4 border-t">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={handleInputChange}
            placeholder="Type your message..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
} 