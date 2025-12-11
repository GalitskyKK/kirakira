/**
 * 🎯 DAILY QUESTS TYPES
 * TypeScript типы для системы ежедневных заданий
 */

// ===============================================
// 🎯 БАЗОВЫЕ ТИПЫ
// ===============================================

export type QuestCategory = 'mood' | 'garden' | 'social' | 'streak'

export type QuestStatus = 'active' | 'completed' | 'claimed' | 'expired'

export type QuestType =
  // Mood Quests (Настроения)
  | 'record_specific_mood' // Записать конкретное настроение
  | 'record_with_note' // Записать настроение с заметкой
  // Garden Quests (Сад)
  | 'collect_elements' // Получить новый элемент
  // Streak Quests (Стрики)
  | 'maintain_streak' // Поддержать стрик N дней

// ===============================================
// 📊 ИНТЕРФЕЙСЫ
// ===============================================

export interface DailyQuest {
  readonly id: string
  readonly telegramId: number
  readonly questType: QuestType
  readonly questCategory: QuestCategory
  readonly targetValue: number
  readonly currentProgress: number
  readonly status: QuestStatus
  readonly rewards: QuestRewards
  readonly generatedAt: Date | string
  readonly expiresAt: Date | string
  readonly completedAt?: Date | string
  readonly claimedAt?: Date | string
  readonly metadata?: QuestMetadata
}

export interface QuestRewards {
  readonly sprouts: number
  readonly gems?: number
  readonly experience: number
  readonly description: string
}

export interface QuestMetadata {
  readonly name: string
  readonly emoji: string
  readonly description: string
  readonly [key: string]: unknown
}

export interface QuestTemplate {
  readonly type: QuestType
  readonly category: QuestCategory
  readonly name: string
  readonly description: string
  readonly emoji: string
  readonly getTargetValue: (userLevel: number) => number
  readonly getRewards: (userLevel: number, targetValue?: number) => QuestRewards
  readonly weight: number // для рандомайзера
}

// ===============================================
// 📡 API ТИПЫ
// ===============================================

export interface DailyQuestsResponse {
  readonly quests: readonly DailyQuest[]
  readonly completedToday: number
  readonly totalToday: number
  readonly canClaimBonus: boolean
  readonly bonusRewards?: QuestRewards
  readonly stats: QuestStats
}

export interface QuestStats {
  readonly activeQuests: number
  readonly completedQuests: number
  readonly claimedQuests: number
  readonly totalQuests: number
  readonly completionRate: number
  readonly totalRewards: QuestRewards
}

export interface ClaimQuestRequest {
  readonly questId: string
  readonly telegramId: number
}

export interface UpdateProgressRequest {
  readonly questId: string
  readonly telegramId: number
  readonly increment?: number
}

export interface UpdateProgressResponse {
  readonly quest: DailyQuest
  readonly isCompleted: boolean
  readonly isNewlyCompleted: boolean
}

export interface ClaimQuestResponse {
  readonly quest: DailyQuest
  readonly newBalance: {
    readonly sprouts: number
    readonly gems: number
  }
  readonly rewards: QuestRewards
}

// ===============================================
// 🎮 UI ТИПЫ
// ===============================================

export interface QuestProgress {
  readonly quest: DailyQuest
  readonly progressPercentage: number
  readonly isCompleted: boolean
  readonly canClaim: boolean
  readonly timeRemaining: number // миллисекунды
  readonly isExpired: boolean
}

export interface QuestCompletionSummary {
  readonly completedCount: number
  readonly totalCount: number
  readonly completionRate: number
  readonly bonusEligible: boolean
  readonly bonusRewards?: QuestRewards
  readonly expiredQuests: readonly DailyQuest[]
  readonly unclaimedQuests: readonly DailyQuest[]
}

export interface QuestRewardAnimation {
  readonly quest: DailyQuest
  readonly rewards: QuestRewards
  readonly isBonus: boolean
  readonly showConfetti: boolean
}

// ===============================================
// 🎯 КОНСТАНТЫ
// ===============================================

export const QUEST_CATEGORIES: Record<
  QuestCategory,
  {
    readonly name: string
    readonly emoji: string
    readonly color: string
    readonly description: string
  }
> = {
  mood: {
    name: 'Настроения',
    emoji: '😊',
    color: '#fbbf24',
    description: 'Задания связанные с отслеживанием настроения',
  },
  garden: {
    name: 'Сад',
    emoji: '🌱',
    color: '#10b981',
    description: 'Задания по выращиванию и улучшению сада',
  },
  social: {
    name: 'Социальное',
    emoji: '👥',
    color: '#3b82f6',
    description: 'Задания по взаимодействию с друзьями',
  },
  streak: {
    name: 'Стрики',
    emoji: '🔥',
    color: '#ef4444',
    description: 'Задания по поддержанию ежедневной активности',
  },
} as const

export const QUEST_STATUSES: Record<
  QuestStatus,
  {
    readonly name: string
    readonly emoji: string
    readonly color: string
    readonly description: string
  }
> = {
  active: {
    name: 'Активно',
    emoji: '⏳',
    color: '#6b7280',
    description: 'Задание в процессе выполнения',
  },
  completed: {
    name: 'Выполнено',
    emoji: '✅',
    color: '#10b981',
    description: 'Задание выполнено, можно получить награду',
  },
  claimed: {
    name: 'Получено',
    emoji: '🎁',
    color: '#8b5cf6',
    description: 'Награда за задание получена',
  },
  expired: {
    name: 'Истекло',
    emoji: '⏰',
    color: '#ef4444',
    description: 'Время выполнения задания истекло',
  },
} as const

