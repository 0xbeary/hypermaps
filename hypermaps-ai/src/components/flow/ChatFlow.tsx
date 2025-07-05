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
  Node,
  Edge,
  Connection,
  Panel,
  NodeChange,
  EdgeChange,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import UserMessageNode from './UserMessageNode';
import AIMessageNode from './AIMessageNode';
import { ChatMessage } from '@/app/schema';
import { useCreateEntity } from '@graphprotocol/hypergraph-react';
import { v4 as uuidv4 } from 'uuid';
import { AIMessageNodeData } from './AIMessageNode';
import { UserMessageNodeData } from './UserMessageNode';

const nodeTypes = {
  userMessage: UserMessageNode,
  aiMessage: AIMessageNode,
};

type ChatFlowProps = {
  messages: ChatMessage[];
  conversationId: string;
  onGenerateAIResponse?: (userMessage: ChatMessage) => Promise<void>;
  onEditMessage?: (messageId: string, newContent: string, newRole?: 'user' | 'assistant') => void;
  onDeleteMessage?: (messageId: string) => void;
};

// Define a union type for all possible node data types
type FlowNodeData = AIMessageNodeData | UserMessageNodeData;

export default function ChatFlow({ 
  messages, 
  conversationId, 
  onGenerateAIResponse, 
  onEditMessage, 
  onDeleteMessage 
}: ChatFlowProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const createMessage = useCreateEntity(ChatMessage);

  // Handle editing messages
  const handleEditMessage = useCallback((messageId: string, newContent: string, newRole?: 'user' | 'assistant') => {
    if (onEditMessage) {
      onEditMessage(messageId, newContent, newRole);
    } else {
      // Fallback to local update if no handler provided
      setNodes((nodes) =>
        nodes.map((node) =>
          node.id === messageId
            ? { ...node, data: { ...node.data, content: newContent } }
            : node
        )
      );
    }
  }, [onEditMessage, setNodes]);

  // Handle deleting messages
  const handleDeleteMessage = useCallback((messageId: string) => {
    if (onDeleteMessage) {
      onDeleteMessage(messageId);
    }
  }, [onDeleteMessage]);

  // Enhanced positioning logic for better visual flow
  const calculateNodePosition = (message: ChatMessage, allMessages: ChatMessage[]) => {
    const isUser = message.role === 'user';
    
    // Find the depth level (how deep in the conversation thread)
    let depth = 0;
    let currentMessage = message;
    while (currentMessage.parentMessageId) {
      const parent = allMessages.find(m => m.id === currentMessage.parentMessageId);
      if (parent) {
        depth++;
        currentMessage = parent;
      } else {
        break;
      }
    }
    
    // Calculate position based on depth and role
    const baseY = depth * 180; // Vertical spacing between levels
    const baseX = isUser ? 50 : 450; // Horizontal spacing between user and AI
    
    // Add some randomness to avoid perfect overlaps
    const randomOffset = Math.random() * 20 - 10;
    
    return {
      x: baseX + randomOffset,
      y: baseY + randomOffset,
    };
  };

  // Convert ChatMessage entities to React Flow nodes and edges
  const { flowNodes, flowEdges } = useMemo(() => {
    const nodes: Node<FlowNodeData>[] = [];
    const edges: Edge[] = [];

    messages.forEach((message) => {
      const position = calculateNodePosition(message, messages);
      
      // Create node based on message role with proper data typing
      if (message.role === 'user') {
        const node: Node<UserMessageNodeData> = {
          id: message.id,
          type: 'userMessage',
          position,
          data: {
            content: message.content,
            createdAt: message.createdAt,
            messageId: message.id,
            onEdit: handleEditMessage,
            onDelete: handleDeleteMessage,
          },
        };
        nodes.push(node);
      } else {
        const node: Node<AIMessageNodeData> = {
          id: message.id,
          type: 'aiMessage',
          position,
          data: {
            content: message.content,
            createdAt: message.createdAt,
            messageId: message.id,
            isGenerating: !message.content.trim(),
            onEdit: handleEditMessage,
            onDelete: handleDeleteMessage,
          },
        };
        nodes.push(node);
      }

      // Create edge if this message has a parent
      if (message.parentMessageId) {
        const edge: Edge = {
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

    return { flowNodes: nodes, flowEdges: edges };
  }, [messages, handleEditMessage, handleDeleteMessage]);

  // Update nodes and edges when messages change
  useEffect(() => {
    setNodes(flowNodes);
    setEdges(flowEdges);
  }, [flowNodes, flowEdges, setNodes, setEdges]);

  // Handle creating new user messages
  const handleCreateUserMessage = useCallback(async (content: string, parentId?: string) => {
    const newMessage = createMessage({
      id: uuidv4(),
      content,
      role: 'user',
      createdAt: new Date(),
      conversationId,
      parentMessageId: parentId || '',
      position: messages.length,
    });

    // Automatically trigger AI response
    if (onGenerateAIResponse) {
      await onGenerateAIResponse(newMessage);
    }
  }, [createMessage, conversationId, messages.length, onGenerateAIResponse]);

  // Handle connections between nodes
  const onConnect = useCallback((params: Connection) => {
    // Don't allow connections between nodes of the same type
    const sourceNode = nodes.find(n => n.id === params.source);
    const targetNode = nodes.find(n => n.id === params.target);
    
    if (sourceNode && targetNode) {
      // Only allow user -> AI connections
      if (sourceNode.type === 'userMessage' && targetNode.type === 'aiMessage') {
        setEdges((eds) => addEdge(params, eds));
      }
    }
  }, [nodes, setEdges]);

  // Handle double-click to create new user message
  const handlePaneClick = useCallback((event: React.MouseEvent) => {
    if (event.detail === 2) { // Double-click
      const content = prompt('Enter your message:');
      if (content) {
        handleCreateUserMessage(content);
      }
    }
  }, [handleCreateUserMessage]);

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
            onClick={() => handleCreateUserMessage("Hello! How can I help you today?")}
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