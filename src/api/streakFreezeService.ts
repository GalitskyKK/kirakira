/**
 * 🧊 API SERVICE: Работа с заморозками стрика
 * Полный набор функций для управления заморозками
 */

import { authenticatedFetch } from '@/utils/apiClient'
import { getLocalDateString } from '@/utils/dateHelpers'
import type {
  BuyStreakFreezeRequest,
  BuyStreakFreezeResponse,
} from '@/types/streakFreeze'

// ============================================
// ТИПЫ ДЛЯ API ЗАПРОСОВ И ОТВЕТОВ
// ============================================

export interface StreakFreezeData {
  readonly manual: number
  readonly auto: number
  readonly max: number
  readonly canAccumulate: boolean
}

interface ApplyStreakFreezeRequest {
  readonly telegramId: number
  readonly freezeType: 'manual' | 'auto'
  readonly missedDays: number
  readonly localDate?: string
}

interface ApplyStreakFreezeResponse {
  readonly success: boolean
  readonly data?: {
    readonly freezeType: 'manual' | 'auto'
    readonly missedDays: number
    readonly remaining: {
      readonly manual: number
      readonly auto: number
    }
    readonly currentStreak: number
  }
  readonly error?: string
}

interface ResetStreakRequest {
  readonly telegramId: number
}

interface ResetStreakResponse {
  readonly success: boolean
  readonly data?: {
    readonly currentStreak: number
    readonly longestStreak: number
    readonly message: string
  }
  readonly error?: string
}

interface CheckStreakResponse {
  readonly success: boolean
  readonly data?: {
    readonly missedDays: number
    readonly currentStreak: number
    readonly streakState: 'ok' | 'at_risk' | 'broken'
    readonly lastCheckin: string | null
  }
  readonly error?: string
}

// ============================================
// API ФУНКЦИИ
// ============================================

/**
 * Получает данные о заморозках стрика пользователя
 */
export async function getStreakFreezes(
  telegramId: number
): Promise<StreakFreezeData> {
  try {
    const response = await authenticatedFetch(
      `/api/user?action=get-streak-freezes&telegramId=${telegramId}`
    )

    if (!response.ok) {
      throw new Error(`Failed to fetch freezes: ${response.status}`)
    }

    const result = (await response.json()) as {
      success: boolean
      data?: StreakFreezeData
      error?: string
    }

    if (!result.success || !result.data) {
      throw new Error(result.error || 'Failed to get streak freezes')
    }

    return result.data
  } catch (error) {
    console.error('❌ Error getting streak freezes:', error)
    // Возвращаем дефолтные значения при ошибке
    return {
      manual: 0,
      auto: 0,
      max: 3,
      canAccumulate: true,
    }
  }
}

/**
 * Применяет заморозку стрика (использует одну заморозку)
 */
export async function applyStreakFreeze(
  request: ApplyStreakFreezeRequest
): Promise<{
  readonly freezeType: 'manual' | 'auto'
  readonly missedDays: number
  readonly remaining: {
    readonly manual: number
    readonly auto: number
  }
  readonly currentStreak: number
}> {
  try {
    const withLocalDate: ApplyStreakFreezeRequest = {
      ...request,
      localDate: request.localDate ?? getLocalDateString(new Date()),
    }

    const response = await authenticatedFetch(
      '/api/user?action=use-streak-freeze',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(withLocalDate),
      }
    )

    if (!response.ok) {
      const errorData = (await response.json()) as { error?: string }
      throw new Error(
        errorData.error || `HTTP ${response.status}: ${response.statusText}`
      )
    }

    const result = (await response.json()) as ApplyStreakFreezeResponse

    if (!result.success || !result.data) {
      throw new Error(result.error || 'Failed to apply streak freeze')
    }

    return result.data
  } catch (error) {
    console.error('❌ Error applying streak freeze:', error)
    throw error
  }
}

/**
 * Сбрасывает стрик пользователя
 */
export async function resetStreak(request: ResetStreakRequest): Promise<{
  readonly currentStreak: number
  readonly longestStreak: number
  readonly message: string
}> {
  try {
    const withLocalDate: ResetStreakRequest & { readonly localDate: string } = {
      ...request,
      localDate: getLocalDateString(new Date()),
    }

    const response = await authenticatedFetch('/api/user?action=reset-streak', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(withLocalDate),
    })

    if (!response.ok) {
      const errorData = (await response.json()) as { error?: string }
      throw new Error(
        errorData.error || `HTTP ${response.status}: ${response.statusText}`
      )
    }

    const result = (await response.json()) as ResetStreakResponse

    if (!result.success || !result.data) {
      throw new Error(result.error || 'Failed to reset streak')
    }

    return result.data
  } catch (error) {
    console.error('❌ Error resetting streak:', error)
    throw error
  }
}

/**
 * Проверяет состояние стрика пользователя
 */
export async function checkStreak(telegramId: number): Promise<{
  readonly missedDays: number
  readonly currentStreak: number
  readonly streakState: 'ok' | 'at_risk' | 'broken'
  readonly lastCheckin: string | null
}> {
  try {
    const localDate = getLocalDateString(new Date())
    const response = await authenticatedFetch(
      `/api/user?action=check-streak&telegramId=${telegramId}&localDate=${localDate}`
    )

    if (!response.ok) {
      throw new Error(`Failed to check streak: ${response.status}`)
    }

    const result = (await response.json()) as CheckStreakResponse

    if (!result.success || !result.data) {
      throw new Error(result.error || 'Failed to check streak')
    }

    return result.data
  } catch (error) {
    console.error('❌ Error checking streak:', error)
    // Возвращаем безопасные дефолтные значения
    return {
      missedDays: 0,
      currentStreak: 0,
      streakState: 'ok',
      lastCheckin: null,
    }
  }
}

/**
 * Определяет рекомендуемый тип заморозки на основе пропущенных дней
 */
export function getRecommendedFreezeType(
  missedDays: number,
  freezeData: StreakFreezeData
): 'auto' | 'manual' | null {
  // Если заморозки не нужны
  if (missedDays <= 0) return null

  // Авто-заморозка приоритетнее и покрывает ровно 1 день
  if (missedDays === 1 && freezeData.auto > 0) {
    return 'auto'
  }

  // Если есть достаточно ручных заморозок
  if (freezeData.manual >= missedDays) {
    return 'manual'
  }

  // Если ничего не доступно
  return null
}

/**
 * Покупка заморозок стрика
 */
export async function buyStreakFreeze(
  request: BuyStreakFreezeRequest
): Promise<BuyStreakFreezeResponse> {
  try {
    const response = await authenticatedFetch(
      '/api/user?action=buy-streak-freeze',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
      }
    )

    if (!response.ok) {
      const errorData = (await response.json()) as { error?: string }
      throw new Error(
        errorData.error || `HTTP ${response.status}: ${response.statusText}`
      )
    }

    const result = (await response.json()) as BuyStreakFreezeResponse

    if (!result.success) {
      throw new Error(result.error || 'Failed to buy streak freeze')
    }

    return result
  } catch (error) {
    console.error('❌ Error buying streak freeze:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}
