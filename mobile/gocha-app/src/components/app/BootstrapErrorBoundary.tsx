import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Pressable, Text, View, StyleSheet } from 'react-native';

type Props = {
  children: ReactNode;
};

type State = {
  error: Error | null;
};

function BootstrapErrorFallback({ onRetry }: { onRetry: () => void }) {
  return (
    <View style={styles.screen}>
      <Text style={styles.title}>Something went wrong</Text>
      <Text style={styles.message}>
        Reload to sign in again or restore your session.
      </Text>
      <Pressable onPress={onRetry} style={styles.button} accessibilityRole="button">
        <Text style={styles.buttonLabel}>Reload</Text>
      </Pressable>
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
    backgroundColor: '#0d0221',
  },
  title: {
    fontSize: 20,
    textAlign: 'center',
    color: '#f4f4ff',
  },
  message: {
    textAlign: 'center',
    maxWidth: 320,
    color: '#9aa0c3',
  },
  button: {
    backgroundColor: '#1B00D8',
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  buttonLabel: {
    color: '#ffffff',
    fontSize: 16,
  },
});
