import type { Session } from '@supabase/supabase-js';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { PROFILE_COLUMNS, type Profile } from '@/features/auth/types';
import { supabase } from '@/lib/supabase';

type AuthState = {
  /** True until the stored session has been read on launch. */
  initializing: boolean;
  session: Session | null;
  profile: Profile | null;
  /** Signed in but hasn't picked a username yet. */
  needsOnboarding: boolean;
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthState | null>(null);

const PROFILE_TIMEOUT_MS = 10_000;

async function loadProfile(userId: string): Promise<Profile | null> {
  if (!supabase) return null;
  // A hung request must not keep the app on its splash screen.
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), PROFILE_TIMEOUT_MS);
  try {
    const { data } = await supabase
      .from('profiles')
      .select(PROFILE_COLUMNS)
      .eq('id', userId)
      .abortSignal(controller.signal)
      .maybeSingle<Profile>();
    return data ?? null;
  } finally {
    clearTimeout(timer);
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [initializing, setInitializing] = useState(Boolean(supabase));
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    if (!supabase) return;
    // onAuthStateChange fires INITIAL_SESSION first, so this also covers app launch.
    const { data } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
      // Don't await Supabase calls inside this callback (can deadlock); defer instead.
      setTimeout(async () => {
        setProfile(next ? await loadProfile(next.user.id) : null);
        setInitializing(false);
      }, 0);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  const refreshProfile = useCallback(async () => {
    if (session) setProfile(await loadProfile(session.user.id));
  }, [session]);

  const signOut = useCallback(async () => {
    await supabase?.auth.signOut();
  }, []);

  const value = useMemo<AuthState>(
    () => ({
      initializing,
      session,
      profile,
      needsOnboarding: Boolean(session && profile && !profile.username),
      refreshProfile,
      signOut,
    }),
    [initializing, session, profile, refreshProfile, signOut]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
