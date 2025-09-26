import { useEffect, useState, useCallback, useRef } from 'react'
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

        <div className="rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 p-4">
          <div className="text-center">
            <div className="mb-2 text-3xl">📅</div>
            <div className="text-2xl font-bold text-gray-900">
              {stats?.totalDays || 0}
            </div>
            <div className="text-sm font-medium text-blue-600">Всего дней</div>
          </div>
        </div>

        <div className="rounded-xl bg-gradient-to-br from-purple-50 to-purple-100 p-4">
          <div className="text-center">
            <div className="mb-2 text-3xl">⭐</div>
            <div className="text-2xl font-bold text-gray-900">
              {stats?.rareElementsFound || 0}
            </div>
            <div className="text-sm font-medium text-purple-600">
              Редкие элементы
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-xl bg-gradient-to-br from-pink-50 to-pink-100 p-4">
          <div className="text-center">
            <div className="mb-2 text-3xl">🏆</div>
            <div className="text-2xl font-bold text-gray-900">
              {stats?.longestStreak || 0}
            </div>
            <div className="text-sm font-medium text-pink-600">
              Лучший стрик
            </div>
          </div>
        </div>

        <div className="rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 p-4">
          <div className="text-center">
            <div className="mb-2 text-3xl">💭</div>
            <div className="text-2xl font-bold text-gray-900">
              {stats?.totalMoodEntries || 0}
            </div>
            <div className="text-sm font-medium text-blue-600">Настроений</div>
          </div>
        </div>

        <div className="rounded-xl bg-gradient-to-br from-green-50 to-green-100 p-4">
          <div className="text-center">
            <div className="mb-2 text-3xl">📤</div>
            <div className="text-2xl font-bold text-gray-900">
              {stats?.gardensShared || 0}
            </div>
            <div className="text-sm font-medium text-green-600">Поделился</div>
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
                <div className="text-xs text-gray-600">
                  {achievement.achievements?.description || 'Description'}
                </div>
                {achievement.is_unlocked && (
                  <div className="mt-2 text-xs font-medium text-green-600">
                    ✅ Разблокировано
                  </div>
                )}
                {!achievement.is_unlocked && achievement.progress > 0 && (
                  <div className="mt-2 text-xs text-gray-500">
                    Прогресс: {achievement.progress}
                  </div>
                )}
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

// DEBUG component to show state in UI (always visible for Telegram debugging)
function ProfileDebug({
  currentUser,
  userLoading,
  profileLoading,
  profileError,
  profileData,
  apiResponse,
  hookErrors,
  renderTime,
  onRetry,
}: any) {
  // Show debug for now to diagnose Telegram issues
  // if (process.env.NODE_ENV !== 'development') return null

  return (
    <div className="mb-4 rounded-xl border border-yellow-200 bg-yellow-50 p-4 text-xs">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="font-bold text-yellow-900">🔍 Profile Debug Info</h3>
        <button
          onClick={onRetry}
          className="rounded bg-yellow-200 px-2 py-1 text-xs text-yellow-900 hover:bg-yellow-300"
        >
          🔄 Retry
        </button>
      </div>
      <div className="space-y-1 text-yellow-800">
        <div>Component Rendered: ✅ at {renderTime || 'unknown time'}</div>
        <div>
          hookErrors:{' '}
          {hookErrors?.length ? `❌ ${hookErrors.length} errors` : '✅'}
        </div>
        <div>userLoading: {userLoading ? '✅' : '❌'}</div>
        <div>profileLoading: {profileLoading ? '✅' : '❌'}</div>
        <div>profileError: {profileError || '❌'}</div>
        <div>currentUser: {currentUser ? '✅' : '❌'}</div>
        <div>telegramId: {currentUser?.telegramId || 'missing'}</div>
        <div>profileData: {profileData ? '✅' : '❌'}</div>
        <div>apiResponse: {apiResponse ? '✅' : '❌'}</div>

        {hookErrors && hookErrors.length > 0 && (
          <details className="mt-2">
            <summary className="cursor-pointer text-red-600">
              ❌ Hook Errors ({hookErrors.length})
            </summary>
            <div className="mt-1 rounded bg-red-100 p-2 text-xs">
              {hookErrors.map((error: string, index: number) => (
                <div key={index} className="text-red-800">
                  {error}
                </div>
              ))}
            </div>
          </details>
        )}

        {currentUser && (
          <details className="mt-2">
            <summary className="cursor-pointer">Current User Info</summary>
            <pre className="mt-1 max-h-40 overflow-auto rounded bg-yellow-100 p-2 text-xs">
              {JSON.stringify(currentUser, null, 2)}
            </pre>
          </details>
        )}
        {apiResponse && (
          <details className="mt-2">
            <summary className="cursor-pointer">API Response</summary>
            <pre className="mt-1 max-h-40 overflow-auto rounded bg-yellow-100 p-2 text-xs">
              {JSON.stringify(apiResponse, null, 2)}
            </pre>
          </details>
        )}
      </div>
    </div>
  )
}

