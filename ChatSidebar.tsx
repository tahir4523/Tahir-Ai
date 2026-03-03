// components/chat/ChatSidebar.tsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

interface Conversation {
  id: string;
  title: string;
  updated_at: string;
}

export default function ChatSidebar() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    loadConversations();
    loadUser();
  }, [pathname]);

  async function loadUser() {
    const { data: { user } } = await supabase.auth.getUser();
    if (user?.email) setUserEmail(user.email);
  }

  async function loadConversations() {
    const res = await fetch('/api/conversations');
    if (res.ok) {
      const data = await res.json();
      setConversations(data.conversations || []);
    }
  }

  async function deleteConversation(id: string, e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();

    await fetch(`/api/conversations?id=${id}`, { method: 'DELETE' });
    setConversations(prev => prev.filter(c => c.id !== id));

    if (pathname.includes(id)) router.push('/chat');
  }

  async function signOut() {
    await supabase.auth.signOut();
    router.push('/');
  }

  const navLinks = [
    { href: '/chat', icon: '💬', label: 'Chat' },
    { href: '/image', icon: '🎨', label: 'Image Gen' },
    { href: '/build', icon: '🏗️', label: 'Build Mode' },
    { href: '/dashboard', icon: '📊', label: 'Dashboard' },
    { href: '/settings', icon: '⚙️', label: 'Settings' },
  ];

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={() => setIsOpen(true)}
        className="md:hidden fixed top-4 left-4 z-50 w-9 h-9 rounded-lg bg-surface-elevated border border-surface-border flex items-center justify-center text-slate-400"
      >
        ☰
      </button>

      {/* Overlay */}
      {isOpen && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-black/60"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed md:relative z-50 md:z-auto
          w-64 h-full flex flex-col
          bg-surface-elevated border-r border-surface-border
          transition-transform duration-300
          ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}
      >
        {/* Logo */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-surface-border">
          <Link href="/chat" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-white font-bold text-xs">
              T
            </div>
            <span className="font-semibold text-white">Tahir GPT</span>
          </Link>
          <button onClick={() => setIsOpen(false)} className="md:hidden text-slate-400">✕</button>
        </div>

        {/* New chat button */}
        <div className="px-3 py-3">
          <Link
            href="/chat"
            className="flex items-center gap-2 w-full px-3 py-2 rounded-lg border border-surface-border hover:border-brand-500/30 hover:bg-surface-overlay text-sm text-slate-300 hover:text-white transition-all"
          >
            <span>＋</span>
            <span>New chat</span>
          </Link>
        </div>

        {/* Nav */}
        <nav className="px-3 pb-3 border-b border-surface-border">
          {navLinks.map(l => (
            <Link
              key={l.href}
              href={l.href}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                pathname === l.href
                  ? 'bg-surface-overlay text-white'
                  : 'text-slate-400 hover:text-white hover:bg-surface-overlay/50'
              }`}
            >
              <span>{l.icon}</span>
              <span>{l.label}</span>
            </Link>
          ))}
        </nav>

        {/* Conversation history */}
        <div className="flex-1 overflow-y-auto px-3 py-3">
          <p className="text-xs text-slate-500 px-2 mb-2 font-medium uppercase tracking-wider">
            Recent
          </p>
          <div className="space-y-0.5">
            {conversations.map(conv => (
              <div key={conv.id} className="group relative">
                <Link
                  href={`/chat/${conv.id}`}
                  className={`flex items-center px-3 py-2 rounded-lg text-sm transition-colors truncate ${
                    pathname.includes(conv.id)
                      ? 'bg-surface-overlay text-white'
                      : 'text-slate-400 hover:text-white hover:bg-surface-overlay/50'
                  }`}
                >
                  {conv.title}
                </Link>
                <button
                  onClick={(e) => deleteConversation(conv.id, e)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 text-slate-500 hover:text-red-400 transition-all text-xs px-1"
                >
                  ✕
                </button>
              </div>
            ))}
            {conversations.length === 0 && (
              <p className="text-slate-600 text-xs px-2">No conversations yet</p>
            )}
          </div>
        </div>

        {/* User */}
        <div className="px-3 py-3 border-t border-surface-border">
          <div className="flex items-center justify-between px-2">
            <div className="text-xs text-slate-400 truncate flex-1">
              {userEmail}
            </div>
            <button
              onClick={signOut}
              className="text-slate-500 hover:text-red-400 text-xs ml-2 transition-colors"
            >
              Sign out
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
