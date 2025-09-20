import type { MoodType } from './garden'

export interface MoodEntry {
  readonly id: string
  readonly userId: string
  readonly date: Date
  readonly mood: MoodType
  readonly intensity: MoodIntensity
  readonly note?: string
  readonly createdAt: Date
}

export enum MoodIntensity {
  LOW = 1,
  MEDIUM = 2,
  HIGH = 3,
}

export interface MoodState {
  readonly todaysMood: MoodEntry | null
  readonly moodHistory: readonly MoodEntry[]
  readonly isLoading: boolean
  readonly error: string | null
  readonly streakCount: number
  readonly lastCheckin: Date | null
}

export interface MoodStats {
  readonly totalEntries: number
  readonly currentStreak: number
  readonly longestStreak: number
  readonly mostFrequentMood: MoodType | null
  readonly averageIntensity: number
  readonly moodDistribution: Record<MoodType, number>
  readonly weeklyTrend: readonly MoodEntry[]
  readonly monthlyTrend: readonly MoodEntry[]
}

export const MOOD_CONFIG: Record<MoodType, MoodConfig> = {
  joy: {
    color: '#fbbf24',
    emoji: '😊',
    label: 'Радость',
    description: 'Чувствую себя счастливо и энергично',
    elementTypes: ['flower', 'decoration'],
    rarityBonus: 0.2,
  },
  calm: {
    color: '#06b6d4',
    emoji: '😌',
    label: 'Спокойствие',
    description: 'Ощущаю умиротворение и баланс',
    elementTypes: ['water', 'tree'],
    rarityBonus: 0.1,
  },
  stress: {
    color: '#ef4444',
    emoji: '😰',
    label: 'Стресс',
    description: 'Чувствую напряжение и беспокойство',
    elementTypes: ['stone', 'crystal'],
    rarityBonus: 0.0,
  },
  sadness: {
    color: '#3b82f6',
    emoji: '😢',
    label: 'Грусть',
    description: 'Ощущаю печаль или меланхолию',
    elementTypes: ['mushroom', 'grass'],
    rarityBonus: 0.05,
  },
  anger: {
    color: '#dc2626',
    emoji: '😠',
    label: 'Гнев',
    description: 'Чувствую раздражение или злость',
    elementTypes: ['stone', 'crystal'],
    rarityBonus: 0.0,
  },
  anxiety: {
    color: '#8b5cf6',
    emoji: '😰',
    label: 'Тревога',
    description: 'Ощущаю беспокойство и волнение',
    elementTypes: ['mushroom', 'decoration'],
    rarityBonus: 0.1,
  },
} as const

export interface MoodConfig {
  readonly color: string
  readonly emoji: string
  readonly label: string
  readonly description: string
  readonly elementTypes: readonly string[]
  readonly rarityBonus: number
}
