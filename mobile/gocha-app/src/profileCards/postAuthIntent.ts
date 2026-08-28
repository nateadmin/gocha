const CHAT_KEY = 'gocha.pendingDirectChatUserId';
const SIGNIN_KEY = 'gocha.startSignIn';

let memoryChatUserId: number | null = null;
let memoryStartSignIn = false;

function write(key: string, value: string): void {
  if (typeof sessionStorage === 'undefined') {
    return;
  }
  try {
    sessionStorage.setItem(key, value);
  } catch {
    // Private mode or native webview without storage.
  }
}

function read(key: string): string | null {
  if (typeof sessionStorage === 'undefined') {
    return null;
  }
  try {
    return sessionStorage.getItem(key);
  } catch {
    return null;
  }
}

function remove(key: string): void {
  if (typeof sessionStorage === 'undefined') {
    return;
  }
  try {
    sessionStorage.removeItem(key);
  } catch {
    // ignore
  }
}

export function queueDirectChat(userId: number): void {
  memoryChatUserId = userId;
  write(CHAT_KEY, String(userId));
}

export function queueSignInThenDirectChat(userId: number): void {
  queueDirectChat(userId);
  memoryStartSignIn = true;
  write(SIGNIN_KEY, '1');
}

export function takePendingDirectChatUserId(): number | null {
  const stored = read(CHAT_KEY);
  remove(CHAT_KEY);
  const fromStore = stored ? Number.parseInt(stored, 10) : NaN;
  const userId = Number.isFinite(fromStore) && fromStore > 0 ? fromStore : memoryChatUserId;
  memoryChatUserId = null;
  return userId && userId > 0 ? userId : null;
}

export function consumeStartSignIn(): boolean {
  const stored = read(SIGNIN_KEY) === '1';
  remove(SIGNIN_KEY);
  const start = stored || memoryStartSignIn;
  memoryStartSignIn = false;
  return start;
}
