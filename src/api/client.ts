/**
 * Централизованный API-клиент с Zod-валидацией
 *
 * Все запросы к API проходят через этот клиент для:
 * - Единообразной обработки ошибок
 * - Runtime валидации ответов
 * - Типобезопасности
 */

import { z } from 'zod'
import {
  validateApiResponse,
  StandardApiResponseSchema,
  ProfileApiGetProfileResponseSchema,
  ProfileApiAddExperienceResponseSchema,
  GardenApiHistoryResponseSchema,
  GardenApiAddElementResponseSchema,
  MoodApiHistoryResponseSchema,
  MoodApiRecordResponseSchema,
} from '@/schemas/api'
import type {
  StandardApiResponse,
  ProfileApiGetProfileResponse,
  ProfileApiAddExperienceResponse,
  DatabaseGardenElement,
  DatabaseMoodEntry,
  MoodType,
  MoodIntensity,
  ElementType,
  RarityLevel,
  Position2D,
} from '@/types'

// ============================================
// API CLIENT CONFIGURATION
// ============================================

interface ApiClientConfig {
  readonly baseUrl: string
  readonly timeout: number
}

const DEFAULT_CONFIG: ApiClientConfig = {
  baseUrl: '/api',
  timeout: 30000, // 30 seconds
}

// ============================================
// ERROR HANDLING
// ============================================

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly statusCode?: number,
    public readonly context?: string
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

export class ValidationError extends Error {
  constructor(
    message: string,
    public readonly context?: string
  ) {
    super(message)
    this.name = 'ValidationError'
  }
}

// ============================================
// BASE API CLIENT
// ============================================

class ApiClient {
  private readonly config: ApiClientConfig

  constructor(config: Partial<ApiClientConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config }
  }

  /**
   * Выполняет HTTP-запрос с автоматической валидацией
   */
  private async request<T>(
    url: string,
    options: RequestInit = {},
    schema?: z.ZodSchema<T>,
    context?: string
  ): Promise<T> {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout)

    try {
      const fullUrl = url.startsWith('http')
        ? url
        : `${this.config.baseUrl}${url}`

      const response = await fetch(fullUrl, {
        ...options,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        throw new ApiError(
          `HTTP ${response.status}: ${response.statusText}`,
          response.status,
          context
        )
      }

      const data = await response.json()

      // Если есть схема - валидируем
      if (schema) {
        return validateApiResponse(schema, data, context)
      }

      return data as T
    } catch (error) {
      clearTimeout(timeoutId)

      if (error instanceof ApiError || error instanceof ValidationError) {
        throw error
      }

      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new ApiError('Request timeout', undefined, context)
        }
        throw new ApiError(error.message, undefined, context)
      }

      throw new ApiError('Unknown error occurred', undefined, context)
    }
  }

  /**
   * GET запрос
   */
  async get<T>(
    url: string,
    schema?: z.ZodSchema<T>,
    context?: string
  ): Promise<T> {
    return this.request<T>(url, { method: 'GET' }, schema, context)
  }

  /**
   * POST запрос
   */
  async post<T>(
    url: string,
    body: unknown,
    schema?: z.ZodSchema<T>,
    context?: string
  ): Promise<T> {
    return this.request<T>(
      url,
      {
        method: 'POST',
        body: JSON.stringify(body),
      },
      schema,
      context
    )
  }

  /**
   * PUT запрос
   */
  async put<T>(
    url: string,
    body: unknown,
    schema?: z.ZodSchema<T>,
    context?: string
  ): Promise<T> {
    return this.request<T>(
      url,
      {
        method: 'PUT',
        body: JSON.stringify(body),
      },
      schema,
      context
    )
  }

  /**
   * DELETE запрос
   */
  async delete<T>(
    url: string,
    schema?: z.ZodSchema<T>,
    context?: string
  ): Promise<T> {
    return this.request<T>(url, { method: 'DELETE' }, schema, context)
  }
}

// Singleton instance
const apiClient = new ApiClient()

// ============================================
// PROFILE API
// ============================================

