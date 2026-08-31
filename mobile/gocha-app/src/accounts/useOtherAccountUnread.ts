import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import type { AppStateStatus } from 'react-native';

import { fetchInboxUnread } from '../api/client';
import type { StoredAccount } from './accountStore';
import { otherAccountUnreadIds, unreadMapsEqual } from './otherAccountUnread';

const POLL_MS = 30_000;

function isPageVisible(): boolean {
  if (typeof document !== 'undefined') {
    return document.visibilityState === 'visible';
  }
  return AppState.currentState === 'active';
}

export function useOtherAccountUnread(
  accounts: StoredAccount[],
  activeAccountId: number | null,
): number[] {
  const [unreadByUserId, setUnreadByUserId] = useState<Record<number, boolean>>({});
  const inFlightRef = useRef(false);
  const unreadRef = useRef(unreadByUserId);
  unreadRef.current = unreadByUserId;

  const load = useCallback(async () => {
    if (inFlightRef.current) {
      return;
    }
    const others = accounts.filter((account) => account.userId !== activeAccountId && account.deviceToken);
    if (others.length === 0) {
      if (Object.keys(unreadRef.current).length > 0) {
        setUnreadByUserId({});
      }
      return;
    }
    inFlightRef.current = true;
    try {
      const next: Record<number, boolean> = {};
      await Promise.all(
        others.map(async (account) => {
          try {
            const summary = await fetchInboxUnread(account.deviceToken);
            next[account.userId] = summary.hasUnread;
          } catch {
            // Keep the last known flag. A 401 here must not sign the active user out.
            if (unreadRef.current[account.userId] === true) {
              next[account.userId] = true;
            }
          }
        }),
      );
      if (!unreadMapsEqual(unreadRef.current, next)) {
        setUnreadByUserId(next);
      }
    } finally {
      inFlightRef.current = false;
    }
  }, [accounts, activeAccountId]);

  useEffect(() => {
    void load();
    let timer: ReturnType<typeof setInterval> | null = null;
    const startTimer = () => {
      if (timer) {
        clearInterval(timer);
      }
      timer = setInterval(() => {
        if (isPageVisible()) {
          void load();
        }
      }, POLL_MS);
    };
    startTimer();
    const onAppState = (state: AppStateStatus) => {
      if (state === 'active') {
        void load();
        startTimer();
      }
    };
    const appSub = AppState.addEventListener('change', onAppState);
    const onVisibility = () => {
      if (isPageVisible()) {
        void load();
      }
    };
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', onVisibility);
    }
    return () => {
      if (timer) {
        clearInterval(timer);
      }
      appSub.remove();
      if (typeof document !== 'undefined') {
        document.removeEventListener('visibilitychange', onVisibility);
      }
    };
  }, [load]);

  return otherAccountUnreadIds(accounts, activeAccountId, unreadByUserId);
}
