import { useRef } from 'react';
import { Pressable, View, StyleSheet } from 'react-native';

import { BrandLogo } from '../brand';
import { StatusRing } from '../status/StatusRing';
import type { StatusRingTone } from '../../status/statusLogic';
import { ACCOUNT_SWITCH_HOLD_MS } from '../../status/statusLogic';
import { useGochaTheme } from '../../theme';

type Props = {
  onPress: () => void;
  onHold?: () => void;
  accessibilityLabel?: string;
  logoSize?: number;
  showBadge?: boolean;
  statusTone?: StatusRingTone;
};

export function AccountLogoButton({
  onPress,
  onHold,
  accessibilityLabel = 'View statuses',
  logoSize = 40,
  showBadge = false,
  statusTone = null,
}: Props) {
  const { theme } = useGochaTheme();
  const holdTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const held = useRef(false);

  function clearHold() {
    if (holdTimer.current) {
      clearTimeout(holdTimer.current);
      holdTimer.current = null;
    }
  }

  return (
    <Pressable
      onPressIn={() => {
        held.current = false;
        clearHold();
        if (!onHold) {
          return;
        }
        holdTimer.current = setTimeout(() => {
          held.current = true;
          onHold();
        }, ACCOUNT_SWITCH_HOLD_MS);
      }}
      onPressOut={clearHold}
      onPress={() => {
        if (held.current) {
          return;
        }
        onPress();
      }}
      delayLongPress={ACCOUNT_SWITCH_HOLD_MS}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={styles.button}>
      <View style={{ width: logoSize + 6, height: logoSize + 6, alignItems: 'center', justifyContent: 'center' }}>
      <StatusRing tone={statusTone} size={logoSize}>
        <View style={[styles.circle, { width: logoSize, height: logoSize, borderRadius: logoSize / 2 }]}>
          <BrandLogo size={logoSize} style={styles.logo} />
          {showBadge ? (
            <View
              style={[
                styles.badge,
                {
                  backgroundColor: theme.colors.accent,
                  borderColor: theme.colors.background,
                },
              ]}
            />
          ) : null}
        </View>
      </StatusRing>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'visible',
  },
  circle: {
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    resizeMode: 'cover',
    borderRadius: 999,
  },
  badge: {
    position: 'absolute',
    top: -1,
    right: -1,
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 2,
  },
});
