import { motion } from 'framer-motion'
import { useUserStore, useGardenStore, useMoodStore } from '@/stores'
import { ProfileHeader } from '@/components/profile/ProfileHeader'
import { ProfileStats } from '@/components/profile/ProfileStats'
import { ProfileAchievements } from '@/components/profile/ProfileAchievements'
import { ProfilePrivacySettings } from '@/components/profile/ProfilePrivacySettings'
import { LoadingSpinner } from '@/components/ui'

export function ProfilePage() {
  const { currentUser, isLoading: userLoading } = useUserStore()
  const { currentGarden, getElementsCount } = useGardenStore()
  const { getMoodStats } = useMoodStore()

  // Calculate profile stats
  const moodStats = getMoodStats()
  const totalElements = getElementsCount()

  if (userLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <LoadingSpinner size="lg" />
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
      <ProfileStats
        user={currentUser}
        garden={currentGarden}
        moodStats={moodStats}
        totalElements={totalElements}
      />

      {/* Achievements */}
      <ProfileAchievements
        user={currentUser}
        moodStats={moodStats}
        totalElements={totalElements}
      />

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
