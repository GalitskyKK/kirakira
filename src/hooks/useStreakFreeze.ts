import { useState, useCallback, useEffect } from 'react'
import { useUserStore } from '@/stores'
import { useMoodStore } from '@/stores/moodStore'
import {
  getStreakFreezes,
  useStreakFreeze as useStreakFreezeAPI,
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

  // Загрузка заморозок
  const loadFreezes = useCallback(async () => {
    if (!currentUser?.telegramId) return

    try {
      setIsLoading(true)
      const data = await getStreakFreezes(currentUser.telegramId)
      setFreezeData(data)
    } catch (error) {
      console.error('Failed to load streak freezes:', error)
    } finally {
      setIsLoading(false)
    }
  }, [currentUser?.telegramId])

  // Использовать заморозку
  const useFreeze = useCallback(
    async (freezeType: 'auto' | 'manual') => {
      if (!currentUser?.telegramId || missedDays === 0) return

      try {
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

        // Закрываем модалку
        setShowModal(false)
        setMissedDays(0)

        // Показываем сообщение об успехе
        if (freezeType === 'auto') {
          setAutoUsedMessage(
            `Автоматически использована заморозка! Стрик сохранён (${result.currentStreak} дней) 🧊`
          )
          setTimeout(() => setAutoUsedMessage(null), 5000)
        }

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

  // Проверка пропущенных дней при монтировании
  const checkAndHandleMissedDays = useCallback(async () => {
    if (!currentUser?.telegramId) return

    const { lastCheckin } = useMoodStore.getState()
    const missed = checkMissedDays(lastCheckin)

    if (missed > 0 && canRecoverStreak(missed)) {
      setMissedDays(missed)

      // Загружаем заморозки
      await loadFreezes()

      // Проверяем можно ли использовать авто-заморозку
      const freezes =
        freezeData ?? (await getStreakFreezes(currentUser.telegramId))
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
      setShowModal(true)
    }
  }, [currentUser?.telegramId, loadFreezes, freezeData, useFreeze])

  // Автоматическая проверка при загрузке
  useEffect(() => {
    void loadFreezes()
  }, [loadFreezes])

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
    checkMissedDays: checkAndHandleMissedDays,
    setShowModal,
    closeModal: () => setShowModal(false),
  }
}
