'use client';

import { use, useCallback, useState } from 'react';
import { ChatMessage, Comment } from '@/app/schema';
import {
  HypergraphSpaceProvider,
  useUpdateEntity,
  useDeleteEntity,
  useQuery,
  useSpace,
} from '@graphprotocol/hypergraph-react';
import { 
  usePostgresSpace, 
  usePostgresQuery, 
  usePostgresUpdateEntity, 
  usePostgresDeleteEntity,
  MockHypergraphSpaceProvider
} from '@/app/data-provider';
import { USE_POSTGRES } from '@/lib/config';
import { ChatFlow } from '@/components/flow';
import { StreamingChat, useStreamingChat } from '@/components/StreamingChat';
import { ReactFlowProvider } from '@xyflow/react';

interface FlowSpacePageProps {
  params: Promise<{ 'space-id': string }>;
}

// Custom hooks to handle conditional logic
function useSpaceData(mode: 'public' | 'private') {
  const hypergraphSpace = useSpace({ mode });
  const postgresSpace = usePostgresSpace({ mode });
  
  return USE_POSTGRES ? postgresSpace : hypergraphSpace;
}

function useMessagesData(options: { mode: 'public' | 'private'; filter: { conversationId: { is: string } } }) {
  const hypergraphData = useQuery(ChatMessage, options);
  const postgresData = usePostgresQuery<ChatMessage>(ChatMessage, options);
  
  return USE_POSTGRES ? postgresData : hypergraphData;
}

function useCommentsData(options: { mode: 'public' | 'private'; filter: { conversationId: { is: string } } }) {
  const hypergraphData = useQuery(Comment, options);
  const postgresData = usePostgresQuery<Comment>(Comment, options);
  
  return USE_POSTGRES ? postgresData : hypergraphData;
}

function useUpdateMessageData() {
  const hypergraphUpdate = useUpdateEntity(ChatMessage);
  const postgresUpdate = usePostgresUpdateEntity<ChatMessage>(ChatMessage);
  
  return USE_POSTGRES ? postgresUpdate : hypergraphUpdate;
}

function useUpdateCommentData() {
  const hypergraphUpdate = useUpdateEntity(Comment);
  const postgresUpdate = usePostgresUpdateEntity<Comment>(Comment);
  
  return USE_POSTGRES ? postgresUpdate : hypergraphUpdate;
}

function useDeleteEntityData() {
  const hypergraphDelete = useDeleteEntity();
  const postgresDelete = usePostgresDeleteEntity();
  
  return USE_POSTGRES ? postgresDelete : hypergraphDelete;
}

// Conditional provider wrapper
function ConditionalSpaceProvider({ children, spaceId }: { children: React.ReactNode; spaceId: string }) {
  if (USE_POSTGRES) {
    return <MockHypergraphSpaceProvider>{children}</MockHypergraphSpaceProvider>;
  }
  
  return <HypergraphSpaceProvider space={spaceId}>{children}</HypergraphSpaceProvider>;
}

export default function FlowSpacePage({ params }: FlowSpacePageProps) {
  const resolvedParams = use(params);
  const spaceId = resolvedParams['space-id'];

  return (
    <ConditionalSpaceProvider spaceId={spaceId}>
      <FlowSpace />
    </ConditionalSpaceProvider>
  );
}

