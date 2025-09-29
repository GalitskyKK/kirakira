import type { Garden, GardenElement } from './garden'
import type { MoodEntry } from './mood'
import type { User } from './user'

export interface ApiResponse<T> {
  readonly data: T
  readonly error: string | null
  readonly success: boolean
}

export interface ApiError {
  readonly message: string
  readonly code: string
  readonly details?: Record<string, unknown>
}

// API Endpoints
export interface ApiEndpoints {
  readonly auth: AuthEndpoints
  readonly garden: GardenEndpoints
  readonly mood: MoodEndpoints
  readonly user: UserEndpoints
}

export interface AuthEndpoints {
  readonly signIn: (
    email: string,
    password: string
  ) => Promise<ApiResponse<User>>
  readonly signUp: (
    email: string,
    password: string
  ) => Promise<ApiResponse<User>>
  readonly signOut: () => Promise<ApiResponse<void>>
  readonly getCurrentUser: () => Promise<ApiResponse<User | null>>
}

export interface GardenEndpoints {
  readonly getGarden: (userId: string) => Promise<ApiResponse<Garden>>
  readonly updateGarden: (garden: Garden) => Promise<ApiResponse<Garden>>
  readonly addElement: (
    element: GardenElement
  ) => Promise<ApiResponse<GardenElement>>
  readonly shareGarden: (gardenId: string) => Promise<ApiResponse<string>>
}

export interface MoodEndpoints {
  readonly getMoodHistory: (
    userId: string,
    limit?: number
  ) => Promise<ApiResponse<readonly MoodEntry[]>>
  readonly addMoodEntry: (
    entry: Omit<MoodEntry, 'id' | 'createdAt'>
  ) => Promise<ApiResponse<MoodEntry>>
  readonly getTodaysMood: (
    userId: string
  ) => Promise<ApiResponse<MoodEntry | null>>
}

export interface UserEndpoints {
  readonly getProfile: (userId: string) => Promise<ApiResponse<User>>
  readonly updateProfile: (user: Partial<User>) => Promise<ApiResponse<User>>
  readonly deleteAccount: (userId: string) => Promise<ApiResponse<void>>
}

// Request/Response types
export interface CreateGardenRequest {
  readonly userId: string
  readonly initialMood: MoodEntry
}

export interface UpdateElementPositionRequest {
  readonly elementId: string
  readonly newPosition: { x: number; y: number }
}

export interface ShareGardenRequest {
  readonly gardenId: string
  readonly includeStats: boolean
  readonly includeHistory: boolean
}

export interface ShareGardenResponse {
  readonly shareUrl: string
  readonly expiresAt: Date
  readonly viewCount: number
}

// Profile API types - определяем на основе схемы БД
export interface DatabaseUser {
  readonly telegram_id: number
  readonly user_id: string
  readonly username?: string
  readonly first_name?: string
  readonly last_name?: string
  readonly language_code?: string
  readonly registration_date: string
  readonly last_visit_date: string
  readonly is_anonymous: boolean
  readonly onboarding_completed: boolean
  readonly notifications_enabled: boolean
  readonly theme: string
  readonly total_days: number
  readonly current_streak: number
  readonly longest_streak: number
  readonly total_elements: number
  readonly rare_elements_found: number
  readonly gardens_shared: number
  readonly created_at: string
  readonly updated_at: string
  readonly photo_url?: string
  readonly share_garden: boolean
  readonly experience: number
  readonly level: number
  readonly privacy_settings: Record<string, boolean>
}

export interface DatabaseUserStats {
  readonly totalDays: number
  readonly currentStreak: number
  readonly longestStreak: number
  readonly totalElements: number
  readonly rareElementsFound: number
  readonly gardensShared: number
  readonly experience: number
  readonly level: number
}

export interface DatabaseAchievement {
  readonly id: string
  readonly achievement_id: string
  readonly unlocked_at: string
  readonly progress: number
  readonly is_unlocked: boolean
}

export interface ProfileData {
  readonly user: DatabaseUser
  readonly stats: DatabaseUserStats
  readonly achievements: readonly DatabaseAchievement[]
  readonly newlyUnlocked?: readonly DatabaseAchievement[]
}

// Дополнительные типы для garden_elements
export interface DatabaseGardenElement {
  readonly id: string
  readonly telegram_id: number
  readonly element_type: string
  readonly rarity: string
  readonly position_x: number
  readonly position_y: number
  readonly mood_influence?: string
  readonly unlock_date: string
  readonly created_at: string
  readonly updated_at: string
}

// Типы для mood_entries
export interface DatabaseMoodEntry {
  readonly id: string
  readonly telegram_id: number
  readonly mood: string
  readonly intensity: number
  readonly note?: string
  readonly mood_date: string
  readonly created_at: string
}

// Типы для friendships
export interface DatabaseFriendship {
  readonly id: string
  readonly requester_telegram_id: number
  readonly addressee_telegram_id: number
  readonly status: 'pending' | 'accepted' | 'declined' | 'blocked'
  readonly created_at: string
  readonly updated_at: string
}

// Общий тип для API ответов
export interface StandardApiResponse<T = unknown> {
  readonly success: boolean
  readonly data?: T
  readonly error?: string
}

// ===========================================
// 🔧 API ENDPOINT TYPES - Полная типизация
// ===========================================

