import 'server-only';

export function getSupabaseServiceRoleKey(): string {
  const value = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!value) {
    throw new Error('Missing required env var: SUPABASE_SERVICE_ROLE_KEY');
  }
  return value;
}
