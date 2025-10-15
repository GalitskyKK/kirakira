import { useState, useCallback, useEffect } from 'react'
import { useUserStore } from '@/stores'
import { useMoodStore } from '@/stores/moodStore'
import {
  getStreakFreezes,
  useStreakFreeze as useStreakFreezeAPI,
  resetStreak as resetStreakAPI,
  checkMissedDays,
  canRecoverStreak,
  getRecommendedFreezeType,
  type StreakFreezeData,
} from '@/api/streakFreezeService'

/**
 * 🧊 Хук для работы с заморозками стрика
 */
export function useStreakFreeze() {
  const { currentUser } = useUserStore()

  const [freezeData, setFreezeData] = useState<StreakFreezeData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [missedDays, setMissedDays] = useState(0)
  const [autoUsedMessage, setAutoUsedMessage] = useState<string | null>(null)
  const [hasProcessedMissedDays, setHasProcessedMissedDays] = useState(false)

  // Загрузка заморозок
  const loadFreezes = useCallback(async () => {
    if (!currentUser?.telegramId) return

    try {
      setIsLoading(true)
      const data = await getStreakFreezes(currentUser.telegramId)
      setFreezeData(data)
    } catch (error) {
      console.error('Failed to load streak freezes:', error)
      // Fallback: используем данные из currentUser.stats
      setFreezeData({
        manual: currentUser.stats.streakFreezes ?? 0,
        auto: currentUser.stats.autoFreezes ?? 0,
        max: 3, // default для уровня 1
        canAccumulate: true,
      })
    } finally {
      setIsLoading(false)
    }
  }, [
    currentUser?.telegramId,
    currentUser?.stats.streakFreezes,
    currentUser?.stats.autoFreezes,
  ])

  // Использовать заморозку
  const useFreeze = useCallback(
    async (freezeType: 'auto' | 'manual') => {
      if (!currentUser?.telegramId || missedDays === 0) return

      try {
        console.log('🧊 Starting freeze usage:', {
          freezeType,
          missedDays,
          userId: currentUser.telegramId,
        })
        setIsLoading(true)

        const result = await useStreakFreezeAPI({
          telegramId: currentUser.telegramId,
          freezeType,
          missedDays,
        })

        // Обновляем локальные данные
        setFreezeData(prev => {
          if (!prev) return null
          return {
            ...prev,
            manual: result.remaining.manual,
            auto: result.remaining.auto,
          }
        })

        // Обновляем стрик в userStore
        const { updateStats } = useUserStore.getState()
        await updateStats({
          currentStreak: result.currentStreak,
        })

        // Обновляем lastCheckin в moodStore, чтобы предотвратить повторную проверку
        // Устанавливаем на вчерашний день, чтобы пользователь мог отметить настроение сегодня
        const { setLastCheckin } = useMoodStore.getState()
        const yesterday = new Date()
        yesterday.setDate(yesterday.getDate() - 1)
        setLastCheckin(yesterday)

        // Закрываем модалку и сбрасываем состояние
        setShowModal(false)
        setMissedDays(0)
        setHasProcessedMissedDays(false)

        // Показываем сообщение об успехе
        if (freezeType === 'auto') {
          setAutoUsedMessage(
            `Автоматически использована заморозка! Стрик сохранён (${result.currentStreak} дней) 🧊`
          )
          setTimeout(() => setAutoUsedMessage(null), 5000)
        } else {
          setAutoUsedMessage(
            `Заморозка использована! Стрик сохранён (${result.currentStreak} дней) 🧊`
          )
          setTimeout(() => setAutoUsedMessage(null), 5000)
        }

        console.log('✅ Freeze used successfully:', {
          freezeType,
          result,
          lastCheckinUpdated: true,
          modalClosed: true,
        })

        // Не возвращаем result, чтобы соответствовать типу Promise<void>
      } catch (error) {
        console.error('Failed to use streak freeze:', error)
        throw error
      } finally {
        setIsLoading(false)
      }
    },
    [currentUser?.telegramId, missedDays]
  )

  // Сбросить стрик (без использования заморозок)
  const resetStreak = useCallback((): Promise<void> => {
    if (!currentUser?.telegramId) return Promise.resolve()

    const performReset = async () => {
      try {
        console.log(
          '🔄 Starting streak reset for user:',
          currentUser.telegramId
        )
        setIsLoading(true)

        const result = await resetStreakAPI({
          telegramId: currentUser.telegramId!,
        })

        // Обновляем стрик в userStore
        const { updateStats } = useUserStore.getState()
        await updateStats({
          currentStreak: result.currentStreak,
          longestStreak: result.longestStreak,
        })

        // Обновляем lastCheckin в moodStore, чтобы предотвратить повторную проверку
        // Устанавливаем на вчерашний день, чтобы пользователь мог отметить настроение сегодня
        const { setLastCheckin } = useMoodStore.getState()
        const yesterday = new Date()
        yesterday.setDate(yesterday.getDate() - 1)
        setLastCheckin(yesterday)

        // Закрываем модалку и сбрасываем состояние
        setShowModal(false)
        setMissedDays(0)
        setHasProcessedMissedDays(false)

        // Показываем сообщение об успехе
        setAutoUsedMessage(`Стрик сброшен! Начинаем новую серию 🌱`)
        setTimeout(() => setAutoUsedMessage(null), 5000)

        console.log('✅ Streak reset successfully:', result)
      } catch (error) {
        console.error('Failed to reset streak:', error)
        throw error
      } finally {
        setIsLoading(false)
      }
    }

    return performReset()
  }, [currentUser?.telegramId])

  // Проверка пропущенных дней при монтировании
  const checkAndHandleMissedDays = useCallback(async () => {
    if (!currentUser?.telegramId || hasProcessedMissedDays) return

    const { lastCheckin } = useMoodStore.getState()
    const missed = checkMissedDays(lastCheckin)

    if (missed > 0 && canRecoverStreak(missed)) {
      setMissedDays(missed)
      setHasProcessedMissedDays(true)

      // Загружаем заморозки
      const freezes = await getStreakFreezes(currentUser.telegramId)
      setFreezeData(freezes)

      const recommendedType = getRecommendedFreezeType(missed, freezes)

      if (recommendedType === 'auto') {
        // Автоматически используем авто-заморозку
        await useFreeze('auto')
      } else {
        // Показываем модалку для ручного выбора
        setShowModal(true)
      }
    } else if (missed > 7) {
      // Стрик потерян безвозвратно
      setMissedDays(missed)
      setHasProcessedMissedDays(true)
      setShowModal(true)
    }
  }, [currentUser?.telegramId, useFreeze, hasProcessedMissedDays])

  // Автоматическая проверка при загрузке
  useEffect(() => {
    if (currentUser?.telegramId && !hasProcessedMissedDays) {
      void loadFreezes()
    }
  }, [currentUser?.telegramId, hasProcessedMissedDays, loadFreezes])

  return {
    // Данные
    freezeData,
    missedDays,
    showModal,
    isLoading,
    autoUsedMessage,

    // Действия
    loadFreezes,
    useFreeze,
    resetStreak,
    checkMissedDays: checkAndHandleMissedDays,
    setShowModal,
    closeModal: () => {
      setShowModal(false)
      setHasProcessedMissedDays(false)
    },
  }
}
