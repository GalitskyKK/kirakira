/**
 * 🎯 DAILY QUESTS UTILITIES
 * Утилиты и шаблоны для системы ежедневных заданий
 */

import type {
  QuestTemplate,
  QuestType,
  QuestCategory,
  QuestRewards,
} from '@/types/dailyQuests'

// ===============================================
// 🎯 ШАБЛОНЫ ЗАДАНИЙ
// ===============================================

export const QUEST_TEMPLATES: Partial<Record<QuestType, QuestTemplate>> = {
  // ===============================================
  // 😊 MOOD QUESTS (Настроения)
  // ===============================================

  record_specific_mood: {
    type: 'record_specific_mood',
    category: 'mood',
    name: 'Позитивное настроение',
    description: 'Запиши настроение радости',
    emoji: '😄',
    getTargetValue: () => 1,
    getRewards: level => ({
      sprouts: 40 + level * 3,
      experience: 60 + level * 8,
      description: `${40 + level * 3}🌿 + ${60 + level * 8} XP`,
    }),
    weight: 12,
  },

  record_with_note: {
    type: 'record_with_note',
    category: 'mood',
    name: 'Размышления',
    description: 'Запиши настроение с заметкой',
    emoji: '📝',
    getTargetValue: () => 1,
    getRewards: level => ({
      sprouts: 50 + level * 4,
      experience: 75 + level * 10,
      description: `${50 + level * 4}🌿 + ${75 + level * 10} XP`,
    }),
    weight: 10,
  },

  // ===============================================
  // 🌱 GARDEN QUESTS (Сад)
  // ===============================================

  collect_elements: {
    type: 'collect_elements',
    category: 'garden',
    name: 'Новый элемент',
    description: 'Получи новый элемент в саду',
    emoji: '🌱',
    getTargetValue: () => 1,
    getRewards: level => ({
      sprouts: 40 + level * 4,
      experience: 60 + level * 8,
      description: `${40 + level * 4}🌿 + ${60 + level * 8} XP`,
    }),
    weight: 15,
  },

  collect_rare_element: {
    type: 'collect_rare_element',
    category: 'garden',
    name: 'Редкая находка',
    description: 'Получи редкий элемент',
    emoji: '💎',
    getTargetValue: () => 1,
    getRewards: level => ({
      sprouts: 80 + level * 8,
      gems: level >= 10 ? 1 : 0,
      experience: 120 + level * 15,
      description: `${80 + level * 8}🌿 + ${120 + level * 15} XP${level >= 10 ? ' + 1💎' : ''}`,
    }),
    weight: 8,
  },

  upgrade_element: {
    type: 'upgrade_element',
    category: 'garden',
    name: 'Улучшатель',
    description: 'Улучши элемент в саду',
    emoji: '⬆️',
    getTargetValue: () => 1,
    getRewards: level => ({
      sprouts: 60 + level * 6,
      experience: 90 + level * 12,
      description: `${60 + level * 6}🌿 + ${90 + level * 12} XP`,
    }),
    weight: 6,
  },

  // ===============================================
  // 👥 SOCIAL QUESTS (Социальное)
  // ===============================================

  visit_friend_garden: {
    type: 'visit_friend_garden',
    category: 'social',
    name: 'Социальный садовод',
    description: 'Посети сад друга',
    emoji: '👥',
    getTargetValue: () => 1,
    getRewards: level => ({
      sprouts: 50 + level * 5,
      experience: 80 + level * 10,
      description: `${50 + level * 5}🌿 + ${80 + level * 10} XP`,
    }),
    weight: 8,
  },

  share_garden: {
    type: 'share_garden',
    category: 'social',
    name: 'Поделись красотой',
    description: 'Поделись своим садом',
    emoji: '📤',
    getTargetValue: () => 1,
    getRewards: level => ({
      sprouts: 45 + level * 5,
      experience: 70 + level * 9,
      description: `${45 + level * 5}🌿 + ${70 + level * 9} XP`,
    }),
    weight: 6,
  },

  // ===============================================
  // 🔥 STREAK QUESTS (Стрики)
  // ===============================================

  maintain_streak: {
    type: 'maintain_streak',
    category: 'streak',
    name: 'Постоянство',
    description: 'Поддержи стрик {target} дней',
    emoji: '🔥',
    getTargetValue: level => Math.min(1, Math.floor(level / 5)),
    getRewards: (level, target) => ({
      sprouts: 70 * target + level * 6,
      experience: 100 * target + level * 12,
      description: `${70 * target + level * 6}🌿 + ${100 * target + level * 12} XP`,
    }),
    weight: 10,
  },

  login_streak: {
    type: 'login_streak',
    category: 'streak',
    name: 'Ежедневный визит',
    description: 'Войди в приложение',
    emoji: '🚪',
    getTargetValue: () => 1,
    getRewards: level => ({
      sprouts: 30 + level * 2,
      experience: 50 + level * 5,
      description: `${30 + level * 2}🌿 + ${50 + level * 5} XP`,
    }),
    weight: 3,
  },
} as const

