/**
 * Hook for managing mood tracking state and operations
 *
 * ПОСЛЕ РЕФАКТОРИНГА:
 * - UI state управляется через Zustand (moodStore)
 * - Серверное состояние через React Query хуки (useMoodQueries)
 */

import { useCallback, useMemo } from 'react'
import { useMoodStore } from '@/stores'
import type { MoodType, MoodIntensity } from '@/types'

/**
 * Hook for managing mood UI state and local operations
 *
 * Для серверных операций используйте:
 * - useMoodHistory() - загрузка истории с сервера
 * - useTodaysMood() - получение сегодняшнего настроения
 * - useRecordMood() - запись настроения
 */
export function useMoodTracking() {
  const {
    todaysMood,
    moodHistory,
    isLoading, // Deprecated - используйте isLoading из React Query хуков
    error, // Deprecated - используйте error из React Query хуков
    streakCount,
    lastCheckin,
    loadMoodHistory,
    setMoodHistory,
    setTodaysMood,
    updateMoodHistoryLocal,
    canCheckinToday,
    getTodaysMood,
    getRecentMoods,
    getMoodStats,
    getStreakInfo,
    clearMoodHistory,
  } = useMoodStore()

  // Memoized mood statistics
  const moodStats = useMemo(() => getMoodStats(), [getMoodStats])
  const streakInfo = useMemo(() => getStreakInfo(), [getStreakInfo])

  // Get mood distribution for charts
  const moodDistribution = useMemo(() => {
    return moodStats.moodDistribution
  }, [moodStats])

  // Get recent moods for a specific period
  const getRecentMoodsCallback = useCallback(
    (days: number) => getRecentMoods(days),
    [getRecentMoods]
  )

  // Check if can check in today
  const canCheckin = useMemo(() => canCheckinToday(), [canCheckinToday])

  // Analyze mood trend
  const recentTrend = useMemo(() => {
    const recent = getRecentMoods(7)
    if (recent.length < 3) return 'stable' as const

    // Simple trend analysis based on mood distribution
    const positiveCount = recent.filter(
      m => m.mood === 'joy' || m.mood === 'calm'
    ).length

    const ratio = positiveCount / recent.length
    if (ratio > 0.6) return 'improving' as const
    if (ratio < 0.4) return 'declining' as const
    return 'stable' as const
  }, [getRecentMoods])

  // Calculate time until next check-in
  const timeUntilNextCheckin = useMemo(() => {
    if (canCheckin) return null

    const now = new Date()
    const tomorrow = new Date(now)
    tomorrow.setDate(tomorrow.getDate() + 1)
    tomorrow.setHours(0, 0, 0, 0)

    return tomorrow
  }, [canCheckin])

  // Mock methods that will be replaced by React Query mutations in components
  const checkInToday = useCallback(
    async (_mood: MoodType, _intensity: MoodIntensity, _note?: string) => {
      console.warn(
        'checkInToday is deprecated. Use useRecordMood() from React Query'
      )
      return null
    },
    []
  )

  const updateTodaysMoodEntry = useCallback(
    async (_mood: MoodType, _intensity: MoodIntensity, _note?: string) => {
      console.warn(
        'updateTodaysMoodEntry is deprecated. Use useRecordMood() from React Query'
      )
      return null
    },
    []
  )

  const moodRecommendation = useMemo(() => {
    if (recentTrend === 'improving') {
      return 'Отличная динамика! Продолжайте в том же духе! 🌟'
    } else if (recentTrend === 'declining') {
      return 'Помните, что трудные времена временны. Позаботьтесь о себе 💚'
    }
    return 'Вы делаете хорошую работу, продолжайте отслеживать свое состояние!'
  }, [recentTrend])

  return {
    // State
    todaysMood: todaysMood ?? getTodaysMood(),
    moodHistory,
    isLoading, // Deprecated - используйте isLoading из useMoodHistory()
    error, // Deprecated - используйте error из useMoodHistory()
    streakCount,
    lastCheckin,

    // Statistics
    moodStats,
    streakInfo,
    moodDistribution,
    recentTrend,
    moodRecommendation,

    // Actions
    loadMoodHistory,
    setMoodHistory, // Для использования с React Query
    setTodaysMood, // Для использования с React Query
    updateMoodHistoryLocal, // Для локального обновления после мутации
    clearMoodHistory,

    // Deprecated methods - for backward compatibility
    // Components should migrate to useRecordMood() from React Query
    canCheckinToday,
    checkInToday,
    updateTodaysMoodEntry,
    timeUntilNextCheckin,

    // Utility functions
    canCheckin,
    getTodaysMood,
    getRecentMoods: getRecentMoodsCallback,
  }
}
