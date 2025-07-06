import { openai } from '@ai-sdk/openai';
import { createDataStreamResponse, streamText } from 'ai';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export async function POST(request: NextRequest) {
  try {
    const { messages }: { messages: ChatMessage[] } = await request.json();

    // Input validation
    if (!Array.isArray(messages) || messages.length === 0) {
      return Response.json(
        { error: 'Invalid messages format' },
        { status: 400 }
      );
    }

    // Validate each message
    const validMessages = messages.filter(msg => 
      msg && 
      typeof msg.content === 'string' && 
      msg.content.trim().length > 0 &&
      ['user', 'assistant'].includes(msg.role)
    );

    if (validMessages.length === 0) {
      return Response.json(
        { error: 'No valid messages provided' },
        { status: 400 }
      );
    }

    console.log('Processing messages for streaming...', { count: validMessages.length });

    // Convert to AI SDK message format
    const aiMessages = validMessages.map((msg: ChatMessage) => ({
      role: msg.role as 'user' | 'assistant',
      content: msg.content,
    }));

    // Use createDataStreamResponse for proper data stream protocol
    return createDataStreamResponse({
      execute: (dataStream) => {
        const result = streamText({
          model: openai('gpt-4o-mini'),
          messages: aiMessages,
          system: 'You are a helpful AI assistant. Provide clear, concise, and helpful responses.',
          temperature: 0.7,
          maxTokens: 1000,
        });

        // Merge the streamText result into the data stream
        result.mergeIntoDataStream(dataStream);
      },
      onError: (error) => {
        console.error('Streaming error:', error);
        return error instanceof Error ? error.message : 'An error occurred during streaming';
      },
    });
    
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