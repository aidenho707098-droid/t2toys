import { Text as RNText, type TextProps as RNTextProps } from 'react-native';

import { useTheme } from '@/hooks/use-theme';
import { Fonts, Type, type ThemeColor, type TypeVariant } from '@/theme/tokens';

export type TextProps = RNTextProps & {
  variant?: TypeVariant;
  color?: ThemeColor;
};

/** App text. Scales with Dynamic Type (capped so layouts survive). */
export function Text({ variant = 'body', color = 'text', style, ...rest }: TextProps) {
  const theme = useTheme();
  return (
    <RNText
      maxFontSizeMultiplier={1.6}
      style={[{ fontFamily: Fonts.sans, color: theme[color] }, Type[variant], style]}
      {...rest}
    />
  );
}
