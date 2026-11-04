import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Screen } from '@/components/ui/screen';
import { Text } from '@/components/ui/text';
import { ListingCard } from '@/features/listings/listing-card';
import { useFeed } from '@/features/listings/use-feed';
import { useTheme } from '@/hooks/use-theme';
import { Layout, Radii, Spacing } from '@/theme/tokens';

export default function HomeScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const { width } = useWindowDimensions();
  const [type, setType] = useState<'sell' | 'wanted'>('sell');
  const { items, loading, error, reload, isSample } = useFeed(type);
  const contentWidth = Math.min(Layout.maxContentWidth, width) - Spacing.lg * 2;
  const columns = contentWidth >= 700 ? 4 : 2;
  // Fixed card width so a lone card in the last row matches the others.
  const cardWidth = Math.floor((contentWidth - Layout.gridGap * (columns - 1)) / columns);

  return (
    <Screen title={t('home.title')}>
      <View style={styles.segment} accessibilityRole="tablist">
        {(['sell', 'wanted'] as const).map((key) => {
          const selected = key === type;
          return (
            <Pressable
              key={key}
              accessibilityRole="tab"
              accessibilityState={{ selected }}
              accessibilityLabel={key === 'sell' ? t('home.forSale') : t('home.wanted')}
              onPress={() => setType(key)}
              style={[
                styles.segmentItem,
                { backgroundColor: selected ? theme.text : theme.surface, borderColor: theme.border },
              ]}>
              <Text variant="bodyStrong" color={selected ? 'background' : 'text'}>
                {key === 'sell' ? t('home.forSale') : t('home.wanted')}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {isSample && __DEV__ ? (
        <Text variant="caption" color="textSecondary" style={styles.notice}>
          {t('common.offline')}
        </Text>
      ) : null}

      {loading ? (
        <ActivityIndicator style={styles.loader} color={theme.primary} />
      ) : error ? (
        <EmptyState title={t('common.error')} action={<Button label={t('common.retry')} onPress={reload} />} />
      ) : (
        <FlatList
          key={columns}
          data={items}
          numColumns={columns}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          columnWrapperStyle={styles.row}
          onRefresh={reload}
          refreshing={false}
          renderItem={({ item }) => (
            <View style={{ width: cardWidth }}>
              <ListingCard listing={item} />
            </View>
          )}
          ListEmptyComponent={<EmptyState title={t('home.empty')} hint={t('home.emptyHint')} />}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  segment: { flexDirection: 'row', gap: Spacing.sm, paddingHorizontal: Spacing.lg, paddingBottom: Spacing.md },
  segmentItem: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: Radii.pill,
    borderWidth: StyleSheet.hairlineWidth,
  },
  notice: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.sm },
  loader: { marginTop: Spacing.xxxl },
  list: { paddingHorizontal: Spacing.lg, paddingBottom: Layout.bottomTabInset + Spacing.xl, gap: Layout.gridGap },
  row: { gap: Layout.gridGap },
});
