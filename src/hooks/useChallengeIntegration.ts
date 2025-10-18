/**
 * Hook для интеграции челленджей с реальной статистикой сада
 * Автоматически обновляет прогресс челленджей при изменении данных
 */

import { useEffect, useCallback } from 'react'
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

  // Функция для подсчета метрик с момента присоединения к челленджу
  const calculateChallengeMetrics = useCallback(
    (challengeStartDate: Date): Record<ChallengeMetric, number> => {
      const startTime = challengeStartDate.getTime()

      console.log(
        `\n📊 Calculating metrics from:`,
        challengeStartDate.toISOString()
      )
      console.log(`🗓️ Start time (ms):`, startTime)
      console.log(
        `📦 Garden data:`,
        gardenData ? `${gardenData.elements.length} elements` : 'null'
      )
      console.log(
        `😊 Mood data:`,
        moodData ? `${moodData.moods.length} moods` : 'null'
      )

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

      console.log(
        `🌱 Garden elements after start:`,
        gardenElementsAfterStart.length
      )
      console.log(`😊 Mood entries after start:`, moodEntriesAfterStart.length)

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

      console.log(`✅ Calculated metrics:`, metrics)

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
      console.warn('⚠️ updateChallengeProgress: No current user')
      return
    }

    console.log('═══════════════════════════════════════════')
    console.log('🔄 updateChallengeProgress called')
    console.log('👤 User ID:', currentUser.telegramId)
    console.log('📋 Total participations:', userParticipations.length)
    console.log(
      '📋 Participations:',
      userParticipations.map(p => ({
        id: p.id.substring(0, 8),
        challengeId: p.challengeId.substring(0, 8),
        status: p.status,
        currentProgress: p.currentProgress,
      }))
    )
    console.log('🎯 Total challenges loaded:', challenges.length)
    console.log('═══════════════════════════════════════════')

    const activeParticipations = getActiveParticipations()
    console.log('✅ Active participations:', activeParticipations.length)

    if (activeParticipations.length === 0) {
      console.log('ℹ️ No active participations found')
      return false
    }

    const updates: ChallengeProgressUpdate[] = []

    // Проходим по всем активным участиям
    for (const participation of activeParticipations) {
      console.log(`\n🔍 Processing participation:`, {
        id: participation.id.substring(0, 8),
        challengeId: participation.challengeId,
        status: participation.status,
        currentProgress: participation.currentProgress,
      })

      // Находим челлендж из React Query данных
      const challenge = challenges.find(c => c.id === participation.challengeId)
      if (!challenge) {
        console.warn(
          `⚠️ Challenge ${participation.challengeId} not found in loaded challenges`
        )
        console.warn(
          'Available challenge IDs:',
          challenges.map(c => c.id)
        )
        continue
      }

      console.log(`✅ Found challenge:`, {
        id: challenge.id,
        title: challenge.title,
        status: challenge.status,
        metric: challenge.requirements.metric,
        targetValue: challenge.requirements.targetValue,
      })

      // Используем дату присоединения как точку отсчета
      const joinedTime = participation.joinedAt.getTime()
      const challengeStartTime = challenge.startDate.getTime()
      const maxTime = Math.max(joinedTime, challengeStartTime)
      const startDate = new Date(maxTime)

      console.log(`\n🎯 Processing challenge: ${challenge.title}`)
      console.log(
        `📅 Participation joined: ${participation.joinedAt.toISOString()}`
      )
      console.log(`🕐 Participation joined time: ${joinedTime}`)
      console.log(`📅 Challenge start: ${challenge.startDate.toISOString()}`)
      console.log(`🕐 Challenge start time: ${challengeStartTime}`)
      console.log(`🕐 Max time: ${maxTime}`)
      console.log(`📅 Using start date: ${startDate.toISOString()}`)
      console.log(`🕐 Using start time: ${startDate.getTime()}`)
      console.log(`📊 Current DB progress: ${participation.currentProgress}`)

      // Считаем метрики с момента присоединения/начала челленджа
      const challengeMetrics = calculateChallengeMetrics(startDate)
      const metric = challenge.requirements.metric
      const currentValue = challengeMetrics[metric]
      const targetValue = challenge.requirements.targetValue

      console.log(`📈 Metric: ${metric}`)
      console.log(`🔢 Calculated value: ${currentValue}`)
      console.log(`🎯 Target value: ${targetValue}`)

      // Ограничиваем прогресс целевым значением
      const cappedValue = Math.min(currentValue, targetValue)
      console.log(`🧢 Capped value: ${cappedValue}`)

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

        console.log(
          `📊 Challenge ${challenge.title}: ${participation.currentProgress} → ${cappedValue}/${targetValue} (${Math.round(
            (cappedValue / targetValue) * 100
          )}%)`
        )
      } else if (cappedValue < participation.currentProgress) {
        console.log(
          `⚠️ Challenge ${challenge.title}: Skipping progress decrease ${participation.currentProgress} → ${cappedValue}`
        )
      }
    }

    // Выполняем обновления через React Query для автоматической инвалидации кеша
    for (const update of updates) {
      try {
        await updateProgressMutation.mutateAsync({
          challengeId: update.challengeId,
          telegramId: currentUser.telegramId,
          metric: update.metric,
          value: update.newValue,
        })

        console.log(
          `✅ Updated challenge progress: ${update.challengeId} - ${update.metric}: ${update.newValue}`
        )
      } catch (error) {
        console.error(`❌ Failed to update challenge progress:`, error)
      }
    }

    return updates.length > 0
  }, [
    currentUser,
    calculateChallengeMetrics,
    getActiveParticipations,
    updateProgressMutation,
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
          await updateProgressMutation.mutateAsync({
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
    updateProgressMutation,
    challenges,
  ])

  // Hook для отслеживания изменений в саду
  useEffect(() => {
    if (!gardenData?.elements || !currentUser) return

    // Обновляем прогресс челленджей при изменении сада
    void updateChallengeProgress()
  }, [gardenData?.elements.length, updateChallengeProgress, currentUser])

  // Hook для отслеживания изменений в настроениях
  useEffect(() => {
    if (!moodData?.moods || !currentUser) return

    // Обновляем прогресс челленджей при изменении настроений
    void updateChallengeProgress()
  }, [moodData?.moods.length, updateChallengeProgress, currentUser])

  // Hook для отслеживания изменений в стрике
  useEffect(() => {
    if (!currentUser) return

    // Обновляем прогресс челленджей при изменении стрика
    void updateChallengeProgress()
  }, [currentUser?.stats.currentStreak, updateChallengeProgress])

  // React Query автоматически загружает челленджи через useChallengeList
  // Больше не нужна ручная загрузка через Zustand loadChallenges

  // Периодическое обновление (каждые 5 минут)
  useEffect(() => {
    if (!currentUser?.telegramId) return

    const interval = setInterval(
      () => {
        void updateChallengeProgress()
      },
      5 * 60 * 1000
    ) // 5 минут

    return () => clearInterval(interval)
  }, [currentUser?.telegramId, updateChallengeProgress])

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
        await updateProgressMutation.mutateAsync({
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
    updateProgressMutation,
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
    console.log(
      '🌱 Starting challenge progress update after garden element added...'
    )

    try {
      // React Query уже инвалидирует кеши, задержка не нужна
      // Проверка currentUser внутри updateChallengeProgress
      await updateChallengeProgress()
      console.log('✅ Challenge progress updated successfully')
    } catch (error) {
      console.error('❌ Failed to update challenge progress:', error)
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
    console.log('🏆 Starting challenge progress update after mood entry...')

    try {
      // React Query уже инвалидирует кеши, задержка не нужна
      // Проверка currentUser внутри updateChallengeProgress
      await updateChallengeProgress()
      console.log('✅ Challenge progress updated successfully')
    } catch (error) {
      console.error('❌ Failed to update challenge progress:', error)
    }
  }, [updateChallengeProgress])

  return {
    onMoodEntryAdded,
  }
}