// ===============================================
// 🎲 ГЕНЕРАЦИЯ КВЕСТОВ
// ===============================================

/**
 * Генерирует детерминированный seed на основе пользователя и даты
 */
export function generateDailySeed(userId: string, date: Date): number {
  const dateStr = date.toISOString().split('T')[0] // YYYY-MM-DD
  const combined = `${userId}-${dateStr}`
  let hash = 0
  for (let i = 0; i < combined.length; i++) {
    hash = (hash << 5) - hash + combined.charCodeAt(i)
    hash = hash & hash
  }
  return Math.abs(hash)
}

/**
 * Выбирает шаблоны квестов с учетом весов и категорий
 */
export function selectQuestTemplates(
  _userLevel: number,
  seed: number,
  maxQuests: number = 5
): QuestTemplate[] {
  const templates = Object.values(QUEST_TEMPLATES)
  const selected: QuestTemplate[] = []
  const usedCategories = new Set<QuestCategory>()

  // Создаем взвешенный список шаблонов
  const weightedTemplates: QuestTemplate[] = []
  templates.forEach(template => {
    if (template != null) {
      for (let i = 0; i < template.weight; i++) {
        weightedTemplates.push(template)
      }
    }
  })

  // Перемешиваем с использованием seed
  const shuffled = [...weightedTemplates]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor((seed + i) % (i + 1))
    const temp = shuffled[i]
    if (temp && shuffled[j]) {
      shuffled[i] = shuffled[j]
      shuffled[j] = temp
    }
  }

  // Выбираем квесты, стараясь разнообразить категории
  for (const template of shuffled) {
    if (selected.length >= maxQuests) break

    // Приоритет: новые категории
    if (
      template != null &&
      (!usedCategories.has(template.category) || selected.length < 3)
    ) {
      selected.push(template)
      usedCategories.add(template.category)
    }
  }

  // Если не набрали достаточно, добавляем любые
  for (const template of shuffled) {
    if (selected.length >= maxQuests) break
    if (template != null && !selected.includes(template)) {
      selected.push(template)
    }
  }

  return selected.slice(0, maxQuests)
}

/**
 * Определяет количество квестов на основе уровня пользователя
 */
export function getQuestCount(userLevel: number): number {
  if (userLevel <= 5) return 3
  if (userLevel <= 15) return 4
  return 5
}

// ===============================================
// 🎁 НАГРАДЫ И БОНУСЫ
// ===============================================

/**
 * Вычисляет бонусные награды за выполнение всех квестов
 */
export function calculateBonusRewards(
  completedCount: number,
  _totalCount: number
): QuestRewards | null {
  if (completedCount < 3) return null

  if (completedCount >= 5) {
    return {
      sprouts: 100,
      gems: 1,
      experience: 100,
      description: 'Идеальный день! +100🌿 + 1💎 + 100 XP',
    }
  }

  if (completedCount >= 4) {
    return {
      sprouts: 75,
      experience: 50,
      description: 'Отличная работа! +75🌿 + 50 XP',
    }
  }

  return {
    sprouts: 50,
    experience: 25,
    description: 'Бонус за 3 квеста! +50🌿 + 25 XP',
  }
}

/**
 * Вычисляет общие награды за день
 */
export function calculateTotalRewards(
  quests: Array<{ rewards: QuestRewards }>
): QuestRewards {
  return quests.reduce(
    (total, quest) => ({
      sprouts: total.sprouts + quest.rewards.sprouts,
      gems: total.gems + (quest.rewards.gems ?? 0),
      experience: total.experience + quest.rewards.experience,
      description: 'Общие награды за день',
    }),
    { sprouts: 0, gems: 0, experience: 0, description: '' }
  )
}

