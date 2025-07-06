import { openai } from '@ai-sdk/openai';
import { streamText, smoothStream } from 'ai';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export async function POST(request: NextRequest) {
  try {
    const { message, conversationHistory = [] }: { 
      message: string; 
      conversationHistory?: ChatMessage[] 
    } = await request.json();

    // Input validation
    if (!message || typeof message !== 'string') {
      return Response.json(
        { error: 'Invalid message format', details: 'Message must be a non-empty string' },
        { status: 400 }
      );
    }

    if (!Array.isArray(conversationHistory)) {
      return Response.json(
        { error: 'Invalid conversation history format', details: 'Conversation history must be an array' },
        { status: 400 }
      );
    }

    console.log('Received AI request:', { message, historyLength: conversationHistory.length });

    // Convert to AI SDK message format with validation
    const messages = [
      ...conversationHistory
        .filter(msg => msg && typeof msg.content === 'string' && ['user', 'assistant'].includes(msg.role))
        .map((msg: ChatMessage) => ({
          role: msg.role as 'user' | 'assistant',
          content: msg.content,
        })),
      {
        role: 'user' as const,
        content: message,
      },
    ];

    console.log('Processing messages for streaming...');

    // Use streamText with proper error handling
    const result = streamText({
      model: openai('gpt-4o-mini'),
      messages,
      system: 'You are a helpful AI assistant. Provide clear, concise, and helpful responses.',
      temperature: 0.7,
      maxTokens: 1000,
      experimental_transform: smoothStream({ chunking: 'word' }),
      onError: (error) => {
        console.error('Stream error:', error);
        throw error;
      },
    });

    // Return the streaming response in the format expected by flow-space
    return result.toDataStreamResponse();
  } catch (error) {
    console.error('Error in AI response:', error);
    
    // Handle different error types
    if (error instanceof Error) {
      if (error.message.includes('API key')) {
        return Response.json(
          { error: 'Authentication error', details: 'Invalid API key configuration' },
          { status: 401 }
        );
      }
      
      if (error.message.includes('rate limit')) {
        return Response.json(
          { error: 'Rate limit exceeded', details: 'Please try again later' },
          { status: 429 }
        );
      }
      
      if (error.message.includes('model')) {
        return Response.json(
          { error: 'Model error', details: 'The AI model is currently unavailable' },
          { status: 503 }
        );
      }
    }
    
    // Generic error response
    return Response.json(
      { 
        error: 'Internal server error', 
        details: error instanceof Error ? error.message : 'Unknown error occurred' 
      },
      { status: 500 }
    );
  }
} 