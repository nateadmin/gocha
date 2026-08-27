import {
  Text,
  type TextProps,
  type TextStyle,
  StyleSheet,
} from 'react-native';

import { useGochaTheme } from '../../theme';

type BrandTextVariant = 'title' | 'body' | 'caption' | 'label' | 'display' | 'mono';

type Props = TextProps & {
  variant?: BrandTextVariant;
  muted?: boolean;
};

export function BrandText({
  variant = 'body',
  muted = false,
  style,
  ...props
}: Props) {
  const { theme } = useGochaTheme();
  const { colors, typography } = theme;

  const variantStyle: TextStyle = {
    color: muted ? colors.mutedForeground : colors.foreground,
    letterSpacing: typography.letterSpacing,
  };

  switch (variant) {
    case 'display':
      variantStyle.fontFamily = typography.serif;
      variantStyle.fontSize = typography.title + 4;
      variantStyle.color = colors.cardForeground;
      break;
    case 'title':
      variantStyle.fontFamily = typography.serif;
      variantStyle.fontSize = typography.title;
      variantStyle.color = colors.cardForeground;
      break;
    case 'caption':
      variantStyle.fontFamily = typography.sans;
      variantStyle.fontSize = typography.caption;
      break;
    case 'label':
      variantStyle.fontFamily = typography.sans;
      variantStyle.fontSize = typography.label;
      variantStyle.textTransform = 'uppercase';
      break;
    case 'mono':
      variantStyle.fontFamily = typography.mono;
      variantStyle.fontSize = typography.body;
      break;
    default:
      variantStyle.fontFamily = typography.sans;
      variantStyle.fontSize = typography.body;
      variantStyle.lineHeight = 24;
  }

  return <Text style={[variantStyle, style]} {...props} />;
}

export function BrandScreenTitle({ children }: { children: string }) {
  const { theme } = useGochaTheme();
  return (
    <Text
      style={[
        styles.screenTitle,
        {
          color: theme.colors.foreground,
          fontFamily: theme.typography.serif,
          letterSpacing: theme.typography.letterSpacing,
        },
      ]}>
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  screenTitle: {
    fontSize: 32,
    fontWeight: '700',
  },
});
