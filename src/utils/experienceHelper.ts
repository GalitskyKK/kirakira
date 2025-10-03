/**
 * 🏆 ХЕЛПЕР ДЛЯ АВТОМАТИЧЕСКОГО НАЧИСЛЕНИЯ ОПЫТА
 *
 * ПОСЛЕ РЕФАКТОРИНГА:
 * Использует централизованный API клиент вместо прямых fetch запросов.
 *
 * Для использования в React компонентах предпочтительнее использовать
 * useAddExperience() хук из React Query.
 */

import { profileApi } from '@/api/client'
import { EXPERIENCE_REWARDS } from './achievements'

type ExperienceReason =
  | 'mood_entry'
  | 'first_mood_today'
  | 'garden_element'
  | 'rare_element'
  | 'share_garden'
  | 'streak_milestone'
  | 'achievement'

interface AddExperienceOptions {
  readonly telegramId: number
  readonly points: number
  readonly reason: ExperienceReason
  readonly details?: string
}

interface ExperienceResult {
  readonly success: boolean
  readonly data?: {
    readonly experience: number
    readonly level: number
    readonly leveledUp?: boolean
  }
  readonly error?: string
}

/**
 * Отправляет запрос на начисление опыта пользователю
 *
 * ОБНОВЛЕНО: Использует централизованный API клиент с Zod валидацией
 */
export async function addExperience({
  telegramId,
  points,
  reason,
  details = '',
}: AddExperienceOptions): Promise<ExperienceResult> {
  try {
    console.log(`🏆 Adding ${points} XP to user ${telegramId} for ${reason}`)

    const result = await profileApi.addExperience(
      telegramId,
      points,
      `${reason}: ${details}`.trim()
    )

    if (result.success && result.data) {
      console.log(`✅ Added ${points} XP for ${reason}:`, result.data)

      // Обновляем локальный стор если это текущий пользователь
      const { useUserStore } = await import('@/stores/userStore')
      const { currentUser, updateUser } = useUserStore.getState()

      if (currentUser?.telegramId === telegramId) {
        updateUser({
          experience: result.data.experience,
          level: result.data.level,
        })
        console.log('🔄 Updated local user store with new XP')
      }

      return { success: true, data: result.data }
    } else {
      console.warn(`❌ Experience API error:`, result.error)
      return { success: false, error: result.error ?? 'Unknown API error' }
    }
  } catch (error) {
    console.error('❌ Experience helper error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Быстрые функции для частых действий
 */
export const experienceHelpers = {
  // Настроения
  moodEntry: (telegramId: number, mood: string) =>
    addExperience({
      telegramId,
      points: EXPERIENCE_REWARDS.DAILY_MOOD,
      reason: 'mood_entry',
      details: mood,
    }),

  firstMoodToday: (telegramId: number, mood: string) =>
    addExperience({
      telegramId,
      points: EXPERIENCE_REWARDS.FIRST_MOOD_OF_DAY,
      reason: 'first_mood_today',
      details: mood,
    }),

  // Сад
  newPlant: (telegramId: number, plantType: string, rarity: string) =>
    addExperience({
      telegramId,
      points: EXPERIENCE_REWARDS.NEW_PLANT,
      reason: 'garden_element',
      details: `${plantType} (${rarity})`,
    }),

  rarePlant: (telegramId: number, plantType: string, rarity: string) =>
    addExperience({
      telegramId,
      points: EXPERIENCE_REWARDS.RARE_PLANT,
      reason: 'rare_element',
      details: `${plantType} (${rarity})`,
    }),

  // Социальные
  shareGarden: (telegramId: number) =>
    addExperience({
      telegramId,
      points: EXPERIENCE_REWARDS.SHARE_GARDEN,
      reason: 'share_garden',
      details: 'garden screenshot shared',
    }),

  // Стрики и достижения
  streakMilestone: (telegramId: number, streakDays: number) =>
    addExperience({
      telegramId,
      points: EXPERIENCE_REWARDS.STREAK_MILESTONE,
      reason: 'streak_milestone',
      details: `${streakDays} days`,
    }),

  achievement: (telegramId: number, achievementId: string) =>
    addExperience({
      telegramId,
      points: EXPERIENCE_REWARDS.COMPLETE_ACHIEVEMENT,
      reason: 'achievement',
      details: achievementId,
    }),
}

/**
 * Проверяет является ли элемент редким и дает дополнительный XP
 */
export function checkRareElementBonus(
  telegramId: number,
  elementType: string,
  rarity: string
): Promise<ExperienceResult> {
  const rareTypes = ['rare', 'epic', 'legendary']

  if (rareTypes.includes(rarity.toLowerCase())) {
    return experienceHelpers.rarePlant(telegramId, elementType, rarity)
  }

  return Promise.resolve({ success: true })
}
