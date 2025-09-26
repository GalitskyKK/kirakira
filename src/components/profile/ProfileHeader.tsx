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
  const displayName = user.firstName || user.username || 'Пользователь'
  const username = user.username ? `@${user.username}` : null

  // Hooks for calculating level
  const { moodStats } = useMoodTracking()
  const { getElementsCount } = useGardenState()

  // Защита от undefined - создаем fallback значения для moodStats
  const safeMoodStats = moodStats || {
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

  // Calculate user level and experience
  const totalElements = getElementsCount ? getElementsCount() : 0
  const experience = calculateExperienceFromStats(
    user,
    safeMoodStats,
    totalElements
  )
  const levelInfo = calculateLevelProgress(experience)

  // Calculate days since registration
  const registrationDate = user?.registrationDate
    ? new Date(user.registrationDate)
    : new Date()
  const daysSinceRegistration = Math.floor(
    (Date.now() - registrationDate.getTime()) / (1000 * 60 * 60 * 24)
  )

  return (
    <motion.div
      className="rounded-2xl border border-gray-200 bg-gradient-to-br from-garden-50 to-green-50 p-6"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-start space-x-4">
        {/* Avatar */}
        <div className="flex-shrink-0">
          <UserAvatar
            photoUrl={user.photoUrl}
            name={displayName}
            username={user.username}
            size="xl"
            className="shadow-lg ring-4 ring-white"
          />
        </div>

        {/* User Info */}
        <div className="flex-1 space-y-2">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{displayName}</h1>
            {username && <p className="text-lg text-garden-600">{username}</p>}
          </div>

          {/* Level Badge with real data */}
          <div className="space-y-2">
            <div className="inline-flex items-center rounded-full bg-gradient-to-r from-yellow-400 to-orange-400 px-4 py-2 text-sm font-medium text-white shadow-sm">
              <span className="mr-2">{levelInfo.currentLevel.emoji}</span>
              <span>{levelInfo.currentLevel.name}</span>
              <span className="ml-2 rounded-full bg-white/20 px-2 py-0.5 text-xs">
                Ур. {levelInfo.currentLevel.level}
              </span>
            </div>

            {/* Level Progress Bar */}
            {levelInfo.nextLevel && (
              <div className="w-full">
                <div className="mb-1 flex justify-between text-xs text-gray-600">
                  <span>Опыт: {experience}</span>
                  <span>
                    До Ур.{levelInfo.nextLevel.level}:{' '}
                    {levelInfo.experienceToNext}
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-gray-200">
                  <div
                    className="h-2 rounded-full bg-gradient-to-r from-yellow-400 to-orange-400 transition-all duration-500"
                    style={{ width: `${levelInfo.progress}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Quick Stats */}
          <div className="flex items-center space-x-4 text-sm text-gray-600">
            <div className="flex items-center space-x-1">
              <span>🗓️</span>
              <span>
                {daysSinceRegistration === 0
                  ? 'Сегодня присоединился'
                  : daysSinceRegistration === 1
                    ? '1 день с нами'
                    : `${daysSinceRegistration} дней с нами`}
              </span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col space-y-2">
          <button className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50">
            ⚙️ Настройки
          </button>
          <button className="rounded-lg bg-garden-500 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-garden-600">
            📤 Поделиться
          </button>
        </div>
      </div>
    </motion.div>
  )
}
