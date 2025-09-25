import type { User, MoodStats, Achievement, GardenerLevel } from '@/types'
import { AchievementCategory } from '@/types'

// Определения достижений (синхронизировано с БД)
export const ACHIEVEMENTS_CONFIG: Omit<
  Achievement,
  'isUnlocked' | 'unlockedAt' | 'progress'
>[] = [
  {
    id: 'first_steps',
    name: 'Первые шаги',
    description: 'Вырастить первое растение',
    emoji: '🌱',
    category: AchievementCategory.GARDEN,
  },
  {
    id: 'week_streak',
    name: 'Неделя силы',
    description: 'Стрик 7 дней',
    emoji: '🔥',
    category: AchievementCategory.STREAK,
  },
  {
    id: 'month_streak',
    name: 'Месяц постоянства',
    description: 'Стрик 30 дней',
    emoji: '🏆',
    category: AchievementCategory.STREAK,
  },
  {
    id: 'gardener',
    name: 'Садовник',
    description: '10 растений в саду',
    emoji: '🌻',
    category: AchievementCategory.GARDEN,
  },
  {
    id: 'rare_hunter',
    name: 'Охотник за редкостями',
    description: 'Найти редкое растение',
    emoji: '💎',
    category: AchievementCategory.GARDEN,
  },
  {
    id: 'mood_analyst',
    name: 'Аналитик настроения',
    description: '30 записей настроения',
    emoji: '📊',
    category: AchievementCategory.MOOD,
  },
  {
    id: 'persistence_master',
    name: 'Мастер постоянства',
    description: '100 дней в приложении',
    emoji: '🎯',
    category: AchievementCategory.STREAK,
  },
  {
    id: 'ambassador',
    name: 'Амбассадор',
    description: 'Поделиться садом 5 раз',
    emoji: '🚀',
    category: AchievementCategory.SOCIAL,
  },
]

// Уровни садовника (синхронизировано с БД)
export const GARDENER_LEVELS: GardenerLevel[] = [
  {
    level: 1,
    name: 'Новичок',
    emoji: '🌱',
    minExperience: 0,
    maxExperience: 99,
    benefits: ['Базовые растения', 'Ежедневные награды'],
  },
  {
    level: 2,
    name: 'Любитель',
    emoji: '🌿',
    minExperience: 100,
    maxExperience: 299,
    benefits: ['Редкие растения', 'Быстрый рост'],
  },
  {
    level: 3,
    name: 'Садовник',
    emoji: '🌻',
    minExperience: 300,
    maxExperience: 699,
    benefits: ['Особые растения', 'Бонус к опыту'],
  },
  {
    level: 4,
    name: 'Эксперт',
    emoji: '🌳',
    minExperience: 700,
    maxExperience: 1499,
    benefits: ['Эпические растения', 'Сезонные темы'],
  },
  {
    level: 5,
    name: 'Мастер',
    emoji: '🌺',
    minExperience: 1500,
    maxExperience: 2999,
    benefits: ['Легендарные растения', 'Премиум функции'],
  },
  {
    level: 6,
    name: 'Гуру',
    emoji: '🌈',
    minExperience: 3000,
    maxExperience: Infinity,
    benefits: ['Уникальные растения', 'Безлимитные возможности'],
  },
]

// Опыт за различные действия
export const EXPERIENCE_REWARDS = {
  DAILY_MOOD: 10,
  FIRST_MOOD_OF_DAY: 20,
  STREAK_MILESTONE: 50, // каждые 7 дней стрика
  NEW_PLANT: 15,
  RARE_PLANT: 50,
  SHARE_GARDEN: 25,
  COMPLETE_ACHIEVEMENT: 100,
} as const

interface AchievementCheck {
  readonly id: string
  readonly condition: (
    user: User,
    moodStats: MoodStats,
    totalElements: number
  ) => boolean
  readonly progress: (
    user: User,
    moodStats: MoodStats,
    totalElements: number
  ) => number
  readonly maxProgress: number
}

// Условия для разблокировки достижений
const ACHIEVEMENT_CONDITIONS: AchievementCheck[] = [
  {
    id: 'first_steps',
    condition: (_user, _moodStats, totalElements) => totalElements >= 1,
    progress: (_user, _moodStats, totalElements) => totalElements,
    maxProgress: 1,
  },
  {
    id: 'week_streak',
    condition: user =>
      Math.max(user.stats.currentStreak, user.stats.longestStreak) >= 7,
    progress: user =>
      Math.max(user.stats.currentStreak, user.stats.longestStreak),
    maxProgress: 7,
  },
  {
    id: 'month_streak',
    condition: user =>
      Math.max(user.stats.currentStreak, user.stats.longestStreak) >= 30,
    progress: user =>
      Math.max(user.stats.currentStreak, user.stats.longestStreak),
    maxProgress: 30,
  },
  {
    id: 'gardener',
    condition: (_user, _moodStats, totalElements) => totalElements >= 10,
    progress: (_user, _moodStats, totalElements) => totalElements,
    maxProgress: 10,
  },
  {
    id: 'rare_hunter',
    condition: user => user.stats.rareElementsFound >= 1,
    progress: user => user.stats.rareElementsFound,
    maxProgress: 1,
  },
  {
    id: 'mood_analyst',
    condition: (_user, moodStats) => moodStats.totalEntries >= 30,
    progress: (_user, moodStats) => moodStats.totalEntries,
    maxProgress: 30,
  },
  {
    id: 'persistence_master',
    condition: user => user.stats.totalDays >= 100,
    progress: user => user.stats.totalDays,
    maxProgress: 100,
  },
  {
    id: 'ambassador',
    condition: user => user.stats.gardensShared >= 5,
    progress: user => user.stats.gardensShared,
    maxProgress: 5,
  },
]

