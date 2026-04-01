export function getSupabasePublicEnv(): { url: string; anonKey: string } {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) {
    throw new Error('Missing required env var: NEXT_PUBLIC_SUPABASE_URL');
  }

  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!anonKey) {
    throw new Error('Missing required env var: NEXT_PUBLIC_SUPABASE_ANON_KEY');
  }

  return {
    url,
    anonKey,
  };
}
