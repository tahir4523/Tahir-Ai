'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';

type Role = 'user' | 'assistant';
type Mode = 'auto' | 'nano' | 'pro';

interface Message {
  id: string;
  role: Role;
  content: string;
  mode?: string;
  provider?: string;
  loading?: boolean;
}

interface Conversation {
  id: string;
  title: string;
  mode: string;
  updated_at: string;
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [mode, setMode] = useState<Mode>('auto');
  const [loading, setLoading] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConvId, setCurrentConvId] = useState<string | null>(null);
  const [userPlan, setUserPlan] = useState<'free' | 'pro'>('free');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userEmail, setUserEmail] = useState('');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const supabase = createClientComponentClient();
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) { router.replace('/login'); return; }
      setUserEmail(session.user.email ?? '');
      fetchProfile(session.user.id);
      fetchConversations();
    });
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function fetchProfile(userId: string) {
    const { data } = await supabase.from('profiles').select('plan').eq('id', userId).single();
    setUserPlan(data?.plan ?? 'free');
  }

  async function fetchConversations() {
    const { data } = await supabase
      .from('conversations').select('*').order('updated_at', { ascending: false }).limit(20);
    setConversations(data ?? []);
  }

  async function loadConversation(convId: string) {
    setCurrentConvId(convId);
    const { data } = await supabase
      .from('messages').select('*').eq('conversation_id', convId).order('created_at');
    setMessages((data ?? []).map((m: any) => ({ id: m.id, role: m.role, content: m.content })));
    setSidebarOpen(false);
  }

  async function newConversation() {
    setMessages([]);
    setCurrentConvId(null);
    setInput('');
    setSidebarOpen(false);
  }

  async function signOut() {
    await supabase.auth.signOut();
    router.replace('/login');
  }

  async function createConversation(title: string, convMode: Mode): Promise<string> {
    const { data } = await supabase.from('conversations')
      .insert({ title: title.slice(0, 50), mode: convMode === 'auto' ? 'nano' : convMode })
      .select().single();
    return data?.id;
  }

  async function sendMessage() {
    const content = input.trim();
    if (!content || loading) return;

    // Check build mode
    const isBuild = /build\s+(me\s+a?|a|an)|create\s+(a|an|me)\s+\w+\s*(app|website)|generate\s+(saas|app)/i.test(content);
    if (isBuild) {
      router.push(`/build?prompt=${encodeURIComponent(content)}`);
      return;
    }

    setInput('');
    textareaRef.current && (textareaRef.current.style.height = 'auto');

    const userMsg: Message = { id: Date.now().toString(), role: 'user', content };
    const assistantMsg: Message = { id: (Date.now() + 1).toString(), role: 'assistant', content: '', loading: true };

    setMessages(prev => [...prev, userMsg, assistantMsg]);
    setLoading(true);

    try {
      let convId = currentConvId;
      if (!convId) {
        convId = await createConversation(content, mode);
        setCurrentConvId(convId);
        fetchConversations();
      }

      const allMessages = [...messages, userMsg].map(m => ({ role: m.role, content: m.content }));

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: allMessages, mode, conversationId: convId }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Request failed');
      }

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let fullText = '';
      let provider = '';
      let responseMode = mode;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        const lines = chunk.split('\n').filter(l => l.startsWith('data: '));
        for (const line of lines) {
          const data = line.slice(6);
          if (data === '[DONE]') break;
          try {
            const parsed = JSON.parse(data);
            if (parsed.text) {
              fullText += parsed.text;
              provider = parsed.provider ?? provider;
              responseMode = parsed.mode ?? responseMode;
              setMessages(prev => prev.map(m =>
                m.id === assistantMsg.id
                  ? { ...m, content: fullText, loading: false, provider, mode: responseMode }
                  : m
              ));
            }
          } catch {}
        }
      }
    } catch (err: any) {
      setMessages(prev => prev.map(m =>
        m.id === assistantMsg.id
          ? { ...m, content: `⚠️ ${err.message}`, loading: false }
          : m
      ));
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  function autoResize(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setInput(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = Math.min(e.target.scrollHeight, 200) + 'px';
  }

  const ModeButton = ({ m, label }: { m: Mode; label: string }) => (
    <button
      onClick={() => setMode(m)}
      style={{
        padding: '0.3rem 0.8rem', borderRadius: '20px', fontSize: '0.75rem',
        fontWeight: 600, letterSpacing: '0.04em', cursor: 'pointer', transition: 'all 0.15s',
        border: mode === m ? 'none' : '1px solid var(--border)',
        background: mode === m
          ? m === 'nano' ? 'rgba(56,189,248,0.2)' : m === 'pro' ? 'rgba(251,191,36,0.2)' : 'rgba(255,255,255,0.1)'
          : 'transparent',
        color: mode === m
          ? m === 'nano' ? '#38bdf8' : m === 'pro' ? '#fbbf24' : '#fff'
          : 'var(--text-secondary)',
      }}
    >
      {label}
    </button>
  );

  return (
    <div style={{ display: 'flex', height: '100vh', background: 'var(--bg-primary)', overflow: 'hidden' }}>
      {/* Sidebar overlay on mobile */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
            zIndex: 40, display: window.innerWidth < 768 ? 'block' : 'none',
          }}
        />
      )}

      {/* Sidebar */}
      <aside style={{
        width: '260px', flexShrink: 0, background: 'var(--bg-secondary)',
        borderRight: '1px solid var(--border)',
        display: 'flex', flexDirection: 'column',
        position: window.innerWidth < 768 ? 'fixed' : 'relative',
        left: 0, top: 0, bottom: 0, zIndex: 50,
        transform: sidebarOpen || window.innerWidth >= 768 ? 'translateX(0)' : 'translateX(-100%)',
        transition: 'transform 0.25s ease',
      }}>
        {/* Sidebar header */}
        <div style={{ padding: '1.25rem', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1rem' }}>
            <div style={{
              width: '32px', height: '32px', borderRadius: '10px',
              background: 'linear-gradient(135deg, #fbbf24, #d97706)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '14px', color: '#000',
              flexShrink: 0,
            }}>T</div>
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--text-primary)', fontSize: '1rem' }}>
              Tahir GPT
            </span>
          </div>
          <button onClick={newConversation} className="btn-primary" style={{ width: '100%', fontSize: '0.85rem', padding: '0.5rem 1rem' }}>
            + New Chat
          </button>
        </div>

        {/* Conversation list */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '0.75rem' }}>
          <p style={{ fontSize: '0.7rem', fontWeight: 600, color: 'rgba(136,136,170,0.5)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.5rem', paddingLeft: '0.5rem' }}>
            Recent Chats
          </p>
          {conversations.map(conv => (
            <button
              key={conv.id}
              onClick={() => loadConversation(conv.id)}
              style={{
                width: '100%', textAlign: 'left', padding: '0.6rem 0.75rem',
                borderRadius: '10px', cursor: 'pointer', transition: 'background 0.15s',
                background: currentConvId === conv.id ? 'var(--accent-dim)' : 'transparent',
                border: currentConvId === conv.id ? '1px solid rgba(251,191,36,0.2)' : '1px solid transparent',
                marginBottom: '0.25rem',
              }}
            >
              <p style={{
                fontSize: '0.83rem', color: 'var(--text-primary)', whiteSpace: 'nowrap',
                overflow: 'hidden', textOverflow: 'ellipsis', fontWeight: currentConvId === conv.id ? 500 : 400,
              }}>
                {conv.title || 'Untitled'}
              </p>
            </button>
          ))}
          {conversations.length === 0 && (
            <p style={{ fontSize: '0.8rem', color: 'rgba(136,136,170,0.4)', textAlign: 'center', paddingTop: '2rem' }}>
              No conversations yet
            </p>
          )}
        </div>

        {/* Sidebar footer */}
        <div style={{ padding: '1rem', borderTop: '1px solid var(--border)' }}>
          {userPlan === 'free' && (
            <button
              onClick={() => router.push('/dashboard')}
              style={{
                width: '100%', padding: '0.6rem', borderRadius: '10px', cursor: 'pointer',
                background: 'linear-gradient(135deg, rgba(251,191,36,0.15), rgba(217,119,6,0.1))',
                border: '1px solid rgba(251,191,36,0.25)', marginBottom: '0.75rem',
                color: '#fbbf24', fontSize: '0.8rem', fontWeight: 600,
              }}
            >
              ⚡ Upgrade to Pro
            </button>
          )}
          {userPlan === 'pro' && (
            <div style={{
              padding: '0.5rem 0.75rem', borderRadius: '10px', marginBottom: '0.75rem',
              background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.2)',
              fontSize: '0.78rem', color: '#fbbf24', textAlign: 'center', fontWeight: 600,
            }}>
              ✦ Pro Plan Active
            </div>
          )}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
            <div style={{ minWidth: 0 }}>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-primary)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {userEmail}
              </p>
            </div>
            <button onClick={signOut} style={{
              padding: '0.3rem 0.6rem', borderRadius: '6px', fontSize: '0.75rem',
              cursor: 'pointer', color: 'var(--text-secondary)', background: 'transparent',
              border: '1px solid var(--border)', whiteSpace: 'nowrap', flexShrink: 0,
            }}>
              Sign out
            </button>
          </div>
        </div>
      </aside>

      {/* Main chat area */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
        {/* Header */}
        <header style={{
          padding: '0.875rem 1.25rem', borderBottom: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', gap: '1rem',
          background: 'rgba(10,10,15,0.8)', backdropFilter: 'blur(10px)',
        }}>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            style={{
              background: 'none', border: 'none', cursor: 'pointer', padding: '0.25rem',
              color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '4px',
            }}
          >
            {[0,1,2].map(i => <span key={i} style={{ display: 'block', width: '18px', height: '1.5px', background: 'currentColor' }} />)}
          </button>

          <div style={{ display: 'flex', gap: '0.4rem' }}>
            <ModeButton m="auto" label="Auto" />
            <ModeButton m="nano" label="⚡ Nano" />
            {userPlan === 'pro' && <ModeButton m="pro" label="✦ Pro" />}
          </div>

          <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.5rem' }}>
            <button onClick={() => router.push('/image')} style={{
              padding: '0.35rem 0.8rem', borderRadius: '8px', fontSize: '0.78rem',
              cursor: 'pointer', color: 'var(--text-secondary)', background: 'transparent',
              border: '1px solid var(--border)',
            }}>
              🎨 Image
            </button>
            <button onClick={() => router.push('/build')} style={{
              padding: '0.35rem 0.8rem', borderRadius: '8px', fontSize: '0.78rem',
              cursor: 'pointer', color: 'var(--text-secondary)', background: 'transparent',
              border: '1px solid var(--border)',
            }}>
              🔧 Build
            </button>
          </div>
        </header>

        {/* Messages */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem 0' }}>
          <div style={{ maxWidth: '760px', margin: '0 auto', padding: '0 1rem' }}>
            {messages.length === 0 && (
              <div style={{ textAlign: 'center', paddingTop: '4rem' }}>
                <div style={{
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  width: '72px', height: '72px', borderRadius: '24px',
                  background: 'linear-gradient(135deg, #fbbf24, #d97706)',
                  marginBottom: '1.5rem', boxShadow: '0 0 60px rgba(251,191,36,0.25)',
                }}>
                  <span style={{ fontSize: '32px', fontWeight: 900, color: '#000', fontFamily: 'var(--font-display)' }}>T</span>
                </div>
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                  What can I help you with?
                </h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '2.5rem' }}>
                  {userPlan === 'pro' ? 'Pro mode active — full power at your fingertips' : 'Ask anything, or try a suggestion below'}
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem', maxWidth: '560px', margin: '0 auto' }}>
                  {[
                    { icon: '💡', text: 'Explain quantum computing simply' },
                    { icon: '🔧', text: 'Build me a SaaS landing page' },
                    { icon: '🎨', text: 'Generate an image of a sunset city' },
                    { icon: '📊', text: 'Write a business plan for a startup' },
                  ].map(({ icon, text }) => (
                    <button key={text} onClick={() => setInput(text)} style={{
                      padding: '0.875rem', borderRadius: '12px', textAlign: 'left', cursor: 'pointer',
                      background: 'var(--bg-card)', border: '1px solid var(--border)',
                      color: 'var(--text-secondary)', fontSize: '0.83rem', lineHeight: 1.4,
                      transition: 'all 0.15s',
                    }}
                    onMouseOver={e => (e.currentTarget.style.borderColor = 'rgba(251,191,36,0.3)')}
                    onMouseOut={e => (e.currentTarget.style.borderColor = 'var(--border)')}
                    >
                      <span style={{ display: 'block', fontSize: '1.1rem', marginBottom: '0.3rem' }}>{icon}</span>
                      {text}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((msg, idx) => (
              <div key={msg.id} className="message-animate" style={{
                display: 'flex', flexDirection: 'column',
                alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start',
                marginBottom: '1.5rem',
              }}>
                {msg.role === 'assistant' && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
                    <div style={{
                      width: '24px', height: '24px', borderRadius: '8px',
                      background: 'linear-gradient(135deg, #fbbf24, #d97706)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '10px', fontWeight: 900, color: '#000', fontFamily: 'var(--font-display)',
                    }}>T</div>
                    <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-primary)' }}>Tahir GPT</span>
                    {msg.mode && (
                      <span className={msg.mode === 'nano' ? 'badge-nano' : 'badge-pro'}>
                        {msg.mode === 'nano' ? '⚡ Nano' : '✦ Pro'}
                      </span>
                    )}
                  </div>
                )}

                <div style={{
                  maxWidth: msg.role === 'user' ? '75%' : '100%',
                  padding: msg.role === 'user' ? '0.75rem 1rem' : '0',
                  background: msg.role === 'user' ? 'linear-gradient(135deg, rgba(251,191,36,0.15), rgba(217,119,6,0.1))' : 'transparent',
                  border: msg.role === 'user' ? '1px solid rgba(251,191,36,0.2)' : 'none',
                  borderRadius: msg.role === 'user' ? '16px 16px 4px 16px' : '0',
                  color: 'var(--text-primary)', fontSize: '0.93rem',
                }}>
                  {msg.loading ? (
                    <div style={{ display: 'flex', gap: '4px', padding: '0.25rem 0' }}>
                      {[0, 1, 2].map(i => (
                        <span key={i} style={{
                          width: '6px', height: '6px', borderRadius: '50%', background: '#fbbf24',
                          animation: `bounce 1.2s ease-in-out ${i * 0.15}s infinite`,
                        }} />
                      ))}
                    </div>
                  ) : (
                    <div className="prose-tahir" dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.content) }} />
                  )}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input area */}
        <div style={{
          padding: '1rem', borderTop: '1px solid var(--border)',
          background: 'rgba(10,10,15,0.9)', backdropFilter: 'blur(10px)',
        }}>
          <div style={{ maxWidth: '760px', margin: '0 auto' }}>
            <div style={{
              display: 'flex', alignItems: 'flex-end', gap: '0.75rem',
              background: 'var(--bg-card)', border: '1px solid var(--border)',
              borderRadius: '16px', padding: '0.75rem 1rem',
              transition: 'border-color 0.2s, box-shadow 0.2s',
            }}
            onFocus={() => {}}
            >
              <textarea
                ref={textareaRef}
                value={input}
                onChange={autoResize}
                onKeyDown={handleKeyDown}
                placeholder="Message Tahir GPT… (Shift+Enter for new line)"
                rows={1}
                style={{
                  flex: 1, background: 'none', border: 'none', outline: 'none', resize: 'none',
                  color: 'var(--text-primary)', fontFamily: 'var(--font-body)', fontSize: '0.95rem',
                  lineHeight: 1.6, maxHeight: '200px', overflowY: 'auto',
                }}
              />
              <button
                onClick={sendMessage}
                disabled={loading || !input.trim()}
                style={{
                  width: '38px', height: '38px', borderRadius: '10px', flexShrink: 0,
                  background: loading || !input.trim() ? 'rgba(251,191,36,0.2)' : 'linear-gradient(135deg, #fbbf24, #d97706)',
                  border: 'none', cursor: loading || !input.trim() ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 0.15s', color: loading || !input.trim() ? 'rgba(251,191,36,0.4)' : '#000',
                  fontSize: '16px',
                }}
              >
                {loading ? '⋯' : '↑'}
              </button>
            </div>
            <p style={{ textAlign: 'center', fontSize: '0.72rem', color: 'rgba(136,136,170,0.4)', marginTop: '0.5rem' }}>
              Tahir GPT can make mistakes. Verify important information.
            </p>
          </div>
        </div>
      </main>

      <style>{`
        @keyframes bounce {
          0%, 80%, 100% { transform: scale(0); opacity: 0.5; }
          40% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}

// Simple markdown renderer
function renderMarkdown(text: string): string {
  return text
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/```(\w+)?\n([\s\S]*?)```/g, '<pre><code>$2</code></pre>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    .replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>')
    .replace(/^\d+\. (.+)$/gm, '<li>$1</li>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>')
    .replace(/^(?!<[hul]).+$/gm, '<p>$&</p>')
    .replace(/<p><\/p>/g, '')
    .replace(/<\/pre>\n<p>/g, '</pre>');
}
