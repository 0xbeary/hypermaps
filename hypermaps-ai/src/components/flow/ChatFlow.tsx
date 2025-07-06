'use client';

import { useCallback, useEffect, useMemo } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  addEdge,
  useNodesState,
  useEdgesState,
  Connection,
  Panel,
  useReactFlow,
  Node,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import UserMessageNode from './UserMessageNode';
import AIMessageNode from './AIMessageNode';
import { ChatMessage } from '@/app/schema';
import { useCreateEntity } from '@graphprotocol/hypergraph-react';
import { v4 as uuidv4 } from 'uuid';

const nodeTypes = {
  userMessage: UserMessageNode,
  aiMessage: AIMessageNode,
};

type ChatFlowProps = {
  messages: ChatMessage[];
  conversationId: string;
  streamingContent?: { [messageId: string]: string };
  currentStreamingMessageId?: string | null;
  isLoading?: boolean;
  onGenerateAIResponse?: (userMessage: ChatMessage) => Promise<void>;
  onEditMessage?: (messageId: string, newContent: string, newRole?: 'user' | 'assistant') => void;
  onDeleteMessage?: (messageId: string) => void;
  onNodeMove?: (messageId: string, position: { x: number; y: number }) => void;
};

export default function ChatFlow({ 
  messages, 
  conversationId, 
  streamingContent = {},
  currentStreamingMessageId = null,
  isLoading = false,
  onGenerateAIResponse, 
  onEditMessage, 
  onDeleteMessage,
  onNodeMove,
}: ChatFlowProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const createMessage = useCreateEntity(ChatMessage);
  const { screenToFlowPosition } = useReactFlow();

  // Stabilize callback dependencies to prevent unnecessary recreations
  const handleEditMessage = useCallback((messageId: string, newContent: string, newRole?: 'user' | 'assistant') => {
    if (onEditMessage) {
      onEditMessage(messageId, newContent, newRole);
    }
  }, [onEditMessage]);

  const handleDeleteMessage = useCallback((messageId: string) => {
    if (onDeleteMessage) {
      onDeleteMessage(messageId);
    }
  }, [onDeleteMessage]);

  // Stabilize the generate response callback by removing messages dependency
  const handleGenerateResponse = useCallback(async (messageId: string) => {
    if (onGenerateAIResponse) {
      // Find the message within the callback to avoid dependency on messages array
      const userMessage = messages.find(msg => msg.id === messageId);
      if (userMessage) {
        await onGenerateAIResponse(userMessage);
      }
    }
  }, [onGenerateAIResponse]); // Remove messages dependency

  // Enhanced positioning logic for better visual flow
  const calculateNodePosition = useCallback((message: ChatMessage, allMessages: ChatMessage[]) => {
    const isUser = message.role === 'user';
    
    // Sort messages by position to ensure consistent ordering
    const sortedMessages = [...allMessages].sort((a, b) => a.position - b.position);
    const messageIndex = sortedMessages.findIndex(m => m.id === message.id);
    
    // Calculate position based on message index and role for consistency
    const baseY = messageIndex * 160; // Vertical spacing between messages
    const baseX = isUser ? 50 : 450; // Horizontal spacing between user and AI
    
    // Use a deterministic offset based on message ID to avoid random shifts
    const deterministicOffset = (message.id.charCodeAt(0) % 20) - 10;
    
    return {
      x: baseX + deterministicOffset,
      y: baseY + deterministicOffset,
    };
  }, []);

  // Handle creating new user messages
  const handleCreateUserMessage = useCallback((content: string, parentId?: string, position?: { x: number, y: number }) => {
    const id = uuidv4();
    let x = position?.x;
    let y = position?.y;

    // If no position is provided, calculate a default one
    if (x === undefined || y === undefined) {
      const tempMessage = {
        id,
        role: 'user' as const,
        position: messages.length,
      } as ChatMessage;
      const calculatedPosition = calculateNodePosition(tempMessage, [...messages, tempMessage]);
      x = calculatedPosition.x;
      y = calculatedPosition.y;
    }

    createMessage({
      id,
      content,
      role: 'user',
      createdAt: new Date(),
      conversationId,
      parentMessageId: parentId || '',
      position: messages.length,
      x,
      y,
    });

    // AI response is no longer automatically triggered.
  }, [createMessage, conversationId, messages, calculateNodePosition]);

  // Convert ChatMessage entities to React Flow nodes and edges
  const { flowNodes, flowEdges } = useMemo(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const nodes: any[] = [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const edges: any[] = [];

    // Find the latest user message
    const userMessages = messages.filter(msg => msg.role === 'user');
    const latestUserMessage = userMessages.length > 0 ? userMessages[userMessages.length - 1] : null;

    // Create nodes for all existing messages in hypergraph
    messages.forEach((message) => {
      const position =
        message.x != null && message.y != null
          ? { x: message.x, y: message.y }
          : calculateNodePosition(message, messages);
      
      // Create node based on message role
      if (message.role === 'user') {
        const isLatestUserMessage = latestUserMessage?.id === message.id;
        const node = {
          id: message.id,
          type: 'userMessage',
          position,
          data: {
            content: message.content,
            createdAt: message.createdAt,
            messageId: message.id,
            isLatestUserMessage,
            isLoading,
            onEdit: handleEditMessage,
            onDelete: handleDeleteMessage,
            onGenerateResponse: handleGenerateResponse,
          },
        };
        nodes.push(node);
      } else {
        const isCurrentlyStreaming = currentStreamingMessageId === message.id;
        const node = {
          id: message.id,
          type: 'aiMessage',
          position,
          data: {
            content: message.content,
            createdAt: message.createdAt,
            messageId: message.id,
            isGenerating: !message.content.trim() && !isCurrentlyStreaming,
            // Use streaming content if this message is currently streaming
            streamingContent: isCurrentlyStreaming ? streamingContent[message.id] : undefined,
            onEdit: handleEditMessage,
            onDelete: handleDeleteMessage,
            onCreateUserMessage: handleCreateUserMessage,
          },
        };
        nodes.push(node);
      }

      // Create edge if this message has a parent
      if (message.parentMessageId) {
        const edge = {
          id: `edge-${message.parentMessageId}-${message.id}`,
          source: message.parentMessageId,
          target: message.id,
          type: 'smoothstep',
          animated: true,
          style: {
            stroke: message.role === 'user' ? '#3b82f6' : '#10b981',
            strokeWidth: 2,
          },
        };
        edges.push(edge);
      }
    });

    // Only add a temporary streaming node if the message doesn't exist in hypergraph yet
    // This ensures hypergraph messages always take priority and replace temporary nodes
    const messageExistsInHypergraph = messages.find(m => m.id === currentStreamingMessageId);
    
    if (currentStreamingMessageId && !messageExistsInHypergraph) {
      // Create a mock message object for the temporary node
      const tempMessage = { 
        id: currentStreamingMessageId, 
        role: 'assistant' as const,
        position: messages.length, // Position it at the end
      } as ChatMessage;

      // Create an augmented message list that includes our temporary node
      // This ensures its position is calculated correctly relative to the final list
      const messagesWithTemp = [...messages, tempMessage];

      const streamingPosition = calculateNodePosition(
        tempMessage, 
        messagesWithTemp
      );
      
      const streamingNode = {
        id: currentStreamingMessageId,
        type: 'aiMessage',
        position: streamingPosition,
        data: {
          content: '',
          createdAt: new Date(),
          messageId: currentStreamingMessageId,
          isGenerating: true,
          streamingContent: streamingContent[currentStreamingMessageId],
          onEdit: handleEditMessage,
          onDelete: handleDeleteMessage,
          onCreateUserMessage: handleCreateUserMessage,
        },
      };
      nodes.push(streamingNode);

      // Create edge from the latest user message to the streaming node
      if (latestUserMessage) {
        const streamingEdge = {
          id: `edge-${latestUserMessage.id}-${currentStreamingMessageId}`,
          source: latestUserMessage.id,
          target: currentStreamingMessageId,
          type: 'smoothstep',
          animated: true,
          style: {
            stroke: '#10b981',
            strokeWidth: 2,
          },
        };
        edges.push(streamingEdge);
      }
    }

    return { flowNodes: nodes, flowEdges: edges };
  }, [
    messages, 
    streamingContent, 
    currentStreamingMessageId, 
    calculateNodePosition,
    handleEditMessage, 
    handleDeleteMessage, 
    handleGenerateResponse,
    isLoading
  ]);

  // Update nodes and edges when messages change
  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    setNodes(flowNodes as any);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    setEdges(flowEdges as any);
  }, [flowNodes, flowEdges, setNodes, setEdges]);

  // Handle connections between nodes
  const onConnect = useCallback((params: Connection) => {
    // Don't allow connections between nodes of the same type
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sourceNode = nodes.find((n: any) => n.id === params.source);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const targetNode = nodes.find((n: any) => n.id === params.target);
    
    if (sourceNode && targetNode) {
      // Only allow user -> AI connections
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if ((sourceNode as any).type === 'userMessage' && (targetNode as any).type === 'aiMessage') {
        setEdges((eds) => addEdge(params, eds));
      }
    }
  }, [nodes, setEdges]);

  const handleNodeDragStop = useCallback(
    (_: React.MouseEvent, node: Node) => {
      if (onNodeMove) {
        onNodeMove(node.id, node.position);
      }
    },
    [onNodeMove]
  );

  // Handle double-click to create new user message
  const handlePaneClick = useCallback((event: React.MouseEvent) => {
    if (event.detail === 2) { // Double-click
      const content = prompt('Enter your message:');
      if (content) {
        const position = screenToFlowPosition({ x: event.clientX, y: event.clientY });
        handleCreateUserMessage(content, undefined, position);
      }
    }
  }, [handleCreateUserMessage, screenToFlowPosition]);

  return (
    <div style={{ width: '100%', height: '100%' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        fitView
        onPaneClick={handlePaneClick}
        onNodeDragStop={handleNodeDragStop}
        className="bg-gray-800"
      >
        <Background color="#555" gap={16} />
        <Controls />
        <MiniMap />
        <Panel position="top-left" className="bg-gray-900 text-white p-4 rounded-lg shadow-md border border-gray-700">
          <h3 className="font-semibold mb-2">💬 Chat Flow</h3>
          <p className="text-sm text-gray-300 mb-2">
            Double-click to create a new message
          </p>
          <button
            onClick={() => handleCreateUserMessage("ask me anything")}
            className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
          >
            + Add Message
          </button>
        </Panel>
        <Panel position="bottom-right" className="bg-white p-2 rounded-lg shadow-md">
          <button
            onClick={() => handleCreateUserMessage("What would you like to know?")}
            className="w-12 h-12 bg-blue-500 text-white rounded-full hover:bg-blue-600 flex items-center justify-center text-2xl"
            title="Add new message"
          >
            +
          </button>
        </Panel>
      </ReactFlow>
    </div>
  );
}