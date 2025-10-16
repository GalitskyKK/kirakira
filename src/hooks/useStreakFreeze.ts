import { useState, useCallback, useEffect } from 'react'
import { useUserSync } from '@/hooks/index.v2'
import { useTelegramId } from '@/hooks/useTelegramId'
import { useQueryClient } from '@tanstack/react-query'
import { userKeys } from '@/hooks/queries/useUserQueries'
import {
  applyStreakFreeze,
  resetStreak as resetStreakAPI,
  checkStreak, // 🔥 НОВЫЙ СЕРВИС
  getStreakFreezes,
  type StreakFreezeData,
  getRecommendedFreezeType,
} from '@/api/streakFreezeService'

/**
 * 🧊 Хук для работы с заморозками стрика (V2 - Серверная логика + React Query)
 */
export function useStreakFreeze() {
  const queryClient = useQueryClient()

  // Получаем данные пользователя через React Query
  const telegramId = useTelegramId()
  const { data: userData } = useUserSync(telegramId, !!telegramId)
  const currentUser = userData?.user

  const [freezeData, setFreezeData] = useState<StreakFreezeData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [missedDays, setMissedDays] = useState(0)
  const [autoUsedMessage, setAutoUsedMessage] = useState<string | null>(null)
  const [hasProcessedStreakCheck, setHasProcessedStreakCheck] = useState(false)

  // 🔥 ШАГ 1: Проверка стрика на сервере при инициализации
  const checkAndHandleStreak = useCallback(async () => {
    if (currentUser?.telegramId == null || hasProcessedStreakCheck) return

    console.log(`🧐 [V2] Checking streak for user ${currentUser.telegramId}`)
    setIsLoading(true)

    try {
      const streakStatus = await checkStreak(currentUser.telegramId)
      setHasProcessedStreakCheck(true)

      console.log('✅ [V2] Server streak status:', streakStatus)

      if (streakStatus.streakState === 'at_risk') {
        setMissedDays(streakStatus.missedDays)

        // Загружаем данные о заморозках
        const freezes = await getStreakFreezes(currentUser.telegramId)
        setFreezeData(freezes)

        // Проверяем, можно ли использовать авто-заморозку
        const recommendedType = getRecommendedFreezeType(
          streakStatus.missedDays,
          freezes
        )
        if (recommendedType === 'auto') {
          console.log('🧊 [V2] Auto-freeze recommended, applying...')
          // Авто-заморозка всегда покрывает ровно 1 день
          void performFreeze('auto', 1)
        } else {
          console.log('🧊 [V2] Manual freeze or reset required, showing modal.')
          setShowModal(true)
        }
      } else if (streakStatus.streakState === 'broken') {
        setMissedDays(streakStatus.missedDays)
        setShowModal(true) // Показываем модалку для сброса
      }
    } catch (error) {
      console.error('❌ [V2] Failed to check streak status:', error)
    } finally {
      setIsLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?.telegramId, hasProcessedStreakCheck])
  // performFreeze создается после, но используется здесь - это безопасно

  useEffect(() => {
    // Даем небольшую задержку, чтобы currentUser успел загрузиться
    const timer = setTimeout(() => {
      void checkAndHandleStreak()
    }, 500)
    return () => clearTimeout(timer)
  }, [checkAndHandleStreak])

  // 🔥 ШАГ 2: Логика использования заморозки (вызывает API)
  const performFreeze = useCallback(
    async (freezeType: 'auto' | 'manual', daysToCover: number) => {
      if (currentUser?.telegramId == null) return

      try {
        setIsLoading(true)
        const result = await applyStreakFreeze({
          telegramId: currentUser.telegramId,
          freezeType,
          missedDays: daysToCover,
        })

        // Обновляем UI
        setShowModal(false)
        setFreezeData({
          manual: result.remaining.manual,
          auto: result.remaining.auto,
          max: freezeData?.max ?? 3,
          canAccumulate: result.remaining.manual < (freezeData?.max ?? 3),
        })
        setAutoUsedMessage(
          `Заморозка использована! Стрик ${result.currentStreak} дней сохранен.`
        )
        setTimeout(() => setAutoUsedMessage(null), 5000)

        // Инвалидируем React Query кеш для обновления данных пользователя
        await queryClient.invalidateQueries({
          queryKey: userKeys.all,
        })

        console.log('✅ [V2] User data invalidated, streak updated:', {
          currentStreak: result.currentStreak,
          streakFreezes: result.remaining.manual,
          autoFreezes: result.remaining.auto,
        })
      } catch (error) {
        console.error(`❌ [V2] Error using ${freezeType} freeze:`, error)
        setAutoUsedMessage(
          `Ошибка: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`
        )
      } finally {
        setIsLoading(false)
      }
    },
    [currentUser?.telegramId, freezeData?.max, queryClient]
  )

  const useFreeze = (freezeType: 'auto' | 'manual') =>
    performFreeze(freezeType, missedDays)

  // 🔥 ШАГ 3: Логика сброса стрика (вызывает API)
  const resetStreak = useCallback(async () => {
    if (currentUser?.telegramId == null) return
    try {
      setIsLoading(true)
      const result = await resetStreakAPI({
        telegramId: currentUser.telegramId,
      })

      setShowModal(false)
      setAutoUsedMessage('Стрик сброшен. Начните новую серию!')
      setTimeout(() => setAutoUsedMessage(null), 5000)

      // Инвалидируем React Query кеш для обновления данных пользователя
      await queryClient.invalidateQueries({
        queryKey: userKeys.all,
      })

      console.log('✅ [V2] Streak reset, user data invalidated:', {
        currentStreak: result.currentStreak,
        longestStreak: result.longestStreak,
      })
    } catch (error) {
      console.error('❌ [V2] Failed to reset streak:', error)
    } finally {
      setIsLoading(false)
    }
  }, [currentUser?.telegramId, queryClient])

  return {
    freezeData,
    missedDays,
    showModal,
    isLoading,
    autoUsedMessage,
    useFreeze,
    resetStreak,
    closeModal: () => setShowModal(false),
  }
}
