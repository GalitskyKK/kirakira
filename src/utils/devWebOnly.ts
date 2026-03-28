/**
 * В DEV: принудительный «чистый браузер» без Telegram Mini App.
 * Нужен, когда расширения подставляют window.Telegram и ломают локальную проверку почты/JWT.
 *
 * Открой http://localhost:5173/?web_only=1 один раз — флаг сохранится в sessionStorage.
 * Сброс: ?web_only=0 или очистить sessionStorage ключ kirakira_dev_web_only.
 */

const STORAGE_KEY = 'kirakira_dev_web_only'

export function syncDevWebOnlyFromUrl(): void {
  if (!import.meta.env.DEV || typeof window === 'undefined') {
    return
  }
  const value = new URLSearchParams(window.location.search).get('web_only')
  if (value === '1') {
    try {
      sessionStorage.setItem(STORAGE_KEY, '1')
    } catch {
      /* ignore */
    }
  }
  if (value === '0') {
    try {
      sessionStorage.removeItem(STORAGE_KEY)
    } catch {
      /* ignore */
    }
  }
}

export function isDevWebOnlyMode(): boolean {
  if (!import.meta.env.DEV || typeof window === 'undefined') {
    return false
  }
  try {
    return sessionStorage.getItem(STORAGE_KEY) === '1'
  } catch {
    return false
  }
}
