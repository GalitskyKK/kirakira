/**
 * 🌱 Garden API Service Layer
 * Инкапсулирует все API запросы связанные с садом
 */

import { authenticatedFetch } from '@/utils/apiClient'
import type {
  GardenElement,
  Position2D,
  MoodType,
  ElementType,
  RarityLevel,
  SeasonalVariant,
} from '@/types'
import type {
  DatabaseGardenElement,
  StandardApiResponse,
  ProfileApiGetProfileResponse,
} from '@/types/api'
import {
  getElementName,
  getElementDescription,
  getElementEmoji,
  getElementColor,
  getElementScale,
} from '@/utils/elementNames'
import { getCurrentSeason } from '@/utils/elementGeneration'

// ============================================
// ТИПЫ ДЛЯ API ЗАПРОСОВ И ОТВЕТОВ
// ============================================

export interface GardenSyncRequest {
  readonly telegramId: number
  readonly forceSync?: boolean
}

export interface GardenHistoryResponse {
  readonly success: boolean
  readonly data?: {
    readonly gardenElements: readonly DatabaseGardenElement[]
  }
  readonly error?: string
}

export interface AddElementRequest {
  readonly telegramId: number
  readonly element: {
    readonly type: ElementType
    readonly position: Position2D
    readonly unlockDate: string
    readonly moodInfluence: MoodType
    readonly rarity: RarityLevel
    readonly seasonalVariant: SeasonalVariant
  }
  readonly telegramUserData: {
    readonly userId: string
    readonly firstName: string
    readonly lastName?: string
    readonly username?: string
    readonly languageCode: string
    readonly photoUrl?: string
  }
}

export interface AddElementResponse {
  readonly success: boolean
  readonly data?: {
    readonly id: string
    readonly element_type: string
    readonly rarity: string
    [key: string]: unknown
  }
  readonly error?: string
}

export interface UpdatePositionRequest {
  readonly telegramId: number
  readonly elementId: string
  readonly position: Position2D
}

export interface UpdatePositionResponse {
  readonly success: boolean
  readonly error?: string
}

// ============================================
// УТИЛИТЫ ДЛЯ КОНВЕРТАЦИИ ДАННЫХ
// ============================================

/**
 * Конвертирует серверный элемент в клиентский формат
 */
export function convertServerElementToClient(
  serverElement: DatabaseGardenElement
): GardenElement {
  const moodInfluence = (serverElement.mood_influence ?? 'joy') as MoodType
  const elementType = serverElement.element_type as ElementType
  const rarity = serverElement.rarity as RarityLevel
  const characteristicsSeed = serverElement.id || `temp_${Date.now()}`

  // Генерируем все характеристики детерминированно на основе element.id
  const name = getElementName(elementType, rarity, characteristicsSeed)
  const description = getElementDescription(elementType, rarity, name)
  const emoji = getElementEmoji(elementType)
  const color = getElementColor(elementType, moodInfluence, characteristicsSeed)
  const scale = getElementScale(characteristicsSeed)

  // Используем сезон из БД или определяем по дате разблокировки
  const seasonalVariant = serverElement.seasonal_variant
    ? (serverElement.seasonal_variant as SeasonalVariant)
    : getCurrentSeason(new Date(serverElement.unlock_date))

  return {
    id: characteristicsSeed,
    type: elementType,
    position: {
      x: serverElement.position_x,
      y: serverElement.position_y,
    },
    unlockDate: new Date(serverElement.unlock_date),
    moodInfluence,
    rarity,
    seasonalVariant,
    name,
    description,
    emoji,
    color,
    scale,
  }
}

// ============================================
// API ФУНКЦИИ
// ============================================

/**
 * Получает профиль пользователя для синхронизации сада
 */
