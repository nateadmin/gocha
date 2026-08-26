import { View, StyleSheet } from 'react-native';

import { BrandLogo } from '../../components/brand/BrandLogo';
import { BrandText } from '../../components/brand/BrandText';
import { CtaButton } from '../../components/brand/CtaButton';
import { BrandButton } from '../../components/brand/BrandButton';
import { ScreenContainer } from '../../components/app/ScreenContainer';

type Props = {
  onSignIn: () => void;
  onSignUp: () => void;
};

export function AuthWelcomeScreen({ onSignIn, onSignUp }: Props) {
  return (
    <ScreenContainer edges={['top', 'left', 'right', 'bottom']}>
      <View style={styles.content}>
        <BrandLogo size={88} />
        <BrandText variant="display" style={styles.title}>Gotcha</BrandText>
        <BrandText muted style={styles.subtitle}>
          Connect. Catch up. Discover.
        </BrandText>

        <View style={styles.actions}>
          <CtaButton label="Sign up" onPress={onSignUp} />
          <BrandButton label="Sign in" variant="outline" onPress={onSignIn} />
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
    marginBottom: 32,
    textAlign: 'center',
  },
  actions: {
    width: '100%',
    gap: 12,
  },
});
