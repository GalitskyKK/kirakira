import { motion } from 'framer-motion'
import { User, Garden, MoodStats } from '@/types'

interface ProfileStatsProps {
  readonly user: User
  readonly garden: Garden | null
  readonly moodStats: MoodStats
  readonly totalElements: number
}

interface StatCardProps {
  readonly emoji: string
  readonly label: string
  readonly value: string | number
  readonly subtitle?: string
  readonly color?: string
  readonly delay?: number
}

function StatCard({
  emoji,
  label,
  value,
  subtitle,
  color = 'gray',
  delay = 0,
}: StatCardProps) {
  const colorClasses = {
    gray: 'from-gray-50 to-gray-100 dark:from-gray-800/50 dark:to-gray-700/50 text-gray-600 dark:text-gray-400',
    green:
      'from-garden-50 to-green-100 dark:from-garden-900/30 dark:to-green-900/30 text-garden-600 dark:text-garden-400',
    blue: 'from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 text-blue-600 dark:text-blue-400',
    orange:
      'from-orange-50 to-orange-100 dark:from-orange-900/30 dark:to-orange-800/30 text-orange-600 dark:text-orange-400',
    purple:
      'from-purple-50 to-purple-100 dark:from-purple-900/30 dark:to-purple-800/30 text-purple-600 dark:text-purple-400',
    pink: 'from-pink-50 to-pink-100 dark:from-pink-900/30 dark:to-pink-800/30 text-pink-600 dark:text-pink-400',
  }

  return (
    <motion.div
      className={`rounded-lg bg-gradient-to-br ${colorClasses[color as keyof typeof colorClasses]} p-3`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.3 }}
    >
      <div className="text-center">
        <div className="mb-1 text-2xl">{emoji}</div>
        <div className="text-xl font-bold text-gray-900 dark:text-gray-100">
          {value}
        </div>
        <div className="text-xs font-medium">{label}</div>
        {subtitle && (
          <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            {subtitle}
          </div>
        )}
      </div>
    </motion.div>
  )
}

export function ProfileStats({
  user,
  garden: _garden,
  moodStats: _moodStats,
  totalElements,
}: ProfileStatsProps) {
  // Защита от undefined - создаем fallback значения (используется в будущем)
  // const _safeMoodStats = moodStats ?? { ... }

  const safeUserStats = user?.stats ?? {
    currentStreak: 0,
    longestStreak: 0,
    totalDays: 0,
    rareElementsFound: 0,
    gardensShared: 0,
  }

  const currentStreak = safeUserStats.currentStreak
  const totalDays = safeUserStats.totalDays
  const rareElements = safeUserStats.rareElementsFound

  return (
    <motion.div
      className="space-y-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.2 }}
    >
      <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
        📊 Статистика
      </h2>

      {/* Main Stats Grid - минимизированные карточки */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard
          emoji="🔥"
          label="Стрик"
          value={currentStreak}
          subtitle={currentStreak > 0 ? 'дней' : 'начните!'}
          color="orange"
          delay={0.1}
        />

        <StatCard
          emoji="🌱"
          label="Растений"
          value={totalElements}
          subtitle={totalElements > 0 ? 'шт.' : 'вырастите!'}
          color="green"
          delay={0.15}
        />

        <StatCard
          emoji="📅"
          label="Дней"
          value={totalDays}
          subtitle="всего"
          color="blue"
          delay={0.2}
        />

        <StatCard
          emoji="⭐"
          label="Редких"
          value={rareElements}
          subtitle="найдено"
          color="purple"
          delay={0.25}
        />
      </div>
    </motion.div>
  )
}
