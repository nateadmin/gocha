import { Platform } from 'react-native';

/**
 * Phone verification uses the Firebase web SDK, which needs a browser DOM for
 * reCAPTCHA. Until native Firebase is linked, phone sign-in and phone linking
 * are offered on web only; iOS and Android use email.
 */
export const PHONE_SIGN_IN_SUPPORTED = Platform.OS === 'web';
