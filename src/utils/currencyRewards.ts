/**
 * 💰 УТИЛИТЫ ДЛЯ НАЧИСЛЕНИЯ ВАЛЮТЫ
 * Хелперы для автоматического начисления валюты за действия
 */

import { useCurrencyStore } from '@/stores/currencyStore'
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
    const { earnCurrency } = useCurrencyStore.getState()

    const result = await earnCurrency(
      telegramId,
      currencyType,
      amount,
      reason,
      description || getReasonDescription(reason),
      metadata
    )

    if (result.success) {
      console.log(
        `✅ Awarded ${amount} ${currencyType} for ${reason}: ${description}`
      )
    } else {
      console.error(`❌ Failed to award currency: ${result.error}`)
    }

    return result
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
    const { loadTransactions } = useCurrencyStore.getState()
    const transactions = await loadTransactions(telegramId, 1000) // Загружаем больше для статистики

    // Фильтруем по дате если указано
    const filteredTransactions = transactions.filter(tx => {
      if (tx.transactionType !== 'earn') return false

      const txDate = new Date(tx.createdAt)

      if (fromDate && txDate < fromDate) return false
      if (toDate && txDate > toDate) return false

      return true
    })

    const sprouts = filteredTransactions
      .filter(tx => tx.currencyType === 'sprouts')
      .reduce((sum, tx) => sum + tx.amount, 0)

    const gems = filteredTransactions
      .filter(tx => tx.currencyType === 'gems')
      .reduce((sum, tx) => sum + tx.amount, 0)

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
