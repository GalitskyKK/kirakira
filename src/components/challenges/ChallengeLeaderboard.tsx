/**
 * Компонент лидерборда челленджа с реальными данными
 */

import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { Crown, Trophy, Medal, User, TrendingUp } from 'lucide-react'
import { Card } from '@/components/ui'
import type { ChallengeLeaderboardEntry, Challenge } from '@/types/challenges'

interface ChallengeLeaderboardProps {
  readonly challenge: Challenge
  readonly leaderboard: readonly ChallengeLeaderboardEntry[]
  readonly currentUserTelegramId: number
  readonly isLoading?: boolean
}

export function ChallengeLeaderboard({
  challenge,
  leaderboard,
  currentUserTelegramId,
  isLoading = false,
}: ChallengeLeaderboardProps) {
  // Мемоизированные данные для оптимизации
  const leaderboardData = useMemo(() => {
    if (!leaderboard.length)
      return { top3: [], others: [], currentUserEntry: null }

    const sortedLeaderboard = [...leaderboard].sort((a, b) => a.rank - b.rank)
    const top3 = sortedLeaderboard.slice(0, 3)
    const others = sortedLeaderboard.slice(3)
    const currentUserEntry =
      sortedLeaderboard.find(
        entry => entry.user.telegramId === currentUserTelegramId
      ) || null

    return { top3, others, currentUserEntry }
  }, [leaderboard, currentUserTelegramId])

  const { top3, others, currentUserEntry } = leaderboardData

  // Функция для получения иконки места
  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="h-5 w-5 text-yellow-500" />
      case 2:
        return <Trophy className="h-5 w-5 text-gray-400" />
      case 3:
        return <Medal className="h-5 w-5 text-amber-600" />
      default:
        return (
          <span className="text-sm font-medium text-gray-500">#{rank}</span>
        )
    }
  }

  // Функция для получения цвета фона места
  const getRankBgColor = (rank: number) => {
    switch (rank) {
      case 1:
        return 'bg-gradient-to-r from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20'
      case 2:
        return 'bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800/20 dark:to-gray-700/20'
      case 3:
        return 'bg-gradient-to-r from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/20'
      default:
        return 'bg-white dark:bg-gray-800'
    }
  }

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="space-y-4">
          <div className="h-6 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center space-x-3">
              <div className="h-10 w-10 animate-pulse rounded-full bg-gray-200 dark:bg-gray-700" />
              <div className="flex-1 space-y-2">
                <div className="h-4 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
                <div className="h-3 w-2/3 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
              </div>
              <div className="h-8 w-16 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
            </div>
          ))}
        </div>
      </Card>
    )
  }

  if (!leaderboard.length) {
    return (
      <Card className="p-6 text-center">
        <div className="flex flex-col items-center space-y-3">
          <TrendingUp className="h-12 w-12 text-gray-400" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
            Пока нет участников
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Станьте первым, кто присоединится к челленджу!
          </p>
        </div>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Заголовок */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          🏆 Лидерборд
        </h3>
        <div className="text-right">
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {leaderboard.length} участник
            {leaderboard.length === 1
              ? ''
              : leaderboard.length < 5
                ? 'а'
                : 'ов'}
          </span>
          {challenge.type === 'cooperative' &&
            leaderboard.length > 0 &&
            leaderboard[0]?.teamProgress !== undefined && (
              <div className="text-xs text-gray-400 dark:text-gray-500">
                Команда: {leaderboard[0].teamProgress} /{' '}
                {challenge.requirements.targetValue}
              </div>
            )}
        </div>
      </div>

      {/* Топ 3 */}
      {top3.length > 0 && (
        <Card className="p-4">
          <h4 className="mb-3 text-sm font-medium text-gray-700 dark:text-gray-300">
            🌟 Топ 3
          </h4>
          <div className="space-y-3">
            {top3.map((entry, index) => (
              <motion.div
                key={entry.user.telegramId}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`
                  flex items-center space-x-4 rounded-lg p-3
                  ${getRankBgColor(entry.rank)}
                  ${entry.isCurrentUser ? 'ring-2 ring-garden-500 ring-opacity-50' : ''}
                `}
              >
                {/* Место */}
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center">
                  {getRankIcon(entry.rank)}
                </div>

                {/* Аватар */}
                <div className="flex-shrink-0">
                  {entry.user.photoUrl ? (
                    <img
                      src={entry.user.photoUrl}
                      alt={entry.user.firstName}
                      className="h-10 w-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-garden-100 dark:bg-garden-800">
                      <User className="h-5 w-5 text-garden-600 dark:text-garden-400" />
                    </div>
                  )}
                </div>

                {/* Информация пользователя */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center space-x-2">
                    <p className="truncate text-sm font-medium text-gray-900 dark:text-gray-100">
                      {entry.user.firstName}
                      {entry.user.lastName && ` ${entry.user.lastName}`}
                    </p>
                    {entry.isCurrentUser && (
                      <span className="rounded-full bg-garden-100 px-2 py-1 text-xs text-garden-800 dark:bg-garden-800 dark:text-garden-200">
                        Вы
                      </span>
                    )}
                  </div>
                  {entry.user.username && (
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      @{entry.user.username}
                    </p>
                  )}
                </div>

                {/* Прогресс */}
                <div className="flex-shrink-0 text-right">
                  <div className="text-lg font-bold text-gray-900 dark:text-gray-100">
                    {entry.progress}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {challenge.type === 'cooperative' &&
                    entry.personalContributionPercentage !== undefined
                      ? `${Math.round(entry.personalContributionPercentage)}% в команде`
                      : `${Math.round(entry.progressPercentage)}%`}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </Card>
      )}

      {/* Остальные участники */}
      {others.length > 0 && (
        <Card className="p-4">
          <h4 className="mb-3 text-sm font-medium text-gray-700 dark:text-gray-300">
            📋 Остальные участники
          </h4>
          <div className="space-y-2">
            {others.map((entry, index) => (
              <motion.div
                key={entry.user.telegramId}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: (index + 3) * 0.05 }}
                className={`
                  flex items-center space-x-3 rounded-lg p-2 transition-colors hover:bg-gray-50 dark:hover:bg-gray-700
                  ${entry.isCurrentUser ? 'bg-garden-50 ring-1 ring-garden-200 dark:bg-garden-900/20 dark:ring-garden-700' : ''}
                `}
              >
                {/* Место */}
                <div className="w-8 flex-shrink-0 text-center">
                  <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    #{entry.rank}
                  </span>
                </div>

                {/* Аватар */}
                <div className="flex-shrink-0">
                  {entry.user.photoUrl ? (
                    <img
                      src={entry.user.photoUrl}
                      alt={entry.user.firstName}
                      className="h-8 w-8 rounded-full object-cover"
                    />
                  ) : (
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700">
                      <User className="h-4 w-4 text-gray-500" />
                    </div>
                  )}
                </div>

                {/* Информация пользователя */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center space-x-2">
                    <p className="truncate text-sm text-gray-900 dark:text-gray-100">
                      {entry.user.firstName}
                      {entry.user.lastName &&
                        ` ${entry.user.lastName.charAt(0)}.`}
                    </p>
                    {entry.isCurrentUser && (
                      <span className="rounded bg-garden-100 px-1.5 py-0.5 text-xs text-garden-800 dark:bg-garden-800 dark:text-garden-200">
                        Вы
                      </span>
                    )}
                  </div>
                </div>

                {/* Прогресс */}
                <div className="flex-shrink-0 text-right">
                  <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {entry.progress}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {challenge.type === 'cooperative' &&
                    entry.personalContributionPercentage !== undefined
                      ? `${Math.round(entry.personalContributionPercentage)}% в команде`
                      : `${Math.round(entry.progressPercentage)}%`}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </Card>
      )}

      {/* Позиция текущего пользователя (если не в топе) */}
      {currentUserEntry && currentUserEntry.rank > 3 && (
        <Card className="border-garden-200 bg-garden-50 p-4 dark:border-garden-700 dark:bg-garden-900/20">
          <h4 className="mb-2 text-sm font-medium text-garden-700 dark:text-garden-300">
            📍 Ваша позиция
          </h4>
          <div className="flex items-center space-x-3">
            <div className="w-8 flex-shrink-0 text-center">
              <span className="text-lg font-bold text-garden-600 dark:text-garden-400">
                #{currentUserEntry.rank}
              </span>
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                {currentUserEntry.user.firstName}
              </p>
            </div>
            <div className="text-right">
              <div className="text-lg font-bold text-garden-600 dark:text-garden-400">
                {currentUserEntry.progress}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {challenge.type === 'cooperative' &&
                currentUserEntry.personalContributionPercentage !== undefined
                  ? `${Math.round(currentUserEntry.personalContributionPercentage)}% в команде`
                  : `${Math.round(currentUserEntry.progressPercentage)}%`}
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Информация о награде */}
    </div>
  )
}
