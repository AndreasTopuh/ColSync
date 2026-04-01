import 'server-only';

import { SupabaseClient } from '@supabase/supabase-js';

const PLAN_LIMITS: Record<string, number> = {
  free: 0,
  starter5: 3,
  pro20: 6,
};

export interface CreditCheckResult {
  ok: boolean;
  error?: string;
  status?: number;
  tier?: string;
  creditsUsed?: number;
}

interface CreditLogContext {
  requestId?: string;
  route?: string;
}

function maskUserId(userId: string): string {
  if (!userId) return 'unknown';
  if (userId.length <= 8) return '***';
  return `${userId.slice(0, 4)}...${userId.slice(-4)}`;
}

function sanitizeErrorMessage(message: string | undefined): string {
  if (!message) return 'unknown';
  // Basic secret redaction in case provider returns sensitive data in errors.
  return message
    .replace(/(apikey|api_key|token|secret|authorization)\s*[:=]\s*[^\s,;]+/gi, '$1=[redacted]')
    .slice(0, 600);
}

function logCredit(level: 'info' | 'warn' | 'error', event: string, details: Record<string, unknown>) {
  const payload = {
    scope: 'credits',
    event,
    ts: new Date().toISOString(),
    ...details,
  };

  if (level === 'error') {
    console.error(payload);
    return;
  }

  if (level === 'warn') {
    console.warn(payload);
    return;
  }

  console.info(payload);
}

/**
 * Server-side credit check and consumption.
 * Uses an atomic Postgres-level update with a guard condition
 * to prevent race conditions between concurrent requests.
 *
 * The `.lt('credits_used', limit)` filter ensures the UPDATE
 * only succeeds if credits_used < limit at the exact moment
 * of the write (Postgres row-level lock), preventing two
 * concurrent requests from both consuming the last credit.
 */
export async function consumeServerCredit(
  supabase: SupabaseClient,
  userId: string,
  context: CreditLogContext = {},
): Promise<CreditCheckResult> {
  const maskedUserId = maskUserId(userId);

  // 1. Read subscription to get tier and current usage
  const { data: sub, error: readError } = await supabase
    .from('subscriptions')
    .select('tier, credits_used')
    .eq('user_id', userId)
    .maybeSingle();

  if (readError) {
    logCredit('error', 'consume.read_failed', {
      requestId: context.requestId,
      route: context.route,
      userId: maskedUserId,
      reason: sanitizeErrorMessage(readError.message),
    });
    return { ok: false, error: 'Failed to read subscription', status: 500 };
  }

  if (!sub || sub.tier === 'free') {
    logCredit('warn', 'consume.blocked_free', {
      requestId: context.requestId,
      route: context.route,
      userId: maskedUserId,
      tier: sub?.tier ?? 'none',
    });
    return { ok: false, error: 'Premium plan required to use this feature.', status: 403 };
  }

  const limit = PLAN_LIMITS[sub.tier] ?? 0;
  if (sub.credits_used >= limit) {
    logCredit('warn', 'consume.blocked_limit', {
      requestId: context.requestId,
      route: context.route,
      userId: maskedUserId,
      tier: sub.tier,
      creditsUsed: sub.credits_used,
      limit,
    });
    return { ok: false, error: 'No AI credits remaining. Upgrade your plan.', status: 403 };
  }

  // 2. Atomic increment: prefer RPC if available.
  //    If RPC fails for any reason (missing function, permissions, schema exposure),
  //    fallback to guarded UPDATE with .lt('credits_used', limit).
  const { data: updatedRows, error: updateError } = await supabase
    .rpc('consume_credit', {
      p_user_id: userId,
      p_limit: limit,
    });

  if (updateError) {
    logCredit('warn', 'consume.rpc_failed_fallback_update', {
      requestId: context.requestId,
      route: context.route,
      userId: maskedUserId,
      tier: sub.tier,
      creditsUsed: sub.credits_used,
      limit,
      rpcReason: sanitizeErrorMessage(updateError.message),
    });

    const { data: fallbackRows, error: fallbackError } = await supabase
      .from('subscriptions')
      .update({ credits_used: sub.credits_used + 1 })
      .eq('user_id', userId)
      .lt('credits_used', limit)
      .select('credits_used');

    if (fallbackError) {
      logCredit('error', 'consume.fallback_update_failed', {
        requestId: context.requestId,
        route: context.route,
        userId: maskedUserId,
        tier: sub.tier,
        creditsUsed: sub.credits_used,
        limit,
        reason: sanitizeErrorMessage(fallbackError.message),
      });
      return { ok: false, error: 'Failed to consume credit. Try again.', status: 500 };
    }

    // No updated rows means limit was reached at write-time (race-safe behavior).
    if (!fallbackRows || fallbackRows.length === 0) {
      logCredit('warn', 'consume.fallback_limit_hit', {
        requestId: context.requestId,
        route: context.route,
        userId: maskedUserId,
        tier: sub.tier,
        creditsUsed: sub.credits_used,
        limit,
      });
      return { ok: false, error: 'No AI credits remaining. Upgrade your plan.', status: 403 };
    }

    logCredit('info', 'consume.success_fallback', {
      requestId: context.requestId,
      route: context.route,
      userId: maskedUserId,
      tier: sub.tier,
      creditsUsedBefore: sub.credits_used,
      creditsUsedAfter: fallbackRows[0].credits_used,
      limit,
    });

    return { ok: true, tier: sub.tier, creditsUsed: fallbackRows[0].credits_used };
  }

  if (updateError || updatedRows === false) {
    logCredit('warn', 'consume.rpc_limit_or_failed', {
      requestId: context.requestId,
      route: context.route,
      userId: maskedUserId,
      tier: sub.tier,
      creditsUsed: sub.credits_used,
      limit,
    });
    return { ok: false, error: 'No AI credits remaining. Upgrade your plan.', status: 403 };
  }

  logCredit('info', 'consume.success_rpc', {
    requestId: context.requestId,
    route: context.route,
    userId: maskedUserId,
    tier: sub.tier,
    creditsUsedBefore: sub.credits_used,
    creditsUsedAfter: sub.credits_used + 1,
    limit,
  });

  return { ok: true, tier: sub.tier, creditsUsed: sub.credits_used + 1 };
}

