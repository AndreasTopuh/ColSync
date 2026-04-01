import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { getBearerToken } from '@/lib/supabase/auth-guard';

export async function GET(req: NextRequest) {
  try {
    const token = getBearerToken(req);
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createSupabaseAdminClient();
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userData.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = userData.user.id;

    const { data: existing, error: readError } = await supabase
      .from('subscriptions')
      .select('tier, credits_used, unlocked_at')
      .eq('user_id', userId)
      .maybeSingle();

    if (readError) {
      return NextResponse.json({ error: 'Failed to read subscription' }, { status: 500 });
    }

    if (!existing) {
      const { error: insertError } = await supabase.from('subscriptions').insert({
        user_id: userId,
        tier: 'free',
        credits_used: 0,
        unlocked_at: null,
      });
      if (insertError) {
        return NextResponse.json({ error: 'Failed to create subscription' }, { status: 500 });
      }

      return NextResponse.json({
        subscription: {
          tier: 'free',
          creditsUsed: 0,
          unlockedAt: null,
        },
      });
    }

    return NextResponse.json({
      subscription: {
        tier: existing.tier,
        creditsUsed: existing.credits_used,
        unlockedAt: existing.unlocked_at,
      },
    });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
