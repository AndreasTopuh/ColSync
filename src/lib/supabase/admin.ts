import { createClient } from '@supabase/supabase-js';
import { getSupabasePublicEnv } from './env';
import { getSupabaseServiceRoleKey } from './server-env';

export function createSupabaseAdminClient() {
  const { url } = getSupabasePublicEnv();
  const serviceRoleKey = getSupabaseServiceRoleKey();

  return createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
