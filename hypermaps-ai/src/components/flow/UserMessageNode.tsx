import { Handle, NodeProps, Position } from '@xyflow/react';
import { memo, useState, useCallback } from 'react';

export interface UserMessageNodeData {
  content: string;
  createdAt: Date;
  messageId: string;
  onEdit?: (messageId: string, newContent: string) => void;
}

function UserMessageNode({ data }: NodeProps<UserMessageNodeData>) {
  const { content, createdAt, messageId, onEdit } = data;
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(content);

  const handleSave = useCallback(() => {
    if (onEdit && editContent !== content) {
      onEdit(messageId, editContent);
    } 
    setIsEditing(false);
  }, [onEdit, messageId, editContent, content]);

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
      <div className="flex items-center gap-2 mb-2">
        <div className="text-blue-400 font-semibold text-sm">👤 User</div>
        <div className="text-xs text-gray-400">
          {createdAt.toLocaleTimeString()}
        </div>
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