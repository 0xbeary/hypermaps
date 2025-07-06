import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { comments } from '@/lib/db/schema';
import { z } from 'zod';

const CommentSchema = z.object({
  id: z.string(),
  content: z.string(),
  createdAt: z.string(), // ISO string from the client
  conversationId: z.string(),
  position: z.number(),
  x: z.number(),
  y: z.number(),
});

export async function POST(req: NextRequest) {
  try {
    const json = await req.json();
    const parsed = CommentSchema.safeParse(json);
    if (!parsed.success) {
      console.error('Invalid comment payload:', parsed.error.issues);
      return NextResponse.json({ error: 'Invalid payload', details: parsed.error.issues }, { status: 400 });
    }

    const c = parsed.data;

    await db.insert(comments).values({
      id: c.id,
      content: c.content,
      createdAt: new Date(c.createdAt),
      conversationId: c.conversationId,
      position: c.position,
      x: c.x,
      y: c.y,
    });

    // Return the created data on success
    return NextResponse.json({ status: 'ok', data: c }, { status: 201 });
  } catch (error: any) {
    // Log the real error on the server
    console.error('Failed to insert comment into DB:', error);
    // And send a descriptive message to the client
    return NextResponse.json({ error: 'Database operation failed', message: error.message }, { status: 500 });
  }
} 