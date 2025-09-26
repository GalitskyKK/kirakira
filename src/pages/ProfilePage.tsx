import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useUserStore, useGardenStore, useMoodStore } from '@/stores'
import { useProfile } from '@/hooks/useProfile'
import { ProfileHeader } from '@/components/profile/ProfileHeader'
import { ProfileStats } from '@/components/profile/ProfileStats'
import { ProfileAchievements } from '@/components/profile/ProfileAchievements'
import { ProfilePrivacySettings } from '@/components/profile/ProfilePrivacySettings'
import { LoadingSpinner } from '@/components/ui'

interface ProfileData {
  user: {
    user_id?: string
    telegram_id?: number
    username?: string
    first_name?: string
    last_name?: string
    photo_url?: string
    registration_date?: string
    current_streak?: number
    longest_streak?: number
    total_days?: number
    rare_elements_found?: number
    gardens_shared?: number
    privacy_settings?: {
      showProfile?: boolean
      shareGarden?: boolean
      shareAchievements?: boolean
      allowFriendRequests?: boolean
      cloudSync?: boolean
    }
  }
  stats?: any
  achievements?: any[]
}

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
  const [_profileData, setProfileData] = useState<ProfileData | null>(null)
  const [loadingProfile, setLoadingProfile] = useState(false)

  // Загружаем профиль при монтировании
  useEffect(() => {
    const loadData = async () => {
      if (currentUser?.telegramId && loadProfile) {
        console.log('🔄 Загружаем данные профиля...')
        setLoadingProfile(true)
        try {
          const data = await loadProfile()
          if (data) {
            console.log('📡 RAW API Response:', data)
            setProfileData(data as ProfileData)
          }
          console.log('✅ Данные профиля загружены:', !!data)
        } catch (error) {
          console.error('❌ Ошибка загрузки профиля:', error)
        } finally {
          setLoadingProfile(false)
        }
      }
    }

    void loadData()
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
          <p className="mt-2 text-sm text-red-600">{String(profileError)}</p>
        </div>
      </div>
    )
  }

  console.log('🎉 Рендерим основной контент ProfilePage')

  // Готовим данные для компонентов с защитой от undefined
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

  // Создаем объединенные данные пользователя из API и локального стора
  const apiUser = _profileData?.user
  const renderUser = {
    // Базовые поля - приоритет данным из API
    id: apiUser?.user_id ?? currentUser?.id ?? '',
    telegramId: apiUser?.telegram_id ?? currentUser?.telegramId ?? 0,
    firstName: apiUser?.first_name ?? currentUser?.firstName ?? 'Пользователь',
    lastName: apiUser?.last_name ?? currentUser?.lastName ?? '',
    username: apiUser?.username ?? currentUser?.username ?? '',
    photoUrl: apiUser?.photo_url ?? currentUser?.photoUrl ?? '',
    registrationDate: apiUser?.registration_date
      ? new Date(apiUser.registration_date)
      : (currentUser?.registrationDate ?? new Date()),
    isAnonymous: currentUser?.isAnonymous ?? false,

    // Статистика из API или fallback
    stats: {
      currentStreak: apiUser?.current_streak ?? 0,
      longestStreak: apiUser?.longest_streak ?? 0,
      totalDays: apiUser?.total_days ?? 0,
      rareElementsFound: apiUser?.rare_elements_found ?? 0,
      gardensShared: apiUser?.gardens_shared ?? 0,
      totalElements: totalElements,
      firstVisit: currentUser?.stats?.firstVisit ?? new Date(),
      lastVisit: currentUser?.stats?.lastVisit ?? new Date(),
    },

    // Настройки из API или fallback
    preferences: {
      privacy: {
        showProfile: apiUser?.privacy_settings?.showProfile ?? true,
        shareGarden: apiUser?.privacy_settings?.shareGarden ?? true,
        shareAchievements: apiUser?.privacy_settings?.shareAchievements ?? true,
        allowFriendRequests:
          apiUser?.privacy_settings?.allowFriendRequests ?? true,
        cloudSync: apiUser?.privacy_settings?.cloudSync ?? false,
        dataCollection:
          currentUser?.preferences?.privacy?.dataCollection ?? false,
        analytics: currentUser?.preferences?.privacy?.analytics ?? false,
      },
      theme: currentUser?.preferences?.theme ?? 'auto',
      language: currentUser?.preferences?.language ?? 'ru',
      notifications: currentUser?.preferences?.notifications ?? true,
      garden: currentUser?.preferences?.garden ?? {},
    },
  }

  console.log('🔍 Рендерим с данными:', {
    hasApiData: Boolean(apiUser),
    hasLocalUser: Boolean(currentUser),
    userFirstName: renderUser.firstName,
    userPhoto: renderUser.photoUrl,
    userStats: renderUser.stats,
    totalElements,
  })

  return (
    <motion.div
      className="space-y-6 p-4 pb-8"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
    >
      {/* Заголовок профиля */}
      <ProfileHeader user={renderUser} />

      {/* Статистика */}
      <ProfileStats
        user={renderUser}
        garden={currentGarden}
        moodStats={moodStats}
        totalElements={totalElements}
      />

      {/* Достижения */}
      <ProfileAchievements
        user={renderUser}
        moodStats={moodStats}
        totalElements={totalElements}
      />

      {/* Настройки приватности */}
      <ProfilePrivacySettings user={renderUser} />
    </motion.div>
  )
}
