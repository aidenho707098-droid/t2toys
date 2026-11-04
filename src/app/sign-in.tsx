import * as AppleAuthentication from 'expo-apple-authentication';
import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { Chip } from '@/components/ui/chip';
import { Text } from '@/components/ui/text';
import { TextField } from '@/components/ui/text-field';
import { PHONE_REGIONS, toE164, type PhoneRegion } from '@/features/auth/phone';
import {
  sendPhoneCode,
  signInWithApple,
  signInWithOAuth,
  verifyPhoneCode,
  type SignInResult,
} from '@/features/auth/social-sign-in';
import { useTheme } from '@/hooks/use-theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { isSupabaseConfigured } from '@/lib/supabase';
import { Layout, Radii, Spacing } from '@/theme/tokens';

type Step = { kind: 'phone' } | { kind: 'code'; e164: string };

export default function SignInScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const scheme = useColorScheme();
  const [region, setRegion] = useState<PhoneRegion>('HK');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState<Step>({ kind: 'phone' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const finish = (result: SignInResult) => {
    setBusy(false);
    if (result.ok) {
      // The root layout sends new users on to onboarding.
      if (router.canGoBack()) router.back();
      else router.replace('/');
    } else if (!result.cancelled) {
      setError(result.message === 'not_configured' ? t('auth.notConfigured') : t('auth.failed', { message: result.message ?? '' }));
    }
  };

  const run = async (fn: () => Promise<SignInResult>) => {
    setError(null);
    setBusy(true);
    finish(await fn());
  };

  const onSendCode = async () => {
    const e164 = toE164(region, phone);
    if (!e164) {
      setError(t('auth.invalidPhone'));
      return;
    }
    setError(null);
    setBusy(true);
    const result = await sendPhoneCode(e164);
    setBusy(false);
    if (result.ok) {
      setCode('');
      setStep({ kind: 'code', e164 });
    } else {
      setError(result.message === 'not_configured' ? t('auth.notConfigured') : t('auth.failed', { message: result.message ?? '' }));
    }
  };

  const onVerify = async () => {
    if (step.kind !== 'code') return;
    setError(null);
    setBusy(true);
    const result = await verifyPhoneCode(step.e164, code.trim());
    if (!result.ok && !result.cancelled) {
      setBusy(false);
      setError(t('auth.invalidCode'));
      return;
    }
    finish(result);
  };

  const showNativeApple = Platform.OS === 'ios';

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: theme.background }]}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('auth.close')}
              onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}
              hitSlop={12}>
              <Text color="textSecondary">{t('auth.close')}</Text>
            </Pressable>
          </View>

          <Text variant="title" accessibilityRole="header">
            {t('auth.title')}
          </Text>
          <Text color="textSecondary">{t('auth.subtitle')}</Text>

          {!isSupabaseConfigured ? (
            <Text color="danger">{t('auth.notConfigured')}</Text>
          ) : null}

          <View style={styles.group}>
            {showNativeApple ? (
              <AppleAuthentication.AppleAuthenticationButton
                buttonType={AppleAuthentication.AppleAuthenticationButtonType.CONTINUE}
                buttonStyle={
                  scheme === 'dark'
                    ? AppleAuthentication.AppleAuthenticationButtonStyle.WHITE
                    : AppleAuthentication.AppleAuthenticationButtonStyle.BLACK
                }
                cornerRadius={Radii.pill}
                style={styles.appleButton}
                onPress={() => run(signInWithApple)}
              />
            ) : (
              <Button label={t('auth.apple')} variant="secondary" disabled={busy} onPress={() => run(signInWithApple)} />
            )}
            <Button
              label={t('auth.google')}
              variant="secondary"
              disabled={busy}
              onPress={() => run(() => signInWithOAuth('google'))}
            />
          </View>

          <View style={styles.dividerRow}>
            <View style={[styles.divider, { backgroundColor: theme.border }]} />
            <Text variant="caption" color="textSecondary">
              {t('auth.or')}
            </Text>
            <View style={[styles.divider, { backgroundColor: theme.border }]} />
          </View>

          {step.kind === 'phone' ? (
            <View style={styles.group}>
              <Text variant="bodyStrong">{t('auth.region')}</Text>
              <View style={styles.chips}>
                {PHONE_REGIONS.map(({ region: r }) => (
                  <Chip key={r} label={t(`auth.regions.${r}`)} selected={r === region} onPress={() => setRegion(r)} />
                ))}
              </View>
              <TextField
                label={t('auth.phoneLabel')}
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                autoComplete="tel"
                textContentType="telephoneNumber"
                placeholder={region === 'OTHER' ? t('auth.phonePlaceholderOther') : undefined}
                returnKeyType="send"
                onSubmitEditing={onSendCode}
              />
              <Button label={t('auth.sendCode')} disabled={busy || !phone} onPress={onSendCode} />
            </View>
          ) : (
            <View style={styles.group}>
              <Text color="textSecondary">{t('auth.codeSent', { phone: step.e164 })}</Text>
              <TextField
                label={t('auth.codeLabel')}
                value={code}
                onChangeText={(v) => setCode(v.replace(/\D/g, '').slice(0, 6))}
                keyboardType="number-pad"
                autoComplete="sms-otp"
                textContentType="oneTimeCode"
                autoFocus
                returnKeyType="done"
                onSubmitEditing={onVerify}
              />
              <Button label={t('auth.verify')} disabled={busy || code.length !== 6} onPress={onVerify} />
              <View style={styles.row}>
                <Pressable accessibilityRole="button" accessibilityLabel={t('auth.resend')} onPress={onSendCode} disabled={busy}>
                  <Text color="primary">{t('auth.resend')}</Text>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={t('auth.changeNumber')}
                  onPress={() => setStep({ kind: 'phone' })}>
                  <Text color="primary">{t('auth.changeNumber')}</Text>
                </Pressable>
              </View>
            </View>
          )}

          {error ? (
            <Text color="danger" accessibilityLiveRegion="assertive">
              {error}
            </Text>
          ) : null}

          <Text variant="caption" color="textSecondary">
            {t('auth.terms')}
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, alignItems: 'center' },
  flex: { flex: 1, width: '100%', maxWidth: 520 },
  scroll: { padding: Spacing.xl, gap: Spacing.lg, paddingBottom: Layout.bottomTabInset },
  header: { flexDirection: 'row', justifyContent: 'flex-end' },
  group: { gap: Spacing.md },
  appleButton: { height: 48, width: '100%' },
  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  divider: { flex: 1, height: StyleSheet.hairlineWidth },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
});
