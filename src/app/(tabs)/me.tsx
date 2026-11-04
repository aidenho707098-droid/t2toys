import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Screen } from '@/components/ui/screen';
import { Text } from '@/components/ui/text';
import { useAuth } from '@/features/auth/auth-provider';
import type { Profile } from '@/features/auth/types';
import { useTheme } from '@/hooks/use-theme';
import { formatUsername } from '@/lib/format';
import i18n, { type AppLocale } from '@/lib/i18n';
import { Colors, Layout, Radii, Spacing } from '@/theme/tokens';

function ProfileHeader({ profile }: { profile: Profile }) {
  const { t } = useTranslation();
  const theme = useTheme();
  const initial = (profile.username ?? '?').slice(0, 1).toUpperCase();
  const joined = new Date(profile.created_at);
  const joinedLabel = `${joined.getFullYear()}-${String(joined.getMonth() + 1).padStart(2, '0')}`;

  return (
    <View style={[styles.card, styles.profileRow, { backgroundColor: theme.surface }]}>
      <View style={[styles.avatar, { backgroundColor: theme.highlight }]} accessibilityElementsHidden>
        <Text variant="heading" style={styles.avatarText}>
          {initial}
        </Text>
      </View>
      <View style={styles.profileText}>
        <Text variant="heading" numberOfLines={1}>
          {formatUsername(profile.username, t)}
        </Text>
        <Text color="textSecondary" numberOfLines={1}>
          {profile.rating_count > 0
            ? t('profile.rating', { avg: Number(profile.rating_avg).toFixed(1), count: profile.rating_count })
            : t('profile.noRating')}
        </Text>
        <Text variant="caption" color="textSecondary" numberOfLines={1}>
          {[t('profile.joined', { date: joinedLabel }), profile.phone_verified ? t('profile.verifiedPhone') : null]
            .filter(Boolean)
            .join(' · ')}
        </Text>
      </View>
    </View>
  );
}

export default function MeScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const { session, profile, signOut } = useAuth();
  const nextLocale: AppLocale = i18n.language === 'en' ? 'zh-HK' : 'en';

  const rows: { key: string; onPress?: () => void; signedInOnly?: boolean }[] = [
    { key: 'me.myListings', signedInOnly: true },
    { key: 'me.saved', signedInOnly: true },
    { key: 'me.reviews', signedInOnly: true },
    { key: 'profile.editInterests', signedInOnly: true, onPress: () => router.push('/onboarding?step=interests') },
    { key: 'me.help' },
  ];

  return (
    <Screen title={t('me.title')}>
      <ScrollView contentContainerStyle={styles.content}>
        {session && profile ? (
          <ProfileHeader profile={profile} />
        ) : (
          <View style={[styles.card, { backgroundColor: theme.surface }]}>
            <Text color="textSecondary">{t('me.signInHint')}</Text>
            <Button label={t('me.signIn')} onPress={() => router.push('/sign-in')} />
          </View>
        )}

        <View style={[styles.list, { borderColor: theme.border }]}>
          {rows
            .filter((r) => !r.signedInOnly || session)
            .map((r) => (
              <Pressable
                key={r.key}
                onPress={r.onPress}
                accessibilityRole="button"
                accessibilityLabel={t(r.key)}
                style={[styles.row, { borderColor: theme.border }]}>
                <Text>{t(r.key)}</Text>
              </Pressable>
            ))}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('me.language')}
            onPress={() => i18n.changeLanguage(nextLocale)}
            style={[styles.row, styles.lastRow]}>
            <Text>{t('me.language')}</Text>
            <Text color="textSecondary">{i18n.language === 'en' ? 'English' : '繁體中文'}</Text>
          </Pressable>
        </View>

        {session ? <Button label={t('profile.signOut')} variant="secondary" onPress={signOut} /> : null}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: Spacing.lg, gap: Spacing.xl, paddingBottom: Layout.bottomTabInset + Spacing.xl },
  card: { padding: Spacing.lg, borderRadius: Radii.lg, gap: Spacing.md },
  profileRow: { flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 56, height: 56, borderRadius: Radii.pill, alignItems: 'center', justifyContent: 'center' },
  // Yellow avatar keeps dark text in both themes for contrast.
  avatarText: { color: Colors.light.text },
  profileText: { flex: 1, gap: Spacing.xxs },
  list: { borderRadius: Radii.lg, borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden' },
  row: {
    minHeight: 52,
    paddingHorizontal: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  lastRow: { borderBottomWidth: 0 },
});
