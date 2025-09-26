import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useUserStore, useGardenStore, useMoodStore } from '@/stores'
import { useProfile } from '@/hooks/useProfile'
import { ProfileHeader } from '@/components/profile/ProfileHeader'
import { ProfileStats } from '@/components/profile/ProfileStats'
import { ProfileAchievements } from '@/components/profile/ProfileAchievements'
import { ProfilePrivacySettings } from '@/components/profile/ProfilePrivacySettings'
import { LoadingSpinner } from '@/components/ui'

export function ProfilePage() {
  console.log('🔥 ПРОСТОЙ ProfilePage начинает рендеринг')

  // ✅ Все хуки работают (проверено тестами)
  const { currentUser, isLoading: userLoading } = useUserStore()
  const { currentGarden, getElementsCount } = useGardenStore()
  const { getMoodStats } = useMoodStore()
  const {
    isLoading: profileLoading,
    error: profileError,
    loadProfile,
  } = useProfile()

  // Состояние для данных профиля
  const [profileData, setProfileData] = useState<any>(null)
  const [loadingProfile, setLoadingProfile] = useState(false)

  // Загружаем профиль при монтировании
  useEffect(() => {
    const loadData = async () => {
      if (currentUser?.telegramId && loadProfile) {
        console.log('🔄 Загружаем данные профиля...')
        setLoadingProfile(true)
        try {
          const data = await loadProfile()
          setProfileData(data)
          console.log('✅ Данные профиля загружены:', !!data)
        } catch (error) {
          console.error('❌ Ошибка загрузки профиля:', error)
        } finally {
          setLoadingProfile(false)
        }
      }
    }

    loadData()
  }, [currentUser?.telegramId, loadProfile])

  // Показываем спиннер во время загрузки
  if (userLoading || profileLoading || loadingProfile) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  // Показываем ошибку если нет пользователя
  if (!currentUser) {
    return (
      <div className="p-6">
        <div className="rounded-xl border border-gray-200 bg-gray-50 p-6 text-center">
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

  // Показываем ошибку если есть проблемы с загрузкой
  if (profileError) {
    return (
      <div className="p-6">
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
          <div className="mb-4 text-6xl">🌸</div>
          <h2 className="mb-2 text-xl font-bold text-red-900">
            Упс! Что-то пошло не так
          </h2>
          <p className="text-red-700">Не переживайте, мы быстро это исправим</p>
          <p className="mt-2 text-sm text-red-600">{profileError}</p>
        </div>
      </div>
    )
  }

  console.log('🎉 Рендерим основной контент ProfilePage')

  // Готовим данные для компонентов
  const moodStats = getMoodStats
    ? getMoodStats()
    : {
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

  const totalElements = getElementsCount ? getElementsCount() : 0

  return (
    <motion.div
      className="space-y-6 p-4 pb-8"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
    >
      {/* Заголовок профиля */}
      <ProfileHeader user={profileData?.user || currentUser} />

      {/* Статистика */}
      <ProfileStats
        user={profileData?.user || currentUser}
        garden={currentGarden}
        moodStats={moodStats}
        totalElements={totalElements}
      />

      {/* Достижения */}
      <ProfileAchievements
        user={profileData?.user || currentUser}
        moodStats={moodStats}
        totalElements={totalElements}
      />

      {/* Настройки приватности */}
      <ProfilePrivacySettings user={profileData?.user || currentUser} />
    </motion.div>
  )
}
