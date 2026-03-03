// components/chat/ModeSelector.tsx
'use client';

import type { AIMode } from '@/lib/ai/router';

interface ModeSelectorProps {
  mode: AIMode;
  onChange: (mode: AIMode) => void;
}

const modes: { value: AIMode; label: string; icon: string; desc: string }[] = [
  { value: 'auto', label: 'Auto', icon: '🔀', desc: 'Smart routing' },
  { value: 'nano', label: 'Nano', icon: '⚡', desc: 'Fast & light' },
  { value: 'pro', label: 'Pro', icon: '🧠', desc: 'Deep reasoning' },
];

export default function ModeSelector({ mode, onChange }: ModeSelectorProps) {
  return (
    <div className="flex items-center gap-1 bg-surface-overlay border border-surface-border rounded-lg p-1">
      {modes.map(m => (
        <button
          key={m.value}
          onClick={() => onChange(m.value)}
          title={m.desc}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all ${
            mode === m.value
              ? 'bg-surface-elevated text-white border border-surface-border'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <span>{m.icon}</span>
          <span className="hidden sm:block">{m.label}</span>
        </button>
      ))}
    </div>
  );
}
