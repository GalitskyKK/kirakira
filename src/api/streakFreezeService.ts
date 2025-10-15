import { apiGet, apiPost } from '@/utils/apiClient'

/**
 * 🧊 API сервис для работы с заморозками стрика
 */

export interface StreakFreezeData {
  readonly manual: number // Обычные заморозки
  readonly auto: number // Авто-заморозки
  readonly max: number // Максимальное накопление
  readonly canAccumulate: boolean
}

export interface UseStreakFreezeParams {
  readonly telegramId: number
  readonly freezeType: 'auto' | 'manual'
  readonly missedDays: number
}

export interface UseStreakFreezeResponse {
  readonly success: boolean
  readonly freezeType: 'auto' | 'manual'
  readonly missedDays: number
  readonly remaining: {
    readonly manual: number
    readonly auto: number
  }
  readonly currentStreak: number
  readonly error?: string
}

export interface ResetStreakParams {
  readonly telegramId: number
}

export interface ResetStreakResponse {
  readonly success: boolean
  readonly currentStreak: number
  readonly longestStreak: number
  readonly message: string
  readonly error?: string
}

/**
 * Получить количество заморозок стрика
 */
export async function getStreakFreezes(
  telegramId: number
): Promise<StreakFreezeData> {
  try {
    const response = await apiGet<{
      success: boolean
      data: StreakFreezeData
      error?: string
    }>(`/api/user?action=get-streak-freezes&telegramId=${telegramId}`)

    if (!response.success || !response.data) {
      throw new Error(response.error ?? 'Failed to fetch streak freezes')
    }

    return response.data
  } catch (error) {
    console.error('Error getting streak freezes:', error)
    throw error
  }
}

/**
 * Использовать заморозку стрика
 */
export async function useStreakFreezeAPI(
  params: UseStreakFreezeParams
): Promise<UseStreakFreezeResponse> {
  try {
    const response = await apiPost<{
      success: boolean
      data: UseStreakFreezeResponse
      error?: string
    }>('/api/user?action=use-streak-freeze', params)

    if (!response.success || !response.data) {
      throw new Error(response.error ?? 'Failed to use streak freeze')
    }

    return response.data
  } catch (error) {
    console.error('Error using streak freeze:', error)
    throw error
  }
}

/**
 * Сбросить стрик (без использования заморозок)
 */
export async function resetStreak(
  params: ResetStreakParams
): Promise<ResetStreakResponse> {
  try {
    const response = await apiPost<{
      success: boolean
      data: ResetStreakResponse
      error?: string
    }>('/api/user?action=reset-streak', params)

    if (!response.success || !response.data) {
      throw new Error(response.error ?? 'Failed to reset streak')
    }

    return response.data
  } catch (error) {
    console.error('Error resetting streak:', error)
    throw error
  }
}

/**
 * Проверить нужна ли заморозка стрика
 * @returns количество пропущенных дней (0 если не нужна заморозка)
 */
export function checkMissedDays(
  lastMoodDate: Date | null,
  currentDate: Date = new Date()
): number {
  if (!lastMoodDate) return 0

  const lastMood = new Date(lastMoodDate)
  lastMood.setHours(0, 0, 0, 0)

  const today = new Date(currentDate)
  today.setHours(0, 0, 0, 0)

  const diffTime = today.getTime() - lastMood.getTime()
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))

  // Если последняя запись была вчера или сегодня - всё ОК
  if (diffDays <= 1) return 0

  // Возвращаем количество пропущенных дней (без сегодняшнего)
  return diffDays - 1
}

/**
 * Проверить можно ли восстановить стрик
 */
export function canRecoverStreak(missedDays: number): boolean {
  return missedDays > 0 && missedDays <= 7
}

/**
 * Получить тип заморозки для автоматического использования
 * Приоритет: авто > обычная
 */
export function getRecommendedFreezeType(
  missedDays: number,
  availableFreezes: { manual: number; auto: number }
): 'auto' | 'manual' | null {
  // Авто-заморозка только для 1 пропущенного дня
  if (missedDays === 1 && availableFreezes.auto > 0) {
    return 'auto'
  }

  // Обычная заморозка если достаточно
  if (availableFreezes.manual >= missedDays) {
    return 'manual'
  }

  return null
}
