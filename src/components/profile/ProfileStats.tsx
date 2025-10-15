import { motion } from 'framer-motion'
import { User, Garden, MoodStats } from '@/types'
import { synchronizeUserLevel } from '@/utils/achievements'

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
      className={`rounded-xl bg-gradient-to-br ${colorClasses[color as keyof typeof colorClasses]} p-4`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.3 }}
    >
      <div className="text-center">
        <div className="mb-2 text-3xl">{emoji}</div>
        <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          {value}
        </div>
        <div className="text-sm font-medium">{label}</div>
        {subtitle != null && subtitle !== '' && (
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
  moodStats,
  totalElements,
}: ProfileStatsProps) {
  // Защита от undefined - создаем fallback значения
  const safeMoodStats = moodStats ?? {
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

  const safeUserStats = user?.stats ?? {
    currentStreak: 0,
    longestStreak: 0,
    totalDays: 0,
    rareElementsFound: 0,
    gardensShared: 0,
  }

  const currentStreak = safeUserStats.currentStreak
  const longestStreak = safeUserStats.longestStreak
  const totalDays = safeUserStats.totalDays
  const rareElements = safeUserStats.rareElementsFound

  // Синхронизируем уровень пользователя с его опытом
  const { levelInfo } = synchronizeUserLevel(user, safeMoodStats, totalElements)

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

      {/* Main Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard
          emoji="🔥"
          label="Текущий стрик"
          value={currentStreak}
          subtitle={currentStreak > 0 ? 'дней подряд' : 'начните сегодня!'}
          color="orange"
          delay={0.1}
        />

        <StatCard
          emoji="🌱"
          label="Растений в саду"
          value={totalElements}
          subtitle={totalElements > 0 ? 'элементов' : 'вырастите первое!'}
          color="green"
          delay={0.15}
        />

        <StatCard
          emoji="📅"
          label="Всего дней"
          value={totalDays}
          subtitle="с момента начала"
          color="blue"
          delay={0.2}
        />

        <StatCard
          emoji="⭐"
          label="Редкие элементы"
          value={rareElements}
          subtitle="найдено"
          color="purple"
          delay={0.25}
        />
      </div>

      {/* Additional Stats */}
      <div className="grid grid-cols-3 gap-2">
        <StatCard
          emoji="🏆"
          label="Лучший стрик"
          value={longestStreak}
          color="pink"
          delay={0.3}
        />

        <StatCard
          emoji="💭"
          label="Настроений"
          value={safeMoodStats.totalEntries}
          color="blue"
          delay={0.35}
        />

        <StatCard
          emoji="📤"
          label="Поделился"
          value={safeUserStats.gardensShared}
          color="green"
          delay={0.4}
        />
      </div>

      {/* Progress to next level (real data) */}
      <motion.div
        className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.45 }}
      >
        <div className="mb-3 flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            🎯 Прогресс до следующего уровня
          </span>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {levelInfo.nextLevel
              ? `${levelInfo.progress.toFixed(1)}%`
              : 'Макс. уровень!'}
          </span>
        </div>

        <div className="mb-2 h-3 w-full rounded-full bg-gray-200 dark:bg-gray-700">
          <div
            className="h-3 rounded-full bg-gradient-to-r from-garden-400 to-green-500 transition-all duration-500"
            style={{ width: `${levelInfo.progress}%` }}
          />
        </div>

        <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
          <span className="flex items-center">
            <span className="mr-1">{levelInfo.currentLevel.emoji}</span>
            {levelInfo.currentLevel.name}
          </span>
          {levelInfo.nextLevel ? (
            <span className="flex items-center">
              <span className="mr-1">{levelInfo.nextLevel.emoji}</span>
              {levelInfo.nextLevel.name}
            </span>
          ) : (
            <span>🌈 Максимум</span>
          )}
        </div>

        {levelInfo.nextLevel && (
          <div className="mt-2 text-center text-xs text-gray-400 dark:text-gray-500">
            Ещё {levelInfo.experienceToNext} опыта до повышения
          </div>
        )}
      </motion.div>
    </motion.div>
  )
}