/**
 * Refund one credit on failure (best-effort).
 * Uses atomic decrement to avoid race conditions.
 */
export async function refundServerCredit(
  supabase: SupabaseClient,
  userId: string,
  context: CreditLogContext = {},
): Promise<void> {
  const maskedUserId = maskUserId(userId);

  // Attempt RPC refund first
  const { error: rpcError } = await supabase.rpc('refund_credit', {
    p_user_id: userId,
  });

  // Fallback for any RPC failure
  if (rpcError) {
    logCredit('warn', 'refund.rpc_failed_fallback_update', {
      requestId: context.requestId,
      route: context.route,
      userId: maskedUserId,
      rpcReason: sanitizeErrorMessage(rpcError.message),
    });

    const { data: sub } = await supabase
      .from('subscriptions')
      .select('credits_used')
      .eq('user_id', userId)
      .maybeSingle();

    if (sub && sub.credits_used > 0) {
      const { error: fallbackError } = await supabase
        .from('subscriptions')
        .update({ credits_used: sub.credits_used - 1 })
        .eq('user_id', userId)
        .gt('credits_used', 0);

      if (fallbackError) {
        logCredit('error', 'refund.fallback_update_failed', {
          requestId: context.requestId,
          route: context.route,
          userId: maskedUserId,
          reason: sanitizeErrorMessage(fallbackError.message),
        });
        return;
      }

      logCredit('info', 'refund.success_fallback', {
        requestId: context.requestId,
        route: context.route,
        userId: maskedUserId,
        creditsUsedBefore: sub.credits_used,
        creditsUsedAfter: Math.max(0, sub.credits_used - 1),
      });
    }

    return;
  }

  logCredit('info', 'refund.success_rpc', {
    requestId: context.requestId,
    route: context.route,
    userId: maskedUserId,
  });
}

/**
 * SQL to create the RPC functions in Supabase SQL Editor:
 *
 * -- Atomic credit consumption (prevents race conditions)
 * CREATE OR REPLACE FUNCTION consume_credit(p_user_id uuid, p_limit int)
 * RETURNS boolean
 * LANGUAGE sql
 * SECURITY DEFINER
 * AS $$
 *   UPDATE subscriptions
 *   SET credits_used = credits_used + 1
 *   WHERE user_id = p_user_id AND credits_used < p_limit
 *   RETURNING true;
 * $$;
 *
 * -- Atomic credit refund
 * CREATE OR REPLACE FUNCTION refund_credit(p_user_id uuid)
 * RETURNS void
 * LANGUAGE sql
 * SECURITY DEFINER
 * AS $$
 *   UPDATE subscriptions
 *   SET credits_used = credits_used - 1
 *   WHERE user_id = p_user_id AND credits_used > 0;
 * $$;
 */
