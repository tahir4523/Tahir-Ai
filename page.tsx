'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';

export default function DashboardPage() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const supabase = createClientComponentClient();
  const router = useRouter();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('upgraded') === 'true') setSuccess(true);

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) { router.replace('/login'); return; }
      supabase.from('profiles').select('*').eq('id', session.user.id).single()
        .then(({ data }) => setProfile(data));
    });
  }, []);

  async function handleUpgrade() {
    setLoading(true);
    const res = await fetch('/api/stripe/checkout', { method: 'POST' });
    const data = await res.json();
    if (data.url) window.location.href = data.url;
    else setLoading(false);
  }

  if (!profile) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary)' }}>
      <div style={{ width: '40px', height: '40px', borderRadius: '50%', border: '2px solid rgba(251,191,36,0.3)', borderTopColor: '#fbbf24', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', padding: '2rem' }}>
      <div style={{ maxWidth: '720px', margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
          <button onClick={() => router.push('/chat')} style={{
            background: 'none', border: '1px solid var(--border)', borderRadius: '8px',
            padding: '0.4rem 0.8rem', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.85rem',
          }}>← Back to Chat</button>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', color: 'var(--text-primary)' }}>Account</h1>
        </div>

        {success && (
          <div style={{
            padding: '1rem 1.25rem', borderRadius: '12px', marginBottom: '1.5rem',
            background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.25)', color: '#4ade80',
          }}>
            🎉 Welcome to Pro! Full access is now unlocked.
          </div>
        )}

        {/* Plan card */}
        <div className="card" style={{ padding: '1.75rem', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
            <div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.25rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Current Plan</p>
              <h2 style={{ fontSize: '1.75rem', fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>
                {profile.plan === 'pro' ? '✦ Pro' : 'Free'}
              </h2>
            </div>
            {profile.plan === 'pro' ? (
              <div style={{
                padding: '0.4rem 1rem', borderRadius: '20px',
                background: 'rgba(251,191,36,0.15)', border: '1px solid rgba(251,191,36,0.3)', color: '#fbbf24', fontSize: '0.85rem', fontWeight: 600,
              }}>Active</div>
            ) : (
              <button onClick={handleUpgrade} disabled={loading} className="btn-primary" style={{ opacity: loading ? 0.7 : 1 }}>
                {loading ? 'Redirecting…' : '⚡ Upgrade to Pro'}
              </button>
            )}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            {[
              { label: 'Messages Used', value: profile.usage_count ?? 0 },
              { label: 'Plan', value: profile.plan === 'pro' ? 'Pro' : 'Free' },
            ].map(({ label, value }) => (
              <div key={label} style={{ padding: '0.875rem', borderRadius: '10px', background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.3rem' }}>{label}</p>
                <p style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-primary)' }}>{value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Comparison table */}
        <div className="card" style={{ padding: '1.75rem' }}>
          <h3 style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '1.25rem' }}>Plan Comparison</h3>
          {[
            { feature: 'AI Chat (Nano Mode)', free: true, pro: true },
            { feature: 'AI Chat (Pro Mode)', free: false, pro: true },
            { feature: 'Image Generation', free: false, pro: true },
            { feature: 'Build Mode', free: '3/day', pro: 'Unlimited' },
            { feature: 'Conversation History', free: '7 days', pro: 'Forever' },
            { feature: 'Messages per hour', free: '10', pro: '100' },
            { feature: 'Priority support', free: false, pro: true },
          ].map(({ feature, free, pro }) => (
            <div key={feature} style={{
              display: 'flex', alignItems: 'center', padding: '0.625rem 0',
              borderBottom: '1px solid var(--border)',
            }}>
              <span style={{ flex: 1, fontSize: '0.88rem', color: 'var(--text-secondary)' }}>{feature}</span>
              <span style={{ width: '80px', textAlign: 'center', fontSize: '0.85rem', color: typeof free === 'boolean' ? (free ? '#4ade80' : 'rgba(136,136,170,0.4)') : '#fbbf24' }}>
                {typeof free === 'boolean' ? (free ? '✓' : '—') : free}
              </span>
              <span style={{ width: '80px', textAlign: 'center', fontSize: '0.85rem', color: typeof pro === 'boolean' ? (pro ? '#4ade80' : 'rgba(136,136,170,0.4)') : '#fbbf24' }}>
                {typeof pro === 'boolean' ? (pro ? '✓' : '—') : pro}
              </span>
            </div>
          ))}
          <div style={{ display: 'flex', marginTop: '0.5rem' }}>
            <span style={{ flex: 1 }} />
            <span style={{ width: '80px', textAlign: 'center', fontSize: '0.75rem', color: 'rgba(136,136,170,0.5)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Free</span>
            <span style={{ width: '80px', textAlign: 'center', fontSize: '0.75rem', color: '#fbbf24', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Pro</span>
          </div>
        </div>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
