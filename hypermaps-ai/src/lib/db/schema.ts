import { pgTable, text, timestamp, integer, doublePrecision } from 'drizzle-orm/pg-core';

export const chatMessages = pgTable('chat_messages', {
  id: text('id').primaryKey(),
  content: text('content').notNull(),
  role: text('role').notNull(), // "user" or "assistant"
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  parentMessageId: text('parent_message_id'),
  conversationId: text('conversation_id').notNull(),
  position: integer('position').notNull(),
  x: doublePrecision('x').notNull(),
  y: doublePrecision('y').notNull(),
});

export const comments = pgTable('comments', {
  id: text('id').primaryKey(),
  content: text('content').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  conversationId: text('conversation_id').notNull(),
  position: integer('position').notNull(),
  x: doublePrecision('x').notNull(),
  y: doublePrecision('y').notNull(),
}); 