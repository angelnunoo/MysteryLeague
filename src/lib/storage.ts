const REMEMBER_KEY = 'ml-remember'

export function getRememberMe(): boolean {
  return localStorage.getItem(REMEMBER_KEY) !== '0'
}

export function setRememberMe(remember: boolean): void {
  localStorage.setItem(REMEMBER_KEY, remember ? '1' : '0')
}

function activeStore(): Storage {
  return getRememberMe() ? localStorage : sessionStorage
}

export const authStorage = {
  getItem(key: string): string | null {
    return activeStore().getItem(key)
  },
  setItem(key: string, value: string): void {
    activeStore().setItem(key, value)
  },
  removeItem(key: string): void {
    localStorage.removeItem(key)
    sessionStorage.removeItem(key)
  },
}

export function clearAuthTokens(): void {
  for (const store of [localStorage, sessionStorage]) {
    const keys: string[] = []
    for (let index = 0; index < store.length; index += 1) {
      const key = store.key(index)
      if (key && (key.startsWith('sb-') || key === 'ml-session')) keys.push(key)
    }
    for (const key of keys) store.removeItem(key)
  }
}
