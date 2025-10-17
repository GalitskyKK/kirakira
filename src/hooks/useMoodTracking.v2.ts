/**
 * 😊 Mood Tracking Hook (v2 - Refactored)
 * Использует React Query для серверного состояния
 * И Zustand для клиентского UI состояния
 */

import { useCallback, useMemo } from 'react'
import { useMoodClientStore } from '@/stores/moodStore.v2'
import {
  useMoodSync,
  useAddMoodEntry,
  useCanCheckinToday,
} from '@/hooks/queries'
import { useUserSync } from '@/hooks/index.v2'
import { useTelegramId } from '@/hooks/useTelegramId'
import { useUpdateQuestProgress } from '@/hooks/queries/useDailyQuestQueries'
import type { MoodType, MoodIntensity, MoodEntry, MoodStats } from '@/types'
import { getMoodDisplayProps, getRecommendedMood } from '@/utils/moodMapping'
import { getTimeUntilNextCheckin } from '@/utils/dateHelpers'
import { calculateMoodStats } from '@/utils/moodMapping'
import { loadMoodHistory, saveMoodHistory } from '@/utils/storage'
import { awardMoodRewards } from '@/utils/currencyRewards'

/**
 * Хук для отслеживания настроения
 * Объединяет серверное состояние (React Query) и клиентское состояние (Zustand)
 */
export function useMoodTracking() {
  const telegramId = useTelegramId()
  const { data: userData } = useUserSync(telegramId, !!telegramId)
  const currentUser = userData?.user
  const userId = currentUser?.id

  // Серверное состояние через React Query
  const {
    data: moodData,
    isLoading,
    error: queryError,
    refetch: syncMoodHistory,
  } = useMoodSync(telegramId, userId, !!telegramId && !!userId)

  const addMoodMutation = useAddMoodEntry()
  const updateQuestProgress = useUpdateQuestProgress()

  // Проверка возможности отметки настроения
  const { canCheckin, todaysMood } = useCanCheckinToday(telegramId, userId)

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

  // Локальное состояние из localStorage (для offline-first подхода)
  const localMoodHistory = loadMoodHistory()

  // Объединенное состояние: приоритет серверным данным, fallback на локальные
  const moodHistory = useMemo(() => {
    if (moodData) {
      // Сохраняем серверные данные локально
      saveMoodHistory(moodData.moods)
      return moodData.moods
    }
    return localMoodHistory
  }, [moodData, localMoodHistory])

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
    return getRecommendedMood(recentTrend)
  }, [recentTrend])

  // Отметка настроения за сегодня
  const checkInToday = useCallback(
    async (
      mood: MoodType,
      intensity: MoodIntensity,
      note?: string
    ): Promise<MoodEntry | null> => {
      if (!currentUser?.telegramId || !currentUser?.id) {
        console.error('❌ No user available')
        return null
      }

      if (!canCheckin) {
        console.error('❌ Already checked in today')
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
          telegramUserData: typeof telegramUserData
        } = {
          telegramUserId: currentUser.telegramId,
          mood,
          intensity,
          date: new Date().toISOString(),
          telegramUserData,
        }

        if (note !== undefined) {
          moodRequest.note = note
        }

        const entry = await addMoodMutation.mutateAsync(moodRequest)

        console.log('✅ Mood checked in successfully')

        // 💰 Начисляем валюту за запись настроения
        const isFirstToday = !todaysMood
        const currencyResult = await awardMoodRewards(
          currentUser.telegramId,
          isFirstToday
        )

        if (currencyResult.success) {
          console.log(
            `💰 Awarded ${currencyResult.sprouts} sprouts for mood check-in`
          )
        }

        // 🎯 Обновляем прогресс daily quests
        if (telegramId) {
          try {
            // Обновляем квесты связанные с настроением
            console.log('🎯 Updating mood-related daily quests...')

            // Обновляем квесты типа record_specific_mood и record_with_note
            const moodQuests = ['record_specific_mood', 'record_with_note']
            for (const questType of moodQuests) {
              try {
                await updateQuestProgress.mutateAsync({
                  telegramId,
                  questType: questType as any,
                  increment: 1,
                })
              } catch (error) {
                console.warn(`⚠️ Failed to update quest ${questType}:`, error)
              }
            }
          } catch (questError) {
            console.error('❌ Failed to update quest progress:', questError)
          }
        }

        return entry
      } catch (error) {
        console.error('❌ Failed to check in mood:', error)
        return null
      }
    },
    [currentUser, canCheckin, addMoodMutation]
  )

  // Получение свойств отображения настроения
  const getMoodDisplay = useCallback((mood: MoodType) => {
    return getMoodDisplayProps(mood)
  }, [])

  // Проверка возможности отметки
  const canCheckinNow = useCallback(() => {
    return canCheckin
  }, [canCheckin])

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
