// components/chat/ChatInput.tsx
'use client';

import { useState, useRef, KeyboardEvent } from 'react';

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export default function ChatInput({ onSend, disabled, placeholder }: ChatInputProps) {
  const [value, setValue] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  function autoResize() {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    ta.style.height = Math.min(ta.scrollHeight, 200) + 'px';
  }

  function handleSend() {
    if (!value.trim() || disabled) return;
    onSend(value.trim());
    setValue('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <div className="relative flex items-end gap-2 bg-surface-elevated border border-surface-border rounded-2xl px-4 py-3 focus-within:border-brand-500/50 transition-colors">
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => { setValue(e.target.value); autoResize(); }}
        onKeyDown={handleKeyDown}
        placeholder={placeholder || 'Message Tahir GPT...'}
        disabled={disabled}
        rows={1}
        className="flex-1 bg-transparent text-white placeholder:text-slate-500 resize-none outline-none text-sm leading-relaxed disabled:opacity-50 max-h-[200px]"
      />
      <button
        onClick={handleSend}
        disabled={!value.trim() || disabled}
        className="flex-shrink-0 w-8 h-8 rounded-lg bg-brand-500 hover:bg-brand-600 disabled:opacity-30 disabled:cursor-not-allowed text-white flex items-center justify-center transition-all hover:scale-105 disabled:scale-100"
      >
        {disabled ? (
          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        ) : (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M22 2L11 13M22 2L15 22L11 13L2 9L22 2Z" />
          </svg>
        )}
      </button>
    </div>
  );
}
