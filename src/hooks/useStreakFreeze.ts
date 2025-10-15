import { useState, useCallback, useEffect } from 'react'
import { useUserStore } from '@/stores'
import { useMoodStore } from '@/stores/moodStore'
import {
  getStreakFreezes,
  applyStreakFreeze,
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

  // Функция для использования заморозки (внутренняя)
  const performFreeze = useCallback(
    async (freezeType: 'auto' | 'manual') => {
      if (!currentUser?.telegramId) return

      try {
        console.log(
          `🧊 Using ${freezeType} freeze for user ${currentUser.telegramId}`
        )
        setIsLoading(true)

        const result = await applyStreakFreeze({
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
        // Устанавливаем на сегодня, чтобы "сбросить" пропущенные дни
        const { setLastCheckin } = useMoodStore.getState()
        const today = new Date()
        setLastCheckin(today)

        // Закрываем модалку и сбрасываем состояние
        setShowModal(false)
        setMissedDays(0)
        // НЕ сбрасываем hasProcessedMissedDays - пользователь уже обработал пропущенные дни

        // Показываем сообщение об успехе
        if (freezeType === 'manual') {
          setAutoUsedMessage(
            `Использована заморозка! Стрик восстановлен до ${result.currentStreak} дней 🧊`
          )
          setTimeout(() => setAutoUsedMessage(null), 5000)
        }

        console.log(
          `✅ ${freezeType} freeze used successfully. New streak: ${result.currentStreak}`
        )
      } catch (error) {
        console.error(`❌ Error using ${freezeType} freeze:`, error)
        setAutoUsedMessage(
          `Ошибка при использовании заморозки: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`
        )
        setTimeout(() => setAutoUsedMessage(null), 5000)
      } finally {
        setIsLoading(false)
      }
    },
    [currentUser?.telegramId, missedDays]
  )

  // Использовать заморозку
  const useFreeze = useCallback(
    async (freezeType: 'auto' | 'manual') => {
      if (!currentUser?.telegramId || missedDays === 0) return
      await performFreeze(freezeType)
    },
    [currentUser?.telegramId, missedDays, performFreeze]
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
        // Устанавливаем на сегодня, чтобы "сбросить" пропущенные дни
        const { setLastCheckin } = useMoodStore.getState()
        const today = new Date()
        setLastCheckin(today)

        // Закрываем модалку и сбрасываем состояние
        setShowModal(false)
        setMissedDays(0)
        // НЕ сбрасываем hasProcessedMissedDays - пользователь уже обработал пропущенные дни

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

    console.log('🔍 Checking missed days:', {
      lastCheckin: lastCheckin?.toISOString(),
      missed,
      hasProcessedMissedDays,
      currentStreak: currentUser?.stats?.currentStreak,
    })

    // Если нет пропущенных дней - всё ОК
    if (missed === 0) {
      console.log('✅ No missed days, user is up to date')
      setHasProcessedMissedDays(true)
      return
    }

    // Если стрик уже сброшен (currentStreak = 0) и есть пропущенные дни
    // значит стрик уже потерян, не показываем модалку
    if (currentUser?.stats?.currentStreak === 0 && missed > 0) {
      console.log(
        '🔍 Streak already reset (currentStreak = 0), skipping freeze modal'
      )
      setHasProcessedMissedDays(true)
      return
    }

    // Если есть пропущенные дни И можно восстановить стрик
    if (missed > 0 && canRecoverStreak(missed)) {
      setMissedDays(missed)
      setHasProcessedMissedDays(true)

      // Загружаем заморозки
      const freezes = await getStreakFreezes(currentUser.telegramId)
      setFreezeData(freezes)

      const recommendedType = getRecommendedFreezeType(missed, freezes)

      if (recommendedType === 'auto') {
        // Автоматически используем авто-заморозку
        // Вызываем функцию напрямую, а не хук
        await performFreeze('auto')
        // После автозаморозки не нужно сбрасывать hasProcessedMissedDays
        // так как performFreeze уже это делает
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
      console.log(
        '🔄 Initializing streak freeze check for user:',
        currentUser.telegramId
      )
      void loadFreezes()
      void checkAndHandleMissedDays()
    }
  }, [
    currentUser?.telegramId,
    hasProcessedMissedDays,
    loadFreezes,
    checkAndHandleMissedDays,
  ])

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
      // НЕ сбрасываем hasProcessedMissedDays при закрытии модалки
      // чтобы предотвратить повторное открытие
    },
  }
}
