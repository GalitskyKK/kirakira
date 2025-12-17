/**
 * 💰 УТИЛИТЫ ДЛЯ НАЧИСЛЕНИЯ ВАЛЮТЫ
 * Хелперы для автоматического начисления валюты за действия
 *
 * Использует прямой API вызов через authenticatedFetch (утилита не может использовать React Query хуки)
 */

import { authenticatedFetch } from '@/utils/apiClient'
import type {
  StandardApiResponse,
  CurrencyApiTransactionResponse,
} from '@/types/api'
import {
  type CurrencyType,
  type CurrencyReason,
  type SproutEarnReason,
  type GemEarnReason,
  SPROUT_REWARDS,
  GEM_REWARDS,
  calculateLevelUpReward,
  getReasonDescription,
} from '@/types/currency'
import type { RarityLevel } from '@/types/garden'

// ===============================================
// 💰 ОСНОВНАЯ ФУНКЦИЯ ДЛЯ НАЧИСЛЕНИЯ ВАЛЮТЫ
// ===============================================

/**
 * Начислить валюту пользователю
 * Использует прямой API вызов (утилита не может использовать React Query хуки)
 */
export async function awardCurrency(
  telegramId: number,
  currencyType: CurrencyType,
  amount: number,
  reason: CurrencyReason,
  description?: string,
  metadata?: Record<string, unknown>
): Promise<{
  success: boolean
  newBalance?: number
  transactionId?: string
  error?: string
}> {
  try {
    const response = await authenticatedFetch('/api/currency?action=earn', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        telegramId,
        currencyType,
        amount,
        reason,
        description: description || getReasonDescription(reason),
        metadata,
      }),
    })

    if (!response.ok) {
      throw new Error(`Failed to earn currency: ${response.status}`)
    }

    const result = (await response.json()) as StandardApiResponse<{
      balance_after: number
      transaction_id: string
    }>

    if (!result.success || !result.data) {
      console.error(`❌ Failed to award currency: ${result.error}`)
      return {
        success: false,
        error: result.error ?? 'Failed to earn currency',
      }
    }

    return {
      success: true,
      newBalance: result.data.balance_after,
      transactionId: result.data.transaction_id,
    }
  } catch (error) {
    console.error('❌ Error awarding currency:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

// ===============================================
// 🌿 РОСТКИ - АВТОМАТИЧЕСКОЕ НАЧИСЛЕНИЕ
// ===============================================

/**
 * Начислить ростки за действие
 */
export async function awardSprouts(
  telegramId: number,
  reason: SproutEarnReason,
  metadata?: Record<string, unknown>
): Promise<{
  success: boolean
  amount: number
  newBalance?: number
  error?: string
}> {
  const reward = SPROUT_REWARDS[reason]

  if (!reward) {
    console.error(`❌ Unknown sprout reward reason: ${reason}`)
    return {
      success: false,
      amount: 0,
      error: 'Unknown reward reason',
    }
  }

  const result = await awardCurrency(
    telegramId,
    'sprouts',
    reward.amount,
    reason,
    reward.description,
    metadata
  )

  return {
    ...result,
    amount: reward.amount,
  }
}

/**
 * Начислить ростки за повышение уровня
 * Формула: 100 + (level * 50)
 */
export async function awardLevelUpSprouts(
  telegramId: number,
  level: number
): Promise<{
  success: boolean
  amount: number
  newBalance?: number
  error?: string
}> {
  const amount = calculateLevelUpReward(level)

  const result = await awardCurrency(
    telegramId,
    'sprouts',
    amount,
    'level_up',
    `Повышение до уровня ${level}`,
    { level }
  )

  return {
    ...result,
    amount,
  }
}

/**
 * Начислить ростки за получение элемента (по редкости)
 */
export async function awardElementSprouts(
  telegramId: number,
  rarity: RarityLevel,
  elementId: string
): Promise<{
  success: boolean
  amount: number
  newBalance?: number
  error?: string
}> {
  const rarityReasonMap: Record<RarityLevel, SproutEarnReason> = {
    common: 'element_common',
    uncommon: 'element_uncommon',
    rare: 'element_rare',
    epic: 'element_epic',
    legendary: 'element_legendary',
  }

  const reason = rarityReasonMap[rarity]
  const reward = SPROUT_REWARDS[reason]

  if (!reward) {
    return {
      success: false,
      amount: 0,
      error: 'Unknown rarity',
    }
  }

  const result = await awardCurrency(
    telegramId,
    'sprouts',
    reward.amount,
    reason,
    `Получен ${rarity} элемент`,
    { elementId, rarity }
  )

  return {
    ...result,
    amount: reward.amount,
  }
}

/**
 * Начислить ростки за стрик
 */
export async function awardStreakSprouts(
  telegramId: number,
  streakDays: number
): Promise<{
  success: boolean
  amount: number
  newBalance?: number
  error?: string
}> {
  // Определяем вехи стрика
  const streakMilestones: Array<{
    days: number
    reason: SproutEarnReason
  }> = [
    { days: 3, reason: 'streak_3_days' },
    { days: 7, reason: 'streak_7_days' },
    { days: 14, reason: 'streak_14_days' },
    { days: 30, reason: 'streak_30_days' },
    { days: 100, reason: 'streak_100_days' },
    { days: 365, reason: 'streak_365_days' },
  ]

  // Находим соответствующую веху
  const milestone = streakMilestones.find(m => m.days === streakDays)

  if (!milestone) {
    // Не веха, не награждаем
    return {
      success: true, // Не ошибка, просто не веха
      amount: 0,
    }
  }

  const reward = SPROUT_REWARDS[milestone.reason]

  const result = await awardCurrency(
    telegramId,
    'sprouts',
    reward.amount,
    milestone.reason,
    `Стрик ${streakDays} дней!`,
    { streakDays }
  )

  return {
    ...result,
    amount: reward.amount,
  }
}

// ===============================================
// 💎 КРИСТАЛЛЫ - АВТОМАТИЧЕСКОЕ НАЧИСЛЕНИЕ
// ===============================================

/**
 * Начислить кристаллы за действие
 */
export async function awardGems(
  telegramId: number,
  reason: GemEarnReason,
  metadata?: Record<string, unknown>
): Promise<{
  success: boolean
  amount: number
  newBalance?: number
  error?: string
}> {
  const reward = GEM_REWARDS[reason]

  if (!reward) {
    console.error(`❌ Unknown gem reward reason: ${reason}`)
    return {
      success: false,
      amount: 0,
      error: 'Unknown reward reason',
    }
  }

  const result = await awardCurrency(
    telegramId,
    'gems',
    reward.amount,
    reason,
    reward.description,
    metadata
  )

  return {
    ...result,
    amount: reward.amount,
  }
}

/**
 * Начислить кристаллы за стрик (недельный/месячный)
 */
export async function awardStreakGems(
  telegramId: number,
  streakDays: number
): Promise<{
  success: boolean
  amount: number
  newBalance?: number
  error?: string
}> {
  if (streakDays === 7) {
    return awardGems(telegramId, 'weekly_streak', { streakDays })
  }

  if (streakDays === 30) {
    return awardGems(telegramId, 'monthly_streak', { streakDays })
  }

  return {
    success: true,
    amount: 0,
  }
}

/**
 * Начислить кристаллы за повышение уровня (вехи: 5, 10)
 */
export async function awardLevelUpGems(
  telegramId: number,
  level: number
): Promise<{
  success: boolean
  amount: number
  newBalance?: number
  error?: string
}> {
  if (level % 10 === 0) {
    // Каждые 10 уровней
    return awardGems(telegramId, 'level_up_milestone_10', { level })
  }

  if (level % 5 === 0) {
    // Каждые 5 уровней
    return awardGems(telegramId, 'level_up_milestone_5', { level })
  }

  return {
    success: true,
    amount: 0,
  }
}

// ===============================================
// 🎁 КОМБИНИРОВАННЫЕ НАГРАДЫ
// ===============================================

/**
 * Начислить все награды за запись настроения
 */
export async function awardMoodRewards(
  telegramId: number,
  isFirstToday: boolean
): Promise<{
  sprouts: number
  gems: number
  success: boolean
}> {
  const sproutsResult = await awardSprouts(
    telegramId,
    isFirstToday ? 'first_mood_of_day' : 'daily_mood'
  )

  return {
    sprouts: sproutsResult.amount,
    gems: 0,
    success: sproutsResult.success,
  }
}

/**
 * Начислить все награды за стрик
 */
export async function awardStreakRewards(
  telegramId: number,
  streakDays: number
): Promise<{
  sprouts: number
  gems: number
  success: boolean
}> {
  const [sproutsResult, gemsResult] = await Promise.all([
    awardStreakSprouts(telegramId, streakDays),
    awardStreakGems(telegramId, streakDays),
  ])

  return {
    sprouts: sproutsResult.amount,
    gems: gemsResult.amount,
    success: sproutsResult.success && gemsResult.success,
  }
}

/**
 * Начислить все награды за повышение уровня
 */
export async function awardLevelUpRewards(
  telegramId: number,
  level: number
): Promise<{
  sprouts: number
  gems: number
  success: boolean
}> {
  const [sproutsResult, gemsResult] = await Promise.all([
    awardLevelUpSprouts(telegramId, level),
    awardLevelUpGems(telegramId, level),
  ])

  return {
    sprouts: sproutsResult.amount,
    gems: gemsResult.amount,
    success: sproutsResult.success && gemsResult.success,
  }
}

/**
 * Начислить награды за разблокировку достижения
 * Обычное достижение: 150 ростков
 * Редкое достижение: 300 ростков + 5 кристаллов
 */
export async function awardAchievementRewards(
  telegramId: number,
  achievementId: string,
  rarity?: string
): Promise<{
  sprouts: number
  gems: number
  success: boolean
}> {
  const isRare =
    rarity === 'rare' || rarity === 'epic' || rarity === 'legendary'

  // Начисляем ростки
  const sproutReason: SproutEarnReason = isRare
    ? 'rare_achievement'
    : 'achievement_unlock'
  const sproutsResult = await awardSprouts(telegramId, sproutReason, {
    achievementId,
    rarity,
  })

  // Начисляем кристаллы только за редкие достижения
  const gemsResult = isRare
    ? await awardGems(telegramId, 'rare_achievement', {
        achievementId,
        rarity,
      })
    : { success: true as const, amount: 0, newBalance: undefined }

  console.log(
    `🏆 Награды за достижение ${achievementId}: ${sproutsResult.amount} ростков, ${gemsResult.amount} кристаллов`
  )

  return {
    sprouts: sproutsResult.amount,
    gems: gemsResult.amount,
    success: sproutsResult.success && gemsResult.success,
  }
}

// ===============================================
// 📊 УТИЛИТЫ
// ===============================================

/**
 * Предварительный просмотр награды (без начисления)
 */
export function previewReward(
  reason: CurrencyReason,
  level?: number
): {
  amount: number
  description: string
  currencyType: CurrencyType
} {
  if (reason in SPROUT_REWARDS) {
    const reward =
      reason === 'level_up' && level !== undefined
        ? {
            amount: calculateLevelUpReward(level),
            description: `Повышение до уровня ${level}`,
          }
        : SPROUT_REWARDS[reason as SproutEarnReason]

    return {
      amount: reward.amount,
      description: reward.description,
      currencyType: 'sprouts',
    }
  }

  if (reason in GEM_REWARDS) {
    const reward = GEM_REWARDS[reason as GemEarnReason]
    return {
      amount: reward.amount,
      description: reward.description,
      currencyType: 'gems',
    }
  }

  return {
    amount: 0,
    description: 'Неизвестная награда',
    currencyType: 'sprouts',
  }
}

/**
 * Получить общую статистику заработка за период
 * Использует прямой API вызов для получения транзакций
 */
export async function getCurrencyEarnedStats(
  telegramId: number,
  fromDate?: Date,
  toDate?: Date
): Promise<{
  sprouts: number
  gems: number
  transactionCount: number
}> {
  try {
    // Загружаем транзакции через API
    const response = await authenticatedFetch(
      `/api/currency?action=transactions&telegramId=${telegramId}&limit=1000`
    )

    if (!response.ok) {
      throw new Error(`Failed to load transactions: ${response.status}`)
    }

    const result =
      (await response.json()) as StandardApiResponse<CurrencyApiTransactionResponse>

    if (!result.success || !result.data) {
      throw new Error(result.error ?? 'Failed to load transactions')
    }

    const transactions = result.data.transactions ?? []

    // Фильтруем по дате если указано
    const filteredTransactions = transactions.filter(
      (tx: { transactionType: string; createdAt: string }) => {
        if (tx.transactionType !== 'earn') return false

        if (fromDate || toDate) {
          const txDate = new Date(tx.createdAt)

          if (fromDate && txDate < fromDate) return false
          if (toDate && txDate > toDate) return false
        }

        return true
      }
    )

    const sprouts = filteredTransactions
      .filter((tx: { currencyType: string }) => tx.currencyType === 'sprouts')
      .reduce((sum: number, tx: { amount: number }) => sum + tx.amount, 0)

    const gems = filteredTransactions
      .filter((tx: { currencyType: string }) => tx.currencyType === 'gems')
      .reduce((sum: number, tx: { amount: number }) => sum + tx.amount, 0)

    return {
      sprouts,
      gems,
      transactionCount: filteredTransactions.length,
    }
  } catch (error) {
    console.error('❌ Error getting currency stats:', error)
    return {
      sprouts: 0,
      gems: 0,
      transactionCount: 0,
    }
  }
}
