/**
 * 😊 Mood React Query Hooks
 * Хуки для работы с данными настроений через React Query
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  syncMoodHistory,
  getMoodHistory,
  getTodaysMood,
  addMoodEntry,
  type AddMoodRequest,
} from '@/api'
import type { MoodEntry } from '@/types'
import { saveMoodHistory, loadMoodHistory } from '@/utils/storage'

// ============================================
// QUERY KEYS - Константы для React Query
// ============================================

export const moodKeys = {
  all: ['mood'] as const,
  sync: (telegramId: number) => [...moodKeys.all, 'sync', telegramId] as const,
  history: (telegramId: number) =>
    [...moodKeys.all, 'history', telegramId] as const,
  today: (telegramId: number) =>
    [...moodKeys.all, 'today', telegramId] as const,
}

// ============================================
// QUERY HOOKS - Получение данных
// ============================================

/**
 * Хук для синхронизации истории настроений с сервером
 */
export function useMoodSync(
  telegramId: number | undefined,
  userId: string | undefined,
  enabled = true
) {
  return useQuery({
    queryKey: moodKeys.sync(telegramId ?? 0),
    queryFn: async () => {
      if (!telegramId || !userId) {
        throw new Error('Telegram ID and User ID are required')
      }
      return syncMoodHistory(telegramId, userId)
    },
    enabled: enabled && !!telegramId && !!userId,
    staleTime: 1000 * 30, // 30 секунд
    gcTime: 1000 * 60 * 5, // 5 минут в кеше
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  })
}

/**
 * Хук для получения истории настроений
 */
export function useMoodHistory(
  telegramId: number | undefined,
  userId: string | undefined,
  enabled = true
) {
  return useQuery({
    queryKey: moodKeys.history(telegramId ?? 0),
    queryFn: async () => {
      if (!telegramId || !userId) {
        throw new Error('Telegram ID and User ID are required')
      }
      return getMoodHistory(telegramId, userId)
    },
    enabled: enabled && !!telegramId && !!userId,
    staleTime: 1000 * 60, // 1 минута
    gcTime: 1000 * 60 * 10, // 10 минут в кеше
  })
}

/**
 * Хук для получения настроения за сегодня
 */
export function useTodaysMood(
  telegramId: number | undefined,
  userId: string | undefined,
  enabled = true
) {
  return useQuery({
    queryKey: moodKeys.today(telegramId ?? 0),
    queryFn: async () => {
      if (!telegramId || !userId) {
        throw new Error('Telegram ID and User ID are required')
      }
      return getTodaysMood(telegramId, userId)
    },
    enabled: enabled && !!telegramId && !!userId,
    staleTime: 1000 * 10, // 10 секунд - очень свежие данные
    gcTime: 1000 * 60 * 5, // 5 минут в кеше
  })
}

// ============================================
// MUTATION HOOKS - Изменение данных
// ============================================

/**
 * Хук для добавления записи о настроении
 * Включает оптимистичные обновления и синхронизацию с локальным хранилищем
 */
export function useAddMoodEntry() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: addMoodEntry,
    onMutate: async (request: AddMoodRequest) => {
      // Отменяем текущие запросы для избежания конфликтов
      await queryClient.cancelQueries({
        queryKey: moodKeys.sync(request.telegramUserId),
      })
      await queryClient.cancelQueries({
        queryKey: moodKeys.today(request.telegramUserId),
      })

      // Сохраняем предыдущее состояние
      const previousSync = queryClient.getQueryData(
        moodKeys.sync(request.telegramUserId)
      )
      const previousToday = queryClient.getQueryData(
        moodKeys.today(request.telegramUserId)
      )

      // Создаем оптимистичную запись
      const optimisticEntry: MoodEntry = {
        id: `mood_${Date.now()}_optimistic`,
        userId: request.telegramUserData.userId,
        date: new Date(request.date),
        mood: request.mood,
        intensity: request.intensity,
        note: request.note,
        createdAt: new Date(),
      }

      // Оптимистично обновляем queries
      queryClient.setQueryData(
        moodKeys.sync(request.telegramUserId),
        (old: {
          moods: readonly MoodEntry[]
          todaysMood: MoodEntry | null
        }) => {
          if (!old) {
            return {
              moods: [optimisticEntry],
              todaysMood: optimisticEntry,
            }
          }
          return {
            moods: [optimisticEntry, ...old.moods],
            todaysMood: optimisticEntry,
          }
        }
      )

      queryClient.setQueryData(
        moodKeys.today(request.telegramUserId),
        optimisticEntry
      )

      // Оптимистично обновляем локальное хранилище
      const storedHistory = loadMoodHistory()
      const updatedHistory = [optimisticEntry, ...storedHistory]
      saveMoodHistory(updatedHistory)

      return { previousSync, previousToday, optimisticEntry }
    },
    onSuccess: (result, request, context) => {
      // Заменяем оптимистичную запись на реальную с сервера
      if (result && context) {
        queryClient.setQueryData(
          moodKeys.sync(request.telegramUserId),
          (old: {
            moods: readonly MoodEntry[]
            todaysMood: MoodEntry | null
          }) => {
            if (!old) return old

            return {
              moods: old.moods.map(mood =>
                mood.id === context.optimisticEntry.id ? result : mood
              ),
              todaysMood:
                old.todaysMood?.id === context.optimisticEntry.id
                  ? result
                  : old.todaysMood,
            }
          }
        )

        queryClient.setQueryData(moodKeys.today(request.telegramUserId), result)

        // Обновляем локальное хранилище финальными данными
        const storedHistory = loadMoodHistory()
        const updatedHistory = storedHistory.map(mood =>
          mood.id === context.optimisticEntry.id ? result : mood
        )
        saveMoodHistory(updatedHistory)
      }

      // Инвалидируем связанные queries
      queryClient.invalidateQueries({
        queryKey: moodKeys.sync(request.telegramUserId),
      })
      queryClient.invalidateQueries({
        queryKey: moodKeys.history(request.telegramUserId),
      })

      console.log('✅ Mood entry added successfully')
    },
    onError: (error, request, context) => {
      // Откатываем оптимистичное обновление при ошибке
      if (context?.previousSync) {
        queryClient.setQueryData(
          moodKeys.sync(request.telegramUserId),
          context.previousSync
        )
      }
      if (context?.previousToday) {
        queryClient.setQueryData(
          moodKeys.today(request.telegramUserId),
          context.previousToday
        )
      }

      // Восстанавливаем локальное хранилище
      if (context) {
        const storedHistory = loadMoodHistory()
        const restoredHistory = storedHistory.filter(
          mood => mood.id !== context.optimisticEntry.id
        )
        saveMoodHistory(restoredHistory)
      }

      console.error('❌ Failed to add mood entry:', error)
    },
  })
}

/**
 * Хук для проверки, можно ли отмечать настроение сегодня
 */
export function useCanCheckinToday(
  telegramId: number | undefined,
  userId: string | undefined
) {
  const { data: todaysMood } = useTodaysMood(telegramId, userId, true)

  return {
    canCheckin: !todaysMood,
    todaysMood: todaysMood ?? null,
  }
}
