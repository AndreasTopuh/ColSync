import { createSupabaseBrowserClient } from './client';

export async function getAccessToken(): Promise<string | null> {
  const supabase = createSupabaseBrowserClient();
  // Use getSession() only for the access token -it reads from memory/localStorage
  // which is fine for sending to server routes that will re-validate with getUser().
  const { data, error } = await supabase.auth.getSession();
  if (error) return null;
  return data.session?.access_token ?? null;
}

export async function getCurrentSession() {
  const supabase = createSupabaseBrowserClient();
  // Use getUser() to validate JWT against Supabase server instead of reading
  // unvalidated session from localStorage (getSession() is deprecated for auth checks).
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) {
    return null;
  }
  return data.user;
}

export async function signInWithEmailPassword(email: string, password: string) {
  const supabase = createSupabaseBrowserClient();
  return supabase.auth.signInWithPassword({ email, password });
}

export async function signUpWithEmailPassword(email: string, password: string) {
  const supabase = createSupabaseBrowserClient();
  return supabase.auth.signUp({ email, password });
}

export async function resendSignupVerification(email: string) {
  const supabase = createSupabaseBrowserClient();
  return supabase.auth.resend({
    type: 'signup',
    email,
  });
}

export async function signOut() {
  const supabase = createSupabaseBrowserClient();
  return supabase.auth.signOut();
}
