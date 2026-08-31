import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import type { LinkingOptions } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { BootstrapErrorBoundary } from './src/components/app/BootstrapErrorBoundary';
import { AccountsProvider, useAccounts } from './src/context/AccountsContext';
import { AuthNavigator } from './src/navigation/AuthNavigator';
import { RootNavigator } from './src/navigation/RootNavigator';
import { appNavigationRef } from './src/navigation/rootNavigation';
import type { AppStackParamList } from './src/navigation/types';
import { OnboardingScreen } from './src/screens/auth/OnboardingScreen';
import { PublicProfileCardScreen } from './src/screens/chats/PublicProfileCardScreen';
import { SplashScreen, useSplashGate } from './src/screens/splash/SplashScreen';
import { AuthProvider, useAuthGate } from './src/context/AuthContext';
import { LanguageProvider } from './src/i18n/LanguageContext';
import { ChatProvider } from './src/chat/ChatContext';
import { ThemeProvider, useGochaTheme } from './src/theme';
import { useBrandFonts } from './src/theme/fonts';

const AppStack = createNativeStackNavigator<AppStackParamList>();

const linking: LinkingOptions<AppStackParamList> = {
  prefixes: [
    'https://gocha.ai',
    'https://www.gocha.ai',
    ...(typeof window !== 'undefined' && window.location?.origin ? [window.location.origin] : []),
  ],
  config: {
    screens: {
      PublicProfileCard: 'c/:slug',
      Main: '',
    },
  },
};

function MainSwitch() {
  const { isAddingAccount } = useAccounts();
  const { appPhase } = useAuthGate();

  if (appPhase === 'auth' || isAddingAccount) {
    return <AuthNavigator />;
  }
  if (appPhase === 'onboarding') {
    return <OnboardingScreen />;
  }
  return <RootNavigator />;
}

function AppShell() {
  const { ready } = useBrandFonts();
  const { theme } = useGochaTheme();
  const { isAddingAccount } = useAccounts();
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

  return (
    <NavigationContainer
      ref={appNavigationRef}
      linking={linking}
      theme={navTheme}
      key={`${appPhase}-${isAddingAccount ? 'add' : 'main'}`}>
      <AppStack.Navigator screenOptions={{ headerShown: false }}>
        <AppStack.Screen name="Main" component={MainSwitch} />
        <AppStack.Screen name="PublicProfileCard" component={PublicProfileCardScreen} />
      </AppStack.Navigator>
    </NavigationContainer>
  );
}

function App() {
  return (
    <BootstrapErrorBoundary>
      <SafeAreaProvider>
        <ThemeProvider>
          <AccountsProvider>
            <AuthProvider>
              <LanguageProvider>
                <ChatProvider>
                  <AppShell />
                </ChatProvider>
              </LanguageProvider>
            </AuthProvider>
          </AccountsProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </BootstrapErrorBoundary>
  );
}

export default App;
