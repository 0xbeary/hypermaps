import { openai } from '@ai-sdk/openai';
import { streamText, convertToCoreMessages } from 'ai';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

export async function POST(request: NextRequest) {
  try {
    const { message, conversationHistory = [] } = await request.json();

    // Convert your ChatMessage format to AI SDK CoreMessage format
    const coreMessages = convertToCoreMessages([
      ...conversationHistory.map((msg: any) => ({
        role: msg.role,
        content: msg.content,
      })),
      {
        role: 'user',
        content: message,
      },
    ]);

    // Stream the AI response
    const result = await streamText({
      model: openai('gpt-4o-mini'), // or whichever model you prefer
      messages: coreMessages,
      system: 'You are a helpful AI assistant. Provide clear, concise, and helpful responses.',
      temperature: 0.7,
      maxTokens: 1000,
    });

    // Return the streaming response
    return result.toTextStreamResponse();
  } catch (error) {
    console.error('Error in AI response:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to generate AI response' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
} 