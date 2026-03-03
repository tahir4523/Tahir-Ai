// app/settings/page.tsx
'use client';

import { useState, useEffect } from 'react';
import ChatSidebar from '@/components/chat/ChatSidebar';
import { createClient } from '@/lib/supabase/client';
import { loadStripe } from '@stripe/stripe-js';

export default function SettingsPage() {
  const [tier, setTier] = useState('free');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.email) setEmail(user.email);

      const { data: profile } = await supabase
        .from('profiles')
        .select('tier')
        .eq('id', user?.id)
        .single();

      if (profile?.tier) setTier(profile.tier);
    }
    load();
  }, []);

  async function handleUpgrade() {
    setLoading(true);
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      const { url, error } = await res.json();
      if (error) throw new Error(error);
      if (url) window.location.href = url;
    } catch (err) {
      alert('Checkout failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex h-screen bg-surface-base overflow-hidden">
      <ChatSidebar />
      <main className="flex-1 overflow-y-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-2xl font-bold text-white mb-8">Settings</h1>

          {/* Account */}
          <section className="bg-surface-elevated border border-surface-border rounded-2xl p-6 mb-6">
            <h2 className="text-white font-semibold mb-4">Account</h2>
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Email</span>
                <span className="text-white">{email}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Plan</span>
                <span className={`font-medium ${tier === 'pro' ? 'text-brand-400' : 'text-white'}`}>
                  {tier === 'pro' ? '⭐ Pro' : '🆓 Free'}
                </span>
              </div>
            </div>
          </section>

          {/* Subscription */}
          <section className="bg-surface-elevated border border-surface-border rounded-2xl p-6 mb-6">
            <h2 className="text-white font-semibold mb-4">Subscription</h2>
            {tier === 'pro' ? (
              <div>
                <div className="flex items-center gap-2 text-green-400 mb-4 text-sm">
                  <span>✓</span>
                  <span>You&apos;re on the Pro plan</span>
                </div>
                <p className="text-slate-400 text-sm">
                  Manage your subscription through the billing portal.
                </p>
              </div>
            ) : (
              <div>
                <p className="text-slate-400 text-sm mb-4">
                  Upgrade to Pro for 500 messages/day, 100 images/month, and priority access.
                </p>
                <button
                  onClick={handleUpgrade}
                  disabled={loading}
                  className="bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white px-6 py-2.5 rounded-xl font-medium text-sm transition-colors flex items-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Loading...
                    </>
                  ) : (
                    '⭐ Upgrade to Pro — $9/month'
                  )}
                </button>
              </div>
            )}
          </section>

          {/* Danger zone */}
          <section className="bg-surface-elevated border border-red-500/20 rounded-2xl p-6">
            <h2 className="text-white font-semibold mb-4">Account Actions</h2>
            <button
              onClick={async () => {
                if (confirm('Are you sure you want to delete all your chat history?')) {
                  const supabase = createClient();
                  const { data: { user } } = await supabase.auth.getUser();
                  await supabase.from('conversations').delete().eq('user_id', user?.id);
                  alert('Chat history deleted.');
                }
              }}
              className="text-red-400 hover:text-red-300 border border-red-500/30 hover:border-red-500/50 px-4 py-2 rounded-xl text-sm transition-colors"
            >
              Delete all chat history
            </button>
          </section>
        </div>
      </main>
    </div>
  );
}
