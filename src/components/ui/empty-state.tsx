import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui/text';
import { Spacing } from '@/theme/tokens';

type Props = { title: string; hint?: string; action?: ReactNode };

export function EmptyState({ title, hint, action }: Props) {
  return (
    <View style={styles.root}>
      <Text variant="heading" style={styles.center}>
        {title}
      </Text>
      {hint ? (
        <Text color="textSecondary" style={styles.center}>
          {hint}
        </Text>
      ) : null}
      {action}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xxl,
    gap: Spacing.md,
  },
  center: { textAlign: 'center' },
});
