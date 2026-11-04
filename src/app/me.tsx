import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Screen } from '@/components/ui/screen';
import { Text } from '@/components/ui/text';
import { useTheme } from '@/hooks/use-theme';
import i18n, { type AppLocale } from '@/lib/i18n';
import { Radii, Spacing } from '@/theme/tokens';

/** M1 adds sign-in and the profile header. */
export default function MeScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const rows = ['me.myListings', 'me.saved', 'me.reviews', 'me.settings', 'me.help'] as const;
  const nextLocale: AppLocale = i18n.language === 'en' ? 'zh-HK' : 'en';

  return (
    <Screen title={t('me.title')}>
      <View style={styles.content}>
        <View style={[styles.card, { backgroundColor: theme.surface }]}>
          <Text color="textSecondary">{t('me.signInHint')}</Text>
          <Button label={t('me.signIn')} />
        </View>

        <View style={[styles.list, { borderColor: theme.border }]}>
          {rows.map((key) => (
            <Pressable
              key={key}
              accessibilityRole="button"
              accessibilityLabel={t(key)}
              style={[styles.row, { borderColor: theme.border }]}>
              <Text>{t(key)}</Text>
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
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: Spacing.lg, gap: Spacing.xl },
  card: { padding: Spacing.lg, borderRadius: Radii.lg, gap: Spacing.md },
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
