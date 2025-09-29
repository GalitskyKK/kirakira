/**
 * 🏆 ХЕЛПЕР ДЛЯ АВТОМАТИЧЕСКОГО НАЧИСЛЕНИЯ ОПЫТА
 * Вызывается при действиях пользователя для синхронизации с БД
 */

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

/**
 * Отправляет запрос на начисление опыта пользователю
 * ОБНОВЛЕНО: Использует централизованную функцию из userStore для синхронизации
 */
export async function addExperience({
  telegramId,
  points,
  reason,
  details = '',
}: AddExperienceOptions): Promise<{
  success: boolean
  data?: any
  error?: string
}> {
  try {
    // Импортируем userStore динамически для избежания циклических зависимостей
    const { useUserStore } = await import('@/stores/userStore')
    const { addExperienceAndSync, currentUser } = useUserStore.getState()

    // Проверяем, что пользователь соответствует
    if (currentUser?.telegramId === telegramId) {
      console.log(`🏆 Using centralized experience sync for user ${telegramId}`)
      return await addExperienceAndSync(points, `${reason}: ${details}`.trim())
    }

    // Fallback для других пользователей (например, в dev режиме)
    console.log(
      `🏆 Adding ${points} XP to user ${telegramId} for ${reason} (fallback)`
    )

    const response = await fetch('/api/profile?action=add_experience', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        telegramId,
        experiencePoints: points,
        reason: `${reason}: ${details}`.trim(),
      }),
    })

    if (!response.ok) {
      console.warn(`❌ Failed to add experience: ${response.status}`)
      return { success: false, error: `HTTP ${response.status}` }
    }

    const result = await response.json()

    if (result.success) {
      console.log(`✅ Added ${points} XP for ${reason}:`, result.data)
      return { success: true, data: result.data }
    } else {
      console.warn(`❌ Experience API error:`, result.error)
      return { success: false, error: result.error }
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
): Promise<{ success: boolean; data?: any; error?: string }> {
  const rareTypes = ['rare', 'epic', 'legendary']

  if (rareTypes.includes(rarity.toLowerCase())) {
    return experienceHelpers.rarePlant(telegramId, elementType, rarity)
  }

  return Promise.resolve({ success: true })
}
