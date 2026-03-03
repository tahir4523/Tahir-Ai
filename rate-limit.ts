// lib/rate-limit.ts
import { createAdminClient } from '@/lib/supabase/server';

export interface UsageCheck {
  allowed: boolean;
  remaining: number;
  limit: number;
  resetAt: string;
}

const FREE_DAILY_MESSAGES = parseInt(process.env.FREE_TIER_DAILY_MESSAGES || '20');
const PRO_DAILY_MESSAGES = parseInt(process.env.PRO_TIER_DAILY_MESSAGES || '500');
const FREE_MONTHLY_IMAGES = parseInt(process.env.FREE_TIER_MONTHLY_IMAGES || '5');
const PRO_MONTHLY_IMAGES = parseInt(process.env.PRO_TIER_MONTHLY_IMAGES || '100');

export async function checkAndIncrementUsage(
  userId: string,
  type: 'message' | 'image'
): Promise<UsageCheck> {
  const supabase = createAdminClient();
  const today = new Date().toISOString().split('T')[0];
  const month = today.substring(0, 7);

  // Get user tier
  const { data: profile } = await supabase
    .from('profiles')
    .select('tier')
    .eq('id', userId)
    .single();

  const tier = profile?.tier || 'free';
  const isPro = tier === 'pro';

  const limit = type === 'message'
    ? (isPro ? PRO_DAILY_MESSAGES : FREE_DAILY_MESSAGES)
    : (isPro ? PRO_MONTHLY_IMAGES : FREE_MONTHLY_IMAGES);

  const period = type === 'message' ? today : month;
  const usageKey = `${userId}:${type}:${period}`;

  // Check/create usage record
  const { data: usage } = await supabase
    .from('usage_tracking')
    .select('count')
    .eq('usage_key', usageKey)
    .single();

  const currentCount = usage?.count || 0;

  if (currentCount >= limit) {
    const resetAt = type === 'message'
      ? new Date(Date.now() + 86400000).toISOString()
      : new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1).toISOString();

    return {
      allowed: false,
      remaining: 0,
      limit,
      resetAt,
    };
  }

  // Increment
  await supabase
    .from('usage_tracking')
    .upsert({
      usage_key: usageKey,
      user_id: userId,
      type,
      period,
      count: currentCount + 1,
      updated_at: new Date().toISOString(),
    });

  return {
    allowed: true,
    remaining: limit - currentCount - 1,
    limit,
    resetAt: type === 'message'
      ? new Date(Date.now() + 86400000).toISOString()
      : new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1).toISOString(),
  };
}
