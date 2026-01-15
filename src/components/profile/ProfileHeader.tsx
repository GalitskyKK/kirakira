import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Settings, BarChart3, Trophy } from 'lucide-react'
import { User } from '@/types'
import { UserAvatar } from '@/components/ui'
import {
  calculateLevelProgress,
  calculateExperienceFromStats,
} from '@/utils/achievements'
import { useGardenState, useMoodTracking } from '@/hooks/index.v2'
import { useTranslation } from '@/hooks/useTranslation'

/**
 * Получает классы цветов градиента в зависимости от уровня
 */
function getLevelGradientClasses(level: number): string {
  const gradients: Record<number, string> = {
    1: 'from-green-400 to-emerald-500', // Новичок - свежий зеленый
    2: 'from-yellow-400 to-orange-400', // Любитель - теплый желто-оранжевый
    3: 'from-blue-400 to-cyan-500', // Садовник - спокойный сине-голубой
    4: 'from-purple-400 to-pink-500', // Эксперт - элегантный фиолетово-розовый
    5: 'from-orange-500 to-red-500', // Мастер - мощный оранжево-красный
    6: 'from-pink-500 to-purple-600', // Гуру - величественный розово-фиолетовый
  }

  return gradients[level] ?? 'from-gray-400 to-gray-500' // fallback
}
interface ProfileHeaderProps {
  readonly user: User
  readonly stats?:
    | {
        totalDays?: number
        currentStreak?: number
        longestStreak?: number
        totalElements?: number
        rareElementsFound?: number
        gardensShared?: number
        experience?: number
        level?: number
        totalMoodEntries?: number
      }
    | undefined
  readonly leaderboardPosition?: {
    readonly position: number | null
    readonly isLoading: boolean
  }
}

export function ProfileHeader({
  user,
  leaderboardPosition,
}: ProfileHeaderProps) {
  const navigate = useNavigate()
  const t = useTranslation()
  const displayName = user.firstName ?? user.username ?? t.profile.user
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

  const leaderboardLabel = (() => {
    if (leaderboardPosition?.isLoading) {
      return `${t.profile.rating}...`
    }
    if (leaderboardPosition?.position != null) {
      return `${t.profile.rating} #${leaderboardPosition.position}`
    }
    return t.profile.outsideTop
  })()

  return (
    <motion.div
      className="glass-card rounded-3xl border border-neutral-200/50 p-6 dark:border-neutral-700/50"
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
              <h1 className="truncate text-xl font-bold text-gray-900 dark:text-gray-100 sm:text-2xl">
                {displayName}
              </h1>
              {username !== null && (
                <p className="truncate text-base text-garden-600 dark:text-garden-100 sm:text-lg">
                  {username}
                </p>
              )}
            </div>
          </div>

          {/* Actions - кнопки настроек и статистики */}
          <div className="ml-2 flex flex-shrink-0 space-x-2">
            <button
              onClick={() => navigate('/leaderboard')}
              className="flex items-center justify-center rounded-lg bg-white p-2 text-gray-600 shadow-sm transition-colors hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
              title={t.profile.rating}
            >
              <Trophy className="h-4 w-4" />
            </button>
            <button
              onClick={() => navigate('/mobile/stats')}
              className="flex items-center justify-center rounded-lg bg-white p-2 text-gray-600 shadow-sm transition-colors hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
              title={t.profile.statistics}
            >
              <BarChart3 className="h-4 w-4" />
            </button>
            <button
              onClick={() => navigate('/mobile/settings')}
              className="flex items-center justify-center rounded-lg bg-white p-2 text-gray-600 shadow-sm transition-colors hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
              title={t.settings.title}
            >
              <Settings className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Bottom row: Level, Progress, Stats */}
        <div className="space-y-3">
          {/* Level Badge */}
          <div className="flex flex-wrap items-center gap-2">
            <div
              className={`inline-flex items-center rounded-full bg-gradient-to-r ${getLevelGradientClasses(levelInfo.currentLevel.level)} px-3 py-1.5 text-sm font-medium text-white shadow-sm`}
            >
              <span className="mr-1.5">{levelInfo.currentLevel.emoji}</span>
              <span className="hidden sm:inline">
                {levelInfo.currentLevel.name}
              </span>
              <span className="sm:hidden">{levelInfo.currentLevel.name}</span>
              <span className="ml-1.5 rounded-full bg-white/20 px-2 py-0.5 text-xs dark:bg-black/20">
                {t.profile.levelShort} {levelInfo.currentLevel.level}
              </span>
            </div>
            <div className="inline-flex items-center rounded-full border border-garden-200/70 bg-white/80 px-3 py-1 text-xs font-semibold text-garden-600 shadow-sm backdrop-blur dark:border-garden-400/30 dark:bg-garden-900/40 dark:text-garden-100">
              <Trophy className="mr-1 h-3.5 w-3.5" />
              <span>{leaderboardLabel}</span>
            </div>
          </div>

          {/* Level Progress Bar */}
          {levelInfo.nextLevel && (
            <div className="w-full">
              <div className="mb-1 flex justify-between text-xs text-gray-600 dark:text-gray-400">
                <span>
                  {t.profile.experience}: {experience}
                </span>
                <span className="hidden sm:inline">
                  {t.profile.toLevel}
                  {levelInfo.nextLevel.level}: {levelInfo.experienceToNext}
                </span>
                <span className="sm:hidden">+{levelInfo.experienceToNext}</span>
              </div>
              <div className="h-2 w-full rounded-full bg-gray-200 dark:bg-gray-700">
                <div
                  className={`h-2 rounded-full bg-gradient-to-r ${getLevelGradientClasses(levelInfo.currentLevel.level)} transition-all duration-500`}
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
