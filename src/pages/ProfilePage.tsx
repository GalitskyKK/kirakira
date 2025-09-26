import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useUserStore, useGardenStore, useMoodStore } from '@/stores'
import { useProfile } from '@/hooks/useProfile'
import { ProfileHeader } from '@/components/profile/ProfileHeader'
import { ProfileStats } from '@/components/profile/ProfileStats'
import { ProfileAchievements } from '@/components/profile/ProfileAchievements'
import { ProfilePrivacySettings } from '@/components/profile/ProfilePrivacySettings'
import { LoadingSpinner } from '@/components/ui'
import type { ProfileData } from '@/types'

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

export function ProfilePage() {
  const { currentUser, isLoading: userLoading } = useUserStore()
  const { currentGarden, getElementsCount } = useGardenStore()
  const { getMoodStats } = useMoodStore()
  const {
    isLoading: profileLoading,
    error: profileError,
    loadProfile,
  } = useProfile()

  const [profileData, setProfileData] = useState<ProfileData | null>(null)

  // Load profile data when component mounts
  useEffect(() => {
    const loadProfileData = async () => {
      if (currentUser?.telegramId) {
        try {
          const data = await loadProfile()
          if (data) {
            setProfileData(data)
          }
        } catch (error) {
          console.error('Failed to load profile:', error)
        }
      }
    }

    loadProfileData()
  }, [currentUser?.telegramId, loadProfile])

  // Calculate profile stats
  const moodStats = getMoodStats()
  const totalElements = getElementsCount()

  if (userLoading || profileLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (profileError) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="text-center">
          <div className="mb-4 text-6xl">🌸</div>
          <h2 className="mb-2 text-xl font-bold text-gray-900">
            Упс! Что-то пошло не так
          </h2>
          <p className="text-gray-600">
            Не переживайте, мы быстро это исправим
          </p>
          <p className="mt-2 text-sm text-gray-500">{profileError}</p>
        </div>
      </div>
    )
  }

  if (!currentUser) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
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
    )
  }

  return (
    <motion.div
      className="space-y-6 p-4 pb-8"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
    >
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
        <ProfileAchievementsServer achievements={profileData.achievements} />
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
              <span className="text-gray-600">Всего записей настроения</span>
              <span className="font-medium text-gray-900">
                {moodStats.totalEntries}
              </span>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  )
}
