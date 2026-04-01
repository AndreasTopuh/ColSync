import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { checkRateLimit } from '@/lib/rate-limit';
import { PlanTier } from '@/lib/storage';
import { hashPremiumCode } from '@/lib/hash-code';
import { getBearerToken } from '@/lib/supabase/auth-guard';

export async function POST(req: NextRequest) {
  // Rate limiting: 5 requests per minute per IP
  const rateLimit = checkRateLimit(req, 'redeem', { limit: 5, windowMs: 60 * 1000 });
  if (!rateLimit.ok) {
    return NextResponse.json({ error: 'Too many requests. Please try again later.' }, { status: 429 });
  }

  try {
    const token = getBearerToken(req);
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = (await req.json().catch(() => null)) as { code?: string } | null;
    const code = body?.code?.trim().toUpperCase();
    if (!code) {
      return NextResponse.json({ error: 'Code is required' }, { status: 400 });
    }

    const supabase = createSupabaseAdminClient();
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userData.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = userData.user;
    const { data: codeRow, error: codeError } = await supabase
      .from('premium_codes')
      .select('id, tier, max_uses, used_count, expires_at')
      .eq('code_hash', hashPremiumCode(code))
      .maybeSingle();

    if (codeError) {
      return NextResponse.json({ error: 'Failed to validate code' }, { status: 500 });
    }

    if (!codeRow) {
      return NextResponse.json({ error: 'Invalid premium code' }, { status: 400 });
    }

    if (codeRow.expires_at && new Date(codeRow.expires_at).getTime() < Date.now()) {
      return NextResponse.json({ error: 'This code has expired' }, { status: 400 });
    }

    if (codeRow.used_count >= codeRow.max_uses) {
      return NextResponse.json({ error: 'This code has reached its usage limit' }, { status: 400 });
    }

    const { data: existingRedemption, error: redemptionReadError } = await supabase
      .from('premium_code_redemptions')
      .select('id')
      .eq('user_id', user.id)
      .eq('premium_code_id', codeRow.id)
      .maybeSingle();

    if (redemptionReadError) {
      return NextResponse.json({ error: 'Failed to validate redemption' }, { status: 500 });
    }

    if (!existingRedemption) {
      // Atomic increment with guard to prevent race conditions
      const { data: updatedCode, error: incrementError } = await supabase
        .from('premium_codes')
        .update({ used_count: codeRow.used_count + 1 })
        .eq('id', codeRow.id)
        .lt('used_count', codeRow.max_uses)
        .select('id');

      if (incrementError || !updatedCode || updatedCode.length === 0) {
        return NextResponse.json({ error: 'This code has reached its usage limit' }, { status: 400 });
      }

      const { error: insertRedemptionError } = await supabase.from('premium_code_redemptions').insert({
        user_id: user.id,
        premium_code_id: codeRow.id,
      });

      if (insertRedemptionError) {
        return NextResponse.json({ error: 'Failed to record redemption' }, { status: 500 });
      }
    }

    const tier = codeRow.tier as PlanTier;
    const unlockedAt = new Date().toISOString();

    const { error: upsertError } = await supabase.from('subscriptions').upsert(
      {
        user_id: user.id,
        tier,
        credits_used: 0,
        unlocked_at: unlockedAt,
      },
      { onConflict: 'user_id' },
    );

    if (upsertError) {
      return NextResponse.json({ error: 'Failed to update subscription' }, { status: 500 });
    }

    await supabase.from('usage_events').insert({
      user_id: user.id,
      event_name: 'premium.code_redeemed',
      event_data: { codeId: codeRow.id, tier },
    });

    return NextResponse.json({
      subscription: {
        tier,
        unlockedAt,
        creditsUsed: 0,
      },
    });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
