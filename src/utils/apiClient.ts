/**
 * 🔐 API Client с автоматической аутентификацией Telegram
 * Добавляет Authorization header во все запросы к API
 * Поддерживает как Telegram Mini App (initData), так и браузерную версию (JWT токен)
 */

const JWT_STORAGE_KEY = 'kirakira_auth_token'

/**
 * Получает JWT токен из localStorage
 */
function getJWTToken(): string | null {
  if (typeof window === 'undefined') {
    return null
  }

  try {
    return localStorage.getItem(JWT_STORAGE_KEY)
  } catch (error) {
    console.warn('⚠️ Failed to read JWT token from localStorage:', error)
    return null
  }
}

/**
 * Сохраняет JWT токен в localStorage
 */
export function setJWTToken(token: string): void {
  if (typeof window === 'undefined') {
    return
  }

  try {
    localStorage.setItem(JWT_STORAGE_KEY, token)
  } catch (error) {
    console.warn('⚠️ Failed to save JWT token to localStorage:', error)
  }
}

/**
 * Удаляет JWT токен из localStorage
 */
export function clearJWTToken(): void {
  if (typeof window === 'undefined') {
    return
  }

  try {
    localStorage.removeItem(JWT_STORAGE_KEY)
  } catch (error) {
    console.warn('⚠️ Failed to clear JWT token from localStorage:', error)
  }
}

/**
 * Декодирует JWT токен и возвращает payload (без валидации подписи)
 * Используется только для получения telegramId на клиенте
 */
export function decodeJWT(token: string): { telegram_id?: number } | null {
  try {
    const parts = token.split('.')
    if (parts.length !== 3 || !parts[1]) {
      return null
    }

    const encodedPayload = parts[1]
    // Base64 URL decode
    const payload = JSON.parse(
      atob(encodedPayload.replace(/-/g, '+').replace(/_/g, '/'))
    )

    return payload
  } catch (error) {
    console.warn('⚠️ Failed to decode JWT token:', error)
    return null
  }
}

/**
 * Получает telegramId из JWT токена
 */
export function getTelegramIdFromJWT(): number | null {
  const token = getJWTToken()
  if (!token) {
    return null
  }

  const payload = decodeJWT(token)
  return payload?.telegram_id ?? null
}

/**
 * Получает Telegram initData для аутентификации
 */
function getTelegramInitData(): string {
  if (typeof window === 'undefined') {
    return ''
  }

  // Проверяем наличие Telegram WebApp
  const telegram = window.Telegram?.WebApp

  if (!telegram?.initData) {
    return ''
  }

  return telegram.initData
}

/**
 * Определяет, находимся ли мы в Telegram Mini App
 */
function isTelegramEnv(): boolean {
  return typeof window !== 'undefined' && !!window.Telegram?.WebApp
}

/**
 * Создает headers для API запроса с аутентификацией
 * Приоритет: Telegram initData (если в Telegram) > JWT токен (если в браузере)
 */
export function createAuthHeaders(
  additionalHeaders: Record<string, string> = {}
): HeadersInit {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...additionalHeaders,
  }

  // Если в Telegram Mini App - используем initData
  if (isTelegramEnv()) {
    const initData = getTelegramInitData()
    if (initData) {
      headers['Authorization'] = `tma ${initData}`
      return headers
    }
  }

  // Если в браузере - используем JWT токен
  const jwtToken = getJWTToken()
  if (jwtToken) {
    headers['Authorization'] = `Bearer ${jwtToken}`
    return headers
  }

  // Если нет ни initData, ни JWT - возвращаем headers без Authorization
  // (некоторые запросы могут работать без авторизации)
  return headers
}

/**
 * Обертка для fetch с автоматической аутентификацией
 */
export async function authenticatedFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const headers = createAuthHeaders(
    options.headers as Record<string, string> | undefined
  )

  return fetch(url, {
    ...options,
    headers,
  })
}

/**
 * GET запрос с аутентификацией
 */
export async function apiGet<T = unknown>(url: string): Promise<T> {
  const response = await authenticatedFetch(url, {
    method: 'GET',
  })

  if (!response.ok) {
    throw new Error(`API GET error: ${response.status} ${response.statusText}`)
  }

  return response.json()
}

/**
 * POST запрос с аутентификацией
 */
export async function apiPost<T = unknown, B = unknown>(
  url: string,
  data: B
): Promise<T> {
  const response = await authenticatedFetch(url, {
    method: 'POST',
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    throw new Error(`API POST error: ${response.status} ${response.statusText}`)
  }

  return response.json()
}

/**
 * PUT запрос с аутентификацией
 */
export async function apiPut<T = unknown, B = unknown>(
  url: string,
  data: B
): Promise<T> {
  const response = await authenticatedFetch(url, {
    method: 'PUT',
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    throw new Error(`API PUT error: ${response.status} ${response.statusText}`)
  }

  return response.json()
}

/**
 * DELETE запрос с аутентификацией
 */
export async function apiDelete<T = unknown>(url: string): Promise<T> {
  const response = await authenticatedFetch(url, {
    method: 'DELETE',
  })

  if (!response.ok) {
    throw new Error(
      `API DELETE error: ${response.status} ${response.statusText}`
    )
  }

  return response.json()
}
