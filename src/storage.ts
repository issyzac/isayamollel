/** Small wrappers around localStorage. Storage can be blocked, so every call is guarded. */

export function readStore(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function writeStore(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* ignore: the choice just won't be remembered */
  }
}
