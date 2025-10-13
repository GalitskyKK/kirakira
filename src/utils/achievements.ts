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

// Уровни садовника (синхронизировано с БД) - 30 уровней
export const GARDENER_LEVELS: GardenerLevel[] = [
  {
    level: 1,
    name: 'Росток',
    emoji: '🌱',
    minExperience: 0,
    maxExperience: 99,
    benefits: [
      '1 комната (16 слотов)',
      'Базовая статистика',
      'Ежедневные награды',
    ],
  },
  {
    level: 2,
    name: 'Побег',
    emoji: '🌿',
    minExperience: 100,
    maxExperience: 249,
    benefits: ['2 комнаты (+16 слотов)', 'Поделиться садом', '+5% опыта'],
  },
  {
    level: 3,
    name: 'Бутон',
    emoji: '🌼',
    minExperience: 250,
    maxExperience: 499,
    benefits: [
      '3 комнаты (+32 слотов)',
      'Просмотр садов друзей',
      '1 бесплатная перестановка/день',
    ],
  },
  {
    level: 4,
    name: 'Цветок',
    emoji: '🌸',
    minExperience: 500,
    maxExperience: 799,
    benefits: [
      '4 комнаты (+48 слотов)',
      '+5% шанс редких растений',
      'Дарить растения друзьям',
    ],
  },
  {
    level: 5,
    name: 'Садовник',
    emoji: '🌻',
    minExperience: 800,
    maxExperience: 1299,
    benefits: [
      '5 комнат (+64 слотов)',
      '+6% шанс редких растений',
      'Магазин тем оформления',
    ],
  },
  {
    level: 6,
    name: 'Ботаник',
    emoji: '🍀',
    minExperience: 1300,
    maxExperience: 1899,
    benefits: [
      '6 комнат (+80 слотов)',
      '+8% шанс редких растений',
      'Еженедельная статистика',
    ],
  },
  {
    level: 7,
    name: 'Знаток',
    emoji: '🌺',
    minExperience: 1900,
    maxExperience: 2599,
    benefits: [
      '7 комнат (+96 слотов)',
      '+10% шанс редких растений',
      'Защита стрика (1 раз/неделя)',
    ],
  },
  {
    level: 8,
    name: 'Флорист',
    emoji: '🌹',
    minExperience: 2600,
    maxExperience: 3399,
    benefits: [
      '8 комнат (+112 слотов)',
      '+12% шанс редких растений',
      'Комментарии к садам',
    ],
  },
  {
    level: 9,
    name: 'Эксперт',
    emoji: '🌳',
    minExperience: 3400,
    maxExperience: 4299,
    benefits: [
      '9 комнат (+128 слотов)',
      '+14% шанс редких растений',
      'Создавать приватные челленджи',
    ],
  },
  {
    level: 10,
    name: 'Мастер',
    emoji: '🎋',
    minExperience: 4300,
    maxExperience: 5399,
    benefits: [
      '10 комнат (+144 слотов)',
      '+16% шанс редких растений',
      'Расширенные достижения',
    ],
  },
  {
    level: 11,
    name: 'Виртуоз',
    emoji: '🪴',
    minExperience: 5400,
    maxExperience: 6699,
    benefits: [
      '11 комнат (+160 слотов)',
      '+18% шанс редких растений',
      '3 перестановки/день',
    ],
  },
  {
    level: 12,
    name: 'Куратор',
    emoji: '🌴',
    minExperience: 6700,
    maxExperience: 8199,
    benefits: [
      '12 комнат (+176 слотов)',
      '+20% шанс редких растений',
      'Экспорт данных в CSV',
    ],
  },
  {
    level: 13,
    name: 'Хранитель',
    emoji: '🌲',
    minExperience: 8200,
    maxExperience: 9999,
    benefits: [
      '13 комнат (+192 слотов)',
      '+22% шанс редких растений',
      'Защита стрика (2 раза/неделя)',
    ],
  },
  {
    level: 14,
    name: 'Архитектор',
    emoji: '🏛️',
    minExperience: 10000,
    maxExperience: 12199,
    benefits: [
      '14 комнат (+208 слотов)',
      '+24% шанс редких растений',
      'Кастомные макеты комнат',
    ],
  },
  {
    level: 15,
    name: 'Легенда',
    emoji: '⭐',
    minExperience: 12200,
    maxExperience: 14699,
    benefits: [
      '15 комнат (+224 слотов)',
      '+26% шанс редких растений',
      'Уникальный значок в профиле',
    ],
  },
  {
    level: 16,
    name: 'Титан',
    emoji: '🗿',
    minExperience: 14700,
    maxExperience: 17599,
    benefits: [
      '16 комнат (+240 слотов)',
      '+28% шанс редких растений',
      'Безлимитные перестановки',
    ],
  },
  {
    level: 17,
    name: 'Феникс',
    emoji: '🔥',
    minExperience: 17600,
    maxExperience: 20999,
    benefits: [
      '17 комнат (+256 слотов)',
      '+30% шанс редких растений',
      'Восстановить любой день стрика',
    ],
  },
  {
    level: 18,
    name: 'Оракул',
    emoji: '🔮',
    minExperience: 21000,
    maxExperience: 24999,
    benefits: [
      '18 комнат (+272 слотов)',
      '+32% шанс редких растений',
      'Предпросмотр завтрашнего растения',
    ],
  },
  {
    level: 19,
    name: 'Мистик',
    emoji: '✨',
    minExperience: 25000,
    maxExperience: 29499,
    benefits: [
      '19 комнат (+288 слотов)',
      '+34% шанс редких растений',
      'Аура: +10% ростков для друзей',
    ],
  },
  {
    level: 20,
    name: 'Божество',
    emoji: '👑',
    minExperience: 29500,
    maxExperience: 34999,
    benefits: [
      '20 комнат (+304 слотов)',
      '+36% шанс редких растений',
      'Эксклюзивные премиум растения',
    ],
  },
  {
    level: 21,
    name: 'Космос',
    emoji: '🌌',
    minExperience: 35000,
    maxExperience: 41499,
    benefits: [
      '22 комнаты (+336 слотов)',
      '+38% шанс редких растений',
      'Космическая тема сада',
    ],
  },
  {
    level: 22,
    name: 'Вечность',
    emoji: '♾️',
    minExperience: 41500,
    maxExperience: 49499,
    benefits: [
      '24 комнаты (+368 слотов)',
      '+40% шанс редких растений',
      'Бессмертный стрик (защита навсегда)',
    ],
  },
  {
    level: 23,
    name: 'Абсолют',
    emoji: '💫',
    minExperience: 49500,
    maxExperience: 59499,
    benefits: [
      '26 комнат (+400 слотов)',
      '+42% шанс редких растений',
      'x2 награды за всё',
    ],
  },
  {
    level: 24,
    name: 'Трансцендент',
    emoji: '🌠',
    minExperience: 59500,
    maxExperience: 71999,
    benefits: [
      '28 комнат (+432 слотов)',
      '+44% шанс редких растений',
      'Создавать легендарные достижения',
    ],
  },
  {
    level: 25,
    name: 'Архонт',
    emoji: '🌟',
    minExperience: 72000,
    maxExperience: 87999,
    benefits: [
      '30 комнат (+464 слотов)',
      '+46% шанс редких растений',
      'Божественные полномочия',
    ],
  },
  {
    level: 26,
    name: 'Небожитель',
    emoji: '☁️',
    minExperience: 88000,
    maxExperience: 106999,
    benefits: [
      '32 комнаты (+496 слотов)',
      '+48% шанс редких растений',
      'Небесные сады',
    ],
  },
  {
    level: 27,
    name: 'Астральный',
    emoji: '🪐',
    minExperience: 107000,
    maxExperience: 129999,
    benefits: [
      '34 комнаты (+528 слотов)',
      '+50% шанс редких растений',
      'Астральная проекция',
    ],
  },
  {
    level: 28,
    name: 'Бесконечность',
    emoji: '🌀',
    minExperience: 130000,
    maxExperience: 159999,
    benefits: [
      '36 комнат (+560 слотов)',
      '+52% шанс редких растений',
      'Бесконечное совершенство',
    ],
  },
  {
    level: 29,
    name: 'Всевидящий',
    emoji: '👁️',
    minExperience: 160000,
    maxExperience: 199999,
    benefits: [
      '38 комнат (+592 слотов)',
      '+55% шанс редких растений',
      'Всевидящее око',
    ],
  },
  {
    level: 30,
    name: 'Творец',
    emoji: '🌈',
    minExperience: 200000,
    maxExperience: Infinity,
    benefits: [
      'Безлимитные комнаты',
      '+60% шанс редких растений',
      'x2 опыт навсегда',
      'Все премиум фичи навсегда',
      'Особый титул "Творец" в сообществе',
      'Эксклюзивный эффект ауры',
      'Доступ ко всем будущим фичам',
    ],
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
