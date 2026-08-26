import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, View, StyleSheet } from 'react-native';

import { ApiError } from '../../api/client';
import type { OtpAuthMode } from '../../api/client';
import { CtaButton } from '../../components/brand/CtaButton';
import { BrandInput } from '../../components/brand/BrandInput';
import { BrandText } from '../../components/brand/BrandText';
import { ScreenContainer } from '../../components/app/ScreenContainer';
import { useAuth } from '../../context/AuthContext';
import { useGochaTheme } from '../../theme';

type Props = {
  mode: OtpAuthMode;
  onCodeSent: (email: string) => void;
  onSwitchMode: () => void;
  onBack?: () => void;
};

export function EmailScreen({ mode, onCodeSent, onSwitchMode, onBack }: Props) {
  const { theme } = useGochaTheme();
  const { requestAuthCode } = useAuth();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isSignUp = mode === 'signup';

  async function handleContinue() {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed) {
      setError('Enter your email.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await requestAuthCode(trimmed, mode);
      onCodeSent(trimmed);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
        if (err.body.code === 'EMAIL_NOT_FOUND' && !isSignUp) {
          // hint handled in message
        }
        if (err.body.code === 'EMAIL_ALREADY_REGISTERED' && isSignUp) {
          // hint handled in message
        }
      } else {
        setError('Could not send a code.');
      }
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
          <BrandText variant="title">
            {isSignUp ? 'Create your account' : 'Sign in'}
          </BrandText>
          <BrandText muted style={styles.subtitle}>
            {isSignUp
              ? 'Enter your email. We will send a verification code.'
              : 'Enter the email for your existing Gotcha account.'}
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

          <CtaButton
            label={isSignUp ? 'Send verification code' : 'Send sign-in code'}
            loading={loading}
            onPress={handleContinue}
          />

          <Pressable onPress={onSwitchMode}>
            <BrandText muted style={{ textAlign: 'center' }}>
              {isSignUp
                ? 'Already have an account? Sign in'
                : 'New to Gotcha? Sign up'}
            </BrandText>
          </Pressable>

          {onBack ? (
            <Pressable onPress={onBack}>
              <BrandText muted style={{ textAlign: 'center' }}>Back</BrandText>
            </Pressable>
          ) : null}
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
  subtitle: { marginBottom: 8 },
  input: { marginBottom: 8 },
});