// ===============================================
// 🎁 НАГРАДЫ ЗА КОМБО
// ===============================================

export const COMBO_REWARDS: Record<number, QuestRewards> = {
  3: {
    sprouts: 50,
    experience: 25,
    description: 'Бонус за 3 квеста!',
  },
  4: {
    sprouts: 75,
    experience: 50,
    description: 'Отличная работа!',
  },
  5: {
    sprouts: 100,
    gems: 1,
    experience: 100,
    description: 'Идеальный день!',
  },
} as const

// ===============================================
// 🎯 УТИЛИТЫ
// ===============================================

/**
 * Проверяет, выполнено ли задание
 */
export function isQuestCompleted(quest: DailyQuest): boolean {
  return quest.currentProgress >= quest.targetValue
}

/**
 * Проверяет, можно ли получить награду
 */
export function canClaimQuest(quest: DailyQuest): boolean {
  if (quest.status !== 'completed') {
    return false
  }

  const expiresAt =
    quest.expiresAt instanceof Date ? quest.expiresAt : new Date(quest.expiresAt)

  if (Number.isNaN(expiresAt.getTime())) {
    return false
  }

  return expiresAt > new Date() && quest.currentProgress >= quest.targetValue
}

/**
 * Вычисляет процент прогресса
 */
export function getQuestProgress(quest: DailyQuest): number {
  if (quest.targetValue === 0) return 100
  return Math.min(
    Math.round((quest.currentProgress / quest.targetValue) * 100),
    100
  )
}

/**
 * Проверяет, истекло ли задание
 */
export function isQuestExpired(quest: DailyQuest): boolean {
  const expiresAt =
    quest.expiresAt instanceof Date
      ? quest.expiresAt
      : new Date(quest.expiresAt)
  return new Date() > expiresAt
}

/**
 * Вычисляет оставшееся время
 */
export function getQuestTimeRemaining(quest: DailyQuest): number {
  const now = new Date()
  const expires =
    quest.expiresAt instanceof Date
      ? quest.expiresAt
      : new Date(quest.expiresAt)
  return Math.max(expires.getTime() - now.getTime(), 0)
}

/**
 * Форматирует время до истечения квеста
 */
export function formatTimeRemaining(expiresAt: Date | string): string {
  const now = new Date()
  const expires = expiresAt instanceof Date ? expiresAt : new Date(expiresAt)
  const diff = expires.getTime() - now.getTime()

  if (diff <= 0) return 'Истекло'

  const hours = Math.floor(diff / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))

  if (hours > 0) {
    return `${hours}ч ${minutes}м`
  }

  return `${minutes}м`
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

/**
 * Получает описание задания с подстановкой значений
 */
export function getQuestDescription(quest: DailyQuest): string {
  const metadata = quest.metadata
  if (!metadata) return 'Выполните задание'

  const description = metadata.description || 'Выполните задание'
  return description.replace('{target}', quest.targetValue.toString())
}

/**
 * Вычисляет бонусные награды
 */
export function calculateBonusRewards(
  completedCount: number,
  _totalCount: number
): QuestRewards | null {
  if (completedCount < 3) return null
  if (completedCount >= 5) return COMBO_REWARDS[5] ?? null
  if (completedCount >= 4) return COMBO_REWARDS[4] ?? null
  return COMBO_REWARDS[3] ?? null
}

/**
 * Получает информацию о категории задания
 */
export function getQuestCategoryInfo(category: QuestCategory) {
  return QUEST_CATEGORIES[category]
}

/**
 * Получает информацию о статусе задания
 */
export function getQuestStatusInfo(status: QuestStatus) {
  return QUEST_STATUSES[status]
}

/**
 * Проверяет, является ли задание социальным
 */
export function isSocialQuest(quest: DailyQuest): boolean {
  return quest.questCategory === 'social'
}

/**
 * Проверяет, является ли задание связанным с настроением
 */
export function isMoodQuest(quest: DailyQuest): boolean {
  return quest.questCategory === 'mood'
}

/**
 * Проверяет, является ли задание связанным с садом
 */
export function isGardenQuest(quest: DailyQuest): boolean {
  return quest.questCategory === 'garden'
}

/**
 * Проверяет, является ли задание связанным со стриками
 */
export function isStreakQuest(quest: DailyQuest): boolean {
  return quest.questCategory === 'streak'
}

// ===============================================
// 🎯 TYPE GUARDS
// ===============================================

export function isQuestType(value: string): value is QuestType {
  const validTypes: QuestType[] = [
    'record_specific_mood',
    'record_with_note',
    'collect_elements',
    'maintain_streak',
  ]
  return validTypes.includes(value as QuestType)
}

export function isQuestCategory(value: string): value is QuestCategory {
  return ['mood', 'garden', 'social', 'streak'].includes(value)
}

export function isQuestStatus(value: string): value is QuestStatus {
  return ['active', 'completed', 'claimed', 'expired'].includes(value)
}

export function isDailyQuest(value: unknown): value is DailyQuest {
  return (
    typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    'questType' in value &&
    'questCategory' in value &&
    'targetValue' in value &&
    'currentProgress' in value &&
    'status' in value &&
    'rewards' in value
  )
}

// ===============================================
// 🎯 HELPER TYPES
// ===============================================

export type QuestFilter = {
  readonly category?: QuestCategory
  readonly status?: QuestStatus
  readonly type?: QuestType
}

export type QuestSort = 'progress' | 'category' | 'expires' | 'rewards'

export interface QuestListOptions {
  readonly filter?: QuestFilter
  readonly sort?: QuestSort
  readonly limit?: number
  readonly offset?: number
}
