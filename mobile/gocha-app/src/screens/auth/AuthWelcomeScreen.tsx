import { View, StyleSheet } from 'react-native';

import { BrandLogo } from '../../components/brand/BrandLogo';
import { BrandText } from '../../components/brand/BrandText';
import { CtaButton } from '../../components/brand/CtaButton';
import { BrandButton } from '../../components/brand/BrandButton';
import { ScreenContainer } from '../../components/app/ScreenContainer';
import { useLanguage } from '../../i18n/LanguageContext';

type Props = {
  onSignIn: () => void;
  onSignUp: () => void;
};

export function AuthWelcomeScreen({ onSignIn, onSignUp }: Props) {
  const { t } = useLanguage();

  return (
    <ScreenContainer edges={['top', 'left', 'right', 'bottom']}>
      <View style={styles.content}>
        <BrandLogo size={88} />
        <BrandText variant="display" style={styles.title}>Gocha</BrandText>
        <BrandText muted style={styles.subtitle}>
          {t('auth.tagline')}
        </BrandText>
        <BrandText muted style={styles.note}>
          {t('auth.signInNote')}
        </BrandText>

        <View style={styles.actions}>
          <CtaButton label={t('auth.signUp')} onPress={onSignUp} />
          <BrandButton label={t('auth.signIn')} variant="outline" onPress={onSignIn} />
        </View>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  title: {
    marginTop: 16,
    fontSize: 40,
  },
  subtitle: {
    marginBottom: 8,
    textAlign: 'center',
  },
  note: {
    marginBottom: 24,
    textAlign: 'center',
    fontSize: 13,
  },
  actions: {
    width: '100%',
    gap: 12,
  },
});
