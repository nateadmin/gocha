import { ImageSourcePropType, Platform } from 'react-native';

const nativeLogo = require('../../assets/branding/Logo.jpeg');

/** Canonical Gotcha logo (GitHub: mobile/gocha-app/assets/branding/Logo.jpeg). */
export const brandLogoSource: ImageSourcePropType =
  Platform.OS === 'web'
    ? { uri: '/Logo.jpeg' }
    : nativeLogo;
