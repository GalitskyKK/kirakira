/**
 * 🎯 DAILY QUESTS API SERVICE
 * Сервис для работы с ежедневными заданиями
 */

import { apiGet, apiPost } from '@/utils/apiClient'
import { getLocalDateString } from '@/utils/dateHelpers'
import type {
  DailyQuestsResponse,
  ClaimQuestResponse,
  UpdateProgressResponse,
} from '@/types/dailyQuests'

// ===============================================
// 📡 API ENDPOINTS
// ===============================================

const DAILY_QUESTS_ENDPOINT = '/api/challenges'

// ===============================================
// 🎯 DAILY QUESTS API FUNCTIONS
// ===============================================

/**
 * Получает ежедневные задания пользователя
 */
export async function getDailyQuests(
  telegramId: number
): Promise<DailyQuestsResponse> {
  // 🔧 ИСПРАВЛЕНИЕ: Передаем локальную дату клиента для корректной работы с часовыми поясами
  const localDate = getLocalDateString(new Date())
  const tzOffsetMinutes = new Date().getTimezoneOffset()
  const url = `${DAILY_QUESTS_ENDPOINT}?action=daily-quests&telegramId=${telegramId}&localDate=${localDate}&tzOffsetMinutes=${tzOffsetMinutes}`
  const response = await apiGet<{
    success: boolean
    data: DailyQuestsResponse
    error?: string
  }>(url)

  if (!response.success) {
    throw new Error(response.error || 'Ошибка при получении заданий')
  }

  // 🔧 ИСПРАВЛЕНИЕ: Корректируем статус квестов на клиенте с учетом локального времени
  // Это необходимо, так как cleanup_expired_daily_quests проверяет истечение по UTC,
  // а на клиенте нужно проверять по локальному времени пользователя
  const correctedData = {
    ...response.data,
    quests: response.data.quests.map(quest => {
      const expiresAt =
        quest.expiresAt instanceof Date
          ? quest.expiresAt
          : new Date(quest.expiresAt)
      const now = new Date()
      const isExpiredByTime = now > expiresAt

      // Если квест помечен как expired в БД, но по локальному времени еще не истек
      if (quest.status === 'expired' && !isExpiredByTime) {
        // Восстанавливаем статус в зависимости от прогресса
        if (quest.currentProgress >= quest.targetValue) {
          return { ...quest, status: 'completed' as const }
        }
        return { ...quest, status: 'active' as const }
      }

      // Если квест активен или выполнен, но по локальному времени истек
      if (
        (quest.status === 'active' || quest.status === 'completed') &&
        isExpiredByTime
      ) {
        return { ...quest, status: 'expired' as const }
      }

      return quest
    }),
  }

  return correctedData
}

/**
 * Получает награду за выполненное задание
 */
export async function claimDailyQuest(
  telegramId: number,
  questId: string
): Promise<ClaimQuestResponse> {
  const url = `${DAILY_QUESTS_ENDPOINT}?action=claim-daily-quest`
  type ClaimDailyQuestApiData =
    | ClaimQuestResponse
    | {
        readonly quest: ClaimQuestResponse['quest']
        readonly balance: ClaimQuestResponse['newBalance']
        readonly rewards: ClaimQuestResponse['rewards']
      }

  const response = await apiPost<{
    success: boolean
    data: ClaimDailyQuestApiData
    error?: string
  }>(url, {
    telegramId,
    questId,
  })

  if (!response.success) {
    throw new Error(response.error || 'Ошибка при получении награды')
  }

  const data = response.data
  if ('newBalance' in data) {
    return data
  }

  return {
    quest: data.quest,
    newBalance: data.balance,
    rewards: data.rewards,
  }
}

/**
 * Обновляет прогресс задания
 */
export async function updateQuestProgress(
  telegramId: number,
  questIdOrType: string,
  increment: number = 1
): Promise<UpdateProgressResponse> {
  type UpdateDailyProgressRequest =
    | { telegramId: number; increment: number; questId: string }
    | { telegramId: number; increment: number; questType: string }

  let requestBody: UpdateDailyProgressRequest

  // Если это UUID (questId), используем questId, иначе questType
  if (questIdOrType.includes('-')) {
    requestBody = { telegramId, increment, questId: questIdOrType }
  } else {
    requestBody = { telegramId, increment, questType: questIdOrType }
  }

  const url = `${DAILY_QUESTS_ENDPOINT}?action=update-daily-progress`
  const response = await apiPost<{
    success: boolean
    data: UpdateProgressResponse
    error?: string
  }>(url, requestBody)

  if (!response.success) {
    throw new Error(response.error || 'Ошибка при обновлении прогресса')
  }

  return response.data
}

// ===============================================
// 🎯 BATCH OPERATIONS
// ===============================================

/**
 * Обновляет прогресс для нескольких заданий одновременно
 */
export async function updateMultipleQuestProgress(
  telegramId: number,
  questUpdates: Array<{ questId: string; increment: number }>
): Promise<UpdateProgressResponse[]> {
  const promises = questUpdates.map(({ questId, increment }) =>
    updateQuestProgress(telegramId, questId, increment)
  )

  return Promise.all(promises)
}

/**
 * Получает награды за несколько выполненных заданий
 */