export const profileApi = {
  /**
   * Получить профиль пользователя
   */
  getProfile: async (
    telegramId: number,
    userData?: {
      readonly userId: string
      readonly firstName?: string
      readonly lastName?: string
      readonly username?: string
      readonly languageCode?: string
      readonly photoUrl?: string
    }
  ): Promise<StandardApiResponse<ProfileApiGetProfileResponse>> => {
    if (userData) {
      const result = await apiClient.post(
        '/profile?action=get_profile',
        { telegramId, userData },
        StandardApiResponseSchema(ProfileApiGetProfileResponseSchema),
        'profileApi.getProfile'
      )
      return result as StandardApiResponse<ProfileApiGetProfileResponse>
    }

    const result = await apiClient.get(
      `/profile?action=get_profile&telegramId=${telegramId}`,
      StandardApiResponseSchema(ProfileApiGetProfileResponseSchema),
      'profileApi.getProfile'
    )
    return result as StandardApiResponse<ProfileApiGetProfileResponse>
  },

  /**
   * Добавить опыт пользователю
   */
  addExperience: async (
    telegramId: number,
    experiencePoints: number,
    reason: string
  ): Promise<StandardApiResponse<ProfileApiAddExperienceResponse>> => {
    const result = await apiClient.post(
      '/profile?action=add_experience',
      { telegramId, experiencePoints, reason },
      StandardApiResponseSchema(ProfileApiAddExperienceResponseSchema),
      'profileApi.addExperience'
    )
    return result as StandardApiResponse<ProfileApiAddExperienceResponse>
  },

  /**
   * Обновить настройки приватности
   */
  updatePrivacy: async (
    telegramId: number,
    settings: Record<string, boolean>
  ): Promise<
    StandardApiResponse<{
      message: string
      updatedSettings: Record<string, boolean>
    }>
  > => {
    return apiClient.post(
      '/profile?action=update_privacy',
      { telegramId, settings },
      undefined,
      'profileApi.updatePrivacy'
    )
  },
}

// ============================================
// GARDEN API
// ============================================

interface TelegramUserData {
  readonly userId: string
  readonly firstName?: string
  readonly lastName?: string
  readonly username?: string
  readonly languageCode?: string
  readonly photoUrl?: string
}

export const gardenApi = {
  /**
   * Получить историю элементов сада
   */
  getHistory: async (
    telegramId: number
  ): Promise<
    StandardApiResponse<{ gardenElements: DatabaseGardenElement[] }>
  > => {
    const result = await apiClient.get(
      `/garden?action=history&telegramId=${telegramId}`,
      StandardApiResponseSchema(GardenApiHistoryResponseSchema),
      'gardenApi.getHistory'
    )
    return result as StandardApiResponse<{
      gardenElements: DatabaseGardenElement[]
    }>
  },

  /**
   * Добавить элемент в сад
   */
  addElement: async (
    telegramId: number,
    element: {
      readonly type: ElementType
      readonly position: Position2D
      readonly unlockDate: string
      readonly moodInfluence: MoodType
      readonly rarity: RarityLevel
    },
    telegramUserData: TelegramUserData
  ): Promise<StandardApiResponse<{ element: DatabaseGardenElement }>> => {
    const result = await apiClient.post(
      '/garden?action=add-element',
      { telegramId, element, telegramUserData },
      StandardApiResponseSchema(GardenApiAddElementResponseSchema),
      'gardenApi.addElement'
    )
    return result as StandardApiResponse<{ element: DatabaseGardenElement }>
  },

  /**
   * Обновить позицию элемента
   */
  updatePosition: async (
    telegramId: number,
    elementId: string,
    position: Position2D
  ): Promise<StandardApiResponse<{ message: string }>> => {
    return apiClient.post(
      '/garden?action=update-position',
      { telegramId, elementId, position },
      undefined,
      'gardenApi.updatePosition'
    )
  },
}

// ============================================
// MOOD API
// ============================================

export const moodApi = {
  /**
   * Получить историю настроений
   */
  getHistory: async (
    telegramId: number
  ): Promise<StandardApiResponse<{ moodHistory: DatabaseMoodEntry[] }>> => {
    const result = await apiClient.get(
      `/mood?action=history&telegramId=${telegramId}`,
      StandardApiResponseSchema(MoodApiHistoryResponseSchema),
      'moodApi.getHistory'
    )
    return result as StandardApiResponse<{ moodHistory: DatabaseMoodEntry[] }>
  },

  /**
   * Записать настроение
   */
  recordMood: async (
    telegramUserId: number,
    mood: MoodType,
    intensity: MoodIntensity,
    date: string,
    telegramUserData: TelegramUserData,
    note?: string
  ): Promise<StandardApiResponse<{ mood: DatabaseMoodEntry }>> => {
    const result = await apiClient.post(
      '/mood?action=record',
      {
        telegramUserId,
        mood,
        intensity,
        note,
        date,
        telegramUserData,
      },
      StandardApiResponseSchema(MoodApiRecordResponseSchema),
      'moodApi.recordMood'
    )
    return result as StandardApiResponse<{ mood: DatabaseMoodEntry }>
  },

  /**
   * Получить настроение за сегодня
   */
  getTodaysMood: async (
    telegramId: number
  ): Promise<StandardApiResponse<{ mood: DatabaseMoodEntry | null }>> => {
    return apiClient.get(
      `/mood?action=today&telegramId=${telegramId}`,
      undefined,
      'moodApi.getTodaysMood'
    )
  },
}

// Export default client for advanced usage
export default apiClient
