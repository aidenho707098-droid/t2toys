import { Image } from 'expo-image';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui/text';
import type { ListingSummary } from '@/features/listings/types';
import { useTheme } from '@/hooks/use-theme';
import { formatPrice, formatRelativeTime } from '@/lib/format';
import { Colors, Radii, Spacing } from '@/theme/tokens';

type Props = { listing: ListingSummary; onPress?: () => void };

/**
 * Feed card. Fixes from the old app: price always shown and formatted, title wraps to
 * 2 lines with ellipsis (never clipped mid-glyph), condition + district + time visible,
 * Reserved/Sold badge, no raw user ids.
 */
export function ListingCard({ listing, onPress }: Props) {
  const theme = useTheme();
  const { t } = useTranslation();
  const badge =
    listing.status === 'reserved'
      ? { label: t('listing.reserved'), bg: theme.reserved, fg: 'textOnPrimary' as const }
      : listing.status === 'sold'
        ? { label: t('listing.sold'), bg: theme.badgeNeutral, fg: 'textOnPrimary' as const }
        : listing.type === 'wanted'
          ? { label: t('listing.wanted'), bg: theme.highlight, fg: 'text' as const }
          : null;

  const meta = [
    listing.condition ? t(`condition.${listing.condition}`) : null,
    listing.districts[0] ?? null,
    formatRelativeTime(listing.bumped_at, t),
  ]
    .filter(Boolean)
    .join(' · ');

  const price = formatPrice(listing.price_hkd, t);

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${listing.title}, ${price}`}
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: theme.surfaceRaised, borderColor: theme.border, opacity: pressed ? 0.85 : 1 },
      ]}>
      <View style={[styles.photo, { backgroundColor: theme.surface }]}>
        {listing.photo_url ? (
          <Image source={listing.photo_url} style={StyleSheet.absoluteFill} contentFit="cover" transition={150} />
        ) : null}
        {badge ? (
          <View style={[styles.badge, { backgroundColor: badge.bg }]}>
            <Text variant="caption" color={badge.fg} style={badge.fg === 'text' ? styles.darkOnYellow : undefined}>
              {badge.label}
            </Text>
          </View>
        ) : null}
      </View>
      <View style={styles.body}>
        <Text variant="bodyStrong" numberOfLines={2}>
          {listing.title}
        </Text>
        <Text variant="price" color="price" numberOfLines={1}>
          {price}
        </Text>
        <Text variant="caption" color="textSecondary" numberOfLines={1}>
          {meta}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { flex: 1, borderRadius: Radii.md, borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden' },
  photo: { aspectRatio: 1, width: '100%' },
  badge: {
    position: 'absolute',
    top: Spacing.sm,
    left: Spacing.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xxs,
    borderRadius: Radii.sm,
  },
  body: { padding: Spacing.sm, gap: Spacing.xxs },
  // Yellow badge keeps dark text in both themes for contrast.
  darkOnYellow: { color: Colors.light.text },
});