export async function claimMultipleQuests(
  telegramId: number,
  questIds: string[]
): Promise<ClaimQuestResponse[]> {
  const promises = questIds.map(questId => claimDailyQuest(telegramId, questId))

  return Promise.all(promises)
}

// ===============================================
// 🎯 UTILITY FUNCTIONS
// ===============================================

/**
 * Проверяет, можно ли обновить прогресс задания
 */
export function canUpdateQuestProgress(quest: {
  status: string
  expiresAt: Date
  currentProgress: number
  targetValue: number
}): boolean {
  const now = new Date()
  return (
    quest.status === 'active' &&
    quest.expiresAt > now &&
    quest.currentProgress < quest.targetValue
  )
}

/**
 * Проверяет, можно ли получить награду за задание
 */
export function canClaimQuestReward(quest: {
  status: string
  expiresAt: Date
  currentProgress: number
  targetValue: number
}): boolean {
  const now = new Date()
  return (
    quest.status === 'completed' &&
    quest.expiresAt > now &&
    quest.currentProgress >= quest.targetValue
  )
}

/**
 * Получает задания по категории
 */
export function getQuestsByCategory<T extends { questCategory: string }>(
  quests: T[],
  category: string
): T[] {
  return quests.filter(quest => quest.questCategory === category)
}

/**
 * Получает задания по статусу
 */
export function getQuestsByStatus<T extends { status: string }>(
  quests: T[],
  status: string
): T[] {
  return quests.filter(quest => quest.status === status)
}

/**
 * Получает активные задания
 */
export function getActiveQuests<T extends { status: string }>(
  quests: T[]
): T[] {
  return quests.filter(quest => quest.status === 'active')
}

/**
 * Получает выполненные задания
 */
export function getCompletedQuests<T extends { status: string }>(
  quests: T[]
): T[] {
  return quests.filter(quest => quest.status === 'completed')
}

/**
 * Получает задания с полученными наградами
 */
export function getClaimedQuests<T extends { status: string }>(
  quests: T[]
): T[] {
  return quests.filter(quest => quest.status === 'claimed')
}

/**
 * Получает истекшие задания
 */
export function getExpiredQuests<T extends { status: string }>(
  quests: T[]
): T[] {
  return quests.filter(quest => quest.status === 'expired')
}

/**
 * Вычисляет общий прогресс выполнения заданий
 */
export function calculateOverallProgress<
  T extends { currentProgress: number; targetValue: number },
>(quests: T[]): { completed: number; total: number; percentage: number } {
  if (quests.length === 0) {
    return { completed: 0, total: 0, percentage: 0 }
  }

  const completed = quests.reduce(
    (sum, quest) => sum + quest.currentProgress,
    0
  )
  const total = quests.reduce((sum, quest) => sum + quest.targetValue, 0)
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0

  return { completed, total, percentage }
}

/**
 * Вычисляет количество выполненных заданий
 */
export function countCompletedQuests<T extends { status: string }>(
  quests: T[]
): number {
  return quests.filter(
    quest => quest.status === 'completed' || quest.status === 'claimed'
  ).length
}

/**
 * Вычисляет количество заданий, готовых к получению награды
 */
export function countClaimableQuests<T extends { status: string }>(
  quests: T[]
): number {
  return quests.filter(quest => quest.status === 'completed').length
}

/**
 * Вычисляет общие награды за день
 */
export function calculateTotalRewards<
  T extends { rewards: { sprouts: number; gems?: number; experience: number } },
>(quests: T[]): { sprouts: number; gems: number; experience: number } {
  return quests.reduce(
    (total, quest) => ({
      sprouts: total.sprouts + quest.rewards.sprouts,
      gems: total.gems + (quest.rewards.gems || 0),
      experience: total.experience + quest.rewards.experience,
    }),
    { sprouts: 0, gems: 0, experience: 0 }
  )
}

// ===============================================
// 🎯 ERROR HANDLING
// ===============================================

/**
 * Обрабатывает ошибки API daily quests
 */
export function handleDailyQuestError(error: unknown): string {
  if (error instanceof Error) {
    return error.message
  }

  if (typeof error === 'object' && error !== null && 'message' in error) {
    return String(error.message)
  }

  return 'Произошла неизвестная ошибка'
}

/**
 * Проверяет, является ли ошибка связанной с сетью
 */
export function isNetworkError(error: unknown): boolean {
  if (error instanceof Error) {
    return (
      error.message.includes('Network Error') ||
      error.message.includes('timeout') ||
      error.message.includes('fetch')
    )
  }
  return false
}

/**
 * Проверяет, является ли ошибка связанной с аутентификацией
 */
export function isAuthError(error: unknown): boolean {
  if (error instanceof Error) {
    return (
      error.message.includes('401') ||
      error.message.includes('Unauthorized') ||
      error.message.includes('Forbidden')
    )
  }
  return false
}

// ===============================================
// 🎯 CACHE HELPERS
// ===============================================

/**
 * Создает ключ кеша для daily quests
 */
export function createDailyQuestsCacheKey(telegramId: number): string {
  return `daily-quests-${telegramId}`
}

/**
 * Создает ключ кеша для конкретного задания
 */
export function createQuestCacheKey(questId: string): string {
  return `quest-${questId}`
}

/**
 * Создает ключ кеша для статистики заданий
 */
export function createQuestStatsCacheKey(telegramId: number): string {
  return `quest-stats-${telegramId}`
}
