'use client';

import { useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';

type Step = 'email' | 'otp' | 'loading';

export default function LoginPage() {
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const supabase = createClientComponentClient();
  const router = useRouter();

  async function handleSendOTP() {
    if (!email || !email.includes('@')) { setError('Please enter a valid email'); return; }
    setLoading(true); setError('');
    const { error } = await supabase.auth.signInWithOtp({ email });
    setLoading(false);
    if (error) setError(error.message);
    else setStep('otp');
  }

  async function handleVerifyOTP() {
    if (otp.length < 6) { setError('Enter the 6-digit code'); return; }
    setLoading(true); setError('');
    const { error } = await supabase.auth.verifyOtp({ email, token: otp, type: 'email' });
    setLoading(false);
    if (error) setError('Invalid or expired code');
    else { setStep('loading'); router.replace('/chat'); }
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '1rem', background: 'var(--bg-primary)', position: 'relative', overflow: 'hidden',
    }}>
      {/* Ambient glow */}
      <div style={{
        position: 'absolute', top: '15%', left: '50%', transform: 'translateX(-50%)',
        width: '700px', height: '700px', borderRadius: '50%', pointerEvents: 'none',
        background: 'radial-gradient(circle, rgba(251,191,36,0.07) 0%, transparent 65%)',
      }} />

      <div style={{ width: '100%', maxWidth: '420px', position: 'relative', zIndex: 1 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: '68px', height: '68px', borderRadius: '22px',
            background: 'linear-gradient(135deg, #fbbf24 0%, #d97706 100%)',
            marginBottom: '1.25rem', boxShadow: '0 0 50px rgba(251,191,36,0.35)',
          }}>
            <span style={{ fontSize: '30px', fontWeight: 900, color: '#000', fontFamily: 'var(--font-display)' }}>T</span>
          </div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2.2rem', fontWeight: 700, color: '#f8f8f8', marginBottom: '0.5rem' }}>
            Tahir <span style={{ background: 'linear-gradient(135deg, #fbbf24, #d97706)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>GPT</span>
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Intelligence redefined</p>
        </div>

        {/* Card */}
        <div style={{
          background: 'var(--bg-card)', border: '1px solid var(--border)',
          borderRadius: '20px', padding: '2rem',
          boxShadow: '0 30px 60px rgba(0,0,0,0.6)',
        }}>
          {step === 'loading' ? (
            <div style={{ textAlign: 'center', padding: '2rem 0' }}>
              <div style={{
                width: '44px', height: '44px', borderRadius: '50%',
                border: '2px solid rgba(251,191,36,0.2)', borderTopColor: '#fbbf24',
                animation: 'spin 0.8s linear infinite', margin: '0 auto 1rem',
              }} />
              <p style={{ color: 'var(--text-secondary)' }}>Signing you in…</p>
            </div>
          ) : step === 'email' ? (
            <>
              <h2 style={{ fontSize: '1.05rem', fontWeight: 600, marginBottom: '1.25rem', color: 'var(--text-primary)' }}>Enter your email</h2>
              <input type="email" placeholder="you@example.com" value={email}
                onChange={e => { setEmail(e.target.value); setError(''); }}
                onKeyDown={e => e.key === 'Enter' && handleSendOTP()}
                className="input-field" style={{ padding: '0.75rem 1rem', fontSize: '1rem', marginBottom: '0.75rem' }}
              />
              {error && <p style={{ color: '#f87171', fontSize: '0.83rem', marginBottom: '0.75rem' }}>{error}</p>}
              <button onClick={handleSendOTP} disabled={loading} className="btn-primary"
                style={{ width: '100%', fontSize: '0.95rem', opacity: loading ? 0.7 : 1 }}>
                {loading ? 'Sending…' : 'Send Login Code →'}
              </button>
              <p style={{ textAlign: 'center', fontSize: '0.78rem', color: 'rgba(136,136,170,0.6)', marginTop: '1rem' }}>
                No password. We send a one-time code to your email.
              </p>
            </>
          ) : (
            <>
              <div style={{ marginBottom: '1.25rem' }}>
                <h2 style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.3rem' }}>Check your email</h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                  Code sent to <span style={{ color: '#fbbf24', fontWeight: 500 }}>{email}</span>
                </p>
              </div>
              <input type="text" placeholder="000000" value={otp} maxLength={6}
                onChange={e => { setOtp(e.target.value.replace(/\D/g, '')); setError(''); }}
                onKeyDown={e => e.key === 'Enter' && handleVerifyOTP()}
                className="input-field" autoFocus
                style={{
                  padding: '0.875rem 1rem', fontSize: '1.75rem', textAlign: 'center',
                  letterSpacing: '0.6rem', fontFamily: 'var(--font-mono)', marginBottom: '0.75rem',
                }}
              />
              {error && <p style={{ color: '#f87171', fontSize: '0.83rem', marginBottom: '0.75rem' }}>{error}</p>}
              <button onClick={handleVerifyOTP} disabled={loading} className="btn-primary"
                style={{ width: '100%', fontSize: '0.95rem', opacity: loading ? 0.7 : 1, marginBottom: '0.5rem' }}>
                {loading ? 'Verifying…' : 'Verify & Sign In'}
              </button>
              <button onClick={() => { setStep('email'); setOtp(''); setError(''); }} className="btn-ghost"
                style={{ width: '100%', fontSize: '0.85rem' }}>
                ← Use different email
              </button>
            </>
          )}
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
