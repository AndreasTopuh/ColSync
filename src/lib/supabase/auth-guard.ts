import 'server-only';

import { NextRequest } from 'next/server';
import { createSupabaseAdminClient } from './admin';

export function getBearerToken(req: NextRequest): string | null {
  const value = req.headers.get('authorization');
  if (!value?.startsWith('Bearer ')) return null;
  return value.slice('Bearer '.length).trim();
}

export async function requireUserFromRequest(req: NextRequest) {
  const token = getBearerToken(req);
  if (!token) {
    return { user: null, error: 'Unauthorized', status: 401 as const };
  }

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) {
    return { user: null, error: 'Unauthorized', status: 401 as const };
  }

  return { user: data.user, error: null, status: 200 as const };
}

export function isAdminEmail(email: string | null | undefined): boolean {
  const raw = process.env.ADMIN_EMAILS || '';
  const allow = raw
    .split(',')
    .map((v) => v.trim().toLowerCase())
    .filter(Boolean);

  if (!email) return false;
  return allow.includes(email.toLowerCase());
}