// PROFILE API TYPES (/api/profile)
export interface ProfileApiGetProfileResponse {
  readonly user: DatabaseUser
  readonly stats: DatabaseUserStats
  readonly achievements: readonly DatabaseAchievement[]
  readonly newlyUnlocked?: readonly DatabaseAchievement[]
}

export interface ProfileApiAddExperienceResponse {
  readonly experience: number
  readonly level: number
  readonly leveledUp?: boolean
  readonly message?: string
}

export interface ProfileApiUpdatePrivacyResponse {
  readonly message: string
  readonly updatedSettings: Record<string, boolean>
}

// USER API TYPES (/api/user)
export interface UserApiStatsResponse {
  readonly totalDays: number
  readonly currentStreak: number
  readonly longestStreak: number
  readonly totalElements: number
  readonly rareElementsFound: number
  readonly gardensShared: number
  readonly experience: number
  readonly level: number
}

export interface UserApiUpdatePhotoResponse {
  readonly message: string
  readonly photoUrl: string
}

// FRIENDS API TYPES (/api/friends)
export interface FriendApiUser {
  readonly telegram_id: number
  readonly first_name: string
  readonly last_name?: string
  readonly username?: string
  readonly photo_url?: string
  readonly level: number
  readonly registration_date: string
  readonly is_online?: boolean
  readonly last_seen?: string
  readonly privacy_settings: Record<string, boolean>
}

export interface FriendApiListResponse {
  readonly friends: readonly FriendApiUser[]
  readonly pendingRequests: readonly {
    readonly id: string
    readonly requester: FriendApiUser
    readonly created_at: string
  }[]
  readonly sentRequests: readonly {
    readonly id: string
    readonly addressee: FriendApiUser
    readonly created_at: string
  }[]
}

export interface FriendApiSearchResponse {
  readonly users: readonly FriendApiUser[]
  readonly hasMore: boolean
  readonly nextPage?: number
}

export interface FriendApiSendRequestResponse {
  readonly message: string
  readonly requestId: string
  readonly status: 'sent' | 'already_friends' | 'request_exists'
}

export interface FriendApiRespondRequestResponse {
  readonly message: string
  readonly status: 'accepted' | 'declined'
  readonly friendship?: {
    readonly id: string
    readonly friend: FriendApiUser
  }
}

// MOOD API TYPES (/api/mood)
export interface MoodApiAddResponse {
  readonly mood: DatabaseMoodEntry
  readonly isFirstToday: boolean
  readonly experienceGained?: number
}

export interface MoodApiTodayResponse {
  readonly mood: DatabaseMoodEntry | null
}

export interface MoodApiHistoryResponse {
  readonly moods: readonly DatabaseMoodEntry[]
  readonly stats: {
    readonly totalEntries: number
    readonly currentStreak: number
    readonly longestStreak: number
    readonly averageMood: string
    readonly moodDistribution: Record<string, number>
  }
}

// GARDEN API TYPES (/api/garden)
export interface GardenApiSyncResponse {
  readonly elements: readonly DatabaseGardenElement[]
  readonly newElement?: DatabaseGardenElement
  readonly user: DatabaseUser
  readonly stats: DatabaseUserStats
}

export interface GardenApiFriendViewResponse {
  readonly user: {
    readonly telegram_id: number
    readonly first_name: string
    readonly last_name?: string
    readonly username?: string
    readonly photo_url?: string
    readonly level: number
    readonly registration_date: string
  }
  readonly elements: readonly DatabaseGardenElement[]
  readonly stats: {
    readonly totalElements: number
    readonly rareElementsFound: number
    readonly currentStreak: number
    readonly totalDays: number
  }
  readonly privacy: {
    readonly shareGarden: boolean
    readonly showProfile: boolean
  }
}

// TELEGRAM API TYPES (/api/telegram)
export interface TelegramApiUserStatsResponse {
  readonly stats: DatabaseUserStats
  readonly achievements: readonly DatabaseAchievement[]
  readonly level: {
    readonly current: number
    readonly name: string
    readonly emoji: string
    readonly experience: number
    readonly nextLevelAt: number
  }
}

// PREMIUM API TYPES (/api/premium)
export interface PremiumApiFeature {
  readonly id: string
  readonly telegram_id: number
  readonly feature_id: string
  readonly transaction_id?: string
  readonly activated_at: string
  readonly expires_at?: string
}

export interface PremiumApiPurchaseResponse {
  readonly feature: PremiumApiFeature
  readonly invoiceUrl?: string
  readonly paymentId?: string
}

// ===========================================
// 🔧 REQUEST TYPES - Типы для запросов
// ===========================================

export interface ProfileApiGetProfileRequest {
  readonly telegramId: number
  readonly userData?: Partial<DatabaseUser>
}

export interface ProfileApiAddExperienceRequest {
  readonly telegramId: number
  readonly experiencePoints: number
  readonly reason: string
}

export interface ProfileApiUpdatePrivacyRequest {
  readonly telegramId: number
  readonly settings: Record<string, boolean>
}

export interface MoodApiAddRequest {
  readonly telegramId: number
  readonly mood: string
  readonly intensity: number
  readonly note?: string
}

export interface FriendApiSearchRequest {
  readonly query: string
  readonly page?: number
  readonly limit?: number
  readonly excludeIds?: readonly number[]
}

export interface FriendApiSendRequestRequest {
  readonly fromTelegramId: number
  readonly toTelegramId: number
}

export interface FriendApiRespondRequestRequest {
  readonly requestId: string
  readonly response: 'accept' | 'decline'
}
