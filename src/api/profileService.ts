/**
 * 📊 Profile API Service Layer
 * Инкапсулирует все API запросы связанные с профилем и опытом
 */

import { authenticatedFetch } from '@/utils/apiClient'
import type {
  ProfileData,
  StandardApiResponse,
  ProfileApiGetProfileResponse,
  ProfileApiAddExperienceResponse,
  DatabaseAchievement,
} from '@/types/api'

// ============================================
// ТИПЫ ДЛЯ API ЗАПРОСОВ И ОТВЕТОВ
// ============================================

export interface AddExperienceRequest {
  readonly telegramId: number
  readonly experiencePoints: number
  readonly reason: string
}

export interface AddExperienceResult {
  readonly experience: number
  readonly level: number
  readonly leveledUp?: boolean
  readonly newAchievements: readonly DatabaseAchievement[]
  readonly reason: string
}

export interface FriendProfileRequest {
  readonly telegramId: number
  readonly friendTelegramId: number
}

// ============================================
// API ФУНКЦИИ
// ============================================

/**
 * Получает полный профиль пользователя
 */
export async function getProfile(
  telegramId: number
): Promise<ProfileData | null> {
  try {
    const response = await authenticatedFetch(
      `/api/profile?action=get_profile&telegramId=${telegramId}`
    )

    if (!response.ok) {
      throw new Error(`Failed to load profile: ${response.status}`)
    }

    const result =
      (await response.json()) as StandardApiResponse<ProfileApiGetProfileResponse>

    if (!result.success || !result.data) {
      return null
    }

    return result.data
  } catch (error) {
    console.error('Failed to get profile:', error)
    throw error
  }
}

/**
 * Добавляет опыт пользователю
 */
export async function addExperience(
  request: AddExperienceRequest
): Promise<AddExperienceResult | null> {
  try {
    const response = await authenticatedFetch(
      '/api/profile?action=add_experience',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
      }
    )

    if (!response.ok) {
      throw new Error(`Failed to add experience: ${response.status}`)
    }

    const result =
      (await response.json()) as StandardApiResponse<ProfileApiAddExperienceResponse>

    if (!result.success || !result.data) {
      return null
    }

    const resultData: AddExperienceResult = {
      experience: result.data.experience,
      level: result.data.level ?? 1,
      newAchievements: [],
      reason: request.reason,
    }

    // Добавляем leveledUp только если оно определено
    if (result.data.leveledUp !== undefined) {
      return {
        ...resultData,
        leveledUp: result.data.leveledUp,
      }
    }

    return resultData
  } catch (error) {
    console.error('Failed to add experience:', error)
    throw error
  }
}

/**
 * Получает профиль друга
 */
export async function getFriendProfile(
  request: FriendProfileRequest
): Promise<ProfileData | null> {
  try {
    const response = await authenticatedFetch(
      `/api/profile?action=get_friend_profile&telegramId=${request.telegramId}&friendTelegramId=${request.friendTelegramId}`
    )

    if (!response.ok) {
      if (response.status === 403) {
        throw new Error('Профиль недоступен или пользователь не в друзьях')
      }
      throw new Error(`Failed to load friend profile: ${response.status}`)
    }

    const result =
      (await response.json()) as StandardApiResponse<ProfileApiGetProfileResponse>

    if (!result.success || !result.data) {
      return null
    }

    return result.data
  } catch (error) {
    console.error('Failed to get friend profile:', error)
    throw error
  }
}
