/**
 * Hook для интеграции челленджей с реальной статистикой сада
 * Автоматически обновляет прогресс челленджей при изменении данных
 */

import { useCallback, useRef, useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import type { ChallengeMetric, GardenElement, MoodEntry } from '@/types'
import {
  useGardenSync,
  useMoodSync,
  useUpdateChallengeProgress,
  useChallengeList,
} from '@/hooks/queries'
import { useUserSync } from '@/hooks/index.v2'
import { useTelegramId } from '@/hooks/useTelegramId'
import { authenticatedFetch } from '@/utils/apiClient'
import type { StandardApiResponse } from '@/types/api'

export function useChallengeIntegration() {
  const telegramId = useTelegramId()
  const queryClient = useQueryClient()
  const { data: userData } = useUserSync(telegramId, !!telegramId)
  const userId = userData?.user?.id

  // ✨ Используем currentUser из React Query вместо Zustand
  const currentUser = userData?.user

  // Используем v2 хуки для получения актуальных данных
  const { data: gardenData } = useGardenSync(telegramId, !!telegramId)
  const { data: moodData } = useMoodSync(
    telegramId,
    userId,
    !!telegramId && !!userId
  )

  // ✨ ИЗМЕНЕНИЕ: Загружаем челленджи через React Query вместо Zustand
  const { data: challengesData } = useChallengeList(telegramId, !!telegramId)
  const challenges = challengesData?.challenges ?? []
  const userParticipations = challengesData?.userParticipations ?? []

  const updateProgressMutation = useUpdateChallengeProgress()

  // 🔑 Стабильная ссылка на mutation для избежания пересоздания callbacks
  const updateProgressMutationRef = useRef(updateProgressMutation)
  updateProgressMutationRef.current = updateProgressMutation

  // Функция для подсчета метрик с момента присоединения к челленджу
  const calculateChallengeMetrics = useCallback(
    (challengeStartDate: Date): Record<ChallengeMetric, number> => {
      const startTime = challengeStartDate.getTime()

      // Элементы сада, добавленные после начала челлендж
      const gardenElementsAfterStart =
        gardenData?.elements.filter((el: GardenElement) => {
          const elTime = new Date(el.unlockDate).getTime()
          return elTime >= startTime
        }) || []

      // Записи настроения после начала челленджа
      const moodEntriesAfterStart =
        moodData?.moods.filter((mood: MoodEntry) => {
          const moodTime = new Date(mood.date).getTime()
          return moodTime >= startTime
        }) || []

      const metrics = {
        garden_elements_count: gardenElementsAfterStart.length,
        rare_elements_count: gardenElementsAfterStart.filter(
          (el: GardenElement) =>
            ['rare', 'epic', 'legendary'].includes(el.rarity)
        ).length,
        garden_diversity: new Set(
          gardenElementsAfterStart.map((el: GardenElement) => el.type)
        ).size,
        mood_entries_count: moodEntriesAfterStart.length,
        streak_days: Math.max(
          0,
          Math.floor((Date.now() - startTime) / (1000 * 60 * 60 * 24))
        ),
        friend_interactions: 0,
      }

      return metrics
    },
    [gardenData, moodData]
  )

  // Функция для определения какие челленджи нужно обновить
  const getActiveParticipations = useCallback(() => {
    return userParticipations.filter(
      participation =>
        participation.status === 'joined' || participation.status === 'active'
    )
  }, [userParticipations])

  // Основная функция обновления прогресса - оптимизированная версия
  const updateChallengeProgress = useCallback(async () => {
    if (!currentUser?.telegramId) {
      return
    }

    const activeParticipations = getActiveParticipations()

    if (activeParticipations.length === 0) {
      return false
    }

    try {
      // ✅ УЛУЧШЕНИЕ: Один запрос для всех челленджей с правильной аутентификацией
      const response = await authenticatedFetch(
        '/api/challenges?action=calculate-all-progress',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            telegramId: currentUser.telegramId,
            challengeIds: activeParticipations.map(p => p.challengeId),
          }),
        }
      )

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const result = (await response.json()) as StandardApiResponse<unknown>

      if (result.success) {
        // ✅ УЛУЧШЕНИЕ: Инвалидируем кеш только при успехе
        queryClient.invalidateQueries({
          queryKey: ['challenges', currentUser.telegramId],
        })

        return true
      } else {
        console.error(`❌ Server calculation failed: ${result.error}`)
        return false
      }
    } catch (error) {
      console.error(`❌ Failed to request server calculation:`, error)
      // ✅ УЛУЧШЕНИЕ: Показываем пользователю ошибку
      if (error instanceof Error) {
        console.error(`Network error: ${error.message}`)
      }
      return false
    }
  }, [currentUser, getActiveParticipations, queryClient])

  // Функция для принудительного обновления всех челленджей
  const forceUpdateAllChallenges = useCallback(async () => {
    if (!currentUser?.telegramId) return

    const activeParticipations = getActiveParticipations()

    for (const participation of activeParticipations) {
      const challenge = challenges.find(c => c.id === participation.challengeId)
      if (!challenge) {
        console.warn(`⚠️ Challenge ${participation.challengeId} not found`)
        continue
      }

      // Используем дату присоединения как точку отсчета
      const startDate = participation.joinedAt

      const challengeMetrics = calculateChallengeMetrics(startDate)
      const metric = challenge.requirements.metric
      const currentValue = challengeMetrics[metric]
      const targetValue = challenge.requirements.targetValue

      // Ограничиваем прогресс целевым значением
      const cappedValue = Math.min(currentValue, targetValue)

      // Не уменьшаем прогресс при принудительном обновлении
      if (cappedValue >= participation.currentProgress) {
        try {
          await updateProgressMutationRef.current.mutateAsync({
            challengeId: participation.challengeId,
            telegramId: currentUser.telegramId,
            metric,
            value: cappedValue,
          })
        } catch (error) {
          console.error(`❌ Failed to force update challenge:`, error)
        }
      } else {
        // Пропускаем обновление, чтобы не уменьшить прогресс
      }
    }
  }, [
    currentUser,
    calculateChallengeMetrics,
    getActiveParticipations,
    challenges,
  ])

  // ❌ УДАЛЕНЫ: useEffect для автоматического обновления при изменении данных
  // Это вызывало бесконечный цикл:
  // 1. updateChallengeProgress() → mutate
  // 2. mutate → invalidate cache
  // 3. cache invalidate → refetch
  // 4. refetch → новые данные → useEffect срабатывает снова
  // 5. GOTO 1
  //
  // ✅ Теперь прогресс обновляется ТОЛЬКО вручную через:
  // - onMoodEntryAdded() (после добавления настроения)
  // - onGardenElementAdded() (после добавления элемента)
  // - forceUpdateAllChallenges() (ручной пересчёт)

  // React Query автоматически загружает челленджи через useChallengeList
  // Больше не нужна ручная загрузка через Zustand loadChallenges

  // ❌ УДАЛЕНО: Периодическое обновление каждые 5 минут
  // React Query имеет встроенный механизм refetch, не нужно дублировать
  // Если нужно периодическое обновление, настройте refetchInterval в useChallengeList

  // Добавляем функцию для ручного пересчета всех челленджей
  const recalculateAllChallenges = useCallback(async () => {
    if (!currentUser?.telegramId) return

    const activeParticipations = getActiveParticipations()

    for (const participation of activeParticipations) {
      const challenge = challenges.find(c => c.id === participation.challengeId)
      if (!challenge) {
        console.warn(`⚠️ Challenge ${participation.challengeId} not found`)
        continue
      }

      const startDate = participation.joinedAt

      const challengeMetrics = calculateChallengeMetrics(startDate)
      const metric = challenge.requirements.metric
      const currentValue = challengeMetrics[metric]
      const targetValue = challenge.requirements.targetValue

      const cappedValue = Math.min(currentValue, targetValue)

      try {
        await updateProgressMutationRef.current.mutateAsync({
          challengeId: participation.challengeId,
          telegramId: currentUser.telegramId,
          metric,
          value: cappedValue,
        })
      } catch (error) {
        console.error(`❌ Failed to recalculate ${challenge.title}:`, error)
      }
    }
  }, [
    currentUser,
    getActiveParticipations,
    calculateChallengeMetrics,
    challenges,
  ])

  return {
    updateChallengeProgress,
    forceUpdateAllChallenges,
    recalculateAllChallenges,
    calculateChallengeMetrics,
  }
}

