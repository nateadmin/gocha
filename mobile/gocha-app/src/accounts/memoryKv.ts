const memory = new Map<string, string>();

export function memoryKvGet(key: string): string | null {
  try {
    if (typeof localStorage !== 'undefined') {
      const value = localStorage.getItem(key);
      if (value != null) {
        memory.set(key, value);
        return value;
      }
    }
  } catch {
    // Native has no localStorage. Use process memory so a live session is not empty.
  }
  return memory.get(key) ?? null;
}

export function memoryKvSet(key: string, value: string): void {
  memory.set(key, value);
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(key, value);
    }
  } catch {
    // Keep the in-memory copy.
  }
}

export function memoryKvRemove(key: string): void {
  memory.delete(key);
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(key);
    }
  } catch {
    // Keep the in-memory copy cleared.
  }
}
