import type { ImageSourcePropType } from 'react-native';

/** Web preview: Logo.jpeg is copied to the Vite build output (publicDir). */
export const brandLogoSource: ImageSourcePropType = {
  uri: `${import.meta.env.BASE_URL}Logo.jpeg`,
};
