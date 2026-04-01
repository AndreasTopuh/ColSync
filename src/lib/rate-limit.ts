import { NextRequest } from 'next/server';

/**
 * Lightweight sliding-window rate limiter backed by an in-memory Map.
 *
 * LIMITATIONS ON SERVERLESS (Vercel):
 * - Each cold start gets a fresh empty map, so limits may reset between
 *   instances. This provides "best-effort" protection, NOT a hard guarantee.
 *
 * For stronger guarantees, swap with Upstash @upstash/ratelimit:
 *   npm i @upstash/ratelimit @upstash/redis
 *   Then set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN in .env.local.
 *
 * The current implementation still provides value:
 * - Within a warm instance (hot path), limits are enforced.
 * - Prevents obvious abuse from a single user hammering one instance.
 */

interface RateLimitTracker {
  count: number;
  resetTime: number;
}

const rateLimitCache = new Map<string, RateLimitTracker>();

// Purge stale entries every 5 minutes to prevent unbounded growth
if (typeof globalThis !== 'undefined') {
  const CLEANUP_INTERVAL = 5 * 60 * 1000;
  const existing = (globalThis as Record<string, unknown>).__rateLimitCleanup;
  if (!existing) {
    const timer = setInterval(() => {
      const now = Date.now();
      for (const [key, value] of rateLimitCache.entries()) {
        if (now > value.resetTime) {
          rateLimitCache.delete(key);
        }
      }
    }, CLEANUP_INTERVAL);
    // Prevent the timer from keeping the process alive if it shutdowns
    if (typeof timer === 'object' && 'unref' in timer) {
      (timer as NodeJS.Timeout).unref();
    }
    (globalThis as Record<string, unknown>).__rateLimitCleanup = true;
  }
}

export interface RateLimitOptions {
  limit: number;     // max requests
  windowMs: number;  // time window in ms
  identifier?: string; // custom identifier (overrides IP)
}

/**
 * Extract client IP from request headers.
 * On Vercel, x-forwarded-for is the canonical source.
 */
function getClientIp(req: NextRequest): string {
  // x-forwarded-for can contain multiple IPs: client, proxy1, proxy2
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) {
    const first = forwarded.split(',')[0]?.trim();
    if (first) return first;
  }

  return req.headers.get('x-real-ip') || '127.0.0.1';
}

export function checkRateLimit(
  req: NextRequest,
  action: string,
  options: RateLimitOptions,
): { ok: boolean; remaining: number; resetTime: number } {
  const identifier = options.identifier || getClientIp(req);
  const key = `ratelimit:${action}:${identifier}`;

  const now = Date.now();
  const tracker = rateLimitCache.get(key) || { count: 0, resetTime: now + options.windowMs };

  // If window expired, reset
  if (now > tracker.resetTime) {
    tracker.count = 0;
    tracker.resetTime = now + options.windowMs;
  }

  tracker.count++;
  rateLimitCache.set(key, tracker);

  return {
    ok: tracker.count <= options.limit,
    remaining: Math.max(0, options.limit - tracker.count),
    resetTime: tracker.resetTime,
  };
}
