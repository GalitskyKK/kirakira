/**
 * 👤 User API Service Layer
 * Инкапсулирует все API запросы связанные с пользователем
 */

import { authenticatedFetch } from '@/utils/apiClient'
import { GardenDisplayMode } from '@/types'
import type { User, UserPreferences, UserStats } from '@/types'
import type {
  DatabaseUser,
  StandardApiResponse,
  ProfileApiGetProfileResponse,
} from '@/types/api'

// ============================================
// ТИПЫ ДЛЯ API ЗАПРОСОВ И ОТВЕТОВ
// ============================================

export interface UserSyncRequest {
  readonly telegramId: number
  readonly userData?: Partial<DatabaseUser>
}

export interface UserSyncResponse {
  readonly user: User
  readonly stats: UserStats
}

// ============================================
// УТИЛИТЫ ДЛЯ КОНВЕРТАЦИИ ДАННЫХ
// ============================================

const DEFAULT_PREFERENCES: UserPreferences = {
  theme: 'auto',
  language: 'ru',
  notifications: {
    enabled: true,
    dailyReminder: true,
    reminderTime: '10:00',
    weeklyStats: true,
    milestones: true,
    streakLost: true,
    inactivityReminder: true,
    weeklyMotivation: true,
    achievements: true,
  },
  privacy: {
    dataCollection: false,
    analytics: false,
    cloudSync: false,
    shareGarden: true,
    showProfile: true,
    shareAchievements: true,
    allowFriendRequests: true,
  },
  garden: {
    autoArrange: false,
    showAnimations: true,
    soundEffects: false,
    hapticFeedback: true,
    seasonalThemes: true,
    friendViewMode: GardenDisplayMode.GARDEN,
  },
}

function isValidDisplayMode(mode: unknown): mode is GardenDisplayMode {
  return (
    typeof mode === 'string' &&
    Object.values(GardenDisplayMode).includes(mode as GardenDisplayMode)
  )
}

function createDefaultStats(): UserStats {
  const now = new Date()
  return {
    totalDays: 0,
    currentStreak: 0,
    longestStreak: 0,
    totalElements: 0,
    rareElementsFound: 0,
    gardensShared: 0,
    firstVisit: now,
    lastVisit: now,
    streakFreezes: 0,
    autoFreezes: 0,
    freeUpgrades: 0,
  }
}

/**
 * Конвертирует серверные данные пользователя в клиентский формат
 */
export function convertServerUserToClient(
  telegramId: number,
  serverUser: DatabaseUser,
  serverStats?: {
    totalDays?: number
    currentStreak?: number
    longestStreak?: number
    totalElements?: number
    rareElementsFound?: number
    gardensShared?: number
  }
): User {
  const baseUser: User = {
    id: `tg_${telegramId}`,
    telegramId: telegramId,
    registrationDate: serverUser.registration_date
      ? new Date(serverUser.registration_date)
      : new Date(),
    lastVisitDate: serverUser.last_visit_date
      ? new Date(serverUser.last_visit_date)
      : new Date(),
    roomTheme: serverUser.room_theme ?? 'isoRoom',
    preferences: {
      ...DEFAULT_PREFERENCES,
      garden: {
        ...DEFAULT_PREFERENCES.garden,
        friendViewMode: isValidDisplayMode(serverUser.friend_garden_display)
          ? serverUser.friend_garden_display
          : DEFAULT_PREFERENCES.garden.friendViewMode,
      },
      privacy: {
        ...DEFAULT_PREFERENCES.privacy,
        ...(serverUser.privacy_settings || {}),
      },
    },
    stats: {
      ...createDefaultStats(),
      totalDays:
        serverStats?.totalDays !== undefined
          ? serverStats.totalDays
          : serverUser.total_days !== undefined
            ? serverUser.total_days
            : 0,
      currentStreak:
        serverStats?.currentStreak !== undefined
          ? serverStats.currentStreak
          : serverUser.current_streak !== undefined
            ? serverUser.current_streak
            : 0,
      longestStreak:
        serverStats?.longestStreak !== undefined
          ? serverStats.longestStreak
          : serverUser.longest_streak !== undefined
            ? serverUser.longest_streak
            : 0,
      totalElements:
        serverStats?.totalElements !== undefined
          ? serverStats.totalElements
          : serverUser.total_elements !== undefined
            ? serverUser.total_elements
            : 0,
      rareElementsFound:
        serverStats?.rareElementsFound !== undefined
          ? serverStats.rareElementsFound
          : serverUser.rare_elements_found !== undefined
            ? serverUser.rare_elements_found
            : 0,
      gardensShared:
        serverStats?.gardensShared !== undefined
          ? serverStats.gardensShared
          : serverUser.gardens_shared !== undefined
            ? serverUser.gardens_shared
            : 0,
      streakFreezes: serverUser.streak_freezes ?? 0,
      autoFreezes: serverUser.auto_freezes ?? 0,
      freeUpgrades: serverUser.free_upgrades ?? 0,
    },
    isAnonymous: false,
  }

  // Добавляем optional поля только если они определены
  return {
    ...baseUser,
    ...(serverUser.first_name !== undefined && {
      firstName: serverUser.first_name,
    }),
    ...(serverUser.last_name !== undefined && {
      lastName: serverUser.last_name,
    }),
    ...(serverUser.username !== undefined && { username: serverUser.username }),
    ...(serverUser.photo_url !== undefined && {
      photoUrl: serverUser.photo_url,
    }),
    ...(serverUser.experience !== undefined && {
      experience: serverUser.experience,
    }),
    ...(serverUser.level !== undefined && { level: serverUser.level }),
  }
}

