import { useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ArrowLeft,
  Lock,
  Eye,
  Users,
  UserPlus,
  UserCheck,
  Ban,
  Check,
  X,
} from 'lucide-react'
import { LoadingSpinner, UserAvatar, Button } from '@/components/ui'
import { useFriendProfileData } from '@/hooks/useProfile'
import { GARDENER_LEVELS } from '@/utils/achievements'
import type {
  DatabaseUser,
  DatabaseUserStats,
  DatabaseAchievement,
  FriendRelationshipInfo,
} from '@/types/api'
import { useTelegramId } from '@/hooks/useTelegramId'
import { useTelegram } from '@/hooks'
import { useCallback, useMemo, useState } from 'react'
import { authenticatedFetch } from '@/utils/apiClient'

interface FriendProfileData {
  readonly user: DatabaseUser
  readonly stats: DatabaseUserStats
  readonly achievements: readonly DatabaseAchievement[]
  readonly privacy: {
    readonly showProfile: boolean
    readonly shareGarden: boolean
    readonly shareAchievements: boolean
  }
  readonly relationship?: FriendRelationshipInfo | undefined
}

export default function FriendProfilePage() {
  const { friendTelegramId } = useParams<{ friendTelegramId: string }>()
  const navigate = useNavigate()

  // Используем новый v2 хук с автоматической загрузкой
  const friendTelegramIdNum = friendTelegramId
    ? parseInt(friendTelegramId)
    : undefined
  const { friendProfile, isLoading, error, loadFriendProfile } =
    useFriendProfileData(friendTelegramIdNum)

  const currentUserTelegramId = useTelegramId()
  const { hapticFeedback, showAlert } = useTelegram()
  const [isProcessingFriendAction, setIsProcessingFriendAction] =
    useState(false)
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false)

  useEffect(() => {
    if (!friendTelegramId) {
      navigate('/')
      return
    }
  }, [friendTelegramId, navigate])

  // Конвертируем данные в нужный формат
  const profileData: FriendProfileData | null = friendProfile
    ? {
        user: friendProfile.user,
        stats: friendProfile.stats,
        achievements: friendProfile.achievements,
        privacy: {
          showProfile:
            friendProfile.user.privacy_settings?.['showProfile'] ?? true,
          shareGarden:
            friendProfile.user.privacy_settings?.['shareGarden'] ?? true,
          shareAchievements:
            friendProfile.user.privacy_settings?.['shareAchievements'] ?? true,
        },
        relationship: friendProfile.relationship,
      }
    : null

  // Упрощенная логика определения статуса дружбы
  const relationshipStatus = useMemo(() => {
    const relationship = profileData?.relationship
    if (!relationship) return 'none'

    // Используем напрямую статус из relationship API
    if (relationship.status === 'friend') return 'friend'
    if (relationship.status === 'blocked') return 'blocked'

    // Для pending определяем направление
    if (
      relationship.status === 'pending' ||
      relationship.status === 'pending_outgoing'
    ) {
      return relationship.pendingDirection === 'incoming'
        ? 'pending_incoming'
        : 'pending_outgoing'
    }

    if (relationship.status === 'pending_incoming') {
      return 'pending_incoming'
    }

    return 'none'
  }, [profileData])

  const canSendFriendRequest = useMemo(() => {
    return relationshipStatus === 'none'
  }, [relationshipStatus])

  const handleAddFriend = useCallback(async () => {
    if (!profileData?.user.telegram_id || !currentUserTelegramId) {
      showAlert?.('Не удалось отправить запрос: нет данных пользователя')
      return
    }
    if (!canSendFriendRequest) {
      showAlert?.('Запрос уже отправлен или недоступен')
      return
    }
    try {
      setIsProcessingFriendAction(true)
      const response = await authenticatedFetch(
        '/api/friends?action=send-request',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            requesterTelegramId: currentUserTelegramId,
            addresseeTelegramId: profileData.user.telegram_id,
          }),
        }
      )

      const result = (await response.json()) as {
        success?: boolean
        data?: { message?: string }
        error?: string
      }
      if (response.ok && result?.success) {
        hapticFeedback('success')
        showAlert?.(result.data?.message ?? 'Запрос отправлен')
        if (friendTelegramIdNum) {
          await loadFriendProfile(friendTelegramIdNum)
        }
      } else {
        showAlert?.(result?.error ?? 'Не удалось отправить запрос')
        hapticFeedback('error')
      }
    } catch (sendError) {
      console.error('Failed to send friend request:', sendError)
      showAlert?.('Не удалось отправить запрос')
      hapticFeedback('error')
    } finally {
      setIsProcessingFriendAction(false)
    }
  }, [
    currentUserTelegramId,
    friendTelegramIdNum,
    hapticFeedback,
    loadFriendProfile,
    profileData?.user.telegram_id,
    showAlert,
    canSendFriendRequest,
  ])

  const handleRemoveFriend = useCallback(async () => {
    if (!profileData?.user.telegram_id || !currentUserTelegramId) {
      showAlert?.('Не удалось удалить из друзей')
      return
    }

    try {
      setIsProcessingFriendAction(true)
      const response = await authenticatedFetch(
        '/api/friends?action=remove-friend',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            telegramId: currentUserTelegramId,
            friendTelegramId: profileData.user.telegram_id,
          }),
        }
      )

      const result = (await response.json()) as {
        success?: boolean
        data?: { message?: string }
        error?: string
      }

      if (response.ok && result?.success) {
        hapticFeedback('success')
        showAlert?.(result.data?.message ?? 'Удалено из друзей')
        setShowRemoveConfirm(false)
        if (friendTelegramIdNum) {
          await loadFriendProfile(friendTelegramIdNum)
        }
      } else {
        showAlert?.(result?.error ?? 'Не удалось удалить из друзей')
        hapticFeedback('error')
      }
    } catch (error) {
      console.error('Failed to remove friend:', error)
      showAlert?.('Не удалось удалить из друзей')
      hapticFeedback('error')
    } finally {
      setIsProcessingFriendAction(false)
    }
  }, [
    currentUserTelegramId,
    friendTelegramIdNum,
    hapticFeedback,
    loadFriendProfile,
    profileData?.user.telegram_id,
    showAlert,
  ])

  const handleRespondRequest = useCallback(
    async (action: 'accept' | 'decline') => {
      if (!profileData?.user.telegram_id || !currentUserTelegramId) {
        showAlert?.('Нет данных для обработки запроса')
        return
      }
      try {
        setIsProcessingFriendAction(true)
        const response = await authenticatedFetch(
          '/api/friends?action=respond-request',
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              telegramId: currentUserTelegramId,
              requesterTelegramId: profileData.user.telegram_id,
              action,
            }),
          }
        )

        const result = (await response.json()) as {
          success?: boolean
          data?: { message?: string }
          error?: string
        }
        if (response.ok && result?.success) {
          hapticFeedback(action === 'accept' ? 'success' : 'warning')
          showAlert?.(result.data?.message ?? 'Запрос обновлён')
          if (friendTelegramIdNum) {
            await loadFriendProfile(friendTelegramIdNum)
          }
        } else {
          showAlert?.(result?.error ?? 'Не удалось обработать запрос')
          hapticFeedback('error')
        }
      } catch (respondError) {
        console.error('Failed to respond to friend request:', respondError)
        showAlert?.('Ошибка при обработке запроса')
        hapticFeedback('error')
      } finally {
        setIsProcessingFriendAction(false)
      }
    },
    [
      currentUserTelegramId,
      friendTelegramIdNum,
      hapticFeedback,
      loadFriendProfile,
      profileData?.user.telegram_id,
      showAlert,
    ]
  )

  const renderFriendshipAction = () => {
    if (!profileData || !currentUserTelegramId) {
      return null
    }
    if (
      profileData.user.telegram_id === currentUserTelegramId ||
      relationshipStatus === 'blocked'
    ) {
      return null
    }

    if (relationshipStatus === 'friend') {
      return (
        <>
          <button
            onClick={() => setShowRemoveConfirm(true)}
            className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-600 transition-colors hover:border-red-300 hover:bg-red-50 hover:text-red-600 dark:border-emerald-500/40 dark:bg-emerald-900/20 dark:text-emerald-300 dark:hover:border-red-500/40 dark:hover:bg-red-900/20 dark:hover:text-red-300"
          >
            <UserCheck className="h-3.5 w-3.5" />В друзьях
          </button>

          {/* Confirmation Modal */}
          {showRemoveConfirm && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
              <motion.div
                className="max-w-sm rounded-2xl border border-neutral-200 bg-white p-6 shadow-xl dark:border-neutral-700 dark:bg-neutral-800"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                <h3 className="mb-2 text-lg font-bold text-neutral-900 dark:text-neutral-100">
                  Удалить из друзей?
                </h3>
                <p className="mb-6 text-sm text-neutral-600 dark:text-neutral-400">
                  Вы уверены, что хотите удалить{' '}
                  {profileData?.user.first_name || 'пользователя'} из друзей?
                </p>
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowRemoveConfirm(false)}
                    className="flex-1"
                  >
                    Отмена
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => {
                      void handleRemoveFriend()
                    }}
                    isLoading={isProcessingFriendAction}
                    className="flex-1 bg-red-500 hover:bg-red-600"
                  >
                    Удалить
                  </Button>
                </div>
              </motion.div>
            </div>
          )}
        </>
      )
    }

    if (relationshipStatus === 'pending_outgoing') {
      return (
        <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-600 dark:border-amber-500/40 dark:bg-amber-900/20 dark:text-amber-300">
          <Ban className="h-3.5 w-3.5" />
          Запрос отправлен
        </div>
      )
    }

    if (relationshipStatus === 'pending_incoming') {
      return (
        <div className="flex items-center gap-2">
          <Button
            variant="primary"
            size="sm"
            className="flex items-center gap-2 px-3 py-1 text-xs"
            onClick={() => {
              void handleRespondRequest('accept')
            }}
            isLoading={isProcessingFriendAction}
          >
            <Check className="h-4 w-4" />
            Принять
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex items-center gap-2 px-3 py-1 text-xs"
            onClick={() => {
              void handleRespondRequest('decline')
            }}
            isLoading={isProcessingFriendAction}
          >
            <X className="h-4 w-4" />
            Отклонить
          </Button>
        </div>
      )
    }

    if (!canSendFriendRequest) {
      return (
        <div className="flex items-center gap-2 rounded-xl border border-neutral-200 bg-neutral-100 px-3 py-1.5 text-xs font-medium text-neutral-500 dark:border-neutral-700/60 dark:bg-neutral-800/60 dark:text-neutral-300">
          <Ban className="h-3.5 w-3.5" />
          Запрос недоступен
        </div>
      )
    }

    return (
      <Button
        variant="primary"
        size="sm"
        className="flex items-center gap-2 px-3 py-1 text-xs"
        onClick={handleAddFriend}
        isLoading={isProcessingFriendAction}
      >
        <UserPlus className="h-4 w-4" />
        Добавить в друзья
      </Button>
    )
  }

  const friendshipActionElement = renderFriendshipAction()

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-kira-50 via-garden-50 to-neutral-50 dark:from-neutral-900 dark:via-neutral-800 dark:to-neutral-900">
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

  // Подсчет дней с регистрации
  const daysSinceRegistration = Math.floor(
    (Date.now() - new Date(user.registration_date).getTime()) /
      (1000 * 60 * 60 * 24)
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-kira-50 via-garden-50 to-neutral-50 dark:from-neutral-900 dark:via-neutral-800 dark:to-neutral-900">
      {/* Header */}
      <div className="glass-card sticky top-0 z-10 border-b border-neutral-200/50 backdrop-blur-md dark:border-neutral-700/50">
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
          <div className="w-16" />
        </div>
      </div>

      <div className="space-y-6 p-4 pb-8">
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
                className="rounded-full shadow-lg ring-4 ring-white dark:ring-gray-800"
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

              {friendshipActionElement !== null && (
                <div className="pt-2">{friendshipActionElement}</div>
              )}
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
  achievement: DatabaseAchievement
  delay: number
}

function AchievementBadge({ achievement, delay }: AchievementBadgeProps) {
  // 🔥 ИСПРАВЛЕНИЕ: Используем данные из join-а вместо achievement_id
  // TypeScript автоматически выведет тип из DatabaseAchievement.achievements
  const emoji = achievement.achievements?.emoji ?? '🏆'
  const name = achievement.achievements?.name ?? achievement.achievement_id
  const description =
    achievement.achievements?.description ?? 'Достижение получено!'

  return (
    <motion.div
      className="rounded-xl border border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50 p-4 dark:border-blue-700 dark:from-blue-900/30 dark:to-indigo-900/30"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay, duration: 0.3 }}
    >
      <div className="text-center">
        <div className="mb-2 text-3xl">{emoji}</div>
        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
          {name}
        </div>
        <div className="mt-1 text-xs text-gray-600 dark:text-gray-400">
          {description}
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
