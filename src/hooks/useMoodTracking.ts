/**
 * 😊 Mood Tracking Hook (v2 - Refactored)
 * Использует React Query для серверного состояния
 * И Zustand для клиентского UI состояния
 */

import { useCallback, useMemo, useState } from 'react'
import { useMoodClientStore } from '@/stores/moodStore'
import {
  useMoodSync,
  useAddMoodEntry,
  useCanCheckinToday,
} from '@/hooks/queries'
import { useUserSync } from '@/hooks/index.v2'
import { useTelegramId } from '@/hooks/useTelegramId'
import { useChallengeMoodIntegration } from '@/hooks/useChallengeIntegration'
import { useUserClientStore } from '@/stores/userStore'
import type { MoodType, MoodIntensity, MoodEntry, MoodStats } from '@/types'
import {
  getMoodDisplayProps,
  getRecommendedMoodWithOptions,
} from '@/utils/moodMapping'
import {
  getLocalDateString,
  getLocalDateTimeString,
  getTimeUntilNextCheckin,
} from '@/utils/dateHelpers'
import { calculateMoodStats } from '@/utils/moodMapping'
import { loadMoodHistory, saveMoodHistory } from '@/utils/storage'
import { awardMoodRewards } from '@/utils/currencyRewards'
import { useTranslation } from '@/hooks/useTranslation'
import { getLocalizedMoodConfig } from '@/utils/moodLocalization'

/**
 * Хук для отслеживания настроения
 * Объединяет серверное состояние (React Query) и клиентское состояние (Zustand)
 */