// Интеграция с существующими системами
export function useChallengeGardenIntegration() {
  const { updateChallengeProgress } = useChallengeIntegration()

  // 🔑 Стабильная ссылка для избежания пересоздания callback
  const updateProgressRef = useRef(updateChallengeProgress)
  useEffect(() => {
    updateProgressRef.current = updateChallengeProgress
  }, [updateChallengeProgress])

  // Функция для вызова после добавления элемента в сад
  const onGardenElementAdded = useCallback(async () => {
    try {
      await updateProgressRef.current()
    } catch {
      // Ошибки не критичны, т.к. прогресс можно обновить позже
    }
  }, []) // 🔑 Пустой массив зависимостей - функция стабильна

  return {
    onGardenElementAdded,
  }
}

export function useChallengeMoodIntegration() {
  const { updateChallengeProgress } = useChallengeIntegration()

  // 🔑 Стабильная ссылка для избежания пересоздания callback
  const updateProgressRef = useRef(updateChallengeProgress)
  useEffect(() => {
    updateProgressRef.current = updateChallengeProgress
  }, [updateChallengeProgress])

  // Функция для вызова после добавления записи настроения
  const onMoodEntryAdded = useCallback(async () => {
    try {
      await updateProgressRef.current()
    } catch {
      // Ошибки не критичны, т.к. прогресс можно обновить позже
    }
  }, []) // 🔑 Пустой массив зависимостей - функция стабильна

  return {
    onMoodEntryAdded,
  }
}
