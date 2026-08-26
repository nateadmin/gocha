import { useState } from 'react';
import { KeyboardAvoidingView, Platform, View, StyleSheet } from 'react-native';

import { ApiError } from '../../api/client';
import { BrandButton } from '../../components/brand/BrandButton';
import { BrandInput } from '../../components/brand/BrandInput';
import { BrandLogo } from '../../components/brand/BrandLogo';
import { BrandText } from '../../components/brand/BrandText';
import { ScreenContainer } from '../../components/app/ScreenContainer';
import { useAuth } from '../../context/AuthContext';
import { useGochaTheme } from '../../theme';

type Props = {
  onCodeSent: (email: string) => void;
};

export function EmailScreen({ onCodeSent }: Props) {
  const { theme } = useGochaTheme();
  const { requestLoginCode } = useAuth();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleContinue() {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed) {
      setError('Enter your email.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await requestLoginCode(trimmed);
      onCodeSent(trimmed);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not send a code.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScreenContainer edges={['top', 'left', 'right', 'bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}>
        <View style={styles.content}>
          <BrandLogo size={72} />
          <BrandText variant="title" style={styles.title}>Sign in to Gotcha</BrandText>
          <BrandText muted style={styles.subtitle}>
            Enter your email. We will send a one-time code.
          </BrandText>

          <BrandInput
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            style={styles.input}
          />

          {error ? (
            <BrandText style={{ color: theme.colors.destructive, marginBottom: 8 }}>
              {error}
            </BrandText>
          ) : null}

          <BrandButton label="Send code" loading={loading} onPress={handleContinue} />
        </View>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    gap: 12,
  },
  title: { marginTop: 16 },
  subtitle: { marginBottom: 8 },
  input: { marginBottom: 8 },
});
