import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, TextInput, View } from 'react-native';

import { EmptyState } from '@/components/ui/empty-state';
import { Screen } from '@/components/ui/screen';
import { useTheme } from '@/hooks/use-theme';
import { Radii, Spacing, Type } from '@/theme/tokens';

/** M3 adds Typesense results, filters and saved searches. Never opens on "no data". */
export default function SearchScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const [query, setQuery] = useState('');

  return (
    <Screen title={t('tabs.search')}>
      <View style={styles.bar}>
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder={t('search.placeholder')}
          placeholderTextColor={theme.textSecondary}
          accessibilityLabel={t('search.placeholder')}
          returnKeyType="search"
          clearButtonMode="while-editing"
          style={[
            styles.input,
            Type.body,
            { color: theme.text, backgroundColor: theme.surface, borderColor: theme.border },
          ]}
        />
      </View>
      <EmptyState title={t('search.recent')} hint={t('search.hint')} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  bar: { paddingHorizontal: Spacing.lg },
  input: {
    minHeight: 44,
    paddingHorizontal: Spacing.lg,
    borderRadius: Radii.pill,
    borderWidth: StyleSheet.hairlineWidth,
  },
});
