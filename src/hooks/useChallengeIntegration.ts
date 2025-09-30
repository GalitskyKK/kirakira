/**
 * Hook для интеграции челленджей с реальной статистикой сада
 * Автоматически обновляет прогресс челленджей при изменении данных
 */

import { useEffect, useCallback } from 'react'
import { useGardenStore } from '@/stores'
import { useMoodStore } from '@/stores'
import { useChallengeStore } from '@/stores/challengeStore'
import { useUserStore } from '@/stores'
import type { ChallengeMetric } from '@/types/challenges'

interface ChallengeProgressUpdate {
  readonly challengeId: string
  readonly metric: ChallengeMetric
  readonly newValue: number
}

export function useChallengeIntegration() {
  const { currentGarden } = useGardenStore()
  const { moodHistory } = useMoodStore()
  const { userParticipations, updateProgress, loadChallenges } =
    useChallengeStore()
  const { currentUser } = useUserStore()

  // Функция для подсчета метрик с момента присоединения к челленджу
  const calculateChallengeMetrics = useCallback(
    (challengeStartDate: Date): Record<ChallengeMetric, number> => {
      console.log(
        `🔢 Calculating metrics from date: ${challengeStartDate.toISOString()}`
      )
      console.log(`🔢 Date type: ${typeof challengeStartDate}`)
      console.log(`🔢 Is Date instance: ${challengeStartDate instanceof Date}`)

      const startTime = challengeStartDate.getTime()
      console.log(`⏰ Start time: ${startTime}`)

      // Проверяем что время корректное (не NaN и не слишком большое)
      if (isNaN(startTime)) {
        console.error(`❌ Invalid start time: ${startTime}`)
      }
      if (startTime > Date.now() + 365 * 24 * 60 * 60 * 1000) {
        // больше чем год в будущем
        console.error(`❌ Start time too far in future: ${startTime}`)
        console.error(`❌ Current time: ${Date.now()}`)
      }

      // Элементы сада, добавленные после начала челленджа
      const gardenElementsAfterStart =
        currentGarden?.elements.filter(
          el => el.unlockDate.getTime() >= startTime
        ) || []

      // Записи настроения после начала челленджа
      const moodEntriesAfterStart = moodHistory.filter(
        mood => mood.date.getTime() >= startTime
      )

      console.log(
        `🌱 Garden elements total: ${currentGarden?.elements.length || 0}`
      )
      console.log(
        `🌱 Garden elements after start: ${gardenElementsAfterStart.length}`
      )
      console.log(`😊 Mood entries total: ${moodHistory.length}`)
      console.log(
        `😊 Mood entries after start: ${moodEntriesAfterStart.length}`
      )

      const metrics = {
        // Элементы сада, добавленные после начала челленджа
        garden_elements_count: gardenElementsAfterStart.length,

        // Редкие элементы, добавленные после начала челленджа
        rare_elements_count: gardenElementsAfterStart.filter(el =>
          ['rare', 'epic', 'legendary'].includes(el.rarity)
        ).length,

        // Разнообразие сада (уникальные типы после начала челленджа)
        garden_diversity: new Set(gardenElementsAfterStart.map(el => el.type))
          .size,

        // Записи настроения после начала челленджа
        mood_entries_count: moodEntriesAfterStart.length,

        // Стрик дней (считаем с момента присоединения)
        streak_days: Math.max(
          0,
          Math.floor((Date.now() - startTime) / (1000 * 60 * 60 * 24))
        ),

        // Взаимодействия с друзьями (пока заглушка)
        friend_interactions: 0,
      }

      console.log(`📊 Calculated metrics:`, metrics)
      return metrics
    },
    [currentGarden, moodHistory]
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
    if (!currentUser?.telegramId) return

    const activeParticipations = getActiveParticipations()
    const updates: ChallengeProgressUpdate[] = []

    // Проходим по всем активным участиям
    for (const participation of activeParticipations) {
      // Находим челлендж в store
      const challenge = useChallengeStore
        .getState()
        .challenges.find(c => c.id === participation.challengeId)
      if (!challenge) continue

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

    // Выполняем обновления
    for (const update of updates) {
      try {
        await updateProgress(
          update.challengeId,
          currentUser.telegramId,
          update.metric,
          update.newValue
        )

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
    updateProgress,
  ])

  // Функция для принудительного обновления всех челленджей
  const forceUpdateAllChallenges = useCallback(async () => {
    if (!currentUser?.telegramId) return

    const activeParticipations = getActiveParticipations()

    for (const participation of activeParticipations) {
      const challenge = useChallengeStore
        .getState()
        .challenges.find(c => c.id === participation.challengeId)
      if (!challenge) continue

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
          await updateProgress(
            participation.challengeId,
            currentUser.telegramId,
            metric,
            cappedValue
          )

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
    updateProgress,
  ])

  // Hook для отслеживания изменений в саду
  useEffect(() => {
    if (!currentGarden || !currentUser) return

    // Обновляем прогресс челленджей при изменении сада
    void updateChallengeProgress()
  }, [currentGarden?.elements.length, updateChallengeProgress, currentUser])

  // Hook для отслеживания изменений в настроениях
  useEffect(() => {
    if (!currentUser) return

    // Обновляем прогресс челленджей при изменении настроений
    void updateChallengeProgress()
  }, [moodHistory.length, updateChallengeProgress, currentUser])

  // Hook для отслеживания изменений в стрике
  useEffect(() => {
    if (!currentUser) return

    // Обновляем прогресс челленджей при изменении стрика
    void updateChallengeProgress()
  }, [currentUser?.stats.currentStreak, updateChallengeProgress])

  // Инициализация - загружаем челленджи если их нет
  useEffect(() => {
    if (currentUser?.telegramId && userParticipations.length === 0) {
      void loadChallenges(currentUser.telegramId)
    }
  }, [currentUser?.telegramId, userParticipations.length, loadChallenges])

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
      const challenge = useChallengeStore
        .getState()
        .challenges.find(c => c.id === participation.challengeId)
      if (!challenge) continue

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
        await updateProgress(
          participation.challengeId,
          currentUser.telegramId,
          metric,
          cappedValue
        )
        console.log(`✅ Recalculated ${challenge.title}: ${cappedValue}`)
      } catch (error) {
        console.error(`❌ Failed to recalculate ${challenge.title}:`, error)
      }
    }
  }, [
    currentUser,
    getActiveParticipations,
    calculateChallengeMetrics,
    updateProgress,
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
  const { currentUser } = useUserStore()

  // Функция для вызова после добавления элемента в сад
  const onGardenElementAdded = useCallback(async () => {
    if (!currentUser?.telegramId) return

    // Небольшая задержка, чтобы изменения успели сохраниться
    setTimeout(async () => {
      await updateChallengeProgress()
    }, 1000)
  }, [currentUser?.telegramId, updateChallengeProgress])

  return {
    onGardenElementAdded,
  }
}

export function useChallengeMoodIntegration() {
  const { updateChallengeProgress } = useChallengeIntegration()
  const { currentUser } = useUserStore()

  // Функция для вызова после добавления записи настроения
  const onMoodEntryAdded = useCallback(async () => {
    if (!currentUser?.telegramId) return

    // Небольшая задержка, чтобы изменения успели сохраниться
    setTimeout(async () => {
      await updateChallengeProgress()
    }, 1000)
  }, [currentUser?.telegramId, updateChallengeProgress])

  return {
    onMoodEntryAdded,
  }
}
