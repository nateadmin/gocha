import { ActivityIndicator, StatusBar, View, StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { HomeScreen } from './src/screens/HomeScreen';
import { ThemeProvider, useGochaTheme } from './src/theme';
import { useBrandFonts } from './src/theme/fonts';

function AppShell() {
  const { ready } = useBrandFonts();
  const { theme } = useGochaTheme();

  if (!ready) {
    return (
      <View
        style={[
          styles.boot,
          { backgroundColor: theme.colors.background },
        ]}>
        <ActivityIndicator color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <>
      <StatusBar
        barStyle={theme.mode === 'dark' ? 'light-content' : 'dark-content'}
        backgroundColor="transparent"
        translucent
      />
      <HomeScreen />
    </>
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
