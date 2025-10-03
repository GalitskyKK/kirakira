import { useMemo } from 'react'
import { motion } from 'framer-motion'
// import { formatDistanceToNow } from 'date-fns'
// import { ru } from 'date-fns/locale'
import { TrendingUp, Calendar, Target, Award } from 'lucide-react'
import { Card } from '@/components/ui'
import { useMoodTracking } from '@/hooks'
import { MOOD_CONFIG } from '@/types/mood'
import type { MoodType, MoodEntry } from '@/types'

interface MoodStatsProps {
  className?: string
}

export function MoodStats({ className }: MoodStatsProps) {
  const { moodStats, streakCount, moodRecommendation, getRecentMoods } =
    useMoodTracking()

  interface ChartDataPoint {
    date: number
    mood: MoodType
    intensity: number
    emoji: string
    color: string
  }

  const chartData = useMemo((): ChartDataPoint[] => {
    const last7Days = getRecentMoods(7)
    return last7Days.map((entry: MoodEntry) => ({
      date: entry.date.getDate(),
      mood: entry.mood,
      intensity: entry.intensity,
      emoji: MOOD_CONFIG[entry.mood].emoji,
      color: MOOD_CONFIG[entry.mood].color,
    }))
  }, [getRecentMoods])

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
            Статистика настроения
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Начните отмечать настроение, чтобы увидеть статистику
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
                  Записей
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
                  Дней подряд
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
                  Текущая серия
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  {moodStats.currentStreak} из {moodStats.longestStreak} дней
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
              Последние дни
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
                    className="flex h-6 w-6 items-center justify-center rounded-full text-xs"
                    style={{ backgroundColor: `${data.color}20` }}
                  >
                    {data.emoji}
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
              Частые настроения
            </h4>
            <div className="space-y-2">
              {topMoods.map(({ mood, percentage, config }, index) => (
                <motion.div
                  key={mood}
                  className="flex items-center justify-between"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <div className="flex items-center space-x-2">
                    <span className="text-lg">{config.emoji}</span>
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      {config.label}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="h-2 w-16 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                      <motion.div
                        className="h-full rounded-full"
                        style={{ backgroundColor: config.color }}
                        initial={{ width: 0 }}
                        animate={{ width: `${percentage}%` }}
                        transition={{ delay: index * 0.1 + 0.3, duration: 0.5 }}
                      />
                    </div>
                    <span className="w-8 text-right text-xs text-gray-600 dark:text-gray-400">
                      {percentage}%
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          </Card>
        )}

        {/* Recommendation */}
        {moodRecommendation && (
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
                  Рекомендация
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  {moodRecommendation}
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
                Средняя интенсивность
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                За все время
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
