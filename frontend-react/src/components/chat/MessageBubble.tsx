import React from 'react';
import { Message } from '@/context/SessionContext';
import { Badge } from '@/components/ui/badge';
import { Bot, User, ArrowUpRight, ArrowDownRight, RefreshCw, HeartHandshake, HelpCircle } from 'lucide-react';

interface MessageBubbleProps {
  message: Message;
}

const getActionBadge = (action?: string, reason?: string) => {
  if (!action) return null;

  switch (action) {
    case 'ASK_HARDER':
      return (
        <div className="flex items-center gap-1.5 flex-wrap">
          <Badge variant="purple" className="gap-1 shadow-sm">
            <ArrowUpRight className="h-3 w-3 text-purple-400" />
            🤖 Action: ASK_HARDER
          </Badge>
          {reason && (
            <span className="text-[11px] text-purple-400/90 font-medium">
              — {reason}
            </span>
          )}
        </div>
      );
    case 'ASK_EASIER':
      return (
        <div className="flex items-center gap-1.5 flex-wrap">
          <Badge variant="warning" className="gap-1 shadow-sm">
            <ArrowDownRight className="h-3 w-3 text-amber-400" />
            🤖 Action: ASK_EASIER
          </Badge>
          {reason && (
            <span className="text-[11px] text-amber-400/90 font-medium">
              — {reason}
            </span>
          )}
        </div>
      );
    case 'CLARIFY':
      return (
        <div className="flex items-center gap-1.5 flex-wrap">
          <Badge variant="info" className="gap-1 shadow-sm">
            <HelpCircle className="h-3 w-3 text-blue-400" />
            🤖 Action: CLARIFY
          </Badge>
          {reason && (
            <span className="text-[11px] text-blue-400/90 font-medium">
              — {reason}
            </span>
          )}
        </div>
      );
    case 'ENCOURAGE':
      return (
        <div className="flex items-center gap-1.5 flex-wrap">
          <Badge variant="success" className="gap-1 shadow-sm">
            <HeartHandshake className="h-3 w-3 text-emerald-400" />
            🤖 Action: ENCOURAGE
          </Badge>
          {reason && (
            <span className="text-[11px] text-emerald-400/90 font-medium">
              — {reason}
            </span>
          )}
        </div>
      );
    case 'CHANGE_TOPIC':
      return (
        <div className="flex items-center gap-1.5 flex-wrap">
          <Badge variant="secondary" className="gap-1 shadow-sm border border-slate-600">
            <RefreshCw className="h-3 w-3" />
            🤖 Action: CHANGE_TOPIC
          </Badge>
          {reason && (
            <span className="text-[11px] text-muted-foreground font-medium">
              — {reason}
            </span>
          )}
        </div>
      );
    default:
      return (
        <div className="flex items-center gap-1.5 flex-wrap">
          <Badge variant="outline" className="gap-1">
            🤖 Action: {action}
          </Badge>
          {reason && (
            <span className="text-[11px] text-muted-foreground">
              — {reason}
            </span>
          )}
        </div>
      );
  }
};

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  const isUser = message.role === 'user';

  return (
    <div
      className={`flex items-start gap-3 my-4 transition-all duration-200 ${
        isUser ? 'justify-end flex-row-reverse' : 'justify-start'
      }`}
    >
      {/* Avatar */}
      <div
        className={`h-9 w-9 rounded-full flex items-center justify-center shrink-0 shadow-md ${
          isUser
            ? 'bg-blue-600 text-white shadow-blue-500/20'
            : 'bg-muted border border-border text-foreground shadow-black/10'
        }`}
      >
        {isUser ? <User className="h-5 w-5" /> : <Bot className="h-5 w-5 text-indigo-400" />}
      </div>

      {/* Bubble Container */}
      <div
        className={`flex flex-col max-w-[80%] md:max-w-[70%] space-y-1.5 ${
          isUser ? 'items-end' : 'items-start'
        }`}
      >
        {/* Adaptive Action Badge (Only for AI replies) */}
        {!isUser && message.action && (
          <div className="mb-1">{getActionBadge(message.action, message.reason)}</div>
        )}

        {/* Message Box */}
        <div
          className={`rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm transition-all ${
            isUser
              ? 'bg-primary text-primary-foreground rounded-tr-none'
              : 'bg-muted/70 backdrop-blur-md border border-border/80 text-foreground rounded-tl-none shadow-sm'
          }`}
        >
          <p className="whitespace-pre-wrap">{message.content}</p>
        </div>

        {/* Timestamp */}
        <span className="text-[10px] text-muted-foreground px-1">
          {message.timestamp}
        </span>
      </div>
    </div>
  );
};
