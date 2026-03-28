import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useUserSync, useGardenSync } from '@/hooks/index.v2'
import { useTelegramId } from '@/hooks/useTelegramId'
import { useProfile } from '@/hooks/useProfile'
import {
  ProfileHeader,
  ProfileRecoveryAccountId,
} from '@/components/profile'
import { ProfileStats } from '@/components/profile/ProfileStats'
import { ProfileAchievements } from '@/components/profile/ProfileAchievements'
import { LoadingSpinner } from '@/components/ui'
import { useViewerLeaderboardPosition } from '@/hooks/queries/useLeaderboardQueries'
import { useTranslation } from '@/hooks/useTranslation'
import { useUserContext } from '@/contexts/UserContext'
import { isKirakiraSyntheticTelegramId } from '@/utils/kirakiraTelegramId'

export function ProfilePage() {
  const navigate = useNavigate()
  const t = useTranslation()
  const { isTelegramEnv } = useUserContext()
  // ✅ Получаем данные через React Query v2 хуки
  const telegramId = useTelegramId()
  const { data: userData, isLoading: userLoading } = useUserSync(
    telegramId,
    telegramId != null
  )
  const { data: gardenData } = useGardenSync(telegramId, telegramId != null)

  const currentUser = userData?.user
  const currentGarden = gardenData

  // ✅ Новый v2 хук - автоматическая загрузка данных через React Query
  const {
    profile: profileData,
    isLoading: profileLoading,
    error: profileError,
  } = useProfile()

  const viewerTelegramId =
    currentUser?.telegramId ?? profileData?.user?.telegram_id ?? null

  const {
    data: levelLeaderboardPosition,
    isLoading: leaderboardPositionLoading,
  } = useViewerLeaderboardPosition({
    category: 'level',
    period: 'all_time',
    viewerTelegramId: viewerTelegramId ?? undefined,
    enabled: viewerTelegramId != null,
  })

  // Вспомогательная функция для подсчета элементов
  const getElementsCount = () => currentGarden?.elements.length ?? 0

  // Показываем спиннер во время загрузки
  if (userLoading || profileLoading) {
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
        <div className="glass-card rounded-3xl border border-neutral-200/50 p-6 text-center dark:border-neutral-700/50">
          <div className="mb-4 text-6xl">😔</div>
          <h2 className="mb-2 text-xl font-bold text-neutral-900 dark:text-neutral-100">
            {t.profile.authRequired}
          </h2>
          <p className="text-neutral-600 dark:text-neutral-400">
            {t.errors.pleaseLogin}
          </p>
          <button
            type="button"
            onClick={() => navigate('/auth')}
            className="mt-4 inline-flex items-center justify-center rounded-2xl bg-kira-500 px-4 py-2 text-white transition-colors hover:bg-kira-600"
          >
            {t.profile.login}
          </button>
        </div>
      </div>
    )
  }

  // Показываем ошибку если есть проблемы с загрузкой
  if (profileError != null) {
    return (
      <div className="p-6">
        <div className="glass-card rounded-3xl border border-red-200/50 bg-red-50/50 p-6 text-center dark:border-red-800/50 dark:bg-red-900/20">
          <div className="mb-4 text-6xl">🌸</div>
          <h2 className="mb-2 text-xl font-bold text-red-900 dark:text-red-200">
            {t.profile.somethingWentWrong}
          </h2>
          <p className="text-red-700 dark:text-red-300">
            {t.profile.dontWorry}
          </p>
          <p className="mt-2 text-sm text-red-600 dark:text-red-400">
            {String(profileError)}
          </p>
        </div>
      </div>
    )
  }

  // 🔧 ИСПРАВЛЕНИЕ: Используем данные из API вместо захардкоженных нулей
  const moodStats = {
    totalEntries: profileData?.stats?.totalMoodEntries ?? 0,
    totalMoodEntries: profileData?.stats?.totalMoodEntries ?? 0, // API возвращает это поле
    currentStreak: profileData?.stats?.currentStreak ?? 0,
    longestStreak: profileData?.stats?.longestStreak ?? 0,
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

  const totalElements = getElementsCount()

  // Создаем объединенные данные пользователя из API и локального стора
  const apiUser = profileData?.user
  const renderUser = {
    // Базовые поля - приоритет данным из API
    id: apiUser?.user_id ?? currentUser?.id ?? '',
    telegramId: apiUser?.telegram_id ?? currentUser?.telegramId ?? 0,
    ...(apiUser?.auth_user_id != null && apiUser.auth_user_id !== ''
      ? { authUserId: apiUser.auth_user_id }
      : currentUser?.authUserId != null
        ? { authUserId: currentUser.authUserId }
        : {}),
    firstName: apiUser?.first_name ?? currentUser?.firstName ?? t.common.user,
    lastName: apiUser?.last_name ?? currentUser?.lastName ?? '',
    username: apiUser?.username ?? currentUser?.username ?? '',
    photoUrl: apiUser?.photo_url ?? currentUser?.photoUrl ?? '',
    registrationDate:
      apiUser?.registration_date != null
        ? new Date(apiUser.registration_date)
        : (currentUser?.registrationDate ?? new Date()),
    isAnonymous: currentUser?.isAnonymous ?? false,

    // 🔥 ИСПРАВЛЕНИЕ: Добавляем поля experience и level из API или currentUser (с fallback значениями)
    experience: apiUser?.experience ?? currentUser?.experience ?? 0,
    level: apiUser?.level ?? currentUser?.level ?? 1,

    // Статистика из API или fallback
    stats: {
      currentStreak: apiUser?.current_streak ?? 0,
      longestStreak: apiUser?.longest_streak ?? 0,
      // "Всего дней" = дни с момента регистрации (инклюзивно), а не активные дни из users.total_days
      totalDays:
        profileData?.stats?.totalDays ??
        Math.max(
          1,
          Math.floor(
            (Date.now() -
              (apiUser?.registration_date != null
                ? new Date(apiUser.registration_date).getTime()
                : (currentUser?.registrationDate ?? new Date()).getTime())) /
              (1000 * 60 * 60 * 24)
          ) + 1
        ),
      rareElementsFound: apiUser?.rare_elements_found ?? 0,
      gardensShared: apiUser?.gardens_shared ?? 0,
      totalElements: totalElements,
      totalMoodEntries: profileData?.stats?.totalMoodEntries ?? 0, // 🔧 Добавлено
      firstVisit: currentUser?.stats?.firstVisit ?? new Date(),
      lastVisit: currentUser?.stats?.lastVisit ?? new Date(),
      streakFreezes:
        apiUser?.streak_freezes ?? currentUser?.stats?.streakFreezes ?? 0,
      autoFreezes:
        apiUser?.auto_freezes ?? currentUser?.stats?.autoFreezes ?? 0,
      freeUpgrades:
        apiUser?.free_upgrades ?? currentUser?.stats?.freeUpgrades ?? 0,
    },

    // Настройки из API или fallback
    preferences: {
      privacy: {
        showProfile: apiUser?.privacy_settings?.['showProfile'] ?? true,
        shareGarden: apiUser?.privacy_settings?.['shareGarden'] ?? true,
        shareAchievements:
          apiUser?.privacy_settings?.['shareAchievements'] ?? true,
        allowFriendRequests:
          apiUser?.privacy_settings?.['allowFriendRequests'] ?? true,
        cloudSync: apiUser?.privacy_settings?.['cloudSync'] ?? false,
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

  return (
    <motion.div
      className="space-y-6 pb-8" // Убрал p-4
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
    >
      {/* Заголовок профиля */}
      <ProfileHeader
        user={renderUser}
        stats={profileData?.stats}
        leaderboardPosition={{
          position: levelLeaderboardPosition?.rank ?? null,
          isLoading: leaderboardPositionLoading,
        }}
      />

      {isTelegramEnv &&
        !isKirakiraSyntheticTelegramId(renderUser.telegramId) &&
        renderUser.authUserId === undefined && (
          <ProfileRecoveryAccountId
            telegramId={renderUser.telegramId}
            username={renderUser.username ?? ''}
          />
        )}

      {/* Кнопка просмотра роадмапа */}
      {/* <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <motion.button
          onClick={() => navigate('/mobile/mood-roadmap')}
          className="w-full rounded-xl border border-garden-200 bg-gradient-to-r from-garden-50 to-kira-50 p-4 text-center transition-all hover:from-garden-100 hover:to-kira-100 dark:border-garden-700 dark:from-garden-900/30 dark:to-kira-900/30 dark:hover:from-garden-900/50 dark:hover:to-kira-900/50"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <div className="flex items-center justify-center space-x-2">
            <span className="text-2xl">📖</span>
            <div className="text-left">
              <p className="font-semibold text-gray-900 dark:text-gray-100">
                {t.profile.moodDiary}
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                {t.profile.moodHistory}
              </p>
            </div>
          </div>
        </motion.button>
      </motion.div> */}

      {/* Статистика */}
      <ProfileStats
        user={renderUser}
        garden={null}
        moodStats={moodStats}
        totalElements={totalElements}
      />

      {/* Достижения */}
      <ProfileAchievements
        user={renderUser}
        moodStats={moodStats}
        totalElements={totalElements}
      />
    </motion.div>
  )
}
