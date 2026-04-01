import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { isAdminEmail, requireUserFromRequest, getBearerToken } from '@/lib/supabase/auth-guard';

export async function GET(req: NextRequest) {
  const token = getBearerToken(req);
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createSupabaseAdminClient();
  const { data: userData, error: userError } = await supabase.auth.getUser(token);
  if (userError || !userData.user || !isAdminEmail(userData.user.email || '')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { data: requests, error: fetchError } = await supabase
    .from('premium_code_requests')
    .select('id, user_id, email, note, status, requested_tier, generated_code, created_at')
    .order('created_at', { ascending: false })
    .limit(50);

  if (fetchError) {
    return NextResponse.json({ error: 'Failed to fetch code requests' }, { status: 500 });
  }

  return NextResponse.json({ requests: requests || [] });
}
