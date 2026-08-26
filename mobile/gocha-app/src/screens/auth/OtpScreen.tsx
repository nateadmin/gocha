import { useEffect, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  TextInput,
  View,
  StyleSheet,
} from 'react-native';

import { ApiError } from '../../api/client';
import { BrandButton } from '../../components/brand/BrandButton';
import { BrandText } from '../../components/brand/BrandText';
import { ScreenContainer } from '../../components/app/ScreenContainer';
import { useAuth } from '../../context/AuthContext';
import { useGochaTheme } from '../../theme';

type Props = {
  email: string;
  onBack: () => void;
};

export function OtpScreen({ email, onBack }: Props) {
  const { theme } = useGochaTheme();
  const { signInWithOtp, requestLoginCode } = useAuth();
  const inputRef = useRef<TextInput>(null);
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(60);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (cooldown <= 0) {
      return;
    }
    const timer = setInterval(() => setCooldown((value) => value - 1), 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  async function handleVerify() {
    const digits = code.replace(/\D/g, '');
    if (digits.length !== 6) {
      setError('Enter the 6-digit code.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await signInWithOtp(email, digits);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not verify the code.');
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    if (cooldown > 0) {
      return;
    }

    setError(null);
    try {
      const payload = await requestLoginCode(email);
      setCooldown(payload.resendAvailableInSeconds || 60);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not resend the code.');
    }
  }

  function handleCodeChange(value: string) {
    const digits = value.replace(/\D/g, '').slice(0, 6);
    setCode(digits);
    if (digits.length === 6) {
      handleVerify();
    }
  }

  return (
    <ScreenContainer edges={['top', 'left', 'right', 'bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}>
        <View style={styles.content}>
          <BrandText variant="title">Enter your code</BrandText>
          <BrandText muted>We sent a code to {email}</BrandText>

          <TextInput
            ref={inputRef}
            autoFocus
            autoComplete="one-time-code"
            keyboardType="number-pad"
            textContentType="oneTimeCode"
            value={code}
            onChangeText={handleCodeChange}
            maxLength={6}
            style={[
              styles.codeInput,
              {
                color: theme.colors.cardForeground,
                borderColor: theme.colors.border,
                fontFamily: theme.typography.mono,
              },
            ]}
          />

          {error ? (
            <BrandText style={{ color: theme.colors.destructive }}>{error}</BrandText>
          ) : null}

          <BrandButton label="Verify" loading={loading} onPress={handleVerify} />

          <Pressable onPress={handleResend} disabled={cooldown > 0}>
            <BrandText
              style={{
                color: cooldown > 0 ? theme.colors.mutedForeground : theme.colors.primary,
                textAlign: 'center',
              }}>
              {cooldown > 0 ? `Resend code in ${cooldown}s` : 'Resend code'}
            </BrandText>
          </Pressable>

          <Pressable onPress={onBack}>
            <BrandText muted style={{ textAlign: 'center' }}>Use a different email</BrandText>
          </Pressable>
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
  codeInput: {
    borderWidth: 1,
    borderRadius: 12,
    fontSize: 28,
    letterSpacing: 12,
    textAlign: 'center',
    paddingVertical: 14,
    marginVertical: 8,
  },
});
