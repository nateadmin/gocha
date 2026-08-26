module.exports = {
  preset: '@react-native/jest-preset',
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|@react-navigation|react-native-screens|react-native-gesture-handler|react-native-safe-area-context|@expo-google-fonts|expo-font|@expo/vector-icons)/)',
  ],
};
