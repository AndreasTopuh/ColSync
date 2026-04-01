import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { isAdminEmail, requireUserFromRequest } from '@/lib/supabase/auth-guard';

export async function GET(req: NextRequest) {
  const auth = await requireUserFromRequest(req);
  if (!auth.user) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  if (!isAdminEmail(auth.user.email)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase.auth.admin.listUsers({ page: 1, perPage: 200 });

  if (error) {
    return NextResponse.json({ error: 'Failed to list users' }, { status: 500 });
  }

  const users = (data.users || []).map((u) => ({
    id: u.id,
    email: u.email ?? null,
    createdAt: u.created_at ?? null,
    lastSignInAt: u.last_sign_in_at ?? null,
  }));

  return NextResponse.json({ users });
}
