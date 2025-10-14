import { calculateGardenerLevel } from './achievements'
import { EXPERIENCE_REWARDS } from './achievements'

/**
 * 📈 Хелперы для расчёта опыта с бонусами от уровня
 *
 * Бонус experienceBonus из уровня применяется ко всем наградам опыта
 */

/**
 * Вычисляет награду опыта с учётом бонуса от уровня
 *
 * @param baseReward - Базовая награда опыта
 * @param userExperience - Текущий опыт пользователя
 * @returns Финальная награда с бонусом
 *
 * @example
 * // Пользователь уровня 10 (experienceBonus: 25%)
 * calculateExperienceReward(100, 5682) // 125 опыта (100 * 1.25)
 */
export function calculateExperienceReward(
  baseReward: number,
  userExperience: number
): number {
  const levelInfo = calculateGardenerLevel(userExperience)
  const bonusMultiplier = 1 + levelInfo.experienceBonus / 100
  return Math.floor(baseReward * bonusMultiplier)
}

/**
 * Вычисляет награду опыта за запись настроения
 *
 * @param userExperience - Текущий опыт пользователя
 * @param isFirstOfDay - Первая запись за день
 * @returns Награда опыта
 */
export function calculateMoodExperience(
  userExperience: number,
  isFirstOfDay: boolean
): number {
  const baseReward = isFirstOfDay
    ? EXPERIENCE_REWARDS.FIRST_MOOD_OF_DAY
    : EXPERIENCE_REWARDS.DAILY_MOOD

  return calculateExperienceReward(baseReward, userExperience)
}

/**
 * Вычисляет награду опыта за новый элемент
 *
 * @param userExperience - Текущий опыт пользователя
 * @param rarity - Редкость элемента
 * @returns Награда опыта
 */
export function calculateElementExperience(
  userExperience: number,
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary'
): number {
  let baseReward = EXPERIENCE_REWARDS.NEW_PLANT

  // Дополнительный опыт за редкие элементы
  switch (rarity) {
    case 'rare':
      baseReward += EXPERIENCE_REWARDS.RARE_PLANT
      break
    case 'epic':
      baseReward += EXPERIENCE_REWARDS.EPIC_PLANT
      break
    case 'legendary':
      baseReward += EXPERIENCE_REWARDS.LEGENDARY_PLANT
      break
  }

  return calculateExperienceReward(baseReward, userExperience)
}

/**
 * Вычисляет награду опыта за стрик
 *
 * @param userExperience - Текущий опыт пользователя
 * @param streakDays - Текущий стрик в днях
 * @returns Награда опыта (0 если не достигнут порог)
 */
export function calculateStreakExperience(
  userExperience: number,
  streakDays: number
): number {
  let baseReward = 0

  // Награда только на определённых порогах
  if (streakDays === 7) {
    baseReward = EXPERIENCE_REWARDS.STREAK_MILESTONE_7
  } else if (streakDays === 30) {
    baseReward = EXPERIENCE_REWARDS.STREAK_MILESTONE_30
  } else if (streakDays === 100) {
    baseReward = EXPERIENCE_REWARDS.STREAK_MILESTONE_100
  }

  if (baseReward === 0) return 0

  return calculateExperienceReward(baseReward, userExperience)
}

/**
 * Вычисляет награду опыта за социальное действие
 *
 * @param userExperience - Текущий опыт пользователя
 * @param action - Тип действия
 * @returns Награда опыта
 */
export function calculateSocialExperience(
  userExperience: number,
  action: 'share' | 'visit' | 'like' | 'comment'
): number {
  let baseReward = 0

  switch (action) {
    case 'share':
      baseReward = EXPERIENCE_REWARDS.SHARE_GARDEN
      break
    case 'visit':
      baseReward = EXPERIENCE_REWARDS.VISIT_FRIEND
      break
    case 'like':
      baseReward = EXPERIENCE_REWARDS.LIKE_GARDEN
      break
    case 'comment':
      baseReward = EXPERIENCE_REWARDS.COMMENT_GARDEN
      break
  }

  return calculateExperienceReward(baseReward, userExperience)
}

