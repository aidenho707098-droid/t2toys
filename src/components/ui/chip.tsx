import { Pressable, StyleSheet } from 'react-native';

import { Text } from '@/components/ui/text';
import { useTheme } from '@/hooks/use-theme';
import { Radii, Spacing } from '@/theme/tokens';

type Props = { label: string; selected: boolean; onPress: () => void };

/** Selectable pill used for filters, regions and interests. */
export function Chip({ label, selected, onPress }: Props) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: selected }}
      accessibilityLabel={label}
      style={({ pressed }) => [
        styles.chip,
        {
          backgroundColor: selected ? theme.primarySoft : theme.surface,
          borderColor: selected ? theme.primary : theme.border,
          opacity: pressed ? 0.8 : 1,
        },
      ]}>
      <Text variant="bodyStrong" color={selected ? 'primary' : 'text'}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    minHeight: 40,
    paddingHorizontal: Spacing.lg,
    justifyContent: 'center',
    borderRadius: Radii.pill,
    borderWidth: 1,
  },
});
