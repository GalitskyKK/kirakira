/**
 * Hook для интеграции челленджей с реальной статистикой сада
 * Автоматически обновляет прогресс челленджей при изменении данных
 */

import { useCallback, useRef } from 'react'
import type { ChallengeMetric, GardenElement, MoodEntry } from '@/types'
import {
  useGardenSync,
  useMoodSync,
  useUpdateChallengeProgress,
  useChallengeList,
} from '@/hooks/queries'
import { useUserSync } from '@/hooks/index.v2'
import { useTelegramId } from '@/hooks/useTelegramId'

interface ChallengeProgressUpdate {
  readonly challengeId: string
  readonly metric: ChallengeMetric
  readonly newValue: number
}

export function useChallengeIntegration() {
  const telegramId = useTelegramId()
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

  // Основная функция обновления прогресса
  const updateChallengeProgress = useCallback(async () => {
    if (!currentUser?.telegramId) {
      return
    }

    const activeParticipations = getActiveParticipations()

    if (activeParticipations.length === 0) {
      return false
    }

    const updates: ChallengeProgressUpdate[] = []

    // Проходим по всем активным участиям
    for (const participation of activeParticipations) {
      // Находим челлендж из React Query данных
      const challenge = challenges.find(c => c.id === participation.challengeId)
      if (!challenge) {
        continue
      }

      // Используем дату присоединения как точку отсчета
      const joinedTime = participation.joinedAt.getTime()
      const challengeStartTime = challenge.startDate.getTime()
      const maxTime = Math.max(joinedTime, challengeStartTime)
      const startDate = new Date(maxTime)

      // Считаем метрики с момента присоединения/начала челленджа
      const challengeMetrics = calculateChallengeMetrics(startDate)
      const metric = challenge.requirements.metric
      const currentValue = challengeMetrics[metric]
      const targetValue = challenge.requirements.targetValue

      // Ограничиваем прогресс целевым значением
      const cappedValue = Math.min(currentValue, targetValue)

      // Проверяем, изменилось ли значение и не уменьшился ли прогресс
      if (
        cappedValue !== participation.currentProgress &&
        cappedValue >= participation.currentProgress
      ) {
        updates.push({
          challengeId: participation.challengeId,
          metric,
          newValue: cappedValue,
        })
      }
    }

    // Выполняем обновления через React Query для автоматической инвалидации кеша
    for (const update of updates) {
      try {
        await updateProgressMutationRef.current.mutateAsync({
          challengeId: update.challengeId,
          telegramId: currentUser.telegramId,
          metric: update.metric,
          value: update.newValue,
        })
      } catch (error) {
        console.error(`❌ Failed to update challenge progress:`, error)
      }
    }

    return updates.length > 0
  }, [
    currentUser,
    calculateChallengeMetrics,
    getActiveParticipations,
    challenges,
  ])

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
      const startDate = new Date(
        Math.max(
          participation.joinedAt.getTime(),
          challenge.startDate.getTime()
        )
      )

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

          console.log(
            `🔄 Force updated challenge: ${participation.challengeId} - ${metric}: ${cappedValue}/${targetValue}`
          )
        } catch (error) {
          console.error(`❌ Failed to force update challenge:`, error)
        }
      } else {
        console.log(
          `⚠️ Force update skipped for challenge ${participation.challengeId}: would decrease progress ${participation.currentProgress} → ${cappedValue}`
        )
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

    console.log('🔄 Manual recalculation of all challenges...')

    const activeParticipations = getActiveParticipations()
    console.log(`📋 Found ${activeParticipations.length} active participations`)

    for (const participation of activeParticipations) {
      const challenge = challenges.find(c => c.id === participation.challengeId)
      if (!challenge) {
        console.warn(`⚠️ Challenge ${participation.challengeId} not found`)
        continue
      }

      const joinedTime = participation.joinedAt.getTime()
      const challengeStartTime = challenge.startDate.getTime()
      const maxTime = Math.max(joinedTime, challengeStartTime)
      const startDate = new Date(maxTime)

      console.log(`🔄 Recalculating ${challenge.title}`)
      console.log(`🔄 Joined time: ${joinedTime}`)
      console.log(`🔄 Challenge start time: ${challengeStartTime}`)
      console.log(`🔄 Max time: ${maxTime}`)
      console.log(`🔄 Start date: ${startDate.toISOString()}`)

      const challengeMetrics = calculateChallengeMetrics(startDate)
      const metric = challenge.requirements.metric
      const currentValue = challengeMetrics[metric]
      const targetValue = challenge.requirements.targetValue

      const cappedValue = Math.min(currentValue, targetValue)

      console.log(
        `🔄 Recalculating ${challenge.title}: ${cappedValue}/${targetValue}`
      )

      try {
        await updateProgressMutationRef.current.mutateAsync({
          challengeId: participation.challengeId,
          telegramId: currentUser.telegramId,
          metric,
          value: cappedValue,
        })
        console.log(`✅ Recalculated ${challenge.title}: ${cappedValue}`)
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

  // Функция для вызова после добавления элемента в сад
  const onGardenElementAdded = useCallback(async () => {
    try {
      await updateChallengeProgress()
    } catch (error) {
      // Ошибки не критичны, т.к. прогресс можно обновить позже
    }
  }, [updateChallengeProgress])

  return {
    onGardenElementAdded,
  }
}

export function useChallengeMoodIntegration() {
  const { updateChallengeProgress } = useChallengeIntegration()

  // Функция для вызова после добавления записи настроения
  const onMoodEntryAdded = useCallback(async () => {
    try {
      await updateChallengeProgress()
    } catch (error) {
      // Ошибки не критичны, т.к. прогресс можно обновить позже
    }
  }, [updateChallengeProgress])

  return {
    onMoodEntryAdded,
  }
}
