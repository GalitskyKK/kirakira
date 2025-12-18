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
import { useTranslation } from '@/hooks/useTranslation'
import { useLocaleStore } from '@/stores/localeStore'

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
  const t = useTranslation()

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
      showAlert?.(t.friendProfile.failedToSend)
      return
    }
    if (!canSendFriendRequest) {
      showAlert?.(t.friendProfile.requestUnavailable)
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
        showAlert?.(result.data?.message ?? t.friendProfile.requestSent)
        if (friendTelegramIdNum) {
          await loadFriendProfile(friendTelegramIdNum)
        }
      } else {
        showAlert?.(result?.error ?? t.friendProfile.failedToSend)
        hapticFeedback('error')
      }
    } catch (sendError) {
      console.error('Failed to send friend request:', sendError)
      showAlert?.(t.friendProfile.failedToSend)
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

  const handleCancelRequest = useCallback(async () => {
    if (!profileData?.user.telegram_id || !currentUserTelegramId) {
      showAlert?.(t.friendProfile.failedToCancel)
      return
    }

    try {
      setIsProcessingFriendAction(true)
      const response = await authenticatedFetch(
        '/api/friends?action=cancel-request',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            telegramId: currentUserTelegramId,
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
        showAlert?.(result.data?.message ?? t.friendProfile.requestCancelled)
        if (friendTelegramIdNum) {
          await loadFriendProfile(friendTelegramIdNum)
        }
      } else {
        showAlert?.(result?.error ?? t.friendProfile.failedToCancel)
        hapticFeedback('error')
      }
    } catch (error) {
      console.error('Failed to cancel friend request:', error)
      showAlert?.(t.friendProfile.failedToCancel)
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

  const handleRemoveFriend = useCallback(async () => {
    if (!profileData?.user.telegram_id || !currentUserTelegramId) {
      showAlert?.(t.friendProfile.failedToRemove)
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
        showAlert?.(result.data?.message ?? t.friendProfile.removedFromFriends)
        setShowRemoveConfirm(false)
        if (friendTelegramIdNum) {
          await loadFriendProfile(friendTelegramIdNum)
        }
      } else {
        showAlert?.(result?.error ?? t.friendProfile.failedToRemove)
        hapticFeedback('error')
      }
    } catch (error) {
      console.error('Failed to remove friend:', error)
      showAlert?.(t.friendProfile.failedToRemove)
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
        showAlert?.(t.friendProfile.noData)
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
          showAlert?.(result.data?.message ?? t.friendProfile.requestUpdated)
          if (friendTelegramIdNum) {
            await loadFriendProfile(friendTelegramIdNum)
          }
        } else {
          showAlert?.(result?.error ?? t.friendProfile.failedToProcess)
          hapticFeedback('error')
        }
      } catch (respondError) {
        console.error('Failed to respond to friend request:', respondError)
        showAlert?.(t.friendProfile.failedToProcess)
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
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowRemoveConfirm(true)}
            className="flex items-center gap-2 border-emerald-300 bg-emerald-50 text-emerald-700 hover:border-red-300 hover:bg-red-50 hover:text-red-600 dark:border-emerald-500/40 dark:bg-emerald-900/30 dark:text-emerald-300 dark:hover:border-red-500/40 dark:hover:bg-red-900/30 dark:hover:text-red-300"
          >
            <UserCheck className="h-4 w-4" />
            {t.friendProfile.inFriends}
          </Button>

          {/* Confirmation Modal */}
          {showRemoveConfirm && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
              <motion.div
                className="max-w-sm rounded-2xl border border-neutral-200 bg-white p-6 shadow-xl dark:border-neutral-700 dark:bg-neutral-800"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                <h3 className="mb-2 text-lg font-bold text-neutral-900 dark:text-neutral-100">
                  {t.friendProfile.removeFromFriends}
                </h3>
                <p className="mb-6 text-sm text-neutral-600 dark:text-neutral-400">
                  {t.friendProfile.removeConfirm}{' '}
                  {profileData?.user.first_name || t.profile.user}{' '}
                  {t.friendProfile.removeConfirmText}
                </p>
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowRemoveConfirm(false)}
                    className="flex-1"
                  >
                    {t.common.cancel}
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
                    {t.friendProfile.remove}
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
        <Button
          variant="outline"
          size="sm"
          className="flex items-center gap-2 border-amber-300 bg-amber-50 text-amber-700 hover:border-red-300 hover:bg-red-50 hover:text-red-600 dark:border-amber-500/40 dark:bg-amber-900/30 dark:text-amber-300 dark:hover:border-red-500/40 dark:hover:bg-red-900/30 dark:hover:text-red-300"
          onClick={() => {
            void handleCancelRequest()
          }}
          isLoading={isProcessingFriendAction}
        >
          <X className="h-4 w-4" />
          {t.friendProfile.cancelRequest}
        </Button>
      )
    }

    if (relationshipStatus === 'pending_incoming') {
      return (
        <div className="flex items-center gap-2">
          <Button
            variant="primary"
            size="sm"
            className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600"
            onClick={() => {
              void handleRespondRequest('accept')
            }}
            isLoading={isProcessingFriendAction}
          >
            <Check className="h-4 w-4" />
            {t.friendProfile.accept}
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex items-center gap-2 border-red-300 text-red-600 hover:border-red-400 hover:bg-red-50 dark:border-red-500/40 dark:text-red-400 dark:hover:bg-red-900/30"
            onClick={() => {
              void handleRespondRequest('decline')
            }}
            isLoading={isProcessingFriendAction}
          >
            <X className="h-4 w-4" />
            {t.friendProfile.decline}
          </Button>
        </div>
      )
    }

    if (!canSendFriendRequest) {
      return (
        <Button
          variant="outline"
          size="sm"
          disabled
          className="flex cursor-not-allowed items-center gap-2 opacity-50"
        >
          <Ban className="h-4 w-4" />
          {t.friendProfile.requestUnavailable}
        </Button>
      )
    }

    return (
      <Button
        variant="primary"
        size="sm"
        className="flex items-center gap-2 bg-kira-500 hover:bg-kira-600"
        onClick={handleAddFriend}
        isLoading={isProcessingFriendAction}
      >
        <UserPlus className="h-4 w-4" />
        {t.friendProfile.addToFriends}
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
            {t.friendProfile.loadingProfile}
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
            {t.friendProfile.profileUnavailable}
          </h1>
          <p className="mb-6 text-gray-600 dark:text-gray-400">{error}</p>
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center rounded-lg bg-garden-500 px-6 py-3 text-white transition-colors hover:bg-garden-600"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t.friendProfile.back}
          </button>
        </motion.div>
      </div>
    )
  }

  if (!profileData) {
    return null
  }

  const { user, stats, achievements, privacy } = profileData
  const displayName = user.first_name || user.username || t.profile.user
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
            {t.friendProfile.back}
          </button>
          <h1 className="font-semibold text-gray-900 dark:text-gray-100">
            {t.friendProfile.title}
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
                      ? t.friendProfile.todayJoined
                      : daysSinceRegistration === 1
                        ? `1 ${t.friendProfile.dayWithUs}`
                        : `${daysSinceRegistration} ${t.friendProfile.daysWithUs}`}
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
              📊 {t.friendProfile.statistics}
            </h2>

            <div className="grid grid-cols-2 gap-3">
              <StatCard
                emoji="🔥"
                label={t.friendProfile.bestStreak}
                value={stats.longestStreak || 0}
              />
              <StatCard
                emoji="🌱"
                label={t.friendProfile.plants}
                value={stats.totalElements || 0}
              />
              <StatCard
                emoji="📅"
                label={t.friendProfile.totalDays}
                value={stats.totalDays || 0}
              />
              <StatCard
                emoji="⭐"
                label={t.friendProfile.rareElements}
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
              {t.friendProfile.privateGarden}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {t.friendProfile.userHidStats}
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
                🏆 {t.friendProfile.achievements}
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
              {t.friendProfile.privateAchievements}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {t.friendProfile.userHidAchievements}
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
                {t.friendProfile.privacySettings}
              </div>
              <div className="mt-1 text-xs text-blue-600 dark:text-blue-300">
                {t.friendProfile.userAllowed}{' '}
                {privacy.shareGarden && privacy.shareAchievements
                  ? t.friendProfile.profileStatsAchievements
                  : privacy.shareGarden
                    ? t.friendProfile.profileStats
                    : privacy.shareAchievements
                      ? t.friendProfile.profileAchievements
                      : t.friendProfile.onlyProfile}
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
  const t = useTranslation()
  const locale = useLocaleStore(state => state.locale)
  const emoji = achievement.achievements?.emoji ?? '🏆'
  const name = achievement.achievements?.name ?? achievement.achievement_id
  const description =
    achievement.achievements?.description ?? t.profile.achievements

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
            {new Date(achievement.unlocked_at).toLocaleDateString(
              locale === 'en' ? 'en-US' : 'ru-RU'
            )}
          </div>
        )}
      </div>
    </motion.div>
  )
}
