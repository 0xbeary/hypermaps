'use client';

import { useChat } from '@ai-sdk/react';
import { useCallback, useState, useRef, useEffect } from 'react';
import { ChatMessage } from '@/app/schema';
import { useCreateEntity } from '@graphprotocol/hypergraph-react';
import { v4 as uuidv4 } from 'uuid';

// Enhanced hook that properly manages streaming state
export function useStreamingChat(conversationId: string, existingMessages: ChatMessage[]) {
  const createMessage = useCreateEntity(ChatMessage);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [streamingContent, setStreamingContent] = useState<{ [messageId: string]: string }>({});
  const [currentStreamingMessageId, setCurrentStreamingMessageId] = useState<string | null>(null);
  const lastUserMessageRef = useRef<string | null>(null);
  const isStreaming = useRef(false);

  // Convert hypergraph messages to AI SDK format
  const convertToAIMessages = useCallback((messages: ChatMessage[]) => {
    return messages?.map(msg => ({
      id: msg.id,
      role: msg.role as 'user' | 'assistant',
      content: msg.content,
    })) || [];
  }, []);

  // Regular useChat for all streaming operations
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
      isStreaming.current = false;
      console.log('AI response finished:', message);
      console.log('AI SDK message ID:', message.id);
      
      // CRITICAL FIX: Clear streaming state IMMEDIATELY before saving to hypergraph
      // This prevents the temporary streaming node from being recreated
      setCurrentStreamingMessageId(null);
      setStreamingContent(prev => {
        const newContent = { ...prev };
        delete newContent[message.id];
        return newContent;
      });
      
      try {
        let x = 450; // Default AI position
        let y = 160; // Default AI position
        
        // If there's a parent user message, position relative to it
        if (lastUserMessageRef.current) {
          const parentMessage = existingMessages.find(msg => msg.id === lastUserMessageRef.current);
          if (parentMessage && parentMessage.x !== undefined && parentMessage.y !== undefined) {
            // Position to the right of the parent user message at the same Y level
            x = parentMessage.x + 500; // Offset to the right of user message
            y = parentMessage.y; // Same Y level as parent
            
            // Small deterministic offset to avoid exact overlaps
            const deterministicOffset = (message.id.charCodeAt(0) % 20) - 10;
            x += deterministicOffset;
            y += deterministicOffset;
          }
        }
        
        // Fallback to old logic if no parent found
        if (!lastUserMessageRef.current || !existingMessages.find(msg => msg.id === lastUserMessageRef.current)) {
          const position = existingMessages.length + 1;
          const baseY = position * 160;
          const baseX = 450; // AI message
          const deterministicOffset = (message.id.charCodeAt(0) % 20) - 10;
          x = baseX + deterministicOffset;
          y = baseY + deterministicOffset;
        }

        // Save to hypergraph when streaming completes
        const aiMessage = createMessage({
          id: message.id,
          content: message.content,
          role: 'assistant',
          createdAt: new Date(),
          conversationId,
          parentMessageId: lastUserMessageRef.current || '',
          position: existingMessages.length + 1,
          x,
          y,
        });
        
        console.log('Created AI message in hypergraph with ID:', aiMessage.id);
        console.log('AI SDK ID vs Hypergraph ID:', message.id, 'vs', aiMessage.id);
        console.log('IDs match:', message.id === aiMessage.id);
        
        setErrorMessage(null);
        setRetryCount(0);
        
      } catch (error) {
        console.error('Error saving AI message to hypergraph:', error);
        setErrorMessage('Failed to save message. Please try again.');
      }
    },
    onError: (error) => {
      isStreaming.current = false;
      console.error('Streaming error:', error);
      
      // Clean up streaming state on error
      setCurrentStreamingMessageId(null);
      setStreamingContent({});
      
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

  // Track streaming content for flow view (no hypergraph operations during streaming)
  useEffect(() => {
    if (isLoading && isStreaming.current && messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage.role === 'assistant') {
        // Set streaming message ID for flow view tracking
        if (!currentStreamingMessageId) {
          setCurrentStreamingMessageId(lastMessage.id);
          console.log('Started tracking streaming for message:', lastMessage.id);
        }
        
        // Update streaming content for flow view (no hypergraph updates)
        if (lastMessage.content) {
          setStreamingContent(prev => ({
            ...prev,
            [lastMessage.id]: lastMessage.content
          }));
        }
      }
    }
  }, [messages, isLoading, currentStreamingMessageId]);

  const generateAIResponse = useCallback(async (userMessage: ChatMessage) => {
    if (isLoading) return;
    
    try {
      isStreaming.current = true;
      setErrorMessage(null);
      // Store the user message ID for parentMessageId
      lastUserMessageRef.current = userMessage.id;
      // Reset streaming state
      setCurrentStreamingMessageId(null);
      setStreamingContent({});
      
      await append({
        role: 'user',
        content: userMessage.content,
      });
    } catch (error) {
      isStreaming.current = false;
      console.error('Error generating AI response:', error);
      setErrorMessage('Failed to send message. Please try again.');
    }
  }, [append, isLoading]);

  // Simplified version for flow-space - uses the same streaming logic
  const generateAIResponseForFlow = useCallback(async (userMessage: ChatMessage) => {
    return generateAIResponse(userMessage);
  }, [generateAIResponse]);

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
    generateAIResponseForFlow,
    error: errorMessage || error,
    clearError,
    canRetry: retryCount < 3,
    streamingContent,
    currentStreamingMessageId,
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
      const position = existingMessages.length;
      const baseY = position * 160;
      const baseX = 50; // User message
      const deterministicOffset = (userMessageId.charCodeAt(0) % 20) - 10;
      const x = baseX + deterministicOffset;
      const y = baseY + deterministicOffset;

      const userMessage = createMessage({
        id: userMessageId,
        content: input,
        role: 'user',
        createdAt: new Date(),
        conversationId,
        parentMessageId: '',
        position: existingMessages.length,
        x,
        y,
      });
      
      console.log('Saved user message to hypergraph:', userMessage);
      
      // Then trigger the AI SDK's submit with the message
      handleSubmit(e);
      
    } catch (error) {
      console.error('Error saving user message:', error);
    }
  }, [input, createMessage, conversationId, existingMessages.length, handleSubmit, clearError]);

  // Add this at the top of your component to catch unhandled promise rejections
  if (typeof window !== 'undefined') {
    window.addEventListener('unhandledrejection', (event) => {
      console.error('Unhandled promise rejection:', event.reason);
      console.error('Promise:', event.promise);
      event.preventDefault(); // Prevent the default behavior
    });
  }

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
              {/* Show streaming indicator for loading assistant messages */}
              {message.role === 'assistant' && isLoading && (
                <span className="inline-block w-2 h-4 bg-blue-500 animate-pulse ml-1"></span>
              )}
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
                      onClick={() => {
                        // Implement retry logic
                      }}
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