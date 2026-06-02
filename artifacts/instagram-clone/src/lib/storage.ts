/** @deprecated App data is stored in Neon — do not use browser storage for messages or media. */

export function safeSetItem(_key: string, _value: string): boolean {
  return false;
}

export function safeGetItem(_key: string): string | null {
  return null;
}

export function safeRemoveItem(_key: string): boolean {
  return true;
}

export function clearExpiredStories(_userId: string): void {
  /* stories expire via Neon API */
}
