import type { MoodType, MoodEntry, MoodStats } from '@/types'
import { MOOD_CONFIG } from '@/types/mood'
import {
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  isWithinInterval,
  differenceInDays,
} from 'date-fns'

/**
 * Maps mood to visual properties for UI display
 */
export function getMoodDisplayProps(mood: MoodType): {
  color: string
  emoji: string
  label: string
  description: string
  gradientFrom: string
  gradientTo: string
} {
  const config = MOOD_CONFIG[mood]

  // Generate gradient colors based on mood
  const gradients: Record<MoodType, { from: string; to: string }> = {
    joy: { from: '#fbbf24', to: '#f59e0b' },
    calm: { from: '#06b6d4', to: '#0891b2' },
    stress: { from: '#ef4444', to: '#dc2626' },
    sadness: { from: '#3b82f6', to: '#2563eb' },
    anger: { from: '#dc2626', to: '#b91c1c' },
    anxiety: { from: '#8b5cf6', to: '#7c3aed' },
  }

  const gradient = gradients[mood]

  return {
    color: config.color,
    emoji: config.emoji,
    label: config.label,
    description: config.description,
    gradientFrom: gradient.from,
    gradientTo: gradient.to,
  }
}

/**
 * Calculates mood statistics from mood history
 */
export function calculateMoodStats(
  moodHistory: readonly MoodEntry[]
): MoodStats {
  if (moodHistory.length === 0) {
    return {
      totalEntries: 0,
      currentStreak: 0,
      longestStreak: 0,
      mostFrequentMood: null,
      averageIntensity: 0,
      moodDistribution: {
        joy: 0,
        calm: 0,
        stress: 0,
        sadness: 0,
        anger: 0,
        anxiety: 0,
      },
      weeklyTrend: [],
      monthlyTrend: [],
    }
  }

  // Sort by date (newest first)
  const sortedHistory = [...moodHistory].sort(
    (a, b) => b.date.getTime() - a.date.getTime()
  )

  // Calculate streaks
  const { currentStreak, longestStreak } = calculateMoodStreaks(sortedHistory)

  // Calculate mood distribution
  const moodDistribution = calculateMoodDistribution(moodHistory)

  // Find most frequent mood
  const mostFrequentMood = findMostFrequentMood(moodDistribution)

  // Calculate average intensity
  const averageIntensity = calculateAverageIntensity(moodHistory)

  // Get trends
  const weeklyTrend = getWeeklyTrend(sortedHistory)
  const monthlyTrend = getMonthlyTrend(sortedHistory)

  return {
    totalEntries: moodHistory.length,
    currentStreak,
    longestStreak,
    mostFrequentMood,
    averageIntensity,
    moodDistribution,
    weeklyTrend,
    monthlyTrend,
  }
}

/**
 * Calculates current and longest streak
 */
function calculateMoodStreaks(sortedHistory: readonly MoodEntry[]): {
  currentStreak: number
  longestStreak: number
} {
  if (sortedHistory.length === 0) {
    return { currentStreak: 0, longestStreak: 0 }
  }

  let currentStreak = 0
  let longestStreak = 0
  let tempStreak = 1

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const lastEntry = sortedHistory[0]!
  const lastEntryDate = new Date(lastEntry.date)
  lastEntryDate.setHours(0, 0, 0, 0)

  // Check if streak is active (last entry was today or yesterday)
  // Убеждаемся, что lastEntryDate это Date объект
  const lastEntryDateObj =
    lastEntryDate instanceof Date ? lastEntryDate : new Date(lastEntryDate)
  const daysSinceLastEntry = differenceInDays(today, lastEntryDateObj)

  if (daysSinceLastEntry <= 1) {
    currentStreak = 1

    // Count consecutive days
    for (let i = 1; i < sortedHistory.length; i++) {
      const currentEntryDate = sortedHistory[i - 1]!.date
      const prevEntryDate = sortedHistory[i]!.date

      const currentDate =
        currentEntryDate instanceof Date
          ? currentEntryDate
          : new Date(currentEntryDate)
      const prevDate =
        prevEntryDate instanceof Date ? prevEntryDate : new Date(prevEntryDate)

      currentDate.setHours(0, 0, 0, 0)
      prevDate.setHours(0, 0, 0, 0)

      const dayDiff = differenceInDays(currentDate, prevDate)

      if (dayDiff === 1) {
        currentStreak++
      } else {
        break
      }
    }
  }

  // Calculate longest streak
  tempStreak = 1
  for (let i = 1; i < sortedHistory.length; i++) {
    const currentEntryDate = sortedHistory[i - 1]!.date
    const prevEntryDate = sortedHistory[i]!.date

    const currentDate =
      currentEntryDate instanceof Date
        ? currentEntryDate
        : new Date(currentEntryDate)
    const prevDate =
      prevEntryDate instanceof Date ? prevEntryDate : new Date(prevEntryDate)

    currentDate.setHours(0, 0, 0, 0)
    prevDate.setHours(0, 0, 0, 0)

    const dayDiff = differenceInDays(currentDate, prevDate)

    if (dayDiff === 1) {
      tempStreak++
      longestStreak = Math.max(longestStreak, tempStreak)
    } else {
      tempStreak = 1
    }
  }

  longestStreak = Math.max(longestStreak, tempStreak)

  return { currentStreak, longestStreak }
}

/**
 * Calculates mood distribution percentages
 */
