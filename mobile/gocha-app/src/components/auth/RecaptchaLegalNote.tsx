import { Linking, Text } from 'react-native';

import { useGochaTheme } from '../../theme';

export function RecaptchaLegalNote() {
  const { theme } = useGochaTheme();
  const linkStyle = {
    color: theme.colors.mutedForeground,
    textDecorationLine: 'underline' as const,
  };

  return (
    <Text
      style={{
        color: theme.colors.mutedForeground,
        fontFamily: theme.typography.sans,
        fontSize: 12,
        lineHeight: 16,
        textAlign: 'center',
      }}>
      This site is protected by reCAPTCHA and the Google{' '}
      <Text
        accessibilityRole="link"
        onPress={() => {
          void Linking.openURL('https://policies.google.com/privacy');
        }}
        style={linkStyle}>
        Privacy Policy
      </Text>{' '}
      and{' '}
      <Text
        accessibilityRole="link"
        onPress={() => {
          void Linking.openURL('https://policies.google.com/terms');
        }}
        style={linkStyle}>
        Terms of Service
      </Text>{' '}
      apply.
    </Text>
  );
}