// ===============================================
// 🎯 ФИЛЬТРАЦИЯ И СОРТИРОВКА
// ===============================================

/**
 * Фильтрует квесты по категории
 */
export function filterQuestsByCategory<
  T extends { questCategory: QuestCategory },
>(quests: T[], category: QuestCategory): T[] {
  return quests.filter(quest => quest.questCategory === category)
}

/**
 * Фильтрует квесты по статусу
 */
export function filterQuestsByStatus<T extends { status: string }>(
  quests: T[],
  status: string
): T[] {
  return quests.filter(quest => quest.status === status)
}

/**
 * Сортирует квесты по прогрессу
 */
export function sortQuestsByProgress<
  T extends { currentProgress: number; targetValue: number },
>(quests: T[]): T[] {
  return [...quests].sort((a, b) => {
    const progressA = a.currentProgress / a.targetValue
    const progressB = b.currentProgress / b.targetValue
    return progressB - progressA
  })
}

/**
 * Сортирует квесты по категории
 */
export function sortQuestsByCategory<
  T extends { questCategory: QuestCategory },
>(quests: T[]): T[] {
  const categoryOrder: QuestCategory[] = ['mood', 'garden', 'social', 'streak']
  return [...quests].sort((a, b) => {
    const indexA = categoryOrder.indexOf(a.questCategory)
    const indexB = categoryOrder.indexOf(b.questCategory)
    return indexA - indexB
  })
}

/**
 * Сортирует квесты по времени истечения
 */
export function sortQuestsByExpiration<T extends { expiresAt: Date | string }>(
  quests: T[]
): T[] {
  return [...quests].sort((a, b) => {
    const aExpires =
      a.expiresAt instanceof Date ? a.expiresAt : new Date(a.expiresAt)
    const bExpires =
      b.expiresAt instanceof Date ? b.expiresAt : new Date(b.expiresAt)
    return aExpires.getTime() - bExpires.getTime()
  })
}

// ===============================================
// 🎯 ВАЛИДАЦИЯ
// ===============================================

/**
 * Проверяет, валиден ли тип квеста
 */
export function isValidQuestType(type: string): type is QuestType {
  return type in QUEST_TEMPLATES
}

/**
 * Проверяет, валидна ли категория квеста
 */
export function isValidQuestCategory(
  category: string
): category is QuestCategory {
  return ['mood', 'garden', 'social', 'streak'].includes(category)
}

/**
 * Проверяет, можно ли обновить прогресс квеста
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
 * Проверяет, можно ли получить награду за квест
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

// ===============================================
// 🎯 ФОРМАТИРОВАНИЕ
// ===============================================

/**
 * Форматирует прогресс квеста
 */
export function formatQuestProgress(current: number, target: number): string {
  return `${current}/${target}`
}

/**
 * Форматирует награды квеста
 */
export function formatQuestRewards(rewards: QuestRewards): string {
  const parts = [`${rewards.sprouts}🌿`, `${rewards.experience} XP`]
  if (rewards.gems != null && rewards.gems > 0) {
    parts.splice(1, 0, `${rewards.gems}💎`)
  }
  return parts.join(' + ')
}

// ===============================================
// 🎯 СТАТИСТИКА
// ===============================================

/**
 * Вычисляет статистику выполнения квестов
 */
export function calculateQuestStats<
  T extends { status: string; rewards: QuestRewards },
>(quests: T[]) {
  const stats = {
    total: quests.length,
    active: 0,
    completed: 0,
    claimed: 0,
    expired: 0,
    completionRate: 0,
    totalRewards: {
      sprouts: 0,
      gems: 0,
      experience: 0,
    },
  }

  quests.forEach(quest => {
    switch (quest.status) {
      case 'active':
        stats.active++
        break
      case 'completed':
        stats.completed++
        break
      case 'claimed':
        stats.claimed++
        stats.totalRewards.sprouts += quest.rewards.sprouts
        stats.totalRewards.gems += quest.rewards.gems ?? 0
        stats.totalRewards.experience += quest.rewards.experience
        break
      case 'expired':
        stats.expired++
        break
    }
  })

  const finished = stats.completed + stats.claimed
  stats.completionRate =
    stats.total > 0 ? Math.round((finished / stats.total) * 100) : 0

  return stats
}
