/**
 * React Query хуки для работы с Mood API
 *
 * Эти хуки управляют серверным состоянием настроений,
 * включая кеширование, оптимистичные обновления и синхронизацию.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { moodApi } from '@/api/client'
import type {
  MoodEntry,
  MoodType,
  MoodIntensity,
  DatabaseMoodEntry,
} from '@/types'

// Query keys для кеширования
export const moodKeys = {
  all: ['mood'] as const,
  history: (telegramId: number) => ['mood', 'history', telegramId] as const,
  today: (telegramId: number) => ['mood', 'today', telegramId] as const,
}

/**
 * Конвертирует DatabaseMoodEntry в MoodEntry
 */
function convertDatabaseMoodEntry(
  serverMood: DatabaseMoodEntry,
  userId: string
): MoodEntry {
  return {
    id: `mood_${serverMood.id || Date.now()}`,
    userId,
    date: new Date(serverMood.mood_date || serverMood.created_at),
    mood: serverMood.mood as MoodType,
    intensity: (serverMood.intensity || 2) as MoodIntensity,
    note: serverMood.note,
    createdAt: new Date(serverMood.created_at),
  }
}

/**
 * Хук для получения истории настроений
 */
export function useMoodHistory(telegramId: number | undefined, userId: string) {
  return useQuery({
    queryKey: moodKeys.history(telegramId!),
    queryFn: async () => {
      if (!telegramId) {
        throw new Error('No telegram ID provided')
      }

      const response = await moodApi.getHistory(telegramId)

      if (!response.success || !response.data) {
        throw new Error(response.error ?? 'Failed to fetch mood history')
      }

      // Конвертируем в формат приложения
      return response.data.moodHistory.map(mood =>
        convertDatabaseMoodEntry(mood, userId)
      )
    },
    enabled: !!telegramId,
    staleTime: 5 * 60 * 1000, // 5 минут
    gcTime: 10 * 60 * 1000, // 10 минут
  })
}

/**
 * Хук для получения настроения за сегодня
 */
export function useTodaysMood(telegramId: number | undefined, userId: string) {
  return useQuery({
    queryKey: moodKeys.today(telegramId!),
    queryFn: async () => {
      if (!telegramId) {
        throw new Error('No telegram ID provided')
      }

      const response = await moodApi.getTodaysMood(telegramId)

      if (!response.success || !response.data) {
        throw new Error(response.error ?? "Failed to fetch today's mood")
      }

      return response.data.mood
        ? convertDatabaseMoodEntry(response.data.mood, userId)
        : null
    },
    enabled: !!telegramId,
    staleTime: 1 * 60 * 1000, // 1 минута
    gcTime: 5 * 60 * 1000, // 5 минут
  })
}

/**
 * Мутация для записи настроения
 */
export function useRecordMood(telegramId: number | undefined, userId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      mood,
      intensity,
      note,
      telegramUserData,
    }: {
      mood: MoodType
      intensity: MoodIntensity
      note?: string
      telegramUserData: {
        readonly userId: string
        readonly firstName?: string
        readonly lastName?: string
        readonly username?: string
        readonly languageCode?: string
        readonly photoUrl?: string
      }
    }) => {
      if (!telegramId) {
        throw new Error('No telegram ID provided')
      }

      const date = new Date().toISOString()

      const response = await moodApi.recordMood(
        telegramId,
        mood,
        intensity,
        date,
        telegramUserData,
        note
      )

      if (!response.success || !response.data) {
        throw new Error(response.error ?? 'Failed to record mood')
      }

      return convertDatabaseMoodEntry(response.data.mood, userId)
    },
    onSuccess: newMood => {
      // Обновляем кеш истории
      queryClient.setQueryData<MoodEntry[]>(
        moodKeys.history(telegramId!),
        old => {
          if (!old) return [newMood]
          return [newMood, ...old]
        }
      )

      // Обновляем сегодняшнее настроение
      queryClient.setQueryData(moodKeys.today(telegramId!), newMood)

      // Инвалидируем для гарантии синхронизации
      void queryClient.invalidateQueries({
        queryKey: moodKeys.history(telegramId!),
      })
    },
  })
}
