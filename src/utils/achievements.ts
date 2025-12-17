import type { User, MoodStats, Achievement, GardenerLevel } from '@/types'
import { AchievementCategory } from '@/types'
import { GARDENER_LEVELS as LEVELS_DATA } from './levelsData'

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
]

// 🎯 Импортируем уровни из отдельного файла (50 уровней)
export { GARDENER_LEVELS, calculateExperienceForLevel } from './levelsData'

// 📈 Опыт за различные действия (обновлено для баланса 6 месяцев до уровня 30)
// Цель: ~555 опыта/день при идеальной игре → 30 уровень за ~6-8 месяцев
export const EXPERIENCE_REWARDS = {
  // Ежедневные (базовые)
  DAILY_MOOD: 50, // Было 10 → 50
  FIRST_MOOD_OF_DAY: 100, // Было 20 → 100
  NEW_PLANT: 75, // Было 15 → 75

  // Стрики
  STREAK_MILESTONE_7: 200, // каждые 7 дней (было 50)
  STREAK_MILESTONE_30: 800, // каждые 30 дней (новое)
  STREAK_MILESTONE_100: 2000, // каждые 100 дней (новое)

  // Редкие события
  RARE_PLANT: 250, // Было 50 → 250
  EPIC_PLANT: 500, // Новое
  LEGENDARY_PLANT: 1200, // Новое

  // Социальные
  SHARE_GARDEN: 100, // Было 25 → 100
  VISIT_FRIEND: 30, // Новое
  LIKE_GARDEN: 15, // Новое
  COMMENT_GARDEN: 50, // Новое

  // Достижения
  COMPLETE_ACHIEVEMENT: 500, // Было 100 → 500

  // Квесты (новое!)
  COMPLETE_DAILY_QUEST: 100,
  COMPLETE_WEEKLY_QUEST: 500,

  // Челленджи
  COMPLETE_CHALLENGE: 800, // Новое
  WEEKLY_ACTIVE: 1000, // Бонус за активную неделю (новое)
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
  for (let i = LEVELS_DATA.length - 1; i >= 0; i--) {
    const level = LEVELS_DATA[i]!
    if (experience >= level.minExperience) {
      return level
    }
  }
  return LEVELS_DATA[0]! // Новичок по умолчанию
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
    LEVELS_DATA.findIndex(l => l.level === currentLevel.level) + 1
  const nextLevel =
    nextLevelIndex < LEVELS_DATA.length ? LEVELS_DATA[nextLevelIndex]! : null

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
    EXPERIENCE_REWARDS.STREAK_MILESTONE_7
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
