import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Text } from '@/components/ui/text';
import { useTheme } from '@/hooks/use-theme';
import { Layout, Spacing } from '@/theme/tokens';

type Props = { title?: string; right?: ReactNode; children: ReactNode };

/** Standard tab screen: safe area, large title, centred max-width content. */
export function Screen({ title, right, children }: Props) {
  const theme = useTheme();
  return (
    <SafeAreaView edges={['top']} style={[styles.root, { backgroundColor: theme.background }]}>
      <View style={styles.inner}>
        {title ? (
          <View style={styles.header}>
            <Text variant="title" accessibilityRole="header" style={styles.title} numberOfLines={1}>
              {title}
            </Text>
            {right}
          </View>
        ) : null}
        {children}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, alignItems: 'center' },
  inner: { flex: 1, width: '100%', maxWidth: Layout.maxContentWidth },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.md,
    gap: Spacing.sm,
  },
  title: { flex: 1 },
});
