
import React from 'react';
import { ChatMessage as ChatMessageType, ChatRole } from '../types';
import { BotIcon, UserIcon, LoadingSpinner } from './icons';
import ToolCallDisplay from './ToolCallDisplay';

interface ChatMessageProps {
  message: ChatMessageType;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const isUser = message.role === ChatRole.USER;

  const containerClasses = `flex items-start gap-4 p-4 ${isUser ? '' : 'bg-gray-800/50'}`;
  const icon = isUser 
    ? <UserIcon className="w-8 h-8 text-gray-400 flex-shrink-0 mt-1" /> 
    : <BotIcon className="w-8 h-8 text-cyan-400 flex-shrink-0 mt-1" />;
  const contentClasses = `flex-1 pt-1 ${isUser ? 'text-gray-100' : 'text-gray-200'}`;

  return (
    <div className={containerClasses}>
      {icon}
      <div className={contentClasses}>
        {message.isLoading ? (
            <div>
                <LoadingSpinner />
                {message.toolCalls && message.toolCalls.length > 0 && (
                <div className="mt-4">
                    <ToolCallDisplay toolCalls={message.toolCalls} isExpandedDefault={true} />
                </div>
                )}
            </div>
        ) : (
          <>
            {message.text && <div className="prose prose-invert max-w-none" dangerouslySetInnerHTML={{__html: message.text.replace(/\n/g, '<br/>')}}></div>}
            
            {message.toolCalls && message.toolCalls.length > 0 && (
                <ToolCallDisplay toolCalls={message.toolCalls} />
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ChatMessage;
