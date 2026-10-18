const path = require('node:path');

const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');

const expoFontStub = path.resolve(__dirname, 'metro/expo-font-stub.js');
const ioniconsModule = path.resolve(__dirname, 'src/components/Ionicons.tsx');

/**
 * Bare React Native ships no Expo native modules, so any code path reaching
 * ExpoFontLoader crashes Android at runtime. Two redirects keep it out:
 *
 * - `@expo/vector-icons/Ionicons` renders from the font bundled with the app,
 *   so icons draw without expo-font. Vite applies the same alias for web.
 * - `expo-font` itself resolves to a stub, so any remaining import is inert
 *   rather than fatal.
 *
 * @type {import('@react-native/metro-config').MetroConfig}
 */
const config = {
  resolver: {
    resolveRequest: (context, moduleName, platform) => {
      if (moduleName === '@expo/vector-icons/Ionicons') {
        return { type: 'sourceFile', filePath: ioniconsModule };
      }

      if (moduleName === 'expo-font' || moduleName.startsWith('expo-font/')) {
        return { type: 'sourceFile', filePath: expoFontStub };
      }

      return context.resolveRequest(context, moduleName, platform);
    },
  },
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
