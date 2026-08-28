import { Component, type ErrorInfo, type ReactNode } from 'react';
import { View, StyleSheet } from 'react-native';

import { BrandText } from '../brand/BrandText';
import { CtaButton } from '../brand/CtaButton';
import { useGochaTheme } from '../../theme';

type Props = {
  children: ReactNode;
};

type State = {
  error: Error | null;
};

function BootstrapErrorFallback({ onRetry }: { onRetry: () => void }) {
  const { theme } = useGochaTheme();

  return (
    <View style={[styles.screen, { backgroundColor: theme.colors.background }]}>
      <BrandText style={styles.title}>Something went wrong</BrandText>
      <BrandText muted style={styles.message}>
        Reload to sign in again or restore your session.
      </BrandText>
      <CtaButton label="Reload" onPress={onRetry} fullWidth={false} compact />
    </View>
  );
}

export class BootstrapErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('Bootstrap render failed', error, info.componentStack);
  }

  private handleRetry = (): void => {
    this.setState({ error: null });
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  render(): ReactNode {
    if (this.state.error) {
      return <BootstrapErrorFallback onRetry={this.handleRetry} />;
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    padding: 24,
  },
  title: {
    fontSize: 20,
    textAlign: 'center',
  },
  message: {
    textAlign: 'center',
    maxWidth: 320,
  },
});
