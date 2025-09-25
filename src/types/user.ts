export interface User {
  readonly id: string
  readonly email?: string
  readonly username?: string
  readonly firstName?: string
  readonly lastName?: string
  readonly photoUrl?: string
  readonly telegramId?: number
  readonly lastVisitDate?: Date
  readonly registrationDate: Date
  readonly preferences: UserPreferences
  readonly stats: UserStats
  readonly isAnonymous: boolean
}

export interface UserPreferences {
  readonly theme: 'light' | 'dark' | 'auto'
  readonly language: 'en' | 'ru'
  readonly notifications: NotificationSettings
  readonly privacy: PrivacySettings
  readonly garden: GardenPreferences
}

export interface NotificationSettings {
  readonly enabled: boolean
  readonly dailyReminder: boolean
  readonly reminderTime: string // HH:MM format
  readonly weeklyStats: boolean
  readonly milestones: boolean
}

export interface PrivacySettings {
  readonly dataCollection: boolean
  readonly analytics: boolean
  readonly cloudSync: boolean
  readonly shareGarden: boolean
  readonly showProfile: boolean
  readonly shareAchievements: boolean
  readonly allowFriendRequests: boolean
}

export interface GardenPreferences {
  readonly autoArrange: boolean
  readonly showAnimations: boolean
  readonly soundEffects: boolean
  readonly hapticFeedback: boolean
  readonly seasonalThemes: boolean
}

export interface UserStats {
  readonly totalDays: number
  readonly currentStreak: number
  readonly longestStreak: number
  readonly totalElements: number
  readonly rareElementsFound: number
  readonly gardensShared: number
  readonly firstVisit: Date
  readonly lastVisit: Date
}

export interface UserState {
  readonly currentUser: User | null
  readonly isAuthenticated: boolean
  readonly isLoading: boolean
  readonly error: string | null
  readonly hasCompletedOnboarding: boolean
}

// Profile and Achievement Types
export interface Achievement {
  readonly id: string
  readonly name: string
  readonly description: string
  readonly emoji: string
  readonly category: AchievementCategory
  readonly unlockedAt?: Date
  readonly isUnlocked: boolean
  readonly progress?: number
  readonly maxProgress?: number
}

export enum AchievementCategory {
  STREAK = 'streak',
  GARDEN = 'garden',
  MOOD = 'mood',
  SOCIAL = 'social',
  SPECIAL = 'special',
}

export interface GardenerLevel {
  readonly level: number
  readonly name: string
  readonly emoji: string
  readonly minExperience: number
  readonly maxExperience: number
  readonly benefits: readonly string[]
}

export interface ProfileStats {
  readonly level: GardenerLevel
  readonly experience: number
  readonly achievements: readonly Achievement[]
  readonly totalMoodEntries: number
  readonly favoriteMood: string
  readonly daysSinceRegistration: number
  readonly averageElementsPerDay: number
}
