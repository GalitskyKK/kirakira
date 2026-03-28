/**
 * Скрипт telegram-web-app.js не подключаем на обычном сайте — иначе каждый визит
 * дергает telegram.org и создаёт объект WebApp даже вне Telegram.
 * В мини-приложении подгружаем SDK динамически (или используем уже инжект клиентом).
 */

const SDK_URL = 'https://telegram.org/js/telegram-web-app.js'

/**
 * Эвристика: страница открыта как Telegram Mini App / внутри клиента Telegram.
 */
export function isLikelyTelegramMiniAppContext(): boolean {
  if (typeof window === 'undefined') {
    return false
  }

  const { search, hash } = window.location
  const combined = `${search}${hash}`.toLowerCase()
  if (search.toLowerCase().includes('tg_sdk=1')) {
    return true
  }
  if (
    combined.includes('tgwebapp') ||
    combined.includes('tgwebappdata') ||
    combined.includes('tgwebappstartparam') ||
    search.toLowerCase().includes('startapp=')
  ) {
    return true
  }

  const ref = document.referrer.toLowerCase()
  if (ref.includes('telegram.org') || ref.includes('t.me')) {
    return true
  }

  if (/Telegram/i.test(navigator.userAgent)) {
    return true
  }

  try {
    if (window.self !== window.top) {
      return true
    }
  } catch {
    return true
  }

  return false
}

let loadPromise: Promise<void> | null = null

/**
 * Гарантирует наличие window.Telegram.WebApp в контексте мини-приложения.
 * В обычном браузере ничего не загружает.
 */
export function ensureTelegramWebAppSdk(): Promise<void> {
  if (typeof window === 'undefined') {
    return Promise.resolve()
  }

  if (window.Telegram?.WebApp) {
    return Promise.resolve()
  }

  if (!isLikelyTelegramMiniAppContext()) {
    return Promise.resolve()
  }

  if (loadPromise) {
    return loadPromise
  }

  loadPromise = new Promise<void>((resolve, reject) => {
    const existing = document.querySelector(
      `script[src="${SDK_URL}"]`
    ) as HTMLScriptElement | null
    if (existing) {
      existing.addEventListener('load', () => resolve(), { once: true })
      existing.addEventListener(
        'error',
        () => reject(new Error('telegram-web-app.js load error')),
        { once: true }
      )
      return
    }

    const script = document.createElement('script')
    script.src = SDK_URL
    script.async = true
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('telegram-web-app.js load error'))
    document.head.appendChild(script)
  })

  return loadPromise
}
