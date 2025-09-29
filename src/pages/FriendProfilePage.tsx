import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, Lock, Eye, Users } from 'lucide-react'
import { LoadingSpinner, UserAvatar } from '@/components/ui'
import { useProfile } from '@/hooks/useProfile'
import { GARDENER_LEVELS } from '@/utils/achievements'

interface FriendProfileData {
  user: {
    id: number
    telegram_id: number
    first_name: string
    last_name?: string
    username?: string
    photo_url?: string
    level: number
    registration_date: string
  }
  stats: any
  achievements: any[]
  privacy: {
    showProfile: boolean
    shareGarden: boolean
    shareAchievements: boolean
  }
}

// Debug component for friend profile
// function FriendProfileDebug({
//   profileData,
//   error,
//   isLoading,
//   friendTelegramId,
// }: any) {
//   return (
//     <div className="mb-4 rounded-xl border border-blue-200 bg-blue-50 p-4 text-xs">
//       <h3 className="mb-2 font-bold text-blue-900">🔍 Friend Debug Info</h3>
//       <div className="space-y-1 text-blue-800">
//         <div>friendTelegramId: {friendTelegramId}</div>
//         <div>isLoading: {isLoading ? '✅' : '❌'}</div>
//         <div>error: {error || '❌'}</div>
//         <div>profileData: {profileData ? '✅' : '❌'}</div>
//         {profileData && (
//           <details className="mt-2">
//             <summary className="cursor-pointer">Profile Data</summary>
//             <pre className="mt-1 overflow-auto rounded bg-blue-100 p-2 text-xs">
//               {JSON.stringify(profileData, null, 2)}
//             </pre>
//           </details>
//         )}
//       </div>
//     </div>
//   )
// }

