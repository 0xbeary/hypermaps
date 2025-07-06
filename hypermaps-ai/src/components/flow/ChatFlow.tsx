'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
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
import CommentNode from './CommentNode';
import { ChatMessage, Comment } from '@/app/schema';
import { useCreateEntity } from '@graphprotocol/hypergraph-react';
import { v4 as uuidv4 } from 'uuid';

const nodeTypes = {
  userMessage: UserMessageNode,
  aiMessage: AIMessageNode,
  comment: CommentNode,
};

type ChatFlowProps = {
  messages: ChatMessage[];
  comments?: Comment[];
  conversationId: string;
  streamingContent?: { [messageId: string]: string };
  currentStreamingMessageId?: string | null;
  isLoading?: boolean;
  onGenerateAIResponse?: (userMessage: ChatMessage) => Promise<void>;
  onEditMessage?: (messageId: string, newContent: string, newRole?: 'user' | 'assistant') => void;
  onDeleteMessage?: (messageId: string) => void;
  onEditComment?: (commentId: string, newContent: string) => void;
  onDeleteComment?: (commentId: string) => void;
  onNodeMove?: (messageId: string, position: { x: number; y: number }) => void;
};

export default function ChatFlow({ 
  messages, 
  comments = [],
  conversationId, 
  streamingContent = {},
  currentStreamingMessageId = null,
  isLoading = false,
  onGenerateAIResponse, 
  onEditMessage, 
  onDeleteMessage,
  onEditComment,
  onDeleteComment,
  onNodeMove,
}: ChatFlowProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node[]>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const createMessage = useCreateEntity(ChatMessage);
  const createComment = useCreateEntity(Comment);
  const { screenToFlowPosition } = useReactFlow();
  const [nodeToStartEditing, setNodeToStartEditing] = useState<string | null>(null);

  const handleDidMountInEditMode = useCallback((messageId: string) => {
    if (nodeToStartEditing === messageId) {
      setNodeToStartEditing(null);
    }
  }, [nodeToStartEditing]);

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
  const calculateNodePosition = useCallback((message: ChatMessage | Comment, allMessages: (ChatMessage | Comment)[], parentId?: string) => {
    const isUser = 'role' in message && message.role === 'user';
    
    // If there's a parent, position relative to it
    if (parentId) {
      const parentMessage = allMessages.find(m => m.id === parentId);
      if (parentMessage && parentMessage.x !== undefined && parentMessage.y !== undefined) {
        // Position user messages to the right of AI messages, AI messages to the right of user messages
        const baseX = isUser ? parentMessage.x + 500 : parentMessage.x + 500; // Both go to the right
        const baseY = parentMessage.y; // Same Y level as parent
        
        // Small random offset to avoid exact overlaps
        const deterministicOffset = (message.id.charCodeAt(0) % 20) - 10;
        
        return {
          x: baseX + deterministicOffset,
          y: baseY + deterministicOffset,
        };
      }
    }
    
    // Fallback to the original positioning logic for messages without parents
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
  const handleCreateUserMessage = useCallback((content: string, parentId?: string, position?: { x: number, y: number }, startInEdit?: boolean) => {
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
      const calculatedPosition = calculateNodePosition(tempMessage, [...messages, tempMessage], parentId);
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

    if (startInEdit) {
      setNodeToStartEditing(id);
    }
  }, [createMessage, conversationId, messages, calculateNodePosition]);

  const handleCreateAndEditUserMessage = useCallback((parentId: string) => {
    handleCreateUserMessage('', parentId, undefined, true);
  }, [handleCreateUserMessage]);

  // Handle creating new comments
  const handleCreateComment = useCallback((content: string, position?: { x: number, y: number }) => {
    const id = uuidv4();
    let x = position?.x || 200;
    let y = position?.y || 200;

    // If no position is provided, calculate a default one
    if (position === undefined) {
      const allItems = [...messages, ...comments];
      const tempComment = {
        id,
        position: allItems.length,
      } as Comment;
      const calculatedPosition = calculateNodePosition(tempComment as any, allItems as any);
      x = calculatedPosition.x + 300; // Offset comments to the right
      y = calculatedPosition.y;
    }

    createComment({
      id,
      content,
      createdAt: new Date(),
      conversationId,
      position: messages.length + comments.length,
      x,
      y,
    });
  }, [createComment, conversationId, messages.length, comments.length]);

  // Convert ChatMessage entities and Comments to React Flow nodes and edges
  const { flowNodes, flowEdges } = useMemo(() => {
    const nodes: Node[] = [];
    const edges: any[] = [];

    // Find the latest user message
    const userMessages = messages.filter(msg => msg.role === 'user');
    const latestUserMessage = userMessages.length > 0 ? userMessages[userMessages.length - 1] : null;

    // Create nodes for all existing messages in hypergraph
    messages.forEach((message) => {
      const position =
        message.x != null && message.y != null
          ? { x: message.x, y: message.y }
          : calculateNodePosition(message, messages, message.parentMessageId);
      
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
            startInEditMode: nodeToStartEditing === message.id,
            onDidMountInEditMode: handleDidMountInEditMode,
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
            streamingContent: isCurrentlyStreaming ? streamingContent[message.id] : undefined,
            onEdit: handleEditMessage,
            onDelete: handleDeleteMessage,
            onCreateUserMessage: handleCreateAndEditUserMessage,
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

    // Create nodes for comments
    comments.forEach((comment) => {
      const position =
        comment.x != null && comment.y != null
          ? { x: comment.x, y: comment.y }
          : { x: 400, y: 100 + comments.indexOf(comment) * 150 };
      
      const node = {
        id: comment.id,
        type: 'comment',
        position,
        data: {
          content: comment.content,
          createdAt: comment.createdAt,
          messageId: comment.id,
          onEdit: onEditComment,
          onDelete: onDeleteComment,
        },
      };
      nodes.push(node);
    });

    // Handle streaming node (existing code)
    const messageExistsInHypergraph = messages.find(m => m.id === currentStreamingMessageId);
    
    if (currentStreamingMessageId && !messageExistsInHypergraph) {
      const tempMessage = { 
        id: currentStreamingMessageId, 
        role: 'assistant' as const,
        position: messages.length,
      } as ChatMessage;

      const messagesWithTemp = [...messages, tempMessage];
      const streamingPosition = calculateNodePosition(tempMessage, messagesWithTemp, latestUserMessage?.id);
      
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
          onCreateUserMessage: handleCreateAndEditUserMessage,
        },
      };
      nodes.push(streamingNode);

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
    comments,
    streamingContent, 
    currentStreamingMessageId, 
    calculateNodePosition,
    handleEditMessage, 
    handleDeleteMessage, 
    handleGenerateResponse,
    onEditComment,
    onDeleteComment,
    isLoading,
    nodeToStartEditing,
    handleDidMountInEditMode
  ]);

  // Update nodes and edges when messages change
  useEffect(() => {
    setNodes(flowNodes);
    setEdges(flowEdges as any);
  }, [flowNodes, flowEdges, setNodes, setEdges]);

  // Handle connections between nodes
  const onConnect = useCallback((params: Connection) => {
    const sourceNode = nodes.find((n) => n.id === params.source);
    const targetNode = nodes.find((n) => n.id === params.target);
    
    if (sourceNode && targetNode) {
      // Only allow user -> AI connections
      if (sourceNode.type === 'userMessage' && targetNode.type === 'aiMessage') {
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

  // Handle double-click to create new user message or comment
  const handlePaneClick = useCallback((event: React.MouseEvent) => {
    if (event.detail === 2) { // Double-click
      const options = ['User Message', 'Comment'];
      const choice = prompt(`What would you like to create?\n1. ${options[0]}\n2. ${options[1]}\n\nEnter 1 or 2:`);
      
      if (choice === '1') {
        const content = prompt('Enter your message:');
        if (content) {
          const position = screenToFlowPosition({ x: event.clientX, y: event.clientY });
          handleCreateUserMessage(content, undefined, position);
        }
      } else if (choice === '2') {
        const content = prompt('Enter your comment:');
        if (content) {
          const position = screenToFlowPosition({ x: event.clientX, y: event.clientY });
          handleCreateComment(content, position);
        }
      }
    }
  }, [handleCreateUserMessage, handleCreateComment, screenToFlowPosition]);

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
            Double-click to create a new message or comment
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => handleCreateUserMessage("ask me anything")}
              className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
            >
              + Message
            </button>
            <button
              onClick={() => handleCreateComment("Add your comment here...")}
              className="px-3 py-1 bg-yellow-500 text-white rounded text-sm hover:bg-yellow-600"
            >
              💬 Comment
            </button>
          </div>
        </Panel>
        <Panel position="bottom-right" className="bg-white p-2 rounded-lg shadow-md">
          <div className="flex gap-2">
            <button
              onClick={() => handleCreateUserMessage("What would you like to know?")}
              className="w-12 h-12 bg-blue-500 text-white rounded-full hover:bg-blue-600 flex items-center justify-center text-2xl"
              title="Add new message"
            >
              +
            </button>
            <button
              onClick={() => handleCreateComment("Add your comment here...")}
              className="w-12 h-12 bg-yellow-500 text-white rounded-full hover:bg-yellow-600 flex items-center justify-center text-xl"
              title="Add new comment"
            >
              💬
            </button>
          </div>
        </Panel>
      </ReactFlow>
    </div>
  );
}