/**
 * Вычисляет награду опыта за достижение
 *
 * @param userExperience - Текущий опыт пользователя
 * @returns Награда опыта
 */
export function calculateAchievementExperience(userExperience: number): number {
  return calculateExperienceReward(
    EXPERIENCE_REWARDS.COMPLETE_ACHIEVEMENT,
    userExperience
  )
}

/**
 * Вычисляет награду опыта за квест
 *
 * @param userExperience - Текущий опыт пользователя
 * @param questType - Тип квеста
 * @returns Награда опыта
 */
export function calculateQuestExperience(
  userExperience: number,
  questType: 'daily' | 'weekly'
): number {
  const baseReward =
    questType === 'daily'
      ? EXPERIENCE_REWARDS.COMPLETE_DAILY_QUEST
      : EXPERIENCE_REWARDS.COMPLETE_WEEKLY_QUEST

  return calculateExperienceReward(baseReward, userExperience)
}

/**
 * Вычисляет награду опыта за челлендж
 *
 * @param userExperience - Текущий опыт пользователя
 * @returns Награда опыта
 */
export function calculateChallengeExperience(userExperience: number): number {
  return calculateExperienceReward(
    EXPERIENCE_REWARDS.COMPLETE_CHALLENGE,
    userExperience
  )
}

/**
 * Вычисляет бонус опыта за активную неделю
 *
 * @param userExperience - Текущий опыт пользователя
 * @returns Награда опыта
 */
export function calculateWeeklyActiveBonus(userExperience: number): number {
  return calculateExperienceReward(
    EXPERIENCE_REWARDS.WEEKLY_ACTIVE,
    userExperience
  )
}

/**
 * Вычисляет общий опыт с учётом всех бонусов
 *
 * Используется для отображения предпросмотра наград
 *
 * @param userExperience - Текущий опыт пользователя
 * @param actions - Объект с выполненными действиями
 * @returns Общий опыт
 */
export function calculateTotalExperience(
  userExperience: number,
  actions: {
    moodEntries?: number
    firstMoodOfDay?: boolean
    newElements?: Array<'common' | 'uncommon' | 'rare' | 'epic' | 'legendary'>
    streakDays?: number
    socialActions?: Array<'share' | 'visit' | 'like' | 'comment'>
    achievements?: number
    dailyQuests?: number
    weeklyQuests?: number
    challenges?: number
    weeklyActiveBonus?: boolean
  }
): number {
  let totalExp = 0

  // Настроение
  if (actions.moodEntries) {
    totalExp += calculateMoodExperience(
      userExperience,
      actions.firstMoodOfDay ?? false
    )
  }

  // Элементы
  if (actions.newElements) {
    for (const rarity of actions.newElements) {
      totalExp += calculateElementExperience(userExperience, rarity)
    }
  }

  // Стрик
  if (actions.streakDays) {
    totalExp += calculateStreakExperience(userExperience, actions.streakDays)
  }

  // Социальные действия
  if (actions.socialActions) {
    for (const action of actions.socialActions) {
      totalExp += calculateSocialExperience(userExperience, action)
    }
  }

  // Достижения
  if (actions.achievements) {
    totalExp +=
      calculateAchievementExperience(userExperience) * actions.achievements
  }

  // Квесты
  if (actions.dailyQuests) {
    totalExp +=
      calculateQuestExperience(userExperience, 'daily') * actions.dailyQuests
  }
  if (actions.weeklyQuests) {
    totalExp +=
      calculateQuestExperience(userExperience, 'weekly') * actions.weeklyQuests
  }

  // Челленджи
  if (actions.challenges) {
    totalExp +=
      calculateChallengeExperience(userExperience) * actions.challenges
  }

  // Бонус за активную неделю
  if (actions.weeklyActiveBonus) {
    totalExp += calculateWeeklyActiveBonus(userExperience)
  }

  return totalExp
}
