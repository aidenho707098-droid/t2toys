import * as AppleAuthentication from 'expo-apple-authentication';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { Platform } from 'react-native';

import { supabase } from '@/lib/supabase';

WebBrowser.maybeCompleteAuthSession();

export type SignInResult = { ok: true } | { ok: false; cancelled?: boolean; message?: string };

/** Deep link Supabase redirects back to after OAuth. Must be listed in Supabase → Auth → URL Configuration. */
export const AUTH_REDIRECT_URL = Linking.createURL('auth/callback');

/**
 * Google (and Apple on Android/web) via Supabase OAuth + PKCE.
 * Native: open an auth session, then exchange the returned code. Web: normal redirect.
 */
export async function signInWithOAuth(provider: 'google' | 'apple'): Promise<SignInResult> {
  if (!supabase) return { ok: false, message: 'not_configured' };

  if (Platform.OS === 'web') {
    const { error } = await supabase.auth.signInWithOAuth({ provider, options: { redirectTo: window.location.origin } });
    return error ? { ok: false, message: error.message } : { ok: true };
  }

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: { redirectTo: AUTH_REDIRECT_URL, skipBrowserRedirect: true },
  });
  if (error || !data.url) return { ok: false, message: error?.message };

  const result = await WebBrowser.openAuthSessionAsync(data.url, AUTH_REDIRECT_URL);
  if (result.type !== 'success') return { ok: false, cancelled: true };

  const url = new URL(result.url);
  const code = url.searchParams.get('code');
  const oauthError = url.searchParams.get('error_description');
  if (!code) return { ok: false, message: oauthError ?? 'no_code' };

  const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
  return exchangeError ? { ok: false, message: exchangeError.message } : { ok: true };
}

/** iOS: native Sign in with Apple sheet, then hand the identity token to Supabase. */
export async function signInWithAppleNative(): Promise<SignInResult> {
  if (!supabase) return { ok: false, message: 'not_configured' };
  try {
    const credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
    });
    if (!credential.identityToken) return { ok: false, message: 'no_identity_token' };
    const { error } = await supabase.auth.signInWithIdToken({ provider: 'apple', token: credential.identityToken });
    if (error) return { ok: false, message: error.message };

    // Apple only sends the name on first sign-in; keep it as the display name.
    const name = [credential.fullName?.givenName, credential.fullName?.familyName].filter(Boolean).join(' ');
    if (name) await supabase.auth.updateUser({ data: { full_name: name } });
    return { ok: true };
  } catch (e) {
    if ((e as { code?: string }).code === 'ERR_REQUEST_CANCELED') return { ok: false, cancelled: true };
    return { ok: false, message: (e as Error).message };
  }
}

export async function signInWithApple(): Promise<SignInResult> {
  if (Platform.OS === 'ios' && (await AppleAuthentication.isAvailableAsync())) return signInWithAppleNative();
  return signInWithOAuth('apple');
}

/** SMS one-time code. Requires an SMS provider (e.g. Twilio) configured in Supabase → Auth → Phone. */
export async function sendPhoneCode(e164: string): Promise<SignInResult> {
  if (!supabase) return { ok: false, message: 'not_configured' };
  const { error } = await supabase.auth.signInWithOtp({ phone: e164 });
  return error ? { ok: false, message: error.message } : { ok: true };
}

export async function verifyPhoneCode(e164: string, code: string): Promise<SignInResult> {
  if (!supabase) return { ok: false, message: 'not_configured' };
  const { error } = await supabase.auth.verifyOtp({ phone: e164, token: code, type: 'sms' });
  return error ? { ok: false, message: error.message } : { ok: true };
}
