import { StyleSheet, TextInput, View, type TextInputProps } from 'react-native';

import { Text } from '@/components/ui/text';
import { useTheme } from '@/hooks/use-theme';
import { Radii, Spacing, Type } from '@/theme/tokens';

type Props = TextInputProps & { label: string; hint?: string; error?: string | null };

export function TextField({ label, hint, error, style, ...rest }: Props) {
  const theme = useTheme();
  return (
    <View style={styles.root}>
      <Text variant="bodyStrong">{label}</Text>
      <TextInput
        accessibilityLabel={label}
        placeholderTextColor={theme.textSecondary}
        maxFontSizeMultiplier={1.6}
        style={[
          styles.input,
          Type.body,
          { color: theme.text, backgroundColor: theme.surface, borderColor: error ? theme.danger : theme.border },
          style,
        ]}
        {...rest}
      />
      {error ? (
        <Text variant="caption" color="danger" accessibilityLiveRegion="polite">
          {error}
        </Text>
      ) : hint ? (
        <Text variant="caption" color="textSecondary">
          {hint}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: Spacing.xs },
  input: {
    minHeight: 48,
    paddingHorizontal: Spacing.lg,
    borderRadius: Radii.md,
    borderWidth: 1,
  },
});
