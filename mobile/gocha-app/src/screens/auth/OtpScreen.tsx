import { useEffect, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  TextInput,
  View,
  StyleSheet,
} from 'react-native';

import { ApiError, type OtpAuthMode } from '../../api/client';
import { CtaButton } from '../../components/brand/CtaButton';
import { BrandText } from '../../components/brand/BrandText';
import { ScreenContainer } from '../../components/app/ScreenContainer';
import { useAuth } from '../../context/AuthContext';
import { useGochaTheme } from '../../theme';

type Props = {
  email: string;
  mode: OtpAuthMode;
  onBack: () => void;
};

export function OtpScreen({ email, mode, onBack }: Props) {
  const { theme } = useGochaTheme();
  const { verifyWithOtp, requestAuthCode } = useAuth();
  const inputRef = useRef<TextInput>(null);
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [showFormatError, setShowFormatError] = useState(false);
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

  async function verifyCode(digits: string) {
    if (digits.length !== 6) {
      return;
    }

    setLoading(true);
    setSubmitError(null);
    try {
      await verifyWithOtp(email, digits, mode);
    } catch (err) {
      setSubmitError(
        err instanceof ApiError ? err.message : 'Could not verify the code.',
      );
    } finally {
      setLoading(false);
    }
  }

  function handleVerifyPress() {
    const digits = code.replace(/\D/g, '');
    if (digits.length !== 6) {
      setShowFormatError(true);
      setSubmitError(null);
      return;
    }

    setShowFormatError(false);
    verifyCode(digits);
  }

  async function handleResend() {
    if (cooldown > 0) {
      return;
    }

    setSubmitError(null);
    setShowFormatError(false);
    try {
      const payload = await requestAuthCode(email, mode);
      setCooldown(payload.resendAvailableInSeconds || 60);
    } catch (err) {
      setSubmitError(
        err instanceof ApiError ? err.message : 'Could not resend the code.',
      );
    }
  }

  function handleCodeChange(value: string) {
    const digits = value.replace(/\D/g, '').slice(0, 6);
    setCode(digits);
    setSubmitError(null);
    setShowFormatError(false);

    if (digits.length === 6) {
      verifyCode(digits);
    }
  }

  const errorMessage = showFormatError
    ? 'Enter the 6-digit code.'
    : submitError;

  return (
    <ScreenContainer edges={['top', 'left', 'right', 'bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}>
        <View style={styles.content}>
          <BrandText variant="title">Enter your code</BrandText>
          <BrandText muted>
            {mode === 'signup'
              ? `Verification code sent to ${email}`
              : `Sign-in code sent to ${email}`}
          </BrandText>

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

          {errorMessage ? (
            <BrandText style={{ color: theme.colors.destructive }}>
              {errorMessage}
            </BrandText>
          ) : null}

          <CtaButton label="Verify" loading={loading} onPress={handleVerifyPress} />

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
