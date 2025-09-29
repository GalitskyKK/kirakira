/**
 * Hook для интеграции челленджей с реальной статистикой сада
 * Автоматически обновляет прогресс челленджей при изменении данных
 */

import { useEffect, useCallback, useRef } from 'react'
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

  // Отслеживаем предыдущие значения для определения изменений
  const previousValues = useRef<Record<string, number>>({})

  // Функция для подсчета текущих значений метрик
  const calculateCurrentMetrics = useCallback((): Record<
    ChallengeMetric,
    number
  > => {
    return {
      // Элементы сада
      garden_elements_count: currentGarden?.elements.length || 0,

      // Редкие элементы
      rare_elements_count:
        currentGarden?.elements.filter(el =>
          ['rare', 'epic', 'legendary'].includes(el.rarity)
        ).length || 0,

      // Разнообразие сада (количество уникальных типов)
      garden_diversity: new Set(
        currentGarden?.elements.map(el => el.type) || []
      ).size,

      // Записи настроения
      mood_entries_count: moodHistory.length,

      // Стрик дней (берем из пользователя)
      streak_days: currentUser?.stats.currentStreak || 0,

      // Взаимодействия с друзьями (пока заглушка)
      friend_interactions: 0,
    }
  }, [currentGarden, moodHistory, currentUser])

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

    const currentMetrics = calculateCurrentMetrics()
    const activeParticipations = getActiveParticipations()
    const updates: ChallengeProgressUpdate[] = []

    // Проходим по всем активным участиям
    for (const participation of activeParticipations) {
      // Находим челлендж в store
      const challenge = useChallengeStore
        .getState()
        .challenges.find(c => c.id === participation.challengeId)
      if (!challenge) continue

      const metric = challenge.requirements.metric
      const currentValue = currentMetrics[metric]
      const previousValue =
        previousValues.current[`${participation.challengeId}_${metric}`] || 0

      // Проверяем, изменилось ли значение
      if (
        currentValue !== previousValue &&
        currentValue > participation.currentProgress
      ) {
        updates.push({
          challengeId: participation.challengeId,
          metric,
          newValue: currentValue,
        })

        // Сохраняем новое значение
        previousValues.current[`${participation.challengeId}_${metric}`] =
          currentValue
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
    calculateCurrentMetrics,
    getActiveParticipations,
    updateProgress,
  ])

  // Функция для принудительного обновления всех челленджей
  const forceUpdateAllChallenges = useCallback(async () => {
    if (!currentUser?.telegramId) return

    const currentMetrics = calculateCurrentMetrics()
    const activeParticipations = getActiveParticipations()

    for (const participation of activeParticipations) {
      const challenge = useChallengeStore
        .getState()
        .challenges.find(c => c.id === participation.challengeId)
      if (!challenge) continue

      const metric = challenge.requirements.metric
      const currentValue = currentMetrics[metric]

      try {
        await updateProgress(
          participation.challengeId,
          currentUser.telegramId,
          metric,
          currentValue
        )

        console.log(
          `🔄 Force updated challenge: ${participation.challengeId} - ${metric}: ${currentValue}`
        )
      } catch (error) {
        console.error(`❌ Failed to force update challenge:`, error)
      }
    }
  }, [
    currentUser,
    calculateCurrentMetrics,
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

  return {
    updateChallengeProgress,
    forceUpdateAllChallenges,
    calculateCurrentMetrics,
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
