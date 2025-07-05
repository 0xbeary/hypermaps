import { Entity, Type } from '@graphprotocol/hypergraph';

export class Chat extends Entity.Class<Chat>('Chat')({
  isUser: Type.Boolean
}) {}