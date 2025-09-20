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
  readonly signIn: (email: string, password: string) => Promise<ApiResponse<User>>
  readonly signUp: (email: string, password: string) => Promise<ApiResponse<User>>
  readonly signOut: () => Promise<ApiResponse<void>>
  readonly getCurrentUser: () => Promise<ApiResponse<User | null>>
}

export interface GardenEndpoints {
  readonly getGarden: (userId: string) => Promise<ApiResponse<Garden>>
  readonly updateGarden: (garden: Garden) => Promise<ApiResponse<Garden>>
  readonly addElement: (element: GardenElement) => Promise<ApiResponse<GardenElement>>
  readonly shareGarden: (gardenId: string) => Promise<ApiResponse<string>>
}

export interface MoodEndpoints {
  readonly getMoodHistory: (userId: string, limit?: number) => Promise<ApiResponse<readonly MoodEntry[]>>
  readonly addMoodEntry: (entry: Omit<MoodEntry, 'id' | 'createdAt'>) => Promise<ApiResponse<MoodEntry>>
  readonly getTodaysMood: (userId: string) => Promise<ApiResponse<MoodEntry | null>>
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