export function ProfilePage() {
  // БАЗОВАЯ ДИАГНОСТИКА - покажется в любом случае
  console.log('🔥 ProfilePage component is rendering!')

  // EXTREME DEBUG: Show this first to prove component renders
  const [renderTime] = useState(() => new Date().toLocaleTimeString())

  const [profileData, setProfileData] = useState<ProfileData | null>(null)
  const [apiResponse, setApiResponse] = useState<any>(null)
  const hookErrorsRef = useRef<string[]>([])

  // Сбрасываем ошибки при каждом рендере
  hookErrorsRef.current = []

  // Безопасно получаем данные из хуков с обработкой ошибок
  let currentUser,
    userLoading,
    currentGarden,
    getElementsCount,
    getMoodStats,
    profileLoading,
    profileError

  try {
    const userStoreResult = useUserStore()
    currentUser = userStoreResult.currentUser
    userLoading = userStoreResult.isLoading
  } catch (error) {
    hookErrorsRef.current.push(
      `useUserStore: ${error instanceof Error ? error.message : String(error)}`
    )
    currentUser = null
    userLoading = false
  }

  try {
    const gardenStoreResult = useGardenStore()
    currentGarden = gardenStoreResult.currentGarden
    getElementsCount = gardenStoreResult.getElementsCount
  } catch (error) {
    hookErrorsRef.current.push(
      `useGardenStore: ${error instanceof Error ? error.message : String(error)}`
    )
    currentGarden = null
    getElementsCount = () => 0
  }

  try {
    const moodStoreResult = useMoodStore()
    getMoodStats = moodStoreResult.getMoodStats
  } catch (error) {
    hookErrorsRef.current.push(
      `useMoodStore: ${error instanceof Error ? error.message : String(error)}`
    )
    getMoodStats = () => ({
      totalEntries: 0,
      currentStreak: 0,
      longestStreak: 0,
      mostFrequentMood: null,
      averageIntensity: 0,
      moodDistribution: {} as Record<MoodType, number>,
      weeklyTrend: [] as readonly MoodEntry[],
      monthlyTrend: [] as readonly MoodEntry[],
    })
  }

  try {
    const profileResult = useProfile()
    profileLoading = profileResult.isLoading
    profileError = profileResult.error
  } catch (error) {
    hookErrorsRef.current.push(
      `useProfile: ${error instanceof Error ? error.message : String(error)}`
    )
    profileLoading = false
    profileError = null
  }

  // Load profile data function
  const loadProfileData = useCallback(async () => {
    if (currentUser?.telegramId) {
      try {
        // Make direct API call to capture response
        const response = await fetch(
          `/api/profile?action=get_profile&telegramId=${currentUser.telegramId}`
        )
        const result = await response.json()
        setApiResponse(result) // Store for debugging

        if (result.success && result.data) {
          setProfileData(result.data)
        }
      } catch (error) {
        setApiResponse({
          error: error instanceof Error ? error.message : String(error),
        })
        console.error('Failed to load profile:', error)
      }
    }
  }, [currentUser?.telegramId])

  // Load profile data when component mounts
  useEffect(() => {
    loadProfileData()
  }, [currentUser?.telegramId, loadProfileData])

  // Calculate profile stats - with safe fallbacks
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

  // БАЗОВАЯ ПРОВЕРКА РЕНДЕРА - если это не видно, значит компонент не вызывается
  return (
    <div>
      {/* БАЗОВЫЙ ИНДИКАТОР - должен показаться в любом случае */}
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
        🔥 ProfilePage ЗАГРУЖЕН в {renderTime} | Errors:{' '}
        {hookErrorsRef.current.length}
      </div>

      <motion.div
        className="space-y-6 p-4 pb-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3 }}
        style={{ marginTop: '60px' }} // Отступ под красный баннер
      >
        {/* Debug Info - ALWAYS VISIBLE */}
        <ProfileDebug
          currentUser={currentUser}
          userLoading={userLoading}
          profileLoading={profileLoading}
          profileError={profileError}
          profileData={profileData}
          apiResponse={apiResponse}
          hookErrors={hookErrorsRef.current}
          renderTime={renderTime}
          onRetry={loadProfileData}
        />

        {/* Show loading if needed */}
        {(userLoading || profileLoading) && (
          <div className="flex min-h-[30vh] items-center justify-center">
            <LoadingSpinner size="lg" />
          </div>
        )}

        {/* Show profile error if exists */}
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

        {/* Show no user message if needed */}
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

        {/* Only show main content if we have a user and no errors */}
        {currentUser && !profileError && !userLoading && !profileLoading && (
          <>
            {/* Profile Header */}
            <ProfileHeader user={currentUser} />

            {/* Profile Stats */}
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

            {/* Achievements */}
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

            {/* Privacy Settings */}
            <ProfilePrivacySettings user={currentUser} />

            {/* Additional Info */}
            <motion.div
              className="rounded-2xl border border-gray-200 bg-white p-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <h3 className="mb-4 text-lg font-semibold text-gray-900">
                📝 Дополнительная информация
              </h3>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Дата регистрации</span>
                  <span className="font-medium text-gray-900">
                    {currentUser.registrationDate.toLocaleDateString('ru-RU')}
                  </span>
                </div>

                {currentUser.lastVisitDate && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Последний визит</span>
                    <span className="font-medium text-gray-900">
                      {currentUser.lastVisitDate.toLocaleDateString('ru-RU')}
                    </span>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Тип аккаунта</span>
                  <span className="font-medium text-gray-900">
                    {currentUser.isAnonymous ? (
                      <span className="rounded-full bg-gray-100 px-3 py-1 text-sm">
                        👤 Анонимный
                      </span>
                    ) : (
                      <span className="rounded-full bg-blue-100 px-3 py-1 text-sm text-blue-600">
                        🔗 Telegram
                      </span>
                    )}
                  </span>
                </div>

                {moodStats.totalEntries > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">
                      Всего записей настроения
                    </span>
                    <span className="font-medium text-gray-900">
                      {moodStats.totalEntries}
                    </span>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </motion.div>
    </div>
  )
}
