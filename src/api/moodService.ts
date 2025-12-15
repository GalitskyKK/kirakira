/**
 * 😊 Mood API Service Layer
 * Инкапсулирует все API запросы связанные с настроением
 */

import { authenticatedFetch } from '@/utils/apiClient'
import type { MoodEntry, MoodType, MoodIntensity } from '@/types'
import type {
  DatabaseMoodEntry,
  StandardApiResponse,
  ProfileApiGetProfileResponse,
} from '@/types/api'
import { getLocalDateString, parseLocalDate } from '@/utils/dateHelpers'

// ============================================
// ТИПЫ ДЛЯ API ЗАПРОСОВ И ОТВЕТОВ
// ============================================

export interface AddMoodRequest {
  readonly telegramUserId: number
  readonly mood: MoodType
  readonly intensity: MoodIntensity
  readonly note?: string
  readonly date: string
  /**
   * Локальная дата пользователя (YYYY-MM-DD).
   * Нужна, чтобы бэкенд НЕ пытался выводить "день" из UTC времени сервера.
   */
  readonly localDate?: string
  readonly telegramUserData: {
    readonly userId: string
    readonly firstName: string
    readonly lastName?: string
    readonly username?: string
    readonly languageCode: string
    readonly photoUrl?: string
  }
}

export interface AddMoodResponse {
  readonly success: boolean
  readonly data?: {
    readonly mood: DatabaseMoodEntry
    readonly isFirstToday: boolean
    readonly experienceGained?: number
  }
  readonly error?: string
}

export interface MoodHistoryResponse {
  readonly success: boolean
  readonly data?: {
    readonly moodHistory: readonly DatabaseMoodEntry[]
  }
  readonly error?: string
}

export interface TodaysMoodResponse {
  readonly success: boolean
  readonly data?: {
    readonly mood: DatabaseMoodEntry | null
    readonly moodEntry: DatabaseMoodEntry | null
    readonly canCheckin: boolean
  }
  readonly error?: string
}

// ============================================
// УТИЛИТЫ ДЛЯ КОНВЕРТАЦИИ ДАННЫХ
// ============================================

/**
 * Конвертирует серверную запись настроения в клиентский формат
 */
export function convertServerMoodToClient(
  serverMood: DatabaseMoodEntry,
  userId: string
): MoodEntry {
  return {
    id: `mood_${serverMood.id || Date.now()}`,
    userId: userId,
    // Парсим mood_date как ЛОКАЛЬНУЮ дату
    date: serverMood.mood_date
      ? parseLocalDate(serverMood.mood_date)
      : new Date(serverMood.created_at),
    mood: serverMood.mood as MoodType,
    intensity: (serverMood.intensity || 2) as MoodIntensity,
    note: serverMood.note,
    createdAt: new Date(serverMood.created_at),
  }
}

// ============================================
// API ФУНКЦИИ
// ============================================

/**
 * Добавляет запись о настроении
 */
export async function addMoodEntry(
  request: AddMoodRequest
): Promise<MoodEntry | null> {
  try {
    const response = await authenticatedFetch('/api/mood?action=record', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    })

    if (!response.ok) {
      console.warn('⚠️ Failed to sync mood to server:', response.status)
      return null
    }

    const result = (await response.json()) as AddMoodResponse

    if (!result.success || !result.data?.mood) {
      return null
    }

    // Конвертируем серверную запись в клиентский формат
    return convertServerMoodToClient(
      result.data.mood,
      request.telegramUserData.userId
    )
  } catch (error) {
    console.warn('⚠️ Server sync failed:', error)
    return null
  }
}

/**
 * Получает историю настроений с сервера
 */
export async function getMoodHistory(
  telegramId: number,
  userId: string
): Promise<readonly MoodEntry[]> {
  try {
    const response = await authenticatedFetch(
      `/api/mood?action=history&telegramId=${telegramId}`
    )

    if (!response.ok) {
      throw new Error(`Failed to fetch mood history: ${response.status}`)
    }

    const result = (await response.json()) as MoodHistoryResponse

    if (!result.success || !result.data?.moodHistory) {
      return []
    }

    // Конвертируем серверные записи в клиентский формат
    return result.data.moodHistory.map(serverMood =>
      convertServerMoodToClient(serverMood, userId)
    )
  } catch (error) {
    console.error('Failed to get mood history:', error)
    throw error
  }
}

/**
 * Получает настроение за сегодня
 */
export async function getTodaysMood(
  telegramId: number,
  userId: string
): Promise<MoodEntry | null> {
  try {
    // 🔧 КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: Передаем локальную дату пользователя
    // для корректной работы с часовыми поясами
    const today = new Date()
    const year = today.getFullYear()
    const month = String(today.getMonth() + 1).padStart(2, '0')
    const day = String(today.getDate()).padStart(2, '0')
    const localDate = `${year}-${month}-${day}` // YYYY-MM-DD в локальном времени

    const response = await authenticatedFetch(
      `/api/mood?action=today&telegramId=${telegramId}&localDate=${localDate}`
    )

    if (!response.ok) {
      throw new Error(`Failed to fetch today's mood: ${response.status}`)
    }

    const result = (await response.json()) as TodaysMoodResponse

    if (!result.success || !result.data) {
      return null
    }

    // Возвращаем moodEntry если есть, иначе null
    return result.data.moodEntry
      ? convertServerMoodToClient(result.data.moodEntry, userId)
      : null
  } catch (error) {
    console.error("Failed to get today's mood:", error)
    throw error
  }
}

/**
 * Синхронизирует настроения с сервером (получает профиль + историю)
 */
export async function syncMoodHistory(
  telegramId: number,
  userId: string
): Promise<{
  moods: readonly MoodEntry[]
  todaysMood: MoodEntry | null
}> {
  try {
    // Получаем профиль пользователя
    const response = await authenticatedFetch(
      `/api/profile?action=get_profile&telegramId=${telegramId}`
    )

    if (!response.ok) {
      throw new Error(`Failed to fetch user data: ${response.status}`)
    }

    const result =
      (await response.json()) as StandardApiResponse<ProfileApiGetProfileResponse>

    if (!result.success || !result.data?.user) {
      return { moods: [], todaysMood: null }
    }

    // Получаем историю настроений
    const moods = await getMoodHistory(telegramId, userId)

    // Находим настроение за сегодня
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const todaysMood =
      moods.find(entry => {
        // Убеждаемся, что entry.date это Date объект
        const entryDate =
          entry.date instanceof Date ? entry.date : new Date(entry.date)
        const entryDateStr = getLocalDateString(entryDate)
        const todayStr = getLocalDateString(today)
        return entryDateStr === todayStr
      }) || null

    return { moods, todaysMood }
  } catch (error) {
    console.error('Failed to sync mood history:', error)
    throw error
  }
}
