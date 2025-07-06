'use client';

import React, { useState, useCallback } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';

interface CommentNodeData {
  content: string;
  createdAt: Date;
  messageId: string;
  onEdit?: (messageId: string, newContent: string) => void;
  onDelete?: (messageId: string) => void;
}

export default function CommentNode({ data }: NodeProps<CommentNodeData>) {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(data.content);

  const handleEdit = useCallback(() => {
    setIsEditing(true);
    setEditContent(data.content);
  }, [data.content]);

  const handleSave = useCallback(() => {
    if (data.onEdit && editContent.trim()) {
      data.onEdit(data.messageId, editContent.trim());
      setIsEditing(false);
    }
  }, [data, editContent]);

  const handleCancel = useCallback(() => {
    setIsEditing(false);
    setEditContent(data.content);
  }, [data.content]);

  const handleDelete = useCallback(() => {
    if (data.onDelete && window.confirm('Are you sure you want to delete this comment?')) {
      data.onDelete(data.messageId);
    }
  }, [data]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      handleSave();
    }
    if (e.key === 'Escape') {
      handleCancel();
    }
  }, [handleSave, handleCancel]);

  return (
    <div className="relative bg-transparent border-2 border-dashed border-yellow-400 rounded-lg p-4 min-w-[200px] max-w-[300px] shadow-lg">
      {/* Corner indicator */}
      <div className="absolute -top-2 -left-2 w-4 h-4 bg-yellow-400 rounded-full flex items-center justify-center">
        <span className="text-xs text-yellow-800">💬</span>
      </div>
      
      {/* Timestamp */}
      <div className="text-xs text-gray-500 mb-2">
        {data.createdAt.toLocaleTimeString()}
      </div>
      
      {/* Content */}
      <div className="mb-3">
        {isEditing ? (
          <textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-full p-2 border border-gray-300 rounded resize-none backdrop-blur-sm"
            rows={3}
            autoFocus
            placeholder="Add your comment..."
          />
        ) : (
          <p className="text-gray-400 p-2 rounded backdrop-blur-sm">
            {data.content}
          </p>
        )}
      </div>
      
      {/* Action buttons */}
      <div className="absolute top-2 right-2 flex justify-end gap-1">
        {isEditing ? (
          <>
            <button
              onClick={handleSave}
              className="px-2 py-1 bg-green-500 text-white rounded text-xs hover:bg-green-600"
            >
              Save
            </button>
            <button
              onClick={handleCancel}
              className="px-2 py-1 bg-gray-500 text-white rounded text-xs hover:bg-gray-600"
            >
              Cancel
            </button>
          </>
        ) : (
          <>
            <button
              onClick={handleEdit}
              className="p-1 text-gray-400 hover:text-blue-400 hover:bg-gray-800/50 rounded"
              title="Edit comment"
            >
              ✏️
            </button>
            <button
              onClick={handleDelete}
              className="p-1 text-gray-400 hover:text-red-400 hover:bg-gray-800/50 rounded"
              title="Delete comment"
            >
              🗑️
            </button>
          </>
        )}
      </div>
      
      {/* Handles for connecting */}
      <Handle
        type="target"
        position={Position.Top}
        style={{ background: '#fbbf24', borderColor: '#f59e0b' }}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        style={{ background: '#fbbf24', borderColor: '#f59e0b' }}
      />
    </div>
  );
} 