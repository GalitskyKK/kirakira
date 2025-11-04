/**
 * Типы для системы челленджей KiraKira
 */

export type ChallengeType = 'personal' | 'competitive' | 'cooperative'

export type ChallengeStatus = 'draft' | 'active' | 'completed' | 'cancelled'

export type ChallengeCategory =
  | 'mood'
  | 'garden'
  | 'social'
  | 'mindfulness'
  | 'streak'

export type ParticipantStatus = 'joined' | 'active' | 'completed' | 'dropped'

export interface Challenge {
  readonly id: string
  readonly title: string
  readonly description: string
  readonly emoji: string
  readonly category: ChallengeCategory
  readonly type: ChallengeType
  readonly status: ChallengeStatus
  readonly startDate: Date
  readonly endDate: Date
  readonly maxParticipants?: number
  readonly requirements: ChallengeRequirements
  readonly rewards: ChallengeRewards
  readonly createdBy: number | null // telegram_id создателя (null для системных)
  readonly createdAt: Date
  readonly updatedAt: Date
  readonly participant_count?: number // количество участников из API
}

export interface ChallengeRequirements {
  readonly minLevel?: number
  readonly minStreak?: number
  readonly minElements?: number
  readonly requiresFriends?: boolean
  readonly targetValue: number // Целевое значение для выполнения
  readonly metric: ChallengeMetric // Что именно измеряем
}

export type ChallengeMetric =
  | 'garden_elements_count' // Количество элементов сада
  | 'mood_entries_count' // Количество записей настроения
  | 'streak_days' // Дни стрика
  | 'rare_elements_count' // Редкие элементы
  | 'garden_diversity' // Разнообразие типов элементов
  | 'friend_interactions' // Взаимодействия с друзьями

export interface ChallengeRewards {
  readonly sprouts?: number // Награда sprouts за челлендж
  readonly gems?: number // Награда gems за челлендж
  readonly experience?: number // Награда опытом
  readonly specialElements?: readonly string[] // Специальные элементы для сада
  readonly achievements?: readonly string[] // ID достижений
  readonly title?: string // Специальный титул
}

export interface ChallengeParticipant {
  readonly id: string
  readonly challengeId: string
  readonly telegramId: number
  readonly status: ParticipantStatus
  readonly joinedAt: Date
  readonly currentProgress: number
  readonly maxProgress: number
  readonly lastUpdateAt: Date
  readonly completedAt?: Date | undefined
  readonly teamProgress?: number // Общий прогресс команды (только для групповых)
  readonly canClaimReward?: boolean // Можно ли получить награду (завершен, но не забран)
}

export interface ChallengeLeaderboardEntry {
  readonly participant: ChallengeParticipant
  readonly user: {
    readonly telegramId: number
    readonly firstName: string
    readonly lastName?: string
    readonly username?: string
    readonly photoUrl?: string
    readonly level: number
  }
  readonly progress: number
  readonly progressPercentage: number
  readonly rank: number
  readonly isCurrentUser: boolean
  readonly teamProgress?: number // Общий прогресс команды (только для групповых)
  readonly personalContributionPercentage?: number // Вклад в команду (только для групповых)
}

export interface ChallengeProgress {
  readonly challengeId: string
  readonly telegramId: number
  readonly progress: number
  readonly progressPercentage: number
  readonly isCompleted: boolean
  readonly timeRemaining: number // миллисекунды до окончания
  readonly dailyProgress?: readonly DailyProgress[]
}

export interface DailyProgress {
  readonly date: Date
  readonly value: number
  readonly total: number
}

// API Response Types
export interface ChallengeListResponse {
  readonly success: boolean
  readonly data?: {
    readonly challenges: readonly Challenge[]
    readonly userParticipations: readonly ChallengeParticipant[]
  }
  readonly error?: string
}

export interface ChallengeDetailsResponse {
  readonly success: boolean
  readonly data?: {
    readonly challenge: Challenge
    readonly participation?: ChallengeParticipant
    readonly leaderboard: readonly ChallengeLeaderboardEntry[]
    readonly progress: ChallengeProgress
  }
  readonly error?: string
}

export interface JoinChallengeResponse {
  readonly success: boolean
  readonly data?: {
    readonly participation: ChallengeParticipant
    readonly challenge: Challenge
  }
  readonly error?: string
}

export interface ChallengeProgressResponse {
  readonly success: boolean
  readonly data?: {
    readonly progress: ChallengeProgress
    readonly leaderboard: readonly ChallengeLeaderboardEntry[]
    readonly newAchievements?: readonly string[]
    readonly rewards?: {
      readonly isCompleted: boolean
      readonly rewards: ChallengeRewards
      readonly challengeTitle: string
    } | null
  }
  readonly error?: string
}

// Предустановленные челленджи
export interface PredefinedChallenge {
  readonly id: string
  readonly title: string
  readonly description: string
  readonly emoji: string
  readonly category: ChallengeCategory
  readonly type: ChallengeType
  readonly duration: number // дни
  readonly requirements: ChallengeRequirements
  readonly rewards: ChallengeRewards
}

// Настройки уведомлений
export interface ChallengeNotificationSettings {
  readonly challengeStarted: boolean
  readonly challengeEnding: boolean
  readonly progressMilestone: boolean
  readonly leaderboardUpdate: boolean
  readonly challengeCompleted: boolean
}

// Статистика челленджей пользователя
export interface UserChallengeStats {
  readonly totalChallengesJoined: number
  readonly totalChallengesCompleted: number
  readonly totalChallengesWon: number
  readonly favoriteCategory: ChallengeCategory
  readonly averageCompletionRate: number
  readonly longestStreak: number
  readonly totalExperienceEarned: number
}
