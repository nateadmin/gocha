import { useState } from 'react';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AuthNavigator } from './src/navigation/AuthNavigator';
import { RootNavigator } from './src/navigation/RootNavigator';
import { OnboardingScreen } from './src/screens/auth/OnboardingScreen';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { ThemeProvider, useGochaTheme } from './src/theme';
import { useBrandFonts } from './src/theme/fonts';

function AppShell() {
  const { ready } = useBrandFonts();
  const { theme } = useGochaTheme();
  const { user, loading } = useAuth();

  const navTheme =
    theme.mode === 'dark'
      ? {
          ...DarkTheme,
          colors: {
            ...DarkTheme.colors,
            background: theme.colors.background,
            card: theme.colors.card,
            text: theme.colors.cardForeground,
            border: theme.colors.border,
            primary: theme.colors.primary,
          },
        }
      : {
          ...DefaultTheme,
          colors: {
            ...DefaultTheme.colors,
            background: theme.colors.background,
            card: theme.colors.card,
            text: theme.colors.cardForeground,
            border: theme.colors.border,
            primary: theme.colors.primary,
          },
        };

  if (!ready || loading) {
    return (
      <View
        style={[styles.boot, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator color={theme.colors.primary} />
      </View>
    );
  }

  let content: React.ReactNode;
  if (!user) {
    content = <AuthNavigator />;
  } else if (user.needsOnboarding) {
    content = <OnboardingScreen />;
  } else {
    content = <RootNavigator />;
  }

  return (
    <NavigationContainer theme={navTheme}>
      {content}
    </NavigationContainer>
  );
}

function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider initialMode="dark">
        <AuthProvider>
          <AppShell />
        </AuthProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  boot: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default App;