export function useMoodTracking() {
  const telegramId = useTelegramId()
  const { data: userData } = useUserSync(telegramId, !!telegramId)
  const currentUser = userData?.user
  const userId = currentUser?.id
  const { isGuestModeEnabled } = useUserClientStore()
  const guestModeEnabled = isGuestModeEnabled === true
  const t = useTranslation()
  const [localVersion, setLocalVersion] = useState(0)

  // Серверное состояние через React Query
  const {
    data: moodData,
    isLoading,
    error: queryError,
    refetch: syncMoodHistory,
  } = useMoodSync(telegramId, userId, !!telegramId && !!userId)

  const addMoodMutation = useAddMoodEntry()
  const { onMoodEntryAdded } = useChallengeMoodIntegration()

  // Проверка возможности отметки настроения
  const { canCheckin, todaysMood: serverTodaysMood } = useCanCheckinToday(
    telegramId,
    userId
  )

  // Клиентское UI состояние через Zustand
  const {
    selectedDateRange,
    isFilterModalOpen,
    selectedMoodFilter,
    setDateRange,
    setFilterModalOpen,
    setSelectedMoodFilter,
    clearFilters,
  } = useMoodClientStore()

  // 🔧 КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: Объединенное состояние с приоритетом серверным данным
  // Если после очистки localStorage нет истории, но есть серверные данные - используем их
  const moodHistory = useMemo(() => {
    void localVersion
    const localMoodHistory = loadMoodHistory()

    // Если есть серверные данные - они приоритетнее
    if (moodData) {
      // Сохраняем серверные данные локально для offline-first
      saveMoodHistory(moodData.moods)
      return moodData.moods
    }

    // Fallback на локальные данные (offline-first)
    return localMoodHistory
  }, [moodData, localVersion])

  const todaysMoodLocal = useMemo(() => {
    if (moodHistory.length === 0) {
      return null
    }

    const todayKey = getLocalDateString(new Date())
    return (
      moodHistory.find(
        entry => getLocalDateString(entry.date ?? new Date()) === todayKey
      ) ?? null
    )
  }, [moodHistory])

  const todaysMood = serverTodaysMood ?? todaysMoodLocal
  const canCheckinTodayFlag = todaysMood === null && canCheckin

  // Статистика настроений
  // 🔧 КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: Используем серверные стрики из userData вместо локального расчета
  const moodStats: MoodStats = useMemo(() => {
    const localStats = calculateMoodStats(moodHistory)

    // Если есть серверные данные о стриках - используем их (более точные!)
    if (userData?.stats) {
      return {
        ...localStats,
        currentStreak: userData.stats.currentStreak ?? localStats.currentStreak,
        longestStreak: userData.stats.longestStreak ?? localStats.longestStreak,
        totalMoodEntries:
          userData.stats.totalMoodEntries ?? localStats.totalEntries,
      }
    }

    return localStats
  }, [moodHistory, userData?.stats])

  // Время до следующей отметки
  const timeUntilNextCheckin = useMemo(() => {
    const lastEntry = moodHistory.length > 0 ? moodHistory[0] : null
    return getTimeUntilNextCheckin(lastEntry?.date ?? null)
  }, [moodHistory])

  // Недавний тренд (последние 7 дней)
  const recentTrend = useMemo((): readonly MoodEntry[] => {
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const recent = moodHistory.filter(entry => entry.date >= sevenDaysAgo)
    return [...recent].sort(
      (a: MoodEntry, b: MoodEntry) => a.date.getTime() - b.date.getTime()
    )
  }, [moodHistory])

  // Рекомендация настроения на основе паттернов
  const moodRecommendation = useMemo(() => {
    return getRecommendedMoodWithOptions(recentTrend, {
      reasonPrefix: t.moodStats.mostCommonRecent,
      noDataReason: t.moodStats.recommendationNoData,
      noPatternReason: t.moodStats.recommendationNoPattern,
      getMoodLabel: mood => getLocalizedMoodConfig(mood, t).label,
    })
  }, [recentTrend, t])

  // Отметка настроения за сегодня
  const checkInToday = useCallback(
    async (
      mood: MoodType,
      intensity: MoodIntensity,
      note?: string
    ): Promise<MoodEntry | null> => {
      if (!canCheckinTodayFlag) {
        console.error('❌ Already checked in today')
        return null
      }

      if (currentUser?.telegramId === undefined) {
        if (guestModeEnabled) {
          const now = new Date()
          const todayKey = getLocalDateString(now)
          const sanitizedHistory = moodHistory.filter(
            entry => getLocalDateString(entry.date) !== todayKey
          )

          const guestEntry: MoodEntry = {
            id: `guest_mood_${now.getTime()}`,
            userId: currentUser?.id ?? 'guest_user',
            date: now,
            mood,
            intensity,
            note,
            createdAt: now,
          }

          saveMoodHistory([guestEntry, ...sanitizedHistory])
          setLocalVersion(version => version + 1)
          return guestEntry
        }

        console.error('❌ No user available')
        return null
      }

      try {
        // Отправляем на сервер через mutation
        const telegramUserData: {
          userId: string
          firstName: string
          lastName?: string
          username?: string
          languageCode: string
          photoUrl?: string
        } = {
          userId: currentUser.id,
          firstName: currentUser.firstName ?? 'User',
          languageCode: currentUser.preferences.language || 'ru',
        }

        if (currentUser.lastName !== undefined) {
          telegramUserData.lastName = currentUser.lastName
        }
        if (currentUser.username !== undefined) {
          telegramUserData.username = currentUser.username
        }
        if (currentUser.photoUrl !== undefined) {
          telegramUserData.photoUrl = currentUser.photoUrl
        }

        const moodRequest: {
          telegramUserId: number
          mood: MoodType
          intensity: MoodIntensity
          note?: string
          date: string
          localDate?: string
          telegramUserData: typeof telegramUserData
        } = {
          telegramUserId: currentUser.telegramId,
          mood,
          intensity,
          // 🔧 КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: отправляем локальное время с offset'ом,
          // а "день" передаем отдельно (YYYY-MM-DD), чтобы не было сдвига на UTC.
          date: getLocalDateTimeString(new Date()),
          localDate: getLocalDateString(new Date()),
          telegramUserData,
        }

        if (note !== undefined) {
          moodRequest.note = note
        }

        const entry = await addMoodMutation.mutateAsync(moodRequest)

        // 💰 Начисляем валюту за запись настроения
        const isFirstToday = todaysMood == null
        const currencyResult = await awardMoodRewards(
          currentUser.telegramId,
          isFirstToday
        )

        if (currencyResult.success) {
          // Успешная награда обрабатывается без дополнительного логирования
        }

        // 🏆 Обновляем прогресс челенджей
        try {
          await onMoodEntryAdded()
        } catch (challengeError) {
          console.warn(
            '⚠️ Failed to update challenge progress:',
            challengeError
          )
        }

        return entry
      } catch (error) {
        console.error('❌ Failed to check in mood:', error)
        return null
      }
    },
    [
      currentUser,
      canCheckinTodayFlag,
      guestModeEnabled,
      addMoodMutation,
      moodHistory,
      todaysMood,
      onMoodEntryAdded,
    ]
  )

  // Получение свойств отображения настроения
  const getMoodDisplay = useCallback((mood: MoodType) => {
    return getMoodDisplayProps(mood)
  }, [])

  // Проверка возможности отметки
  const canCheckinNow = useCallback(() => {
    return canCheckinTodayFlag
  }, [canCheckinTodayFlag])

  // Получение настроения за сегодня
  const getTodaysMoodEntry = useCallback(() => {
    return todaysMood
  }, [todaysMood])

  // Получение недавних настроений
  const getRecentMoods = useCallback(
    (days: number): readonly MoodEntry[] => {
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - days)

      return moodHistory.filter(entry => entry.date >= cutoffDate)
    },
    [moodHistory]
  )

  // Получение статистики
  const getMoodStatsData = useCallback(() => {
    return moodStats
  }, [moodStats])

  // Получение информации о streak
  const getStreakInfo = useCallback(() => {
    return {
      current: moodStats.currentStreak,
      longest: moodStats.longestStreak,
    }
  }, [moodStats])

  return {
    // Состояние
    todaysMood,
    moodHistory,
    isLoading: isLoading || addMoodMutation.isPending,
    error: queryError?.message ?? addMoodMutation.error?.message ?? null,
    streakCount: moodStats.currentStreak,
    lastCheckin: moodHistory.length > 0 ? (moodHistory[0]?.date ?? null) : null,

    // Статистика
    moodStats,
    timeUntilNextCheckin,
    recentTrend,
    moodRecommendation,

    // Фильтры UI
    selectedDateRange,
    isFilterModalOpen,
    selectedMoodFilter,

    // Actions
    syncMoodHistory,
    checkInToday,
    getMoodDisplay,
    setDateRange,
    setFilterModalOpen,
    setSelectedMoodFilter,
    clearFilters,

    // Utility functions
    canCheckinToday: canCheckinNow,
    getTodaysMood: getTodaysMoodEntry,
    getRecentMoods,
    getMoodStats: getMoodStatsData,
    getStreakInfo,
  }
}