export async function getUserProfile(
  telegramId: number
): Promise<ProfileApiGetProfileResponse | null> {
  try {
    const response = await authenticatedFetch(
      `/api/profile?action=get_profile&telegramId=${telegramId}`
    )

    if (!response.ok) {
      throw new Error(`Failed to fetch user data: ${response.status}`)
    }

    const result =
      (await response.json()) as StandardApiResponse<ProfileApiGetProfileResponse>

    if (!result.success || !result.data) {
      return null
    }

    return result.data
  } catch (error) {
    console.error('Failed to get user profile:', error)
    throw error
  }
}

/**
 * Получает полную историю элементов сада с сервера
 */
export async function getGardenHistory(
  telegramId: number
): Promise<readonly GardenElement[]> {
  try {
    const response = await authenticatedFetch(
      `/api/garden?action=history&telegramId=${telegramId}`
    )

    if (!response.ok) {
      throw new Error(`Failed to fetch garden history: ${response.status}`)
    }

    const result = (await response.json()) as GardenHistoryResponse

    if (!result.success || !result.data?.gardenElements) {
      return []
    }

    // Конвертируем серверные элементы в клиентский формат
    return result.data.gardenElements.map(convertServerElementToClient)
  } catch (error) {
    console.error('Failed to get garden history:', error)
    throw error
  }
}

/**
 * Добавляет новый элемент в сад
 */
export async function addGardenElement(
  request: AddElementRequest
): Promise<{ id: string; element: GardenElement } | null> {
  try {
    const response = await authenticatedFetch(
      '/api/garden?action=add-element',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
      }
    )

    if (!response.ok) {
      throw new Error(`Failed to add garden element: ${response.status}`)
    }

    const result = (await response.json()) as AddElementResponse

    if (!result.success || !result.data?.id) {
      return null
    }

    const serverUUID = result.data.id

    // Пересчитываем характеристики на основе серверного UUID
    const name = getElementName(
      request.element.type,
      request.element.rarity,
      serverUUID
    )
    const description = getElementDescription(
      request.element.type,
      request.element.rarity,
      name
    )
    const emoji = getElementEmoji(request.element.type)
    const color = getElementColor(
      request.element.type,
      request.element.moodInfluence,
      serverUUID
    )
    const scale = getElementScale(serverUUID)

    const finalElement: GardenElement = {
      id: serverUUID,
      type: request.element.type,
      position: request.element.position,
      unlockDate: new Date(request.element.unlockDate),
      moodInfluence: request.element.moodInfluence,
      rarity: request.element.rarity,
      seasonalVariant: getCurrentSeason(new Date(request.element.unlockDate)),
      name,
      description,
      emoji,
      color,
      scale,
    }

    return { id: serverUUID, element: finalElement }
  } catch (error) {
    console.error('Failed to add garden element:', error)
    throw error
  }
}

/**
 * Обновляет позицию элемента в саду
 */
export async function updateElementPosition(
  request: UpdatePositionRequest
): Promise<boolean> {
  try {
    const response = await authenticatedFetch(
      '/api/garden?action=update-position',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
      }
    )

    if (!response.ok) {
      console.warn(
        '⚠️ Failed to sync element position to server:',
        response.status
      )
      return false
    }

    console.log('✅ Element position synced to server successfully')
    return true
  } catch (error) {
    console.warn('⚠️ Server position sync failed:', error)
    return false
  }
}

/**
 * Синхронизирует сад с сервером (получает профиль + историю элементов)
 */
export async function syncGarden(telegramId: number): Promise<{
  streak: number
  elements: readonly GardenElement[]
}> {
  try {
    // Получаем профиль пользователя для streak
    const profile = await getUserProfile(telegramId)

    if (!profile) {
      return { streak: 0, elements: [] }
    }

    const streak = profile.stats?.currentStreak ?? 0

    // Получаем историю элементов
    const elements = await getGardenHistory(telegramId)

    return { streak, elements }
  } catch (error) {
    console.error('Failed to sync garden:', error)
    throw error
  }
}
