import { Handle, NodeProps, Position } from '@xyflow/react';
import { memo, useState, useCallback } from 'react';

export interface UserMessageNodeData extends Record<string, unknown> {
  content: string;
  createdAt: Date;
  messageId: string;
  isLatestUserMessage?: boolean;
  isLoading?: boolean;
  onEdit?: (messageId: string, newContent: string, newRole?: 'user' | 'assistant') => void;
  onDelete?: (messageId: string) => void;
  onGenerateResponse?: (messageId: string) => Promise<void>;
}

function UserMessageNode({ data }: NodeProps) {
  const { content, createdAt, messageId, isLatestUserMessage, isLoading = false, onEdit, onDelete, onGenerateResponse } = data as UserMessageNodeData;
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(content);

  const handleSave = useCallback(() => {
    if (onEdit && editContent !== content) {
      onEdit(messageId, editContent, 'user');
    } 
    setIsEditing(false);
  }, [onEdit, messageId, editContent, content]);

  const handleDelete = useCallback(() => {
    if (onDelete) {
      onDelete(messageId);
    }
  }, [onDelete, messageId]);

  const handleGenerateResponse = useCallback(async () => {
    if (onGenerateResponse && !isLoading) {
      try {
        await onGenerateResponse(messageId);
      } catch (error) {
        console.error('Error generating response:', error);
      }
    }
  }, [onGenerateResponse, messageId, isLoading]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      handleSave();
    }
    if (e.key === 'Escape') {
      setEditContent(content);
      setIsEditing(false);
    }
  }, [handleSave, content]);

  return (
    <div className="px-4 py-3 bg-gray-900 border-2 border-gray-700 rounded-lg min-w-[250px] max-w-[400px] shadow-lg hover:shadow-xl transition-shadow">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="text-blue-400 font-semibold text-sm">👤 User</div>
          <div className="text-xs text-gray-400">
            {createdAt.toLocaleTimeString()}
          </div>
          {isLatestUserMessage && (
            <div className="text-xs text-green-400 font-semibold bg-green-400/10 px-2 py-1 rounded">
              Latest
            </div>
          )}
        </div>
        
        {!isEditing && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsEditing(true)}
              className="p-1 text-gray-400 hover:text-blue-400 hover:bg-gray-800 rounded"
              title="Edit message"
            >
              ✏️
            </button>
            <button
              onClick={handleDelete}
              className="p-1 text-gray-400 hover:text-red-400 hover:bg-gray-800 rounded"
              title="Delete message"
            >
              🗑️
            </button>
            {onGenerateResponse && (
              <button
                onClick={handleGenerateResponse}
                disabled={isLoading}
                className="flex items-center justify-center w-6 h-6 bg-green-600 text-white rounded-full hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                title="Generate AI response"
              >
                {isLoading ? (
                  <div className="animate-spin w-3 h-3 border-2 border-white border-t-transparent rounded-full"></div>
                ) : (
                  <span className="text-lg font-bold -translate-y-px">+</span>
                )}
              </button>
            )}
          </div>
        )}
      </div>
      
      <div className="mb-2">
        {isEditing ? (
          <div>
            <textarea
              className="w-full resize-none border border-gray-600 bg-gray-800 text-white text-sm p-2 min-h-[60px] focus:outline-none focus:ring-2 focus:ring-blue-400 rounded"
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              onKeyDown={handleKeyDown}
              autoFocus
            />
            <div className="flex gap-2 mt-2">
              <button
                onClick={handleSave}
                className="px-2 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600"
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
          <div 
            className="text-sm text-gray-200 whitespace-pre-wrap cursor-pointer hover:bg-gray-800 p-1 rounded"
            onClick={() => setIsEditing(true)}
          >
            {content || 'Click to edit...'}
          </div>
        )}
      </div>

      {/* Handle for connecting to AI responses */}
      <Handle 
        type="source" 
        position={Position.Right} 
        className="w-3 h-3 bg-blue-500 border-2 border-gray-900 shadow-sm"
      />
      
      {/* Handle for receiving connections from previous messages */}
      <Handle 
        type="target" 
        position={Position.Left} 
        className="w-3 h-3 bg-blue-500 border-2 border-gray-900 shadow-sm"
      />
    </div>
  );
}

export default memo(UserMessageNode); 