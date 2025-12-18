import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { TrendingUp, Calendar, Target, Award } from 'lucide-react'
import { Card } from '@/components/ui'
import { useMoodTracking } from '@/hooks/index.v2'
import { MOOD_CONFIG } from '@/types/mood'
import { MoodImage } from './MoodImage'
import { useTranslation } from '@/hooks/useTranslation'
import { getLocalizedMoodConfig } from '@/utils/moodLocalization'
import type { MoodType, MoodEntry } from '@/types'

interface MoodStatsProps {
  className?: string
}

export function MoodStats({ className }: MoodStatsProps) {
  const t = useTranslation()
  const { moodStats, streakCount, recentTrend, moodRecommendation } =
    useMoodTracking()

  interface ChartDataPoint {
    date: number
    mood: MoodType
    intensity: number
    emoji: string
    color: string
  }

  const chartData = useMemo((): ChartDataPoint[] => {
    const last7Days = recentTrend.slice(0, 7).reverse()
    return last7Days
      .filter((entry: MoodEntry) => entry.mood && entry.mood in MOOD_CONFIG)
      .map((entry: MoodEntry) => ({
        date: entry.date.getDate(),
        mood: entry.mood,
        intensity: entry.intensity,
        emoji: MOOD_CONFIG[entry.mood].emoji,
        color: MOOD_CONFIG[entry.mood].color,
      }))
  }, [recentTrend])

  const topMoods = useMemo(() => {
    return Object.entries(moodStats.moodDistribution)
      .filter(([, percentage]) => percentage > 0)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([mood, percentage]) => ({
        mood: mood as MoodType,
        percentage,
        config: MOOD_CONFIG[mood as MoodType],
      }))
  }, [moodStats.moodDistribution])

  if (moodStats.totalEntries === 0) {
    return (
      <Card className={className} padding="lg">
        <div className="text-center">
          <div className="mb-3 text-4xl">📊</div>
          <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-gray-100">
            {t.moodStats.title}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {t.moodStats.startMarking}
          </p>
        </div>
      </Card>
    )
  }

  return (
    <div className={className}>
      <div className="space-y-4">
        {/* Overview Stats */}
        <div className="grid grid-cols-2 gap-4">
          <Card padding="sm">
            <div className="flex items-center space-x-3">
              <div className="rounded-lg bg-blue-100 p-2 dark:bg-blue-900/50">
                <Calendar
                  size={16}
                  className="text-blue-600 dark:text-blue-400"
                />
              </div>
              <div>
                <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {moodStats.totalEntries}
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  {t.moodStats.entries}
                </p>
              </div>
            </div>
          </Card>

          <Card padding="sm">
            <div className="flex items-center space-x-3">
              <div className="rounded-lg bg-orange-100 p-2 dark:bg-orange-900/50">
                <Target
                  size={16}
                  className="text-orange-600 dark:text-orange-400"
                />
              </div>
              <div>
                <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {streakCount}
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  {t.moodStats.daysInRow}
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Streak Info */}
        <Card padding="sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="rounded-lg bg-green-100 p-2 dark:bg-green-900/50">
                <Award
                  size={16}
                  className="text-green-600 dark:text-green-400"
                />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {t.moodStats.currentSeries}
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  {moodStats.currentStreak} {t.profile.of}{' '}
                  {moodStats.longestStreak} {t.profile.days}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-lg font-semibold text-green-600">
                {moodStats.currentStreak}
              </p>
            </div>
          </div>
        </Card>

        {/* Recent Trend */}
        {chartData.length > 0 && (
          <Card padding="sm">
            <h4 className="mb-3 text-sm font-semibold text-gray-900 dark:text-gray-100">
              {t.moodStats.lastDays}
            </h4>
            <div className="flex items-end justify-between space-x-1">
              {chartData.map((data: ChartDataPoint, index: number) => (
                <motion.div
                  key={`${data.date}-${index}`}
                  className="flex flex-col items-center space-y-1"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <div
                    className="flex h-6 w-6 items-center justify-center rounded-full"
                    style={{ backgroundColor: `${data.color}20` }}
                  >
                    <MoodImage mood={data.mood} size={16} />
                  </div>
                  <div
                    className="w-2 rounded-t"
                    style={{
                      height: `${data.intensity * 12}px`,
                      backgroundColor: data.color,
                    }}
                  />
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {data.date}
                  </span>
                </motion.div>
              ))}
            </div>
          </Card>
        )}

        {/* Top Moods */}
        {topMoods.length > 0 && (
          <Card padding="sm">
            <h4 className="mb-3 text-sm font-semibold text-gray-900 dark:text-gray-100">
              {t.moodStats.frequentMoods}
            </h4>
            <div className="space-y-2">
              {topMoods.map(({ mood, percentage, config }, index) => {
                const localizedConfig = getLocalizedMoodConfig(mood, t)
                return (
                  <motion.div
                    key={mood}
                    className="flex items-center justify-between"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <div className="flex items-center space-x-2">
                      <MoodImage mood={mood} size={20} />
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        {localizedConfig.label}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="h-2 w-16 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                        <motion.div
                          className="h-full rounded-full"
                          style={{ backgroundColor: config.color }}
                          initial={{ width: 0 }}
                          animate={{ width: `${percentage}%` }}
                          transition={{
                            delay: index * 0.1 + 0.3,
                            duration: 0.5,
                          }}
                        />
                      </div>
                      <span className="w-8 text-right text-xs text-gray-600 dark:text-gray-400">
                        {percentage}%
                      </span>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          </Card>
        )}

        {/* Recommendation */}
        {moodRecommendation.mood && moodRecommendation.mood in MOOD_CONFIG && (
          <Card padding="sm" variant="glass">
            <div className="flex items-start space-x-3">
              <div className="rounded-lg bg-purple-100 p-2 dark:bg-purple-900/50">
                <TrendingUp
                  size={16}
                  className="text-purple-600 dark:text-purple-400"
                />
              </div>
              <div className="flex-1">
                <p className="mb-1 text-sm font-medium text-gray-900 dark:text-gray-100">
                  {t.moodStats.moodPattern}
                </p>
                <div className="mb-2 flex items-center space-x-2">
                  <MoodImage mood={moodRecommendation.mood} size={20} />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    {getLocalizedMoodConfig(moodRecommendation.mood, t).label}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    ({moodRecommendation.confidence}%)
                  </span>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  {moodRecommendation.reason}
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* Average Intensity */}
        <Card padding="sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                {t.moodStats.averageIntensity}
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                {t.moodStats.allTime}
              </p>
            </div>
            <div className="flex items-center space-x-1">
              {Array.from({ length: 3 }, (_, i) => (
                <div
                  key={i}
                  className={clsx(
                    'h-2 w-2 rounded-full',
                    i < Math.round(moodStats.averageIntensity)
                      ? 'bg-garden-500'
                      : 'bg-gray-300 dark:bg-gray-600'
                  )}
                />
              ))}
              <span className="ml-2 text-sm font-semibold text-gray-900 dark:text-gray-100">
                {moodStats.averageIntensity.toFixed(1)}
              </span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}

function clsx(...classes: (string | undefined | false)[]): string {
  return classes.filter(Boolean).join(' ')
}
