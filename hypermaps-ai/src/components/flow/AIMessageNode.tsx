import { Handle, NodeProps, Position } from '@xyflow/react';
import { memo } from 'react';

export type AIMessageNodeData = {
  content: string;
  createdAt: Date;
  messageId: string;
  isGenerating?: boolean;
};

function AIMessageNode({ data }: NodeProps<AIMessageNodeData>) {
  const { content, createdAt, messageId, isGenerating } = data;

  return (
    <div className="px-4 py-3 bg-gray-900 border-2 border-green-400 rounded-lg min-w-[250px] max-w-[400px] shadow-lg shadow-green-400/20 hover:shadow-green-400/30 transition-shadow">
      <div className="flex items-center gap-2 mb-2">
        <div className="text-green-400 font-semibold text-sm">🤖 AI Assistant</div>
        <div className="text-xs text-gray-500">
          {createdAt.toLocaleTimeString()}
        </div>
      </div>
      
      <div className="mb-2">
        {isGenerating || !content ? (
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <div className="animate-spin w-4 h-4 border-2 border-green-400 border-t-transparent rounded-full"></div>
            <span>Generating response...</span>
          </div>
        ) : (
          <div className="text-sm text-gray-100 whitespace-pre-wrap">
            {content}
          </div>
        )}
      </div>
      
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