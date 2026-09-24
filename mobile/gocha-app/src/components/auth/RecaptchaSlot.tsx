import { Platform, StyleSheet, View } from 'react-native';

import { RECAPTCHA_HOST_ID } from '../../auth/phoneFirebase';

export function RecaptchaSlot() {
  if (Platform.OS !== 'web') {
    return null;
  }

  return (
    <View
      nativeID={RECAPTCHA_HOST_ID}
      collapsable={false}
      style={styles.host}
    />
  );
}

const styles = StyleSheet.create({
  host: {
    minHeight: 78,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
