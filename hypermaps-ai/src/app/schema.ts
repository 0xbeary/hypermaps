import { Entity, Type } from '@graphprotocol/hypergraph';

export class ChatMessage extends Entity.Class<ChatMessage>('ChatMessage')({
  content: Type.Text,
  role: Type.Text, // "user" or "assistant"
  createdAt: Type.Date,
  
  // Store parent as simple ID instead of relation
  parentMessageId: Type.Text, // Empty string for root messages
  
  // Optional conversation grouping
  conversationId: Type.Text,
  position: Type.Number,
}) {}

// export class Conversation extends Entity.Class<Conversation>('Conversation')({
//   name: Type.Text,
//   messages: Type.Relation(ChatMessage),
// }) {}