/**
 * Вычисляет достижения пользователя на основе текущих данных
 */
export function calculateAchievements(
  user: User,
  moodStats: MoodStats,
  totalElements: number
): Achievement[] {
  return ACHIEVEMENTS_CONFIG.map(config => {
    const condition = ACHIEVEMENT_CONDITIONS.find(c => c.id === config.id)

    if (!condition) {
      return {
        ...config,
        isUnlocked: false,
        progress: 0,
        maxProgress: 1,
      }
    }

    const isUnlocked = condition.condition(user, moodStats, totalElements)
    const progress = condition.progress(user, moodStats, totalElements)

    return {
      ...config,
      isUnlocked,
      progress,
      maxProgress: condition.maxProgress,
      ...(isUnlocked && { unlockedAt: new Date() }), // В реальности дата из БД
    }
  })
}

/**
 * Вычисляет текущий уровень садовника на основе опыта
 */
export function calculateGardenerLevel(experience: number): GardenerLevel {
  for (let i = GARDENER_LEVELS.length - 1; i >= 0; i--) {
    const level = GARDENER_LEVELS[i]!
    if (experience >= level.minExperience) {
      return level
    }
  }
  return GARDENER_LEVELS[0]! // Новичок по умолчанию
}

/**
 * Вычисляет прогресс до следующего уровня
 */
export function calculateLevelProgress(experience: number): {
  currentLevel: GardenerLevel
  nextLevel: GardenerLevel | null
  progress: number // 0-100%
  experienceToNext: number
} {
  const currentLevel = calculateGardenerLevel(experience)
  const nextLevelIndex =
    GARDENER_LEVELS.findIndex(l => l.level === currentLevel.level) + 1
  const nextLevel =
    nextLevelIndex < GARDENER_LEVELS.length
      ? GARDENER_LEVELS[nextLevelIndex]!
      : null

  if (!nextLevel) {
    return {
      currentLevel,
      nextLevel: null,
      progress: 100,
      experienceToNext: 0,
    }
  }

  const experienceInCurrentLevel = experience - currentLevel.minExperience
  const experienceNeededForNextLevel =
    nextLevel.minExperience - currentLevel.minExperience
  const progress = Math.min(
    100,
    (experienceInCurrentLevel / experienceNeededForNextLevel) * 100
  )
  const experienceToNext = nextLevel.minExperience - experience

  return {
    currentLevel,
    nextLevel,
    progress,
    experienceToNext: Math.max(0, experienceToNext),
  }
}

/**
 * Вычисляет опыт на основе действий пользователя
 */
export function calculateExperienceFromStats(
  user: User,
  moodStats: MoodStats,
  totalElements: number
): number {
  let experience = 0

  // Базовый опыт за дни активности
  experience += moodStats.totalEntries * EXPERIENCE_REWARDS.DAILY_MOOD

  // Бонус за стрики
  const streakBonuses =
    Math.floor(user.stats.longestStreak / 7) *
    EXPERIENCE_REWARDS.STREAK_MILESTONE
  experience += streakBonuses

  // Опыт за растения
  experience += totalElements * EXPERIENCE_REWARDS.NEW_PLANT
  experience += user.stats.rareElementsFound * EXPERIENCE_REWARDS.RARE_PLANT

  // Опыт за социальную активность
  experience += user.stats.gardensShared * EXPERIENCE_REWARDS.SHARE_GARDEN

  // Бонус за достижения
  const achievements = calculateAchievements(user, moodStats, totalElements)
  const unlockedCount = achievements.filter(a => a.isUnlocked).length
  experience += unlockedCount * EXPERIENCE_REWARDS.COMPLETE_ACHIEVEMENT

  return Math.max(0, experience)
}

/**
 * Создает summary профиля для отображения
 */
export function createProfileSummary(
  user: User,
  moodStats: MoodStats,
  totalElements: number
) {
  const achievements = calculateAchievements(user, moodStats, totalElements)
  const experience = calculateExperienceFromStats(
    user,
    moodStats,
    totalElements
  )
  const levelInfo = calculateLevelProgress(experience)

  return {
    achievements,
    unlockedAchievements: achievements.filter(a => a.isUnlocked).length,
    totalAchievements: achievements.length,
    experience,
    levelInfo,
    stats: {
      daysSinceRegistration: Math.floor(
        (Date.now() - user.registrationDate.getTime()) / (1000 * 60 * 60 * 24)
      ),
      totalMoodEntries: moodStats.totalEntries,
      averageElementsPerDay:
        totalElements > 0 && user.stats.totalDays > 0
          ? Math.round(
              (totalElements / Math.max(user.stats.totalDays, 1)) * 10
            ) / 10
          : 0,
    },
  }
}
