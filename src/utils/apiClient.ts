/**
 * 🔐 API Client с автоматической аутентификацией Telegram
 * Добавляет Authorization header во все запросы к API
 */

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
    console.warn('⚠️ Telegram WebApp initData not available')
    return ''
  }

  return telegram.initData
}

/**
 * Создает headers для API запроса с аутентификацией
 */
export function createAuthHeaders(
  additionalHeaders: Record<string, string> = {}
): HeadersInit {
  const initData = getTelegramInitData()

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...additionalHeaders,
  }

  // Добавляем Authorization header если есть initData
  if (initData) {
    headers['Authorization'] = `tma ${initData}`
  }

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