export default function FriendProfilePage() {
  const { friendTelegramId } = useParams<{ friendTelegramId: string }>()
  const navigate = useNavigate()
  const { loadFriendProfile, isLoading, error } = useProfile()
  const [profileData, setProfileData] = useState<FriendProfileData | null>(null)

  useEffect(() => {
    if (!friendTelegramId) {
      navigate('/')
      return
    }

    const loadData = async () => {
      const data = await loadFriendProfile(parseInt(friendTelegramId))
      if (data) {
        // 🔍 ОТЛАДКА: Логируем полученные данные друга
        console.log('🔍 Friend Profile Data Received:', {
          friendTelegramId,
          hasUser: !!data.user,
          hasStats: !!data.stats,
          registrationDate: data.user?.registration_date,
          statsData: data.stats,
          userData: data.user,
        })

        setProfileData(data as FriendProfileData)
      }
    }

    void loadData()
  }, [friendTelegramId, loadFriendProfile, navigate])

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-garden-50 to-green-50 dark:from-gray-900 dark:to-gray-800">
        <motion.div
          className="text-center"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600 dark:text-gray-400">
            Загружаем профиль...
          </p>
        </motion.div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-900/30 dark:to-orange-900/30">
        <motion.div
          className="mx-auto max-w-md p-8 text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="mb-4 text-6xl">🔒</div>
          <h1 className="mb-4 text-2xl font-bold text-gray-900 dark:text-gray-100">
            Профиль недоступен
          </h1>
          <p className="mb-6 text-gray-600 dark:text-gray-400">{error}</p>
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center rounded-lg bg-garden-500 px-6 py-3 text-white transition-colors hover:bg-garden-600"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Назад
          </button>
        </motion.div>
      </div>
    )
  }

  if (!profileData) {
    return null
  }

  const { user, stats, achievements, privacy } = profileData
  const displayName = user.first_name || user.username || 'Пользователь'
  const username = user.username ? `@${user.username}` : null

  // Calculate level info if we have stats
  const currentLevel =
    GARDENER_LEVELS.find(l => l.level === user.level) || GARDENER_LEVELS[0]!

  // 🔍 ОТЛАДКА: Сравниваем два способа подсчета дней
  const daysSinceRegistrationLocal = Math.floor(
    (Date.now() - new Date(user.registration_date).getTime()) /
      (1000 * 60 * 60 * 24)
  )

  const daysSinceRegistrationFromStats = stats?.totalDays || 0

  console.log('🔍 Friend Days Comparison:', {
    localCalculation: daysSinceRegistrationLocal,
    statsCalculation: daysSinceRegistrationFromStats,
    registrationDate: user.registration_date,
    usingForDisplay: daysSinceRegistrationLocal,
  })

  const daysSinceRegistration = daysSinceRegistrationLocal

  return (
    <div className="min-h-screen bg-gradient-to-br from-garden-50 to-green-50 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <div className="sticky top-0 z-10 border-b border-gray-200 bg-white/80 backdrop-blur-md dark:border-gray-700 dark:bg-gray-900/80">
        <div className="flex items-center justify-between p-4">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
          >
            <ArrowLeft className="mr-2 h-5 w-5" />
            Назад
          </button>
          <h1 className="font-semibold text-gray-900 dark:text-gray-100">
            Профиль друга
          </h1>
          <div className="w-16" /> {/* Spacer */}
        </div>
      </div>

      <div className="space-y-6 p-4 pb-8">
        {/* Debug Info */}
        {/* <FriendProfileDebug
          profileData={profileData}
          error={error}
          isLoading={isLoading}
          friendTelegramId={friendTelegramId}
        /> */}

        {/* Profile Header */}
        <motion.div
          className="rounded-2xl border border-gray-200 bg-gradient-to-br from-blue-50 to-indigo-50 p-6 dark:border-gray-700 dark:from-blue-900/30 dark:to-indigo-900/30"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          <div className="flex items-start space-x-4">
            <div className="flex-shrink-0">
              <UserAvatar
                photoUrl={user.photo_url}
                name={displayName}
                username={user.username}
                size="xl"
                className="shadow-lg ring-4 ring-white dark:ring-gray-800"
              />
            </div>

            <div className="flex-1 space-y-2">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {displayName}
                </h1>
                {username && (
                  <p className="text-lg text-blue-600 dark:text-blue-400">
                    {username}
                  </p>
                )}
              </div>

              {/* Level Badge */}
              <div className="inline-flex items-center rounded-full bg-gradient-to-r from-blue-400 to-indigo-400 px-4 py-2 text-sm font-medium text-white shadow-sm">
                <span className="mr-2">{currentLevel.emoji}</span>
                <span>{currentLevel.name}</span>
                <span className="ml-2 rounded-full bg-white/20 px-2 py-0.5 text-xs">
                  Ур. {currentLevel.level}
                </span>
              </div>

              {/* Quick Stats */}
              <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
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
          </div>
        </motion.div>

        {/* Stats Section */}
        {privacy.shareGarden && stats ? (
          <motion.div
            className="space-y-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              📊 Статистика
            </h2>

            <div className="grid grid-cols-2 gap-3">
              <StatCard
                emoji="🔥"
                label="Лучший стрик"
                value={stats.longestStreak || 0}
              />
              <StatCard
                emoji="🌱"
                label="Растений"
                value={stats.totalElements || 0}
              />
              <StatCard
                emoji="📅"
                label="Всего дней"
                value={stats.totalDays || 0}
              />
              <StatCard
                emoji="⭐"
                label="Редких элементов"
                value={stats.rareElementsFound || 0}
              />
            </div>

            {/* 🔍 ОТЛАДКА: Показываем сырые данные статистики в DEV режиме */}
            {import.meta.env.DEV && (
              <div className="mt-4 rounded-lg bg-yellow-50 p-3 text-xs text-yellow-800">
                <strong>DEBUG - Raw Stats:</strong>
                <pre>{JSON.stringify(stats, null, 2)}</pre>
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div
            className="rounded-2xl border border-gray-200 bg-gray-50 p-6 text-center dark:border-gray-700 dark:bg-gray-800"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Lock className="mx-auto mb-3 h-8 w-8 text-gray-400" />
            <h3 className="mb-1 font-medium text-gray-600 dark:text-gray-400">
              Приватный сад
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Пользователь скрыл статистику своего сада
            </p>
          </motion.div>
        )}

        {/* Achievements Section */}
        {privacy.shareAchievements && achievements.length > 0 ? (
          <motion.div
            className="space-y-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                🏆 Достижения
              </h2>
              <div className="rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-600 dark:bg-blue-900/50 dark:text-blue-400">
                {achievements.length}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {achievements.map((achievement, index) => (
                <AchievementBadge
                  key={achievement.achievement_id}
                  achievement={achievement}
                  delay={0.1 + index * 0.05}
                />
              ))}
            </div>
          </motion.div>
        ) : (
          <motion.div
            className="rounded-2xl border border-gray-200 bg-gray-50 p-6 text-center dark:border-gray-700 dark:bg-gray-800"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Users className="mx-auto mb-3 h-8 w-8 text-gray-400" />
            <h3 className="mb-1 font-medium text-gray-600 dark:text-gray-400">
              Приватные достижения
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Пользователь скрыл свои достижения
            </p>
          </motion.div>
        )}

        {/* Privacy Info */}
        <motion.div
          className="rounded-xl border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-900/30"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <div className="flex items-start space-x-3">
            <Eye className="mt-0.5 h-5 w-5 text-blue-500 dark:text-blue-400" />
            <div className="flex-1">
              <div className="text-sm font-medium text-blue-800 dark:text-blue-200">
                Настройки приватности
              </div>
              <div className="mt-1 text-xs text-blue-600 dark:text-blue-300">
                Этот пользователь разрешил просмотр{' '}
                {privacy.shareGarden && privacy.shareAchievements
                  ? 'профиля, статистики и достижений'
                  : privacy.shareGarden
                    ? 'профиля и статистики'
                    : privacy.shareAchievements
                      ? 'профиля и достижений'
                      : 'только профиля'}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

// Helper Components
interface StatCardProps {
  emoji: string
  label: string
  value: number
}

function StatCard({ emoji, label, value }: StatCardProps) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
      <div className="text-center">
        <div className="mb-2 text-3xl">{emoji}</div>
        <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          {value}
        </div>
        <div className="text-sm font-medium text-gray-600 dark:text-gray-400">
          {label}
        </div>
      </div>
    </div>
  )
}

interface AchievementBadgeProps {
  achievement: any
  delay: number
}

function AchievementBadge({ achievement, delay }: AchievementBadgeProps) {
  return (
    <motion.div
      className="rounded-xl border border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50 p-4 dark:border-blue-700 dark:from-blue-900/30 dark:to-indigo-900/30"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay, duration: 0.3 }}
    >
      <div className="text-center">
        <div className="mb-2 text-3xl">{achievement.achievements.emoji}</div>
        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
          {achievement.achievements.name}
        </div>
        <div className="mt-1 text-xs text-gray-600 dark:text-gray-400">
          {achievement.achievements.description}
        </div>
        {achievement.unlocked_at && (
          <div className="mt-2 text-xs text-blue-500 dark:text-blue-400">
            {new Date(achievement.unlocked_at).toLocaleDateString('ru-RU')}
          </div>
        )}
      </div>
    </motion.div>
  )
}
