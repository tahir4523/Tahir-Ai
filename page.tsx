'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function ImagePage() {
  const [prompt, setPrompt] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [revisedPrompt, setRevisedPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [size, setSize] = useState('1024x1024');
  const router = useRouter();

  async function generate() {
    if (!prompt.trim()) return;
    setLoading(true); setError(''); setImageUrl(''); setRevisedPrompt('');

    try {
      const res = await fetch('/api/image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, size }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      setImageUrl(data.imageUrl);
      setRevisedPrompt(data.revisedPrompt ?? '');
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function downloadImage() {
    if (!imageUrl) return;
    const a = document.createElement('a');
    a.href = imageUrl;
    a.download = 'tahir-gpt-image.png';
    a.target = '_blank';
    a.click();
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', padding: '1.5rem' }}>
      <div style={{ maxWidth: '720px', margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
          <button onClick={() => router.back()} style={{
            background: 'none', border: '1px solid var(--border)', borderRadius: '8px',
            padding: '0.4rem 0.8rem', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.85rem',
          }}>← Back</button>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', color: 'var(--text-primary)' }}>
            Image Generation
          </h1>
          <span className="badge-pro">Pro</span>
        </div>

        {/* Input */}
        <div className="card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
          <textarea
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            placeholder="Describe the image you want to create…"
            rows={3}
            style={{
              width: '100%', background: 'none', border: 'none', outline: 'none', resize: 'none',
              color: 'var(--text-primary)', fontFamily: 'var(--font-body)', fontSize: '0.95rem',
              lineHeight: 1.6, marginBottom: '1rem',
            }}
          />
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <select
              value={size}
              onChange={e => setSize(e.target.value)}
              style={{
                background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '8px',
                color: 'var(--text-primary)', padding: '0.4rem 0.75rem', fontSize: '0.83rem', cursor: 'pointer',
              }}
            >
              <option value="1024x1024">Square (1024×1024)</option>
              <option value="1792x1024">Wide (1792×1024)</option>
              <option value="1024x1792">Portrait (1024×1792)</option>
            </select>
            <button onClick={generate} disabled={loading || !prompt.trim()} className="btn-primary"
              style={{ opacity: loading || !prompt.trim() ? 0.6 : 1 }}>
              {loading ? 'Generating…' : '🎨 Generate'}
            </button>
          </div>
        </div>

        {/* Loading state */}
        {loading && (
          <div className="card" style={{ padding: '3rem', textAlign: 'center' }}>
            <div style={{
              width: '60px', height: '60px', borderRadius: '50%', margin: '0 auto 1rem',
              border: '3px solid rgba(251,191,36,0.2)', borderTopColor: '#fbbf24',
              animation: 'spin 1s linear infinite',
            }} />
            <p style={{ color: 'var(--text-secondary)' }}>Creating your image…</p>
            <p style={{ color: 'rgba(136,136,170,0.5)', fontSize: '0.8rem', marginTop: '0.25rem' }}>This takes ~10 seconds</p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div style={{
            padding: '1rem', borderRadius: '12px', marginBottom: '1rem',
            background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.25)',
            color: '#f87171', fontSize: '0.9rem',
          }}>
            ⚠️ {error}
          </div>
        )}

        {/* Result */}
        {imageUrl && !loading && (
          <div className="card" style={{ overflow: 'hidden' }}>
            <img src={imageUrl} alt={prompt} style={{ width: '100%', display: 'block' }} />
            <div style={{ padding: '1rem' }}>
              {revisedPrompt && (
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '1rem', fontStyle: 'italic' }}>
                  Revised: {revisedPrompt}
                </p>
              )}
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button onClick={downloadImage} className="btn-primary" style={{ fontSize: '0.85rem' }}>
                  ↓ Download
                </button>
                <button onClick={generate} className="btn-ghost" style={{ fontSize: '0.85rem' }}>
                  ↺ Regenerate
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
