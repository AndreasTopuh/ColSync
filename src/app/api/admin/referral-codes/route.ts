import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { isAdminEmail, requireUserFromRequest } from '@/lib/supabase/auth-guard';
import { hashPremiumCode } from '@/lib/hash-code';

function sanitizeTier(value: string): 'starter5' | 'pro20' | null {
  if (value === 'starter5' || value === 'pro20') return value;
  return null;
}

export async function GET(req: NextRequest) {
  const auth = await requireUserFromRequest(req);
  if (!auth.user) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  if (!isAdminEmail(auth.user.email)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from('premium_codes')
    .select('id, code_hash, tier, max_uses, used_count, expires_at, created_at, created_by')
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: 'Failed to load referral codes' }, { status: 500 });
  }

  const codes = (data || []).map((row) => ({
    id: row.id,
    code: row.code_hash,
    tier: row.tier,
    maxUses: row.max_uses,
    usedCount: row.used_count,
    expiresAt: row.expires_at,
    createdAt: row.created_at,
    createdBy: row.created_by,
  }));

  return NextResponse.json({ codes });
}

export async function POST(req: NextRequest) {
  const auth = await requireUserFromRequest(req);
  if (!auth.user) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  if (!isAdminEmail(auth.user.email)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = (await req.json().catch(() => null)) as {
    code?: string;
    tier?: string;
    maxUses?: number;
    expiresAt?: string | null;
  } | null;

  const code = body?.code?.trim().toUpperCase();
  const tier = sanitizeTier(body?.tier || '');
  const maxUses = Number(body?.maxUses || 1);

  if (!code || !tier) {
    return NextResponse.json({ error: 'Code and tier are required' }, { status: 400 });
  }

  if (!Number.isFinite(maxUses) || maxUses < 1 || maxUses > 5000) {
    return NextResponse.json({ error: 'Invalid max uses value' }, { status: 400 });
  }

  const expiresAt = body?.expiresAt || null;

  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.from('premium_codes').insert({
    code_hash: hashPremiumCode(code),
    tier,
    max_uses: Math.floor(maxUses),
    used_count: 0,
    expires_at: expiresAt,
    created_by: auth.user.email || 'admin',
  });

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ error: 'Code already exists' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to create code' }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
