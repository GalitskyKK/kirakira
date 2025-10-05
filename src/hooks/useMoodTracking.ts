import { useCallback, useMemo } from 'react'
import { useMoodStore } from '@/stores'
import type { MoodType, MoodIntensity, MoodEntry, MoodStats } from '@/types'
import { getMoodDisplayProps, getRecommendedMood } from '@/utils/moodMapping'
import { getTimeUntilNextCheckin, formatDate } from '@/utils/dateHelpers'

/**
 * Hook for managing mood tracking and statistic
 */
export function useMoodTracking() {
  const {
    todaysMood,
    moodHistory,
    isLoading,
    error,
    streakCount,
    lastCheckin,
    loadMoodHistory,
    addMoodEntry,
    updateTodaysMood,
    canCheckinToday,
    getTodaysMood,
    getRecentMoods,
    getMoodStats,
    getStreakInfo,
    setError,
    clearMoodHistory,
  } = useMoodStore()

  // Memoized mood statistic
  const moodStats: MoodStats = useMemo(() => getMoodStats(), [getMoodStats])

  // Get time until next check-in
  const timeUntilNextCheckin = useMemo(() => {
    return getTimeUntilNextCheckin(lastCheckin)
  }, [lastCheckin])

  // Get recent mood trend
  const recentTrend = useMemo((): readonly MoodEntry[] => {
    const recent = getRecentMoods(7) // Last 7 days
    return [...recent].sort(
      (a: MoodEntry, b: MoodEntry) => a.date.getTime() - b.date.getTime()
    )
  }, [getRecentMoods])

  // Get mood recommendation based on patterns
  const moodRecommendation = useMemo(() => {
    return getRecommendedMood(recentTrend)
  }, [recentTrend])

  // Check in with mood today
  const checkInToday = useCallback(
    async (
      mood: MoodType,
      intensity: MoodIntensity,
      note?: string
    ): Promise<MoodEntry | null> => {
      try {
        setError(null)

        if (!canCheckinToday()) {
          setError('You have already checked in today')
          return null
        }

        const entry = await addMoodEntry(mood, intensity, note)
        return entry
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Failed to check in'
        setError(errorMessage)
        return null
      }
    },
    [addMoodEntry, canCheckinToday, setError]
  )

  // Update today's mood if already checked in
  const updateTodaysMoodEntry = useCallback(
    async (
      mood: MoodType,
      intensity: MoodIntensity,
      note?: string
    ): Promise<MoodEntry | null> => {
      try {
        setError(null)
        const entry = await updateTodaysMood(mood, intensity, note)
        return entry
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Failed to update mood'
        setError(errorMessage)
        return null
      }
    },
    [updateTodaysMood, setError]
  )

  // Get mood display properties
  const getMoodDisplay = useCallback((mood: MoodType) => {
    return getMoodDisplayProps(mood)
  }, [])

  // Get mood history for a specific period
  const getMoodHistoryForPeriod = useCallback(
    (period: 'week' | 'month' | 'year'): readonly MoodEntry[] => {
      const now = new Date()
      let cutoffDate: Date

      switch (period) {
        case 'week':
          cutoffDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
          break
        case 'month':
          cutoffDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
          break
        case 'year':
          cutoffDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)
          break
        default:
          cutoffDate = new Date(0)
      }

      return moodHistory.filter(entry => entry.date >= cutoffDate)
    },
    [moodHistory]
  )

  // Get mood frequency for a specific mood
  const getMoodFrequency = useCallback(
    (mood: MoodType, period: 'week' | 'month' | 'year' = 'month'): number => {
      const periodHistory = getMoodHistoryForPeriod(period)
      const moodCount = periodHistory.filter(
        entry => entry.mood === mood
      ).length
      return periodHistory.length > 0
        ? (moodCount / periodHistory.length) * 100
        : 0
    },
    [getMoodHistoryForPeriod]
  )

  // Check if user has checked in consistently
  const getConsistencyScore = useCallback((): number => {
    const last30Days = getMoodHistoryForPeriod('month')
    const expectedDays = Math.min(
      30,
      Math.floor(
        (new Date().getTime() -
          (moodHistory[moodHistory.length - 1]?.date.getTime() ??
            new Date().getTime())) /
          (24 * 60 * 60 * 1000)
      ) + 1
    )

    if (expectedDays === 0) return 0
    return Math.round((last30Days.length / expectedDays) * 100)
  }, [getMoodHistoryForPeriod, moodHistory])

  // Get formatted mood history for charts
  const getFormattedMoodData = useCallback(() => {
    return moodHistory.map(entry => ({
      date: formatDate(entry.date, 'dd.MM'),
      mood: entry.mood,
      intensity: entry.intensity,
      display: getMoodDisplay(entry.mood),
    }))
  }, [moodHistory, getMoodDisplay])

  // Check if it's a good time to check in (not too late, not too early)
  const isGoodTimeToCheckin = useCallback((): boolean => {
    const now = new Date()
    const hours = now.getHours()

    // Good time is between 6 AM and 11 PM
    return hours >= 6 && hours <= 23
  }, [])

  return {
    // State
    todaysMood,
    moodHistory,
    isLoading,
    error,
    streakCount,
    lastCheckin,

    // Statistics
    moodStats,
    recentTrend,
    moodRecommendation,
    timeUntilNextCheckin,

    // Actions
    loadMoodHistory,
    checkInToday,
    updateTodaysMoodEntry,
    clearMoodHistory,
    setError,

    // Utility functions
    canCheckinToday,
    getTodaysMood,
    getRecentMoods,
    getStreakInfo,
    getMoodDisplay,
    getMoodHistoryForPeriod,
    getMoodFrequency,
    getConsistencyScore,
    getFormattedMoodData,
    isGoodTimeToCheckin,
  }
}
