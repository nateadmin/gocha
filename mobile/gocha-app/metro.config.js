const path = require('path');
const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');

const expoFontStub = path.resolve(__dirname, 'metro/expo-font-stub.js');

/**
 * Bare React Native has no Expo native modules. Force expo-font onto a stub so
 * Ionicons does not crash Android with missing ExpoFontLoader.
 *
 * @type {import('@react-native/metro-config').MetroConfig}
 */
const config = {
  resolver: {
    resolveRequest: (context, moduleName, platform) => {
      if (moduleName === 'expo-font' || moduleName.startsWith('expo-font/')) {
        return { filePath: expoFontStub, type: 'sourceFile' };
      }
      return context.resolveRequest(context, moduleName, platform);
    },
  },
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
