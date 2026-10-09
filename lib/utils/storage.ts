/**
 * Safe LocalStorage & SessionStorage utilities to prevent QuotaExceededError and SSR issues
 * Includes an in-memory fallback store so app operation is never interrupted even if localStorage is full or disabled.
 */

const inMemoryStore: Record<string, string> = {};

export function safeLocalStorageSet(key: string, value: any): void {
  try {
    const serialized = typeof value === 'string' ? value : JSON.stringify(value);
    
    // Always store in in-memory store as instant guaranteed fallback
    inMemoryStore[key] = serialized;

    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        window.localStorage.setItem(key, serialized);
      } catch (err: any) {
        // Handle QuotaExceededError gracefully without crashing
        // Attempt to clean non-essential cached keys
        try {
          window.localStorage.removeItem('amanita_promptpay_settings');
          window.localStorage.removeItem('amanita_contact_settings_temp');
          window.localStorage.removeItem('amanita_cached_products');
          // Retry once
          window.localStorage.setItem(key, serialized);
        } catch {
          // If still failing, keep in memory store only
        }
      }
    }
  } catch {
    // Fail silently, in-memory store already holds the state
  }
}

export function safeLocalStorageGet<T = any>(key: string, fallback: T | null = null): T | null {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const raw = window.localStorage.getItem(key);
        if (raw) {
          try {
            return JSON.parse(raw) as T;
          } catch {
            return raw as unknown as T;
          }
        }
      } catch {
        // localStorage read blocked or failed, fall through to memoryStore
      }
    }

    // Check in-memory store
    if (inMemoryStore[key]) {
      try {
        return JSON.parse(inMemoryStore[key]) as T;
      } catch {
        return inMemoryStore[key] as unknown as T;
      }
    }
  } catch {
    // Return fallback on any unexpected error
  }
  return fallback;
}
