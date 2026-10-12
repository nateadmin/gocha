import { loadPersistedKv, persistKvRemove, persistKvSet } from './persistentKv';

const memory = new Map<string, string>();

function hasLocalStorage(): boolean {
  try {
    return typeof localStorage !== 'undefined' && localStorage !== null;
  } catch {
    return false;
  }
}

/**
 * Native has no localStorage, so values are kept in memory for synchronous
 * reads and written through to disk. Call this once before anything reads
 * the keys so a saved session survives an app restart.
 */
export async function hydrateMemoryKv(keys: string[]): Promise<void> {
  if (hasLocalStorage()) {
    return;
  }
  try {
    const stored = await loadPersistedKv(keys);
    for (const key of keys) {
      const value = stored[key];
      if (value != null && !memory.has(key)) {
        memory.set(key, value);
      }
    }
  } catch {
    // Unreadable storage behaves like a fresh install.
  }
}

export function memoryKvNeedsHydration(): boolean {
  return !hasLocalStorage();
}

export function memoryKvGet(key: string): string | null {
  try {
    if (hasLocalStorage()) {
      const value = localStorage.getItem(key);
      if (value != null) {
        memory.set(key, value);
        return value;
      }
    }
  } catch {
    // Fall back to the in-memory copy.
  }
  return memory.get(key) ?? null;
}

export function memoryKvSet(key: string, value: string): void {
  memory.set(key, value);
  if (!hasLocalStorage()) {
    persistKvSet(key, value);
    return;
  }
  try {
    localStorage.setItem(key, value);
  } catch {
    // Keep the in-memory copy.
  }
}

export function memoryKvRemove(key: string): void {
  memory.delete(key);
  if (!hasLocalStorage()) {
    persistKvRemove(key);
    return;
  }
  try {
    localStorage.removeItem(key);
  } catch {
    // Keep the in-memory copy cleared.
  }
}
