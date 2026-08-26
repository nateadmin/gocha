import type { ReactNode } from 'react';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AccountsProvider } from './src/context/AccountsContext';
import { AuthNavigator } from './src/navigation/AuthNavigator';
import { RootNavigator } from './src/navigation/RootNavigator';
import { OnboardingScreen } from './src/screens/auth/OnboardingScreen';
import { SplashScreen, useSplashGate } from './src/screens/splash/SplashScreen';
import { AuthProvider, useAuthGate } from './src/context/AuthContext';
import { ChatProvider } from './src/chat/ChatContext';
import { ThemeProvider, useGochaTheme } from './src/theme';
import { useBrandFonts } from './src/theme/fonts';

function AppShell() {
  const { ready } = useBrandFonts();
  const { theme } = useGochaTheme();
  const { loading, appPhase } = useAuthGate();
  const splashReady = useSplashGate(ready && !loading);

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

  if (!splashReady) {
    return <SplashScreen />;
  }

  let content: ReactNode;
  if (appPhase === 'auth') {
    content = <AuthNavigator />;
  } else if (appPhase === 'onboarding') {
    content = <OnboardingScreen />;
  } else {
    content = <RootNavigator />;
  }

  return (
    <NavigationContainer theme={navTheme} key={appPhase}>
      {content}
    </NavigationContainer>
  );
}

function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider initialMode="dark">
        <AccountsProvider>
          <AuthProvider>
            <ChatProvider>
              <AppShell />
            </ChatProvider>
          </AuthProvider>
        </AccountsProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

export default App;
