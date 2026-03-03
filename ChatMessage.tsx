// components/chat/ChatMessage.tsx
'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useState } from 'react';

interface MessageProps {
  message: {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    model?: string;
    mode?: string;
  };
  isStreaming?: boolean;
}

export default function ChatMessage({ message, isStreaming }: MessageProps) {
  const [copied, setCopied] = useState(false);
  const isUser = message.role === 'user';

  function copyMessage() {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className={`flex gap-3 py-4 animate-fade-in ${isUser ? 'justify-end' : 'justify-start'}`}>
      {!isUser && (
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-white font-bold text-xs flex-shrink-0 mt-0.5">
          T
        </div>
      )}

      <div className={`group max-w-[85%] md:max-w-[75%] ${isUser ? 'order-first' : ''}`}>
        <div
          className={`relative rounded-2xl px-4 py-3 ${
            isUser
              ? 'bg-brand-500/20 border border-brand-500/30 text-white ml-auto'
              : 'bg-surface-elevated border border-surface-border text-slate-100'
          }`}
        >
          {isUser ? (
            <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
          ) : (
            <div className={`prose text-sm ${isStreaming && !message.content ? 'min-h-[1.5rem]' : ''}`}>
              {message.content ? (
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    code({ node, className, children, ...props }) {
                      const isInline = !className;
                      const match = /language-(\w+)/.exec(className || '');
                      if (!isInline && match) {
                        return (
                          <div className="relative">
                            <div className="flex items-center justify-between bg-[#0d0d16] border border-surface-border rounded-t-lg px-4 py-2 text-xs text-slate-400">
                              <span>{match[1]}</span>
                              <button
                                onClick={() => {
                                  navigator.clipboard.writeText(String(children));
                                  setCopied(true);
                                  setTimeout(() => setCopied(false), 2000);
                                }}
                                className="hover:text-white transition-colors"
                              >
                                {copied ? '✓ Copied' : 'Copy'}
                              </button>
                            </div>
                            <pre className="!rounded-t-none !mt-0">
                              <code className={className} {...props}>
                                {children}
                              </code>
                            </pre>
                          </div>
                        );
                      }
                      return <code className={className} {...props}>{children}</code>;
                    },
                  }}
                >
                  {message.content}
                </ReactMarkdown>
              ) : null}
              {isStreaming && (
                <span className="inline-block w-1.5 h-4 bg-brand-400 ml-0.5 animate-pulse" />
              )}
            </div>
          )}
        </div>

        {/* Actions */}
        {!isUser && message.content && !isStreaming && (
          <div className="flex items-center gap-2 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={copyMessage}
              className="text-xs text-slate-500 hover:text-slate-300 transition-colors px-2 py-1"
            >
              {copied ? '✓ Copied' : 'Copy'}
            </button>
            {message.model && (
              <span className="text-xs text-slate-600">
                {message.model} · {message.mode}
              </span>
            )}
          </div>
        )}
      </div>

      {isUser && (
        <div className="w-8 h-8 rounded-full bg-surface-overlay border border-surface-border flex items-center justify-center text-slate-400 text-xs flex-shrink-0 mt-0.5">
          U
        </div>
      )}
    </div>
  );
}
