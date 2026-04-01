import { NextRequest, NextResponse } from 'next/server';
import { isAdminEmail, requireUserFromRequest } from '@/lib/supabase/auth-guard';

export async function GET(req: NextRequest) {
  const auth = await requireUserFromRequest(req);
  if (!auth.user) {
    return NextResponse.json({ isAdmin: false }, { status: 200 });
  }

  return NextResponse.json({
    isAdmin: isAdminEmail(auth.user.email),
    email: auth.user.email ?? null,
  });
}
