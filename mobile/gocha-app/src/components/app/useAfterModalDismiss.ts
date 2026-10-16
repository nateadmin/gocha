import { useCallback, useRef } from 'react';
import { Platform } from 'react-native';

/**
 * iOS cannot present a second Modal or the share sheet while a Modal is still
 * animating closed, so the follow-up action (open report reasons, share, ...)
 * would silently do nothing. On iOS the action runs from the closing Modal's
 * onDismiss (with a timeout fallback); elsewhere it runs right away.
 */
export function useAfterModalDismiss(): {
  runAfterDismiss: (action: () => void) => void;
  onDismiss: () => void;
} {
  const pending = useRef<(() => void) | null>(null);

  const flush = useCallback(() => {
    const action = pending.current;
    pending.current = null;
    action?.();
  }, []);

  const runAfterDismiss = useCallback(
    (action: () => void) => {
      if (Platform.OS !== 'ios') {
        action();
        return;
      }
      pending.current = action;
      setTimeout(flush, 500);
    },
    [flush],
  );

  return { runAfterDismiss, onDismiss: flush };
}
