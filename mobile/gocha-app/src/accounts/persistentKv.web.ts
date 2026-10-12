// Web persists through localStorage in memoryKv; nothing extra to load or write.
export async function loadPersistedKv(_keys: string[]): Promise<Record<string, string | null>> {
  return {};
}

export function persistKvSet(_key: string, _value: string): void {}

export function persistKvRemove(_key: string): void {}
