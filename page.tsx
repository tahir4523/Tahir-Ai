'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

interface BuildFile { path: string; language: string; content: string; description: string; }
interface BuildStep { step: number; title: string; description: string; duration: string; }
interface BuildResult {
  title: string; description: string; steps: BuildStep[];
  folderStructure: string; files: BuildFile[];
  techStack: string[]; deployInstructions: string;
  envVariables: { key: string; description: string; required: boolean }[];
}

export default function BuildPage() {
  const [prompt, setPrompt] = useState('');
  const [result, setResult] = useState<BuildResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'overview' | 'files' | 'deploy'>('overview');
  const [activeFile, setActiveFile] = useState<number>(0);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const p = searchParams.get('prompt');
    if (p) { setPrompt(p); }
  }, []);

  async function build() {
    if (!prompt.trim()) return;
    setLoading(true); setError(''); setResult(null);
    try {
      const res = await fetch('/api/build', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Build failed');
      setResult(data);
      setActiveTab('overview');
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
  }

  const Tab = ({ id, label }: { id: typeof activeTab; label: string }) => (
    <button
      onClick={() => setActiveTab(id)}
      style={{
        padding: '0.5rem 1rem', borderRadius: '8px', fontSize: '0.85rem', cursor: 'pointer',
        background: activeTab === id ? 'rgba(251,191,36,0.15)' : 'transparent',
        border: activeTab === id ? '1px solid rgba(251,191,36,0.3)' : '1px solid transparent',
        color: activeTab === id ? '#fbbf24' : 'var(--text-secondary)',
        fontWeight: activeTab === id ? 600 : 400,
        transition: 'all 0.15s',
      }}
    >{label}</button>
  );

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', padding: '1.5rem' }}>
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
          <button onClick={() => router.back()} style={{
            background: 'none', border: '1px solid var(--border)', borderRadius: '8px',
            padding: '0.4rem 0.8rem', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.85rem',
          }}>← Back</button>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', color: 'var(--text-primary)' }}>
            🔧 Build Mode
          </h1>
        </div>

        {/* Prompt input */}
        <div className="card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
          <textarea
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            placeholder='Describe what to build… e.g. "Build me a SaaS app for project management with Next.js"'
            rows={3}
            style={{
              width: '100%', background: 'none', border: 'none', outline: 'none', resize: 'none',
              color: 'var(--text-primary)', fontFamily: 'var(--font-body)', fontSize: '0.95rem',
              lineHeight: 1.6, marginBottom: '1rem',
            }}
          />
          <button onClick={build} disabled={loading || !prompt.trim()} className="btn-primary"
            style={{ opacity: loading || !prompt.trim() ? 0.6 : 1 }}>
            {loading ? '⚙️ Building…' : '🔧 Build It'}
          </button>
        </div>

        {/* Loading */}
        {loading && (
          <div className="card" style={{ padding: '3rem', textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', marginBottom: '1rem', animation: 'spin 2s linear infinite', display: 'inline-block' }}>⚙️</div>
            <h3 style={{ color: 'var(--text-primary)', marginBottom: '0.5rem' }}>Building your project…</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Generating code, structure, and deployment guide</p>
          </div>
        )}

        {error && (
          <div style={{
            padding: '1rem', borderRadius: '12px', marginBottom: '1rem',
            background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.25)', color: '#f87171',
          }}>⚠️ {error}</div>
        )}

        {/* Result */}
        {result && !loading && (
          <div>
            {/* Project header */}
            <div className="card" style={{ padding: '1.5rem', marginBottom: '1rem' }}>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                {result.title}
              </h2>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>{result.description}</p>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {result.techStack?.map(t => (
                  <span key={t} style={{
                    padding: '0.2rem 0.6rem', borderRadius: '20px', fontSize: '0.75rem',
                    background: 'rgba(56,189,248,0.1)', border: '1px solid rgba(56,189,248,0.2)', color: '#38bdf8',
                  }}>{t}</span>
                ))}
              </div>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '1rem' }}>
              <Tab id="overview" label="📋 Overview" />
              <Tab id="files" label={`📁 Files (${result.files?.length ?? 0})`} />
              <Tab id="deploy" label="🚀 Deploy" />
            </div>

            {activeTab === 'overview' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                {/* Steps */}
                <div className="card" style={{ padding: '1.5rem' }}>
                  <h3 style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '1rem' }}>Build Steps</h3>
                  {result.steps?.map(s => (
                    <div key={s.step} style={{
                      display: 'flex', gap: '0.75rem', marginBottom: '1rem', alignItems: 'flex-start',
                    }}>
                      <div style={{
                        width: '28px', height: '28px', borderRadius: '50%', flexShrink: 0,
                        background: 'linear-gradient(135deg, #fbbf24, #d97706)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '0.75rem', fontWeight: 700, color: '#000',
                      }}>{s.step}</div>
                      <div>
                        <p style={{ fontWeight: 500, color: 'var(--text-primary)', fontSize: '0.88rem' }}>{s.title}</p>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>{s.description}</p>
                        <p style={{ color: 'rgba(136,136,170,0.5)', fontSize: '0.75rem', marginTop: '0.2rem' }}>⏱ {s.duration}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Folder structure */}
                <div className="card" style={{ padding: '1.5rem' }}>
                  <h3 style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '1rem' }}>Folder Structure</h3>
                  <pre style={{ fontSize: '0.78rem', lineHeight: 1.6, color: '#38bdf8', overflowX: 'auto' }}>
                    {result.folderStructure}
                  </pre>
                  {result.envVariables?.length > 0 && (
                    <>
                      <h3 style={{ fontWeight: 600, color: 'var(--text-primary)', margin: '1.25rem 0 0.75rem' }}>Environment Variables</h3>
                      {result.envVariables.map(e => (
                        <div key={e.key} style={{
                          marginBottom: '0.5rem', padding: '0.4rem 0.6rem', borderRadius: '8px',
                          background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)',
                        }}>
                          <code style={{ color: '#fbbf24', fontSize: '0.78rem' }}>{e.key}</code>
                          {e.required && <span style={{ color: '#f87171', fontSize: '0.7rem', marginLeft: '0.4rem' }}>*required</span>}
                          <p style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', marginTop: '0.1rem' }}>{e.description}</p>
                        </div>
                      ))}
                    </>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'files' && (
              <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: '1rem', minHeight: '400px' }}>
                {/* File list */}
                <div className="card" style={{ padding: '0.75rem', overflowY: 'auto' }}>
                  {result.files?.map((f, i) => (
                    <button key={i} onClick={() => setActiveFile(i)} style={{
                      width: '100%', textAlign: 'left', padding: '0.6rem 0.75rem', borderRadius: '8px',
                      cursor: 'pointer', marginBottom: '0.2rem', transition: 'background 0.15s',
                      background: activeFile === i ? 'rgba(251,191,36,0.1)' : 'transparent',
                      border: activeFile === i ? '1px solid rgba(251,191,36,0.2)' : '1px solid transparent',
                    }}>
                      <p style={{ fontSize: '0.78rem', color: activeFile === i ? '#fbbf24' : 'var(--text-secondary)', fontFamily: 'var(--font-mono)', wordBreak: 'break-all' }}>
                        {f.path}
                      </p>
                    </button>
                  ))}
                </div>

                {/* File content */}
                <div className="card" style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                  {result.files?.[activeFile] && (
                    <>
                      <div style={{ padding: '0.875rem 1rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <code style={{ fontSize: '0.83rem', color: '#fbbf24' }}>{result.files[activeFile].path}</code>
                          <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.1rem' }}>{result.files[activeFile].description}</p>
                        </div>
                        <button onClick={() => copyToClipboard(result.files[activeFile].content)} style={{
                          padding: '0.3rem 0.75rem', borderRadius: '6px', fontSize: '0.78rem',
                          background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)',
                          color: 'var(--text-secondary)', cursor: 'pointer',
                        }}>Copy</button>
                      </div>
                      <div style={{ flex: 1, overflowY: 'auto', padding: '1rem' }}>
                        <pre style={{ fontSize: '0.8rem', lineHeight: 1.65, color: '#d4d4e8', margin: 0, background: 'none', border: 'none', padding: 0 }}>
                          {result.files[activeFile].content}
                        </pre>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'deploy' && (
              <div className="card" style={{ padding: '1.5rem' }}>
                <h3 style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '1rem' }}>🚀 Deployment Instructions</h3>
                <div className="prose-tahir" dangerouslySetInnerHTML={{ __html: result.deployInstructions?.replace(/\n/g, '<br/>') ?? '' }} />
              </div>
            )}
          </div>
        )}
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