// ============================================
// API ФУНКЦИИ
// ============================================

/**
 * Синхронизирует данные пользователя с сервером
 */
export async function syncUserFromSupabase(
  telegramId: number,
  userData?: Partial<DatabaseUser>
): Promise<UserSyncResponse | null> {
  try {
    let response: Response
    if (userData) {
      response = await authenticatedFetch(`/api/profile?action=get_profile`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ telegramId, userData }),
      })
    } else {
      response = await authenticatedFetch(
        `/api/profile?action=get_profile&telegramId=${telegramId}`
      )
    }

    if (!response.ok) {
      throw new Error(`Failed to fetch user data: ${response.status}`)
    }

    const result =
      (await response.json()) as StandardApiResponse<ProfileApiGetProfileResponse>

    if (!result.success || !result.data?.user) {
      return null
    }

    const user = convertServerUserToClient(
      telegramId,
      result.data.user,
      result.data.stats
    )

    return {
      user,
      stats: user.stats,
    }
  } catch (error) {
    console.error('Failed to sync user from Supabase:', error)
    throw error
  }
}

/**
 * Обновляет настройки приватности пользователя
 */
export async function updatePrivacySettings(
  telegramId: number,
  privacySettings: Record<string, boolean>
): Promise<boolean> {
  try {
    const response = await authenticatedFetch(
      '/api/profile?action=update_privacy',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          telegramId,
          privacySettings,
        }),
      }
    )

    if (!response.ok) {
      throw new Error(`Failed to update privacy: ${response.status}`)
    }

    const result = (await response.json()) as StandardApiResponse

    return result.success
  } catch (error) {
    console.error('Failed to update privacy settings:', error)
    throw error
  }
}

/**
 * Обновляет фото профиля пользователя
 */
export async function updateUserPhoto(
  telegramId: number,
  photoUrl: string
): Promise<boolean> {
  try {
    const response = await authenticatedFetch('/api/user?action=update_photo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        telegramId,
        photoUrl,
      }),
    })

    if (!response.ok) {
      throw new Error(`Failed to update photo: ${response.status}`)
    }

    const result = (await response.json()) as StandardApiResponse

    return result.success
  } catch (error) {
    console.error('Failed to update user photo:', error)
    throw error
  }
}

/**
 * Обновляет приоритетный вид сада при просмотре друзей
 */
export async function updateFriendGardenDisplay(
  telegramId: number,
  displayMode: GardenDisplayMode
): Promise<{
  success: boolean
  data?: { friendGardenDisplay: GardenDisplayMode }
  error?: string
}> {
  try {
    const response = await authenticatedFetch(
      `/api/user?action=update-friend-garden-display&telegramId=${telegramId}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          friendGardenDisplay: displayMode,
        }),
      }
    )

    if (!response.ok) {
      throw new Error(
        `Failed to update friend garden display: ${response.status}`
      )
    }

    const result = (await response.json()) as StandardApiResponse<{
      friendGardenDisplay: GardenDisplayMode
    }>

    return {
      success: result.success,
      ...(result.data && { data: result.data }),
      ...(result.error && { error: result.error }),
    }
  } catch (error) {
    console.error('Failed to update friend garden display:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Добавляет опыт пользователю
 */
export async function addUserExperience(
  telegramId: number,
  experiencePoints: number,
  reason: string
): Promise<{
  success: boolean
  data?: {
    experience: number
    level: number
    leveledUp?: boolean
    sproutReward?: number
    gemReward?: number
    specialUnlock?: string | null
    newAchievements?: readonly string[]
    reason: string
  }
  error?: string
}> {
  try {
    const response = await authenticatedFetch(
      '/api/profile?action=add_experience',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          telegramId,
          experiencePoints,
          reason,
        }),
      }
    )

    if (!response.ok) {
      throw new Error(`Failed to add experience: ${response.status}`)
    }

    const result = (await response.json()) as StandardApiResponse<{
      experience: number
      level: number
      leveledUp: boolean
      sproutReward: number
      gemReward: number
      specialUnlock: string | null
      newAchievements: readonly string[]
      reason: string
    }>

    return {
      success: result.success,
      ...(result.data && { data: result.data }),
      ...(result.error && { error: result.error }),
    }
  } catch (error) {
    console.error('Failed to add user experience:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Очищает данные пользователя
 */
export async function clearUserData(telegramId: number): Promise<boolean> {
  try {
    const response = await authenticatedFetch('/api/user?action=clear_data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        telegramId,
      }),
    })

    if (!response.ok) {
      throw new Error(`Failed to clear user data: ${response.status}`)
    }

    const result = (await response.json()) as StandardApiResponse

    return result.success
  } catch (error) {
    console.error('Failed to clear user data:', error)
    throw error
  }
}
