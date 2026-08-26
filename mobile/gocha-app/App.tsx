import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { RootNavigator } from './src/navigation/RootNavigator';
import { ThemeProvider, useGochaTheme } from './src/theme';
import { useBrandFonts } from './src/theme/fonts';

function AppShell() {
  const { ready } = useBrandFonts();
  const { theme } = useGochaTheme();

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

  if (!ready) {
    return (
      <View
        style={[styles.boot, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer theme={navTheme}>
      <RootNavigator />
    </NavigationContainer>
  );
}

function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider initialMode="dark">
        <AppShell />
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
