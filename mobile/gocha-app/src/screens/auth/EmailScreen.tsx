import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, View, StyleSheet } from 'react-native';

import { ApiError, fetchAppMeta, type AccountChannel, type OtpAuthMode } from '../../api/client';
import { normalizeIdentifier } from '../../auth/accountChannel';
import { sendPhoneSms } from '../../auth/phoneFirebase';
import { RecaptchaLegalNote } from '../../components/auth/RecaptchaLegalNote';
import { CtaButton } from '../../components/brand/CtaButton';
import { BrandInput } from '../../components/brand/BrandInput';
import { BrandText } from '../../components/brand/BrandText';
import { ScreenContainer } from '../../components/app/ScreenContainer';
import { useAuth } from '../../context/AuthContext';
import { useGochaTheme } from '../../theme';

type Props = {
  mode: OtpAuthMode;
  onCodeSent: (identifier: string, channel: AccountChannel) => void;
  onSwitchMode: () => void;
  onBack?: () => void;
};

export function EmailScreen({ mode, onCodeSent, onSwitchMode, onBack }: Props) {
  const { theme } = useGochaTheme();
  const { requestAuthCode } = useAuth();
  const [channel, setChannel] = useState<AccountChannel>('email');
  const [identifier, setIdentifier] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryAfterSeconds, setRetryAfterSeconds] = useState(0);
  const [phoneEnabled, setPhoneEnabled] = useState(true);

  const isSignUp = mode === 'signup';
  const blocked = retryAfterSeconds > 0;

  useEffect(() => {
    void fetchAppMeta()
      .then((meta) => {
        setPhoneEnabled(meta.account.phoneSignInEnabled || meta.auth.phoneSignInEnabled);
      })
      .catch(() => {
        setPhoneEnabled(true);
      });
  }, []);

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
    const normalized = normalizeIdentifier(channel, identifier);
    if (!normalized) {
      setError(channel === 'email' ? 'Enter your email.' : 'Enter your phone number.');
      return;
    }
    if (channel === 'email' && !normalized.includes('@')) {
      setError('Enter a valid email.');
      return;
    }

    if (blocked) {
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const payload = await requestAuthCode(normalized, mode, { channel });
      if (channel === 'phone') {
        const meta = await fetchAppMeta();
        if (!meta.auth.firebase) {
          throw new Error('Phone sign-in is not configured yet.');
        }
        await sendPhoneSms(meta.auth.firebase, normalized);
      }
      if (payload.resendAvailableInSeconds > 0) {
        setRetryAfterSeconds(payload.resendAvailableInSeconds);
      }
      onCodeSent(normalized, channel);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
        if (err.body.code === 'RATE_LIMITED' && err.body.retryAfterSeconds) {
          setRetryAfterSeconds(err.body.retryAfterSeconds);
        }
      } else {
        setError(err instanceof Error ? err.message : 'Could not send a code.');
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
              ? 'Use email or phone. The other is optional later.'
              : 'Use the email or phone on your Gocha account.'}
          </BrandText>

          <View style={styles.channelRow}>
            <Pressable
              onPress={() => {
                setChannel('email');
                setError(null);
              }}
              style={[
                styles.channelChip,
                {
                  borderColor: theme.colors.border,
                  backgroundColor: channel === 'email' ? theme.colors.primary : theme.colors.card,
                },
              ]}>
              <BrandText
                style={{
                  color: channel === 'email' ? '#fff' : theme.colors.cardForeground,
                  textAlign: 'center',
                }}>
                Email
              </BrandText>
            </Pressable>
            <Pressable
              onPress={() => {
                if (!phoneEnabled) {
                  setError('Phone sign-in is not configured yet.');
                  return;
                }
                setChannel('phone');
                setError(null);
              }}
              style={[
                styles.channelChip,
                {
                  borderColor: theme.colors.border,
                  backgroundColor: channel === 'phone' ? theme.colors.primary : theme.colors.card,
                },
              ]}>
              <BrandText
                style={{
                  color: channel === 'phone' ? '#fff' : theme.colors.cardForeground,
                  textAlign: 'center',
                }}>
                Phone
              </BrandText>
            </Pressable>
          </View>

          <BrandInput
            autoCapitalize="none"
            autoComplete={channel === 'email' ? 'email' : 'tel'}
            keyboardType={channel === 'email' ? 'email-address' : 'phone-pad'}
            placeholder={channel === 'email' ? 'Email' : 'Phone with country code'}
            value={identifier}
            onChangeText={setIdentifier}
            onSubmitEditing={() => {
              void handleContinue();
            }}
            returnKeyType="go"
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

          {channel === 'phone' ? <RecaptchaLegalNote /> : null}

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
  channelRow: {
    flexDirection: 'row',
    gap: 8,
  },
  channelChip: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
});
