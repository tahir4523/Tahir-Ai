// app/auth/page.tsx
'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter, useSearchParams } from 'next/navigation';

export default function AuthPage() {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'email' | 'otp'>('email');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const supabase = createClient();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirectTo') || '/chat';

  async function sendOTP() {
    if (!email) return;
    setLoading(true);
    setError('');

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: true,
      },
    });

    if (error) {
      setError(error.message);
    } else {
      setMessage(`Code sent to ${email}`);
      setStep('otp');
    }
    setLoading(false);
  }

  async function verifyOTP() {
    if (!otp) return;
    setLoading(true);
    setError('');

    const { error } = await supabase.auth.verifyOtp({
      email,
      token: otp,
      type: 'email',
    });

    if (error) {
      setError('Invalid or expired code. Please try again.');
    } else {
      router.push(redirectTo);
      router.refresh();
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-surface-base flex flex-col items-center justify-center px-4">
      {/* Background glow */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-brand-500/5 blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-400 to-brand-600 text-white font-bold text-2xl mb-4">
            T
          </div>
          <h1 className="text-2xl font-bold text-white">Tahir GPT</h1>
          <p className="text-slate-400 mt-1 text-sm">Sign in to start chatting</p>
        </div>

        <div className="bg-surface-elevated border border-surface-border rounded-2xl p-8">
          {step === 'email' ? (
            <div className="animate-fade-in">
              <h2 className="text-lg font-semibold text-white mb-6">Enter your email</h2>
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && sendOTP()}
                className="w-full bg-surface-overlay border border-surface-border rounded-xl px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:border-brand-500/70 transition-colors mb-4"
                autoFocus
              />
              {error && <p className="text-red-400 text-sm mb-4">{error}</p>}
              <button
                onClick={sendOTP}
                disabled={loading || !email}
                className="w-full bg-brand-500 hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed text-white py-3 rounded-xl font-semibold transition-colors"
              >
                {loading ? 'Sending...' : 'Continue with email →'}
              </button>
              <p className="text-slate-500 text-xs text-center mt-4">
                We&apos;ll send a 6-digit code to your email. No password needed.
              </p>
            </div>
          ) : (
            <div className="animate-fade-in">
              <button
                onClick={() => { setStep('email'); setError(''); setOtp(''); }}
                className="text-slate-400 hover:text-white text-sm mb-4 flex items-center gap-1 transition-colors"
              >
                ← Back
              </button>
              <h2 className="text-lg font-semibold text-white mb-2">Check your email</h2>
              <p className="text-slate-400 text-sm mb-6">{message}</p>
              <input
                type="text"
                placeholder="000000"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                onKeyDown={(e) => e.key === 'Enter' && verifyOTP()}
                className="w-full bg-surface-overlay border border-surface-border rounded-xl px-4 py-3 text-white text-center text-2xl tracking-widest placeholder:text-slate-500 focus:outline-none focus:border-brand-500/70 transition-colors mb-4 font-mono"
                autoFocus
                maxLength={6}
              />
              {error && <p className="text-red-400 text-sm mb-4">{error}</p>}
              <button
                onClick={verifyOTP}
                disabled={loading || otp.length < 6}
                className="w-full bg-brand-500 hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed text-white py-3 rounded-xl font-semibold transition-colors"
              >
                {loading ? 'Verifying...' : 'Verify code'}
              </button>
              <button
                onClick={sendOTP}
                className="w-full text-slate-400 hover:text-white text-sm mt-3 transition-colors"
              >
                Resend code
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