function FlowSpace() {
  const { name, ready } = useSpaceData('private');
  const { data: messages } = useMessagesData({ 
    mode: 'private', 
    filter: {
      conversationId: { is: "conv-1" }
    } 
  });
  const { data: comments } = useCommentsData({ 
    mode: 'private', 
    filter: {
      conversationId: { is: "conv-1" }
    } 
  });
  
  const updateMessage = useUpdateMessageData();
  const updateComment = useUpdateCommentData();
  const deleteMessage = useDeleteEntityData();
  const deleteComment = useDeleteEntityData();
  const [viewMode, setViewMode] = useState<'flow' | 'chat'>('flow');

  // Use unified streaming hook
  const { 
    generateAIResponseForFlow,
    isLoading,
    streamingContent,
    currentStreamingMessageId,
  } = useStreamingChat('conv-1', messages || []);

  const handleGenerateAIResponse = useCallback(async (userMessage: ChatMessage) => {
    if (isLoading) return;
    
    try {
      console.log('Starting AI response generation for user message:', userMessage.id);
      
      // Don't create the entity here - let the streaming function create it when complete
      await generateAIResponseForFlow(userMessage);
      
      console.log('AI response generation completed successfully');
      
    } catch (error) {
      console.error('Error in handleGenerateAIResponse:', {
        error,
        userMessageId: userMessage.id,
      });
      
      // Show user-friendly error
      alert('Failed to generate AI response. Please try again.');
    }
  }, [generateAIResponseForFlow, isLoading]);

  const handleEditMessage = useCallback((messageId: string, newContent: string, newRole?: 'user' | 'assistant') => {
    try {
      const updateData: { content: string; role?: 'user' | 'assistant' } = { content: newContent };
      if (newRole) {
        updateData.role = newRole;
      }
      
      updateMessage(messageId, updateData);
      console.log(`Updated message: ${messageId}`);
    } catch (error) {
      console.error('Error updating message:', error);
      alert('Error updating message');
    }
  }, [updateMessage]);

  const handleDeleteMessage = useCallback((messageId: string) => {
    const confirmMessage = 'Are you sure you want to delete this message?';
      
    if (window.confirm(confirmMessage)) {
      try {
        deleteMessage(messageId);
        console.log(`Deleted message: ${messageId}`);
      } catch (error) {
        console.error('Error deleting message:', error);
        alert('Error deleting message');
      }
    }
  }, [deleteMessage]);

  const handleEditComment = useCallback((commentId: string, newContent: string) => {
    try {
      updateComment(commentId, { content: newContent });
      console.log(`Updated comment: ${commentId}`);
    } catch (error) {
      console.error('Error updating comment:', error);
      alert('Error updating comment');
    }
  }, [updateComment]);

  const handleDeleteComment = useCallback((commentId: string) => {
    if (window.confirm('Are you sure you want to delete this comment?')) {
      try {
        deleteComment(commentId);
        console.log(`Deleted comment: ${commentId}`);
      } catch (error) {
        console.error('Error deleting comment:', error);
        alert('Error deleting comment');
      }
    }
  }, [deleteComment]);

  const handleNodeMove = useCallback(
    (nodeId: string, position: { x: number; y: number }) => {
      try {
        // Check if it's a message or comment
        const message = messages?.find(m => m.id === nodeId);
        const comment = comments?.find(c => c.id === nodeId);
        
        if (message) {
          updateMessage(nodeId, { x: position.x, y: position.y });
        } else if (comment) {
          updateComment(nodeId, { x: position.x, y: position.y });
        }
      } catch (error) {
        console.error('Error updating node position:', error);
      }
    },
    [updateMessage, updateComment, messages, comments]
  );

  if (!ready) {
    return <div>Loading...</div>;
  }

  return (
    <div className="flex flex-col h-screen">
      {/* Header with view toggle */}
      <div className="flex items-center justify-between p-4 border-b">
        <h1 className="text-2xl font-bold">🗺️ {name}</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode('chat')}
            className={`px-3 py-1 rounded ${
              viewMode === 'chat' 
                ? 'bg-blue-500 text-white' 
                : 'bg-gray-200 text-gray-700'
            }`}
          >
            💬 Chat
          </button>
          <button
            onClick={() => setViewMode('flow')}
            className={`px-3 py-1 rounded ${
              viewMode === 'flow' 
                ? 'bg-blue-500 text-white' 
                : 'bg-gray-200 text-gray-700'
            }`}
          >
            🗺️ Flow
          </button>
        </div>
      </div>

      {/* Content area */}
      <div className="flex-1 overflow-hidden">
        {viewMode === 'chat' ? (
          <StreamingChat 
            conversationId="conv-1"
            existingMessages={messages || []}
          />
        ) : (
          <ReactFlowProvider>
            <ChatFlow
              messages={messages || []}
              comments={comments || []}
              conversationId="conv-1"
              streamingContent={streamingContent}
              currentStreamingMessageId={currentStreamingMessageId}
              isLoading={isLoading}
              onGenerateAIResponse={handleGenerateAIResponse}
              onEditMessage={handleEditMessage}
              onDeleteMessage={handleDeleteMessage}
              onEditComment={handleEditComment}
              onDeleteComment={handleDeleteComment}
              onNodeMove={handleNodeMove}
            />
          </ReactFlowProvider>
        )}
      </div>
    </div>
  );
} 