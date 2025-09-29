import { motion } from 'framer-motion'
import { User } from '@/types'
import { UserAvatar } from '@/components/ui'
import {
  calculateLevelProgress,
  calculateExperienceFromStats,
} from '@/utils/achievements'
import { useMoodTracking, useGardenState } from '@/hooks'
interface ProfileHeaderProps {
  readonly user: User
}

export function ProfileHeader({ user }: ProfileHeaderProps) {
  const displayName = user.firstName ?? user.username ?? 'Пользователь'
  const username = user.username != null ? `@${user.username}` : null

  // Hooks for calculating level
  const { moodStats } = useMoodTracking()
  const { getElementsCount } = useGardenState()

  // Защита от undefined - создаем fallback значения для moodStats
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

  const totalElements = getElementsCount?.() ?? 0

  // Используем опыт из пользователя если доступен, иначе рассчитываем
  const experience =
    user.experience ??
    calculateExperienceFromStats(user, safeMoodStats, totalElements)

  // Рассчитываем информацию об уровне
  const levelInfo = calculateLevelProgress(experience)

  // Calculate days since registration
  const registrationDate = new Date(user.registrationDate)
  const daysSinceRegistration = Math.floor(
    (Date.now() - registrationDate.getTime()) / (1000 * 60 * 60 * 24)
  )

  return (
    <motion.div
      className="rounded-2xl border border-gray-200 bg-gradient-to-br from-garden-50 to-green-50 p-6 dark:border-gray-700 dark:from-garden-900/30 dark:to-green-900/30"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* Mobile-first responsive layout */}
      <div className="space-y-4">
        {/* Top row: Avatar, Name/Username, Actions */}
        <div className="flex items-start justify-between">
          <div className="flex min-w-0 flex-1 items-start space-x-3">
            {/* Avatar */}
            <div className="flex-shrink-0">
              <UserAvatar
                photoUrl={user.photoUrl}
                name={displayName}
                username={user.username}
                size="lg"
                className="rounded-full shadow-lg ring-4 ring-white dark:ring-gray-800"
              />
            </div>

            {/* Name & Username */}
            <div className="min-w-0 flex-1">
              <h1 className="truncate text-xl font-bold text-gray-900 sm:text-2xl">
                {displayName}
              </h1>
              {username !== null && (
                <p className="truncate text-base text-garden-600 sm:text-lg">
                  {username}
                </p>
              )}
            </div>
          </div>

          {/* Actions - Desktop only, стекаются в колонку на мобилке */}
          <div className="ml-2 flex flex-shrink-0 flex-col space-y-1">
            <button className="whitespace-nowrap rounded-lg bg-white px-3 py-1.5 text-xs font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700">
              ⚙️ Настройки
            </button>
            <button className="whitespace-nowrap rounded-lg bg-garden-500 px-3 py-1.5 text-xs font-medium text-white shadow-sm transition-colors hover:bg-garden-600">
              📤 Поделиться
            </button>
          </div>
        </div>

        {/* Bottom row: Level, Progress, Stats */}
        <div className="space-y-3">
          {/* Level Badge */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex items-center rounded-full bg-gradient-to-r from-yellow-400 to-orange-400 px-3 py-1.5 text-sm font-medium text-white shadow-sm">
              <span className="mr-1.5">{levelInfo.currentLevel.emoji}</span>
              <span className="hidden sm:inline">
                {levelInfo.currentLevel.name}
              </span>
              <span className="sm:hidden">Садовник</span>
              <span className="ml-1.5 rounded-full bg-white/20 px-2 py-0.5 text-xs dark:bg-black/20">
                Ур. {levelInfo.currentLevel.level}
              </span>
            </div>

            {/* Quick Stats */}
            <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
              <span>🗓️</span>
              <span className="ml-1">
                {daysSinceRegistration === 0
                  ? 'Сегодня'
                  : daysSinceRegistration === 1
                    ? '1 день'
                    : `${daysSinceRegistration} дней`}
              </span>
            </div>
          </div>

          {/* Level Progress Bar */}
          {levelInfo.nextLevel && (
            <div className="w-full">
              <div className="mb-1 flex justify-between text-xs text-gray-600 dark:text-gray-400">
                <span>Опыт: {experience}</span>
                <span className="hidden sm:inline">
                  До Ур.{levelInfo.nextLevel.level}:{' '}
                  {levelInfo.experienceToNext}
                </span>
                <span className="sm:hidden">+{levelInfo.experienceToNext}</span>
              </div>
              <div className="h-2 w-full rounded-full bg-gray-200 dark:bg-gray-700">
                <div
                  className="h-2 rounded-full bg-gradient-to-r from-yellow-400 to-orange-400 transition-all duration-500"
                  style={{ width: `${levelInfo.progress}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}
