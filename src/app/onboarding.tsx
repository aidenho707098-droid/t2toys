import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { Chip } from '@/components/ui/chip';
import { Text } from '@/components/ui/text';
import { TextField } from '@/components/ui/text-field';
import { useAuth } from '@/features/auth/auth-provider';
import { loadMyInterests, saveInterests, saveUsername } from '@/features/auth/onboarding-api';
import { suggestUsername, validateUsername } from '@/features/auth/username';
import { categoryName, useTopCategories, type Category } from '@/features/categories/use-categories';
import { useTheme } from '@/hooks/use-theme';
import { Radii, Spacing } from '@/theme/tokens';

type Step = 'username' | 'interests';

export default function OnboardingScreen() {
  const { t, i18n } = useTranslation();
  const theme = useTheme();
  const params = useLocalSearchParams<{ step?: string }>();
  const { session, profile, refreshProfile } = useAuth();
  const { categories, loading: loadingCategories } = useTopCategories();

  const [step, setStep] = useState<Step>(params.step === 'interests' && profile?.username ? 'interests' : 'username');
  const meta = session?.user.user_metadata as { full_name?: string; name?: string } | undefined;
  const [username, setUsername] = useState(
    () => profile?.username ?? suggestUsername(meta?.full_name ?? meta?.name ?? session?.user.email)
  );
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [pendingSensitive, setPendingSensitive] = useState<Category | null>(null);
  const [adultConfirmed, setAdultConfirmed] = useState(Boolean(profile?.adult_confirmed_at));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Editing later: start from the interests already saved.
  useEffect(() => {
    if (!session) return;
    let cancelled = false;
    loadMyInterests(session.user.id).then((ids) => {
      if (!cancelled && ids.length) setSelected(new Set(ids));
    });
    return () => {
      cancelled = true;
    };
  }, [session]);

  if (!session) return null;
  const userId = session.user.id;

  const onSaveUsername = async () => {
    const problem = validateUsername(username);
    if (problem) {
      setUsernameError(t(`onboarding.usernameErrors.${problem}`));
      return;
    }
    setSaving(true);
    const result = await saveUsername(userId, username);
    setSaving(false);
    if (result.ok) {
      setUsernameError(null);
      setStep('interests');
    } else {
      setUsernameError(result.reason === 'taken' ? t('onboarding.usernameTaken') : t('onboarding.error'));
    }
  };

  const toggle = (c: Category) => {
    const next = new Set(selected);
    if (next.has(c.id)) {
      next.delete(c.id);
    } else if (c.sensitive && !adultConfirmed) {
      setPendingSensitive(c);
      return;
    } else {
      next.add(c.id);
    }
    setSelected(next);
  };

  const confirmAdult = () => {
    if (!pendingSensitive) return;
    setAdultConfirmed(true);
    setSelected(new Set(selected).add(pendingSensitive.id));
    setPendingSensitive(null);
  };

  const onSaveInterests = async () => {
    if (selected.size === 0) {
      setError(t('onboarding.pickAtLeastOne'));
      return;
    }
    setSaving(true);
    setError(null);
    const needsAdultWrite = adultConfirmed && !profile?.adult_confirmed_at;
    const result = await saveInterests(userId, [...selected], needsAdultWrite);
    if (!result.ok) {
      setSaving(false);
      setError(t('onboarding.error'));
      return;
    }
    await refreshProfile();
    setSaving(false);
    if (router.canGoBack()) router.back();
    else router.replace('/');
  };

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        {step === 'username' ? (
          <View style={styles.group}>
            <Text variant="title" accessibilityRole="header">
              {t('onboarding.usernameTitle')}
            </Text>
            <TextField
              label={t('onboarding.usernameLabel')}
              value={username}
              onChangeText={(v) => {
                setUsername(v.trim());
                setUsernameError(null);
              }}
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="username-new"
              maxLength={20}
              hint={username ? t('onboarding.usernameHint', { username }) : t('onboarding.usernameRules')}
              error={usernameError}
              returnKeyType="next"
              onSubmitEditing={onSaveUsername}
            />
            <Button label={saving ? t('onboarding.saving') : t('onboarding.next')} disabled={saving} onPress={onSaveUsername} />
          </View>
        ) : (
          <View style={styles.group}>
            <Text variant="title" accessibilityRole="header">
              {t('onboarding.interestsTitle')}
            </Text>
            <Text color="textSecondary">{t('onboarding.interestsHint')}</Text>

            {loadingCategories ? (
              <ActivityIndicator color={theme.primary} />
            ) : (
              <View style={styles.chips}>
                {categories.map((c) => (
                  <Chip
                    key={c.id}
                    label={categoryName(c, i18n.language)}
                    selected={selected.has(c.id)}
                    onPress={() => toggle(c)}
                  />
                ))}
              </View>
            )}

            {pendingSensitive ? (
              <View
                style={[styles.notice, { backgroundColor: theme.highlightSoft, borderColor: theme.highlight }]}
                accessibilityRole="alert">
                <Text variant="bodyStrong">{t('onboarding.adultTitle')}</Text>
                <Text>{t('onboarding.adultBody')}</Text>
                <Button label={t('onboarding.adultConfirm')} onPress={confirmAdult} />
                <Button label={t('onboarding.adultCancel')} variant="secondary" onPress={() => setPendingSensitive(null)} />
              </View>
            ) : null}

            {error ? <Text color="danger">{error}</Text> : null}
            <Button label={saving ? t('onboarding.saving') : t('onboarding.done')} disabled={saving} onPress={onSaveInterests} />
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, alignItems: 'center' },
  scroll: { padding: Spacing.xl, gap: Spacing.lg, width: '100%', maxWidth: 640, alignSelf: 'center' },
  group: { gap: Spacing.lg },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  notice: { padding: Spacing.lg, borderRadius: Radii.lg, borderWidth: 1, gap: Spacing.md },
});
