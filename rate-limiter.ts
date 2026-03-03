/**
 * Simple in-memory rate limiter for API routes.
 * In production, use Redis via Upstash for distributed rate limiting.
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

const LIMITS = {
  free: { requests: 10, windowMs: 60 * 60 * 1000 },  // 10/hour
  pro:  { requests: 100, windowMs: 60 * 60 * 1000 },  // 100/hour
};

export function checkRateLimit(
  userId: string,
  plan: 'free' | 'pro' = 'free'
): { allowed: boolean; remaining: number; resetAt: number } {
  const limit = LIMITS[plan];
  const now = Date.now();
  const entry = store.get(userId);

  if (!entry || now > entry.resetAt) {
    store.set(userId, { count: 1, resetAt: now + limit.windowMs });
    return { allowed: true, remaining: limit.requests - 1, resetAt: now + limit.windowMs };
  }

  if (entry.count >= limit.requests) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt };
  }

  entry.count++;
  return { allowed: true, remaining: limit.requests - entry.count, resetAt: entry.resetAt };
}
