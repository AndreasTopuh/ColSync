'use client';

import { useEffect, useState } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';

export interface AuthState {
  isAuthed: boolean;
  user: User | null;
  authChecked: boolean;
}

export function useAuth(): AuthState {
  const [state, setState] = useState<AuthState>({
    isAuthed: false,
    user: null,
    authChecked: false,
  });

  useEffect(() => {
    let cancelled = false;
    const supabase = createSupabaseBrowserClient();

    const fetchSession = async () => {
      const { data, error } = await supabase.auth.getUser();
      if (cancelled) return;

      setState({
        isAuthed: !error && !!data.user,
        user: error ? null : data.user,
        authChecked: true,
      });
    };

    void fetchSession();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (cancelled) return;
      setState({
        isAuthed: !!session,
        user: session?.user ?? null,
        authChecked: true,
      });
    });

    return () => {
      cancelled = true;
      listener.subscription.unsubscribe();
    };
  }, []);

  return state;
}
