import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useUserStore, useGardenStore, useMoodStore } from '@/stores'
import { useProfile } from '@/hooks/useProfile'
import { ProfileHeader } from '@/components/profile/ProfileHeader'
import { ProfileStats } from '@/components/profile/ProfileStats'
import { ProfileAchievements } from '@/components/profile/ProfileAchievements'
import { ProfilePrivacySettings } from '@/components/profile/ProfilePrivacySettings'
import { LoadingSpinner } from '@/components/ui'
import type { ProfileData, MoodType, MoodEntry } from '@/types'

// Temporary components for server data
function ProfileStatsServer({ stats }: any) {
  return (
    <motion.div
      className="space-y-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.2 }}
    >
      <h2 className="text-lg font-semibold text-gray-900">
        📊 Статистика (Сервер)
      </h2>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-gradient-to-br from-orange-50 to-orange-100 p-4">
          <div className="text-center">
            <div className="mb-2 text-3xl">🔥</div>
            <div className="text-2xl font-bold text-gray-900">
              {stats?.currentStreak || 0}
            </div>
            <div className="text-sm font-medium text-orange-600">
              Текущий стрик
            </div>
          </div>
        </div>

        <div className="rounded-xl bg-gradient-to-br from-green-50 to-green-100 p-4">
          <div className="text-center">
            <div className="mb-2 text-3xl">🌱</div>
            <div className="text-2xl font-bold text-gray-900">
              {stats?.totalElements || 0}
            </div>
            <div className="text-sm font-medium text-green-600">
              Растений в саду
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

function ProfileAchievementsServer({ achievements }: any) {
  return (
    <motion.div
      className="space-y-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.3 }}
    >
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">
          🏆 Достижения (Сервер)
        </h2>
        <div className="rounded-full bg-garden-100 px-3 py-1 text-sm font-medium text-garden-600">
          {achievements?.filter((a: any) => a.is_unlocked).length || 0}/
          {achievements?.length || 0}
        </div>
      </div>

      {achievements && achievements.length > 0 ? (
        <div className="grid grid-cols-2 gap-3">
          {achievements.map((achievement: any) => (
            <div
              key={achievement.achievement_id}
              className={`rounded-xl border p-4 ${
                achievement.is_unlocked
                  ? 'border-green-200 bg-green-50'
                  : 'border-gray-200 bg-gray-50'
              }`}
            >
              <div className="text-center">
                <div className="mb-2 text-3xl">
                  {achievement.achievements?.emoji || '🏆'}
                </div>
                <div className="text-sm font-bold text-gray-900">
                  {achievement.achievements?.name || 'Achievement'}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="py-8 text-center">
          <div className="mb-2 text-4xl">🎯</div>
          <p className="text-gray-600">Пока нет достижений</p>
        </div>
      )}
    </motion.div>
  )
}

// DEBUG component
function ProfileDebug({
  currentUser,
  userLoading,
  profileLoading,
  profileError,
  profileData,
  renderTime,
  onRetry,
}: any) {
  return (
    <div className="mb-4 rounded-xl border border-yellow-200 bg-yellow-50 p-4 text-xs">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="font-bold text-yellow-900">
          🔍 SIMPLE Profile Debug (useProfile)
        </h3>
        <button
          onClick={onRetry}
          className="rounded bg-yellow-200 px-2 py-1 text-xs text-yellow-900 hover:bg-yellow-300"
        >
          🔄 Retry
        </button>
      </div>
      <div className="space-y-1 text-yellow-800">
        <div>Component Rendered: ✅ at {renderTime}</div>
        <div>userLoading: {userLoading ? '✅' : '❌'}</div>
        <div>profileLoading: {profileLoading ? '✅' : '❌'}</div>
        <div>profileError: {profileError || '❌'}</div>
        <div>currentUser: {currentUser ? '✅ (LOCAL)' : '❌'}</div>
        <div>telegramId: {currentUser?.telegramId || 'missing'}</div>
        <div>profileData: {profileData ? '✅ (SERVER)' : '❌'}</div>
        <div>📊 Data Source: {profileData?.user ? 'SERVER' : 'LOCAL'}</div>
        <div>🔑 Server User ID: {profileData?.user?.telegram_id || 'N/A'}</div>
        <div>👤 Server Username: {profileData?.user?.username || 'N/A'}</div>
        <div>
          📅 Server RegDate: {profileData?.user?.registration_date || 'N/A'}
        </div>
        <div>
          ⚠️ Profile Data Type: {profileData ? typeof profileData : 'null'}
        </div>
        <div>
          ⚠️ User Data Type:{' '}
          {profileData?.user ? typeof profileData.user : 'null'}
        </div>
        <div>
          ⚠️ User Fields:{' '}
          {profileData?.user ? Object.keys(profileData.user).length : 0}
        </div>

        {currentUser && (
          <details className="mt-2">
            <summary className="cursor-pointer">
              Current User Info (LOCAL)
            </summary>
            <pre className="mt-1 max-h-40 overflow-auto rounded bg-yellow-100 p-2 text-xs">
              {JSON.stringify(currentUser, null, 2)}
            </pre>
          </details>
        )}
        {profileData && (
          <details className="mt-2">
            <summary className="cursor-pointer">Profile Data (SERVER)</summary>
            <pre className="mt-1 max-h-40 overflow-auto rounded bg-yellow-100 p-2 text-xs">
              {JSON.stringify(profileData, null, 2)}
            </pre>
          </details>
        )}
      </div>
    </div>
  )
}

export function ProfilePage() {
  console.log('🔥 SAFE ProfilePage rendering started')

  // ПРАВИЛЬНЫЕ ХУКИ - используем тот же подход что и FriendProfilePage
  const { currentUser, isLoading: userLoading } = useUserStore()
  const { currentGarden, getElementsCount } = useGardenStore()
  const { getMoodStats } = useMoodStore()
  const {
    loadProfile,
    isLoading: profileLoading,
    error: profileError,
  } = useProfile()

  console.log(
    '🔥 Hooks loaded. currentUser:',
    !!currentUser,
    'userLoading:',
    userLoading
  )

  // БЕЗОПАСНОЕ СОСТОЯНИЕ
  const [renderTime] = useState(() => new Date().toLocaleTimeString())
  const [profileData, setProfileData] = useState<ProfileData | null>(null)

  // Load profile data using the same hook as FriendProfilePage
  useEffect(() => {
    if (!currentUser?.telegramId) return

    const loadData = async () => {
      console.log(
        '🔥 Loading profile data using useProfile hook for:',
        currentUser.telegramId
      )
      const data = await loadProfile(currentUser.telegramId)
      console.log('🔥 Profile data received:', data)
      if (data) {
        setProfileData(data)
        console.log('🔥 Profile data set successfully')
      }
    }

    void loadData()
  }, [currentUser?.telegramId, loadProfile])

  // Безопасные статистики
  const moodStats = getMoodStats
    ? getMoodStats()
    : {
        totalEntries: 0,
        currentStreak: 0,
        longestStreak: 0,
        mostFrequentMood: null as MoodType | null,
        averageIntensity: 0,
        moodDistribution: {} as Record<MoodType, number>,
        weeklyTrend: [] as readonly MoodEntry[],
        monthlyTrend: [] as readonly MoodEntry[],
      }

  const totalElements = getElementsCount ? getElementsCount() : 0

  console.log('🔥 About to render ProfilePage UI')

  return (
    <div>
      {/* КРАСНЫЙ БАННЕР - должен показаться ВСЕГДА */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          background: '#ff0000',
          color: 'white',
          padding: '10px',
          fontSize: '14px',
          zIndex: 9999,
          textAlign: 'center',
        }}
      >
        🔥 SAFE ProfilePage ЗАГРУЖЕН в {renderTime}
      </div>

      <motion.div
        className="space-y-6 p-4 pb-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3 }}
        style={{ marginTop: '60px' }}
      >
        {/* Debug Info */}
        <ProfileDebug
          currentUser={currentUser}
          userLoading={userLoading}
          profileLoading={profileLoading}
          profileError={profileError}
          profileData={profileData}
          renderTime={renderTime}
          onRetry={() => window.location.reload()}
        />

        {/* Loading */}
        {(userLoading || profileLoading) && (
          <div className="flex min-h-[30vh] items-center justify-center">
            <LoadingSpinner size="lg" />
          </div>
        )}

        {/* Error */}
        {profileError && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-6">
            <div className="text-center">
              <div className="mb-4 text-6xl">🌸</div>
              <h2 className="mb-2 text-xl font-bold text-red-900">
                Упс! Что-то пошло не так
              </h2>
              <p className="text-red-700">
                Не переживайте, мы быстро это исправим
              </p>
              <p className="mt-2 text-sm text-red-600">{profileError}</p>
            </div>
          </div>
        )}

        {/* No User */}
        {!currentUser && !userLoading && (
          <div className="rounded-xl border border-gray-200 bg-gray-50 p-6">
            <div className="text-center">
              <div className="mb-4 text-6xl">😔</div>
              <h2 className="mb-2 text-xl font-bold text-gray-900">
                Пользователь не найден
              </h2>
              <p className="text-gray-600">
                Пожалуйста, авторизуйтесь для просмотра профиля
              </p>
            </div>
          </div>
        )}

        {/* Main Content - простая логика как в FriendProfilePage */}
        {currentUser && !profileError && !userLoading && !profileLoading && (
          <>
            <ProfileHeader user={profileData?.user || currentUser} />

            {profileData?.stats ? (
              <ProfileStatsServer stats={profileData.stats} />
            ) : (
              <ProfileStats
                user={currentUser}
                garden={currentGarden}
                moodStats={moodStats}
                totalElements={totalElements}
              />
            )}

            {profileData?.achievements ? (
              <ProfileAchievementsServer
                achievements={profileData.achievements}
              />
            ) : (
              <ProfileAchievements
                user={currentUser}
                moodStats={moodStats}
                totalElements={totalElements}
              />
            )}

            <ProfilePrivacySettings user={profileData?.user || currentUser} />
          </>
        )}
      </motion.div>
    </div>
  )
}
