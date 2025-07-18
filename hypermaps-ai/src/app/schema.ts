import { Entity, Type } from '@graphprotocol/hypergraph';

export class ChatMessage extends Entity.Class<ChatMessage>('ChatMessage')({
  content: Type.Text,
  id: Type.Text,
  role: Type.Text, // "user" or "assistant"
  createdAt: Type.Date,
  
  // Store parent as simple ID instead of relation
  parentMessageId: Type.Text, // Empty string for root messages
  
  // Optional conversation grouping
  conversationId: Type.Text,
  position: Type.Number,

  // Store x, y coordinates for flow view
  x: Type.Number,
  y: Type.Number,
}) {}

export class Comment extends Entity.Class<Comment>('Comment')({
  content: Type.Text,
  id: Type.Text,
  createdAt: Type.Date,
  
  // Optional conversation grouping
  conversationId: Type.Text,
  position: Type.Number,

  // Store x, y coordinates for flow view
  x: Type.Number,
  y: Type.Number,
}) {}

// export class Conversation extends Entity.Class<Conversation>('Conversation')({
//   name: Type.Text,
//   messages: Type.Relation(ChatMessage),
// }) {}