import { Handle, NodeProps, Position } from '@xyflow/react';
import { memo, useState, useCallback } from 'react';

export interface AIMessageNodeData extends Record<string, unknown> {
  content: string;
  createdAt: Date;
  messageId: string;
  isGenerating?: boolean;
  streamingContent?: string;
  onEdit?: (messageId: string, newContent: string, newRole?: 'user' | 'assistant') => void;
  onDelete?: (messageId: string) => void;
  onCreateUserMessage?: (content: string, parentId?: string) => void;
}

function AIMessageNode({ data }: NodeProps) {
  const { 
    content, 
    createdAt, 
    messageId, 
    isGenerating, 
    streamingContent, 
    onEdit, 
    onDelete, 
    onCreateUserMessage 
  } = data as AIMessageNodeData;
  
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(content);

  const handleSave = useCallback(() => {
    if (onEdit && editContent !== content) {
      onEdit(messageId, editContent, 'assistant');
    } 
    setIsEditing(false);
  }, [onEdit, messageId, editContent, content]);

  const handleDelete = useCallback(() => {
    if (onDelete) {
      onDelete(messageId);
    }
  }, [onDelete, messageId]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      handleSave();
    }
    if (e.key === 'Escape') {
      setEditContent(content);
      setIsEditing(false);
    }
  }, [handleSave, content]);

  const handleCreateUserMessage = useCallback(() => {
    if (onCreateUserMessage) {
      const userInput = prompt('Enter your follow-up message:');
      if (userInput && userInput.trim()) {
        onCreateUserMessage(userInput.trim(), messageId);
      }
    }
  }, [onCreateUserMessage, messageId]);

  // Use streaming content if available, otherwise use stored content
  const displayContent = streamingContent || content;
  const isCurrentlyStreaming = Boolean(streamingContent);

  return (
    <div className="px-4 py-3 bg-gray-900 border-2 border-green-400 rounded-lg min-w-[250px] max-w-[400px] shadow-lg shadow-green-400/20 hover:shadow-green-400/30 transition-shadow">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="text-green-400 font-semibold text-sm">🤖 AI Assistant</div>
          <div className="text-xs text-gray-500">
            {createdAt.toLocaleTimeString()}
          </div>
        </div>
        
        {!isEditing && (
          <div className="flex items-center gap-1">
            {!isGenerating && (
              <button
                onClick={() => setIsEditing(true)}
                className="p-1 text-gray-400 hover:text-green-400 hover:bg-gray-800 rounded"
                title="Edit message"
              >
                ✏️
              </button>
            )}
            <button
              onClick={handleDelete}
              className={`p-1 text-gray-400 hover:text-red-400 hover:bg-gray-800 rounded ${
                isGenerating ? 'bg-red-900/20 border border-red-400' : ''
              }`}
              title={isGenerating ? "Cancel/Delete stuck response" : "Delete message"}
            >
              {isGenerating ? '🛑' : '🗑️'}
            </button>
          </div>
        )}
      </div>
      
      <div className="mb-2">
        {isEditing ? (
          <div>
            <textarea
              className="w-full resize-none border border-gray-600 bg-gray-800 text-white text-sm p-2 min-h-[60px] focus:outline-none focus:ring-2 focus:ring-green-400 rounded"
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              onKeyDown={handleKeyDown}
              autoFocus
            />
            <div className="flex gap-2 mt-2">
              <button
                onClick={handleSave}
                className="px-2 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600"
              >
                Save (Ctrl+Enter)
              </button>
              <button
                onClick={() => {
                  setEditContent(content);
                  setIsEditing(false);
                }}
                className="px-2 py-1 bg-gray-600 text-white text-xs rounded hover:bg-gray-700"
              >
                Cancel (Esc)
              </button>
            </div>
          </div>
        ) : (
          <>
            {(isGenerating || isCurrentlyStreaming) && !displayContent ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <div className="animate-spin w-4 h-4 border-2 border-green-400 border-t-transparent rounded-full"></div>
                  <span>Generating response...</span>
                </div>
              </div>
            ) : (
              <div className="text-sm text-gray-200 whitespace-pre-wrap">
                {displayContent}
                {isCurrentlyStreaming && (
                  <span className="inline-block w-2 h-4 bg-green-400 animate-pulse ml-1"></span>
                )}
              </div>
            )}
          </>
        )}
      </div>
      
      {/* Add User Message Button - show when not editing and not generating */}
      {!isEditing && !isGenerating && onCreateUserMessage && (
        <div className="mb-2">
          <button
            onClick={handleCreateUserMessage}
            className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors w-full justify-center"
            title="Add follow-up user message"
          >
            <span className="text-lg">+</span>
            <span>Add User Message</span>
          </button>
        </div>
      )}
      
      {/* Handle for receiving connections from user messages */}
      <Handle 
        type="target" 
        position={Position.Left} 
        className="w-3 h-3 bg-green-500 border-2 border-black shadow-sm"
      />
      
      {/* Handle for connecting to follow-up user messages */}
      <Handle 
        type="source" 
        position={Position.Right} 
        className="w-3 h-3 bg-green-500 border-2 border-black shadow-sm"
      />
    </div>
  );
}

export default memo(AIMessageNode); 