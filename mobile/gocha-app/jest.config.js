module.exports = {
  preset: '@react-native/jest-preset',
  // Mirrors the Metro and Vite aliases so tests exercise the icon component
  // that actually ships instead of the Expo set the app no longer bundles.
  moduleNameMapper: {
    '^@expo/vector-icons/Ionicons$': '<rootDir>/src/components/Ionicons.tsx',
  },
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|@react-navigation|react-native-screens|react-native-gesture-handler|react-native-safe-area-context|@expo-google-fonts|expo-font|@expo/vector-icons|firebase|@firebase)/)',
  ],
};