function calculateMoodDistribution(
  moodHistory: readonly MoodEntry[]
): Record<MoodType, number> {
  const counts: Record<MoodType, number> = {
    joy: 0,
    calm: 0,
    stress: 0,
    sadness: 0,
    anger: 0,
    anxiety: 0,
  }

  // Count occurrences
  moodHistory.forEach(entry => {
    counts[entry.mood]++
  })

  // Convert to percentages
  const total = moodHistory.length
  const distribution: Record<MoodType, number> = {
    joy: Math.round((counts.joy / total) * 100),
    calm: Math.round((counts.calm / total) * 100),
    stress: Math.round((counts.stress / total) * 100),
    sadness: Math.round((counts.sadness / total) * 100),
    anger: Math.round((counts.anger / total) * 100),
    anxiety: Math.round((counts.anxiety / total) * 100),
  }

  return distribution
}

/**
 * Finds the most frequent mood
 */
function findMostFrequentMood(
  distribution: Record<MoodType, number>
): MoodType | null {
  let maxPercentage = 0
  let mostFrequent: MoodType | null = null

  Object.entries(distribution).forEach(([mood, percentage]) => {
    if (percentage > maxPercentage) {
      maxPercentage = percentage
      mostFrequent = mood as MoodType
    }
  })

  return mostFrequent
}

/**
 * Calculates average mood intensity
 */
function calculateAverageIntensity(moodHistory: readonly MoodEntry[]): number {
  if (moodHistory.length === 0) return 0

  const totalIntensity = moodHistory.reduce(
    (sum, entry) => sum + entry.intensity,
    0
  )

  return Math.round((totalIntensity / moodHistory.length) * 10) / 10
}

/**
 * Gets mood entries for current week
 */
function getWeeklyTrend(
  sortedHistory: readonly MoodEntry[]
): readonly MoodEntry[] {
  const now = new Date()
  const weekStart = startOfWeek(now, { weekStartsOn: 1 }) // Monday
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 })

  return sortedHistory.filter(entry =>
    isWithinInterval(entry.date, { start: weekStart, end: weekEnd })
  )
}

/**
 * Gets mood entries for current month
 */
function getMonthlyTrend(
  sortedHistory: readonly MoodEntry[]
): readonly MoodEntry[] {
  const now = new Date()
  const monthStart = startOfMonth(now)
  const monthEnd = endOfMonth(now)

  return sortedHistory.filter(entry =>
    isWithinInterval(entry.date, { start: monthStart, end: monthEnd })
  )
}

/**
 * Gets mood color based on intensity
 */
export function getMoodColorWithIntensity(
  mood: MoodType,
  intensity: number
): string {
  const baseColor = MOOD_CONFIG[mood].color

  // Adjust opacity based on intensity (1 = 0.4, 2 = 0.7, 3 = 1.0)
  const opacity = 0.1 + intensity * 0.3

  // Convert hex to rgba
  const hex = baseColor.replace('#', '')
  const r = parseInt(hex.substr(0, 2), 16)
  const g = parseInt(hex.substr(2, 2), 16)
  const b = parseInt(hex.substr(4, 2), 16)

  return `rgba(${r}, ${g}, ${b}, ${opacity})`
}

/**
 * Gets recommended mood based on recent patterns
 */
export function getRecommendedMood(recentHistory: readonly MoodEntry[]): {
  mood: MoodType | null
  confidence: number
  reason: string
} {
  return getRecommendedMoodWithOptions(recentHistory)
}

interface RecommendedMoodOptions {
  readonly reasonPrefix?: string
  readonly noDataReason?: string
  readonly noPatternReason?: string
  readonly getMoodLabel?: (mood: MoodType) => string
}

export function getRecommendedMoodWithOptions(
  recentHistory: readonly MoodEntry[],
  options: RecommendedMoodOptions = {}
): {
  mood: MoodType | null
  confidence: number
  reason: string
} {
  const {
    reasonPrefix = 'Чаще всего за последние дни',
    noDataReason = 'Недостаточно данных для рекомендации',
    noPatternReason = 'Не удалось определить паттерн',
    getMoodLabel = mood => MOOD_CONFIG[mood].label,
  } = options

  if (recentHistory.length === 0) {
    return {
      mood: null,
      confidence: 0,
      reason: noDataReason,
    }
  }

  // Get last 7 days
  const recent = recentHistory.slice(0, 7)
  const distribution = calculateMoodDistribution(recent)

  // Find most common mood
  const mostCommon = findMostFrequentMood(distribution)

  if (mostCommon === null) {
    return {
      mood: null,
      confidence: 0,
      reason: noPatternReason,
    }
  }

  const confidence = distribution[mostCommon]

  return {
    mood: mostCommon,
    confidence,
    reason: `${reasonPrefix}: ${getMoodLabel(mostCommon)}`,
  }
}

/**
 * Calculates the dominant (most frequent) mood from the last 7 days
 * Used to determine companion's default appearance when no mood is logged today
 */
export function getDominantMoodFromLastWeek(
  moodHistory: readonly MoodEntry[]
): MoodType | null {
  if (moodHistory.length === 0) {
    return null
  }

  // Get entries from the last 7 days
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
  sevenDaysAgo.setHours(0, 0, 0, 0)

  const recentEntries = moodHistory.filter(entry => {
    const entryDate = entry.date instanceof Date ? entry.date : new Date(entry.date)
    return entryDate >= sevenDaysAgo
  })

  if (recentEntries.length === 0) {
    return null
  }

  // Count mood occurrences
  const moodCounts: Record<MoodType, number> = {
    joy: 0,
    calm: 0,
    stress: 0,
    sadness: 0,
    anger: 0,
    anxiety: 0,
  }

  recentEntries.forEach(entry => {
    moodCounts[entry.mood]++
  })

  // Find the most frequent mood
  let dominantMood: MoodType | null = null
  let maxCount = 0

  Object.entries(moodCounts).forEach(([mood, count]) => {
    if (count > maxCount) {
      maxCount = count
      dominantMood = mood as MoodType
    }
  })

  return dominantMood
}