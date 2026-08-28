import { useEffect, useState } from 'react';
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
  const [retryAfterSeconds, setRetryAfterSeconds] = useState(0);

  const isSignUp = mode === 'signup';
  const blocked = retryAfterSeconds > 0;

  useEffect(() => {
    if (retryAfterSeconds <= 0) {
      return;
    }

    const timer = setInterval(() => {
      setRetryAfterSeconds((value) => Math.max(0, value - 1));
    }, 1000);

    return () => clearInterval(timer);
  }, [retryAfterSeconds]);

  async function handleContinue() {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed) {
      setError('Enter your email.');
      return;
    }

    if (blocked) {
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const payload = await requestAuthCode(trimmed, mode);
      if (payload.resendAvailableInSeconds > 0) {
        setRetryAfterSeconds(payload.resendAvailableInSeconds);
      }
      onCodeSent(trimmed);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
        if (err.body.code === 'RATE_LIMITED' && err.body.retryAfterSeconds) {
          setRetryAfterSeconds(err.body.retryAfterSeconds);
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
              : 'Enter the email for your existing Gocha account.'}
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

          {blocked ? (
            <BrandText muted style={{ marginBottom: 8, textAlign: 'center' }}>
              You can request another code in {retryAfterSeconds}s.
            </BrandText>
          ) : null}

          <CtaButton
            label={isSignUp ? 'Send verification code' : 'Send sign-in code'}
            loading={loading}
            disabled={blocked}
            onPress={handleContinue}
          />

          <Pressable onPress={onSwitchMode}>
            <BrandText muted style={{ textAlign: 'center' }}>
              {isSignUp
                ? 'Already have an account? Sign in'
                : 'New to Gocha? Sign up'}
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
