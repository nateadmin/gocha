import { useState } from 'react';
import { Linking, Pressable, ScrollView, Switch, View, StyleSheet } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

import { formatApiError } from '../../api/formatApiError';
import { BrandText } from '../../components/brand/BrandText';
import { CtaButton } from '../../components/brand/CtaButton';
import { ScreenContainer } from '../../components/app/ScreenContainer';
import { LEGAL_URLS } from '../../config/api';
import { useAuth } from '../../context/AuthContext';
import { useGochaTheme } from '../../theme';

/**
 * Shown once after sign-in, before the main app:
 * - Terms of Use agreement with zero tolerance for objectionable content
 *   (App Store guideline 1.2 for apps with user-generated content).
 * - The choice to send message text to OpenAI for AI features
 *   (App Store guideline 5.1.2). Off unless the user turns it on.
 */
export function ConsentScreen() {
  const { theme } = useGochaTheme();
  const { user, completeConsent, signOut } = useAuth();
  const needsTerms = user?.termsAccepted === false;
  const needsAiChoice = user?.aiConsentDecided === false;
  const [agreed, setAgreed] = useState(!needsTerms);
  const [aiEnabled, setAiEnabled] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleContinue() {
    setSaving(true);
    setError(null);
    try {
      await completeConsent({
        acceptTerms: needsTerms,
        aiEnabled: needsAiChoice ? aiEnabled : null,
      });
    } catch (err) {
      setError(formatApiError(err, 'Could not save your choice. Please try again.'));
    } finally {
      setSaving(false);
    }
  }

  const linkStyle = { color: theme.colors.primary, textDecorationLine: 'underline' as const };

  return (
    <ScreenContainer edges={['top', 'left', 'right', 'bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        <BrandText variant="display" style={styles.title}>
          Before you continue
        </BrandText>

        {needsTerms ? (
          <View style={[styles.card, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
            <BrandText style={styles.heading}>Community rules</BrandText>
            <BrandText muted style={styles.body}>
              Gocha has zero tolerance for objectionable content or abusive users. Do not post
              harassment, hate, sexual content, violence, scams, or spam. You can report or block
              anyone from a chat. We review reports within 24 hours and remove content and accounts
              that break these rules.
            </BrandText>
            <Pressable
              style={styles.checkRow}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: agreed }}
              onPress={() => setAgreed((value) => !value)}>
              <Ionicons
                name={agreed ? 'checkbox' : 'square-outline'}
                size={24}
                color={theme.colors.primary}
              />
              <BrandText style={styles.checkLabel}>
                I agree to the{' '}
                <BrandText style={linkStyle} onPress={() => void Linking.openURL(LEGAL_URLS.terms)}>
                  Terms of Use
                </BrandText>{' '}
                and the{' '}
                <BrandText style={linkStyle} onPress={() => void Linking.openURL(LEGAL_URLS.privacy)}>
                  Privacy Policy
                </BrandText>
                .
              </BrandText>
            </Pressable>
          </View>
        ) : null}

        {needsAiChoice ? (
          <View style={[styles.card, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
            <BrandText style={styles.heading}>AI features</BrandText>
            <BrandText muted style={styles.body}>
              Message translation, Catch Up summaries and Gocha AI send the text of your messages to
              our AI provider, OpenAI, to process them. Nothing is sent unless you turn this on, and
              you can change it any time in Settings.
            </BrandText>
            <View style={styles.toggleRow}>
              <BrandText style={styles.checkLabel}>Allow AI features</BrandText>
              <Switch
                value={aiEnabled}
                onValueChange={setAiEnabled}
                trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
                thumbColor={theme.colors.primaryForeground}
                accessibilityLabel="Allow AI features"
              />
            </View>
          </View>
        ) : null}

        {error ? (
          <BrandText style={[styles.error, { color: theme.colors.destructive }]}>{error}</BrandText>
        ) : null}

        <View style={styles.actions}>
          <CtaButton
            label="Continue"
            loading={saving}
            disabled={!agreed || saving}
            onPress={() => void handleContinue()}
          />
          <Pressable onPress={() => void signOut()} accessibilityRole="button" style={styles.signOut}>
            <BrandText muted>Sign out</BrandText>
          </Pressable>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: {
    flexGrow: 1,
    padding: 24,
    justifyContent: 'center',
    gap: 16,
  },
  title: {
    fontSize: 30,
    textAlign: 'center',
    marginBottom: 8,
  },
  card: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 16,
    gap: 10,
  },
  heading: {
    fontSize: 18,
    fontWeight: '600',
  },
  body: {
    fontSize: 14,
    lineHeight: 20,
  },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 4,
  },
  checkLabel: {
    flex: 1,
    fontSize: 15,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  error: {
    textAlign: 'center',
  },
  actions: {
    gap: 12,
    marginTop: 8,
  },
  signOut: {
    alignSelf: 'center',
    padding: 8,
  },
});
