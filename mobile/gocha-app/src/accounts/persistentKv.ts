import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Native disk storage behind memoryKv. Web uses localStorage instead
 * (persistentKv.web.ts), so this native module never enters the web bundle.
 */

const LOAD_TIMEOUT_MS = 3000;

// Android runs each AsyncStorage call on its own IO coroutine, so two quick
// writes to one key can land out of order. Queue them so disk matches memory.
let writes: Promise<void> = Promise.resolve();

function enqueue(write: () => Promise<void>): void {
  writes = writes.then(write).catch(() => undefined);
}

/** Resolves with what is on disk, or nothing if storage does not answer in time. */
export async function loadPersistedKv(keys: string[]): Promise<Record<string, string | null>> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<Record<string, string | null>>((resolve) => {
    timer = setTimeout(() => resolve({}), LOAD_TIMEOUT_MS);
  });
  try {
    return await Promise.race([AsyncStorage.getMany(keys), timeout]);
  } finally {
    clearTimeout(timer);
  }
}

export function persistKvSet(key: string, value: string): void {
  enqueue(() => AsyncStorage.setItem(key, value));
}

export function persistKvRemove(key: string): void {
  enqueue(() => AsyncStorage.removeItem(key));
}
