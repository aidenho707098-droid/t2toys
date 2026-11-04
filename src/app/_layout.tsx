import '@/lib/i18n';

import { DarkTheme, DefaultTheme, Stack, ThemeProvider, router, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';

import { AuthProvider, useAuth } from '@/features/auth/auth-provider';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/theme/tokens';

SplashScreen.preventAutoHideAsync();

const SPLASH_MAX_MS = 4000;

/** Hides the splash once the stored session is known, and routes new users to onboarding. */
function AuthGate() {
  const { initializing, needsOnboarding } = useAuth();
  const segments = useSegments();

  useEffect(() => {
    if (!initializing) SplashScreen.hideAsync();
  }, [initializing]);

  // Hard cap: whatever happens with the network, never sit on the splash for more than a few seconds.
  useEffect(() => {
    const timer = setTimeout(() => SplashScreen.hideAsync(), SPLASH_MAX_MS);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (initializing) return;
    const inOnboarding = segments[0] === 'onboarding';
    if (needsOnboarding && !inOnboarding) router.replace('/onboarding');
  }, [initializing, needsOnboarding, segments]);

  return null;
}

export default function RootLayout() {
  const scheme = useColorScheme() === 'dark' ? 'dark' : 'light';
  const base = scheme === 'dark' ? DarkTheme : DefaultTheme;
  const c = Colors[scheme];

  return (
    <ThemeProvider
      value={{
        ...base,
        colors: { ...base.colors, primary: c.primary, background: c.background, card: c.background, text: c.text, border: c.border },
      }}>
      <AuthProvider>
        <AuthGate />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="sign-in" options={{ presentation: 'modal' }} />
          <Stack.Screen name="onboarding" options={{ gestureEnabled: false }} />
        </Stack>
      </AuthProvider>
    </ThemeProvider>
  );
}
