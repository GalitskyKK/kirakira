import { useMemo, useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Trophy, RefreshCw, Crown, Flame, Leaf } from 'lucide-react'
import { useTelegramId } from '@/hooks/useTelegramId'
import { useUserSync } from '@/hooks/index.v2'
import { useLeaderboard } from '@/hooks/queries/useLeaderboardQueries'
import {
  Button,
  LoadingSpinner,
  UserAvatar,
  Modal,
  ModalBody,
} from '@/components/ui'
import { FriendGardenView } from '@/components/garden/FriendGardenView'
import { PageHeader } from '@/components/layout'
import { useTranslation } from '@/hooks/useTranslation'
import { useLocaleStore } from '@/stores/localeStore'
import type {
  LeaderboardCategory,
  LeaderboardEntry,
  LeaderboardPeriod,
} from '@/types/api'
import type { User } from '@/types'

interface CategoryConfig {
  readonly id: LeaderboardCategory
  readonly label: string
  readonly description: string
  readonly metricLabel: string
  readonly metricShortLabel: string
  readonly icon: React.ReactNode
  readonly scoreAccessor: (entry: LeaderboardEntry) => number | undefined
}

const getCategoryConfigs = (
  t: ReturnType<typeof useTranslation>
): readonly CategoryConfig[] => [
  {
    id: 'level',
    label: t.leaderboard.level,
    description: t.leaderboard.levelDescription,
    metricLabel: t.leaderboard.levelMetric,
    metricShortLabel: t.leaderboard.levelShort,
    icon: <Crown className="h-4 w-4" />,
    scoreAccessor: entry => entry.stats?.level ?? entry.score,
  },
  {
    id: 'streak',
    label: t.leaderboard.streak,
    description: t.leaderboard.streakDescription,
    metricLabel: t.leaderboard.streakMetric,
    metricShortLabel: t.leaderboard.streakShort,
    icon: <Flame className="h-4 w-4" />,
    scoreAccessor: entry => entry.stats?.current_streak ?? entry.score,
  },
  {
    id: 'elements',
    label: t.leaderboard.elements,
    description: t.leaderboard.elementsDescription,
    metricLabel: t.leaderboard.elementsMetric,
    metricShortLabel: t.leaderboard.elementsShort,
    icon: <Leaf className="h-4 w-4" />,
    scoreAccessor: entry => entry.stats?.total_elements ?? entry.score,
  },
]

const getPeriodOptions = (
  t: ReturnType<typeof useTranslation>
): readonly {
  readonly id: LeaderboardPeriod
  readonly label: string
}[] => [
  { id: 'all_time', label: t.leaderboard.allTime },
  { id: 'monthly', label: t.leaderboard.monthly },
]

const TOP_LIMIT = 20

export function LeaderboardPage() {
  const navigate = useNavigate()
  const t = useTranslation()
  const locale = useLocaleStore(state => state.locale)
  const telegramId = useTelegramId()
  const { data: userData } = useUserSync(telegramId, telegramId != null)
  const currentUser: User | null = userData?.user ?? null

  const categoryConfigs = useMemo(() => getCategoryConfigs(t), [t])
  const periodOptions = useMemo(() => getPeriodOptions(t), [t])

  const [category, setCategory] = useState<LeaderboardCategory>('level')
  const [period, setPeriod] = useState<LeaderboardPeriod>('all_time')
  const [gardenFriendId, setGardenFriendId] = useState<number | null>(null)
  const [isGardenModalOpen, setIsGardenModalOpen] = useState(false)

  const {
    data: leaderboardData,
    isLoading,
    isFetching,
    error,
    refetch,
  } = useLeaderboard({
    category,
    period,
    limit: TOP_LIMIT,
    viewerTelegramId: telegramId ?? undefined,
  })

  const entries = useMemo(() => {
    if (!leaderboardData?.entries) {
      return []
    }
    return leaderboardData.entries
  }, [leaderboardData])
  const viewerPosition = leaderboardData?.viewerPosition ?? null

  const isViewerInList = useMemo(() => {
    if (viewerPosition == null) {
      return false
    }
    return entries.some(
      entry => entry.user.telegram_id === viewerPosition.user.telegram_id
    )
  }, [entries, viewerPosition])

  const categoryConfig = useMemo<CategoryConfig>(() => {
    const foundConfig = categoryConfigs.find(config => config.id === category)
    if (foundConfig !== undefined) {
      return foundConfig
    }
    if (categoryConfigs.length === 0) {
      throw new Error('categoryConfigs must contain at least one entry')
    }
    const fallbackConfig = categoryConfigs[0]
    if (fallbackConfig === undefined) {
      throw new Error('categoryConfigs fallback is undefined')
    }
    return fallbackConfig
  }, [category, categoryConfigs])

  const handleChangeCategory = useCallback(
    (newCategory: LeaderboardCategory) => {
      setCategory(newCategory)
    },
    []
  )

  const handleChangePeriod = useCallback((newPeriod: LeaderboardPeriod) => {
    setPeriod(newPeriod)
  }, [])

  const handleViewProfile = useCallback(
    (entry: LeaderboardEntry) => {
      const entryTelegramId = entry.user.telegram_id
      if (!entryTelegramId) {
        return
      }
      if (entryTelegramId === currentUser?.telegramId) {
        navigate('/profile')
        return
      }
      navigate(`/friend/${entryTelegramId}`)
    },
    [currentUser?.telegramId, navigate]
  )

  const handleViewGarden = useCallback((entry: LeaderboardEntry) => {
    const entryTelegramId = entry.user.telegram_id
    if (!entryTelegramId) {
      return
    }
    setGardenFriendId(entryTelegramId)
    setIsGardenModalOpen(true)
  }, [])

  const closeGardenModal = useCallback(() => {
    setIsGardenModalOpen(false)
    setGardenFriendId(null)
  }, [])

  const renderEntry = useCallback(
    (entry: LeaderboardEntry, highlight = false) => {
      const rank = entry.rank
      const isCurrentUser = entry.user.telegram_id === currentUser?.telegramId
      const scoreValue = categoryConfig.scoreAccessor(entry) ?? entry.score
      const shareGardenSetting =
        entry.user.privacy_settings?.['shareGarden'] ?? undefined
      const canViewGarden =
        currentUser != null && entry.user.telegram_id !== currentUser.telegramId
      const shareGardenAllowed = shareGardenSetting !== false
      const firstNameRaw = entry.user.first_name
      const usernameRaw = entry.user.username
      const hasFirstName =
        typeof firstNameRaw === 'string' && firstNameRaw.trim().length > 0
      const hasUsername =
        typeof usernameRaw === 'string' && usernameRaw.trim().length > 0
      const displayName = hasFirstName
        ? firstNameRaw.trim()
        : hasUsername
          ? usernameRaw.trim()
          : `${t.profile.user} ${entry.user.telegram_id}`
      const usernameLabel =
        hasUsername && typeof usernameRaw === 'string'
          ? `@${usernameRaw.trim()}`
          : null
      const isProfileHidden =
        typeof entry.visibility === 'object' &&
        entry.visibility !== null &&
        'isProfileHidden' in entry.visibility &&
        Boolean(
          (entry.visibility as { readonly isProfileHidden?: boolean })
            .isProfileHidden
        )

      const openProfile = () => {
        handleViewProfile(entry)
      }

      return (
        <motion.div
          key={`${entry.user.telegram_id}-${entry.rank}`}
          layout
          whileHover={{ scale: 1.01 }}
          className={`flex items-center justify-between rounded-2xl border p-4 transition-colors ${
            isCurrentUser
              ? 'border-kira-400/70 bg-kira-50/70 shadow-lg dark:border-kira-500/40 dark:bg-kira-900/30'
              : highlight
                ? 'border-amber-300/80 bg-amber-50/70 dark:border-amber-500/40 dark:bg-amber-900/20'
                : 'border-neutral-200/70 bg-white/70 hover:border-kira-200/70 hover:bg-kira-50/60 dark:border-neutral-700/60 dark:bg-neutral-800/60 dark:hover:border-kira-500/40 dark:hover:bg-neutral-800/80'
          }`}
          role="button"
          tabIndex={0}
          onClick={openProfile}
          onKeyDown={event => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault()
              openProfile()
            }
          }}
        >
          <div className="flex items-center gap-3">
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-full text-base font-semibold ${
                rank <= 3
                  ? 'bg-gradient-to-br from-amber-300 to-amber-500 text-amber-950 dark:from-amber-500 dark:to-amber-600 dark:text-amber-100'
                  : 'bg-neutral-100 text-neutral-700 dark:bg-neutral-700 dark:text-neutral-100'
              }`}
            >
              {rank}
            </div>
            <UserAvatar
              photoUrl={entry.user.photo_url}
              name={displayName}
              username={entry.user.username}
              size="md"
              className="shadow-md"
            />
            <div>
              <div className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                {displayName}
              </div>
              {usernameLabel !== null ? (
                <div className="text-xs text-neutral-500 dark:text-neutral-400">
                  {usernameLabel}
                </div>
              ) : null}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                {scoreValue ?? '—'}
              </div>
              <div className="text-xs text-neutral-500 dark:text-neutral-400">
                {categoryConfig.metricShortLabel}
              </div>
              {isProfileHidden ? (
                <div className="mt-1 text-xs text-amber-500 dark:text-amber-300">
                  {t.leaderboard.profileHidden}
                </div>
              ) : null}
            </div>
            <div className="flex items-center gap-2">
              {shareGardenAllowed ? (
                <Button
                  variant="secondary"
                  size="sm"
                  className="px-3 py-1 text-xs"
                  onClick={event => {
                    event.stopPropagation()
                    handleViewGarden(entry)
                  }}
                  disabled={!canViewGarden}
                >
                  {t.leaderboard.garden}
                </Button>
              ) : (
                <span className="rounded-lg bg-neutral-100 px-2 py-1 text-xs text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400">
                  {t.leaderboard.gardenHidden}
                </span>
              )}
            </div>
          </div>
        </motion.div>
      )
    },
    [categoryConfig, currentUser, handleViewGarden, handleViewProfile]
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-kira-50 via-garden-50 to-neutral-50 dark:from-neutral-900 dark:via-neutral-800 dark:to-neutral-900">
      <PageHeader
        title={t.leaderboard.title}
        icon={<Trophy className="h-5 w-5" />}
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              void refetch()
            }}
            isLoading={isFetching && !isLoading}
            className="p-2"
            aria-label={t.leaderboard.refresh}
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        }
      />

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -16 }}
        transition={{ duration: 0.25 }}
        className="space-y-6 p-4 pb-24"
      >
        <div className="glass-card rounded-3xl border border-neutral-200/60 bg-white/80 p-4 shadow-xl dark:border-neutral-700/60 dark:bg-neutral-900/70">
          <div className="flex flex-wrap gap-2">
            {categoryConfigs.map(config => (
              <button
                key={config.id}
                onClick={() => handleChangeCategory(config.id)}
                className={`flex items-center gap-1 rounded-xl px-3 py-1.5 text-xs font-medium transition-all ${
                  config.id === category
                    ? 'bg-gradient-to-r from-kira-500 to-garden-500 text-white shadow-md'
                    : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700'
                }`}
                type="button"
              >
                {config.icon}
                <span className="max-w-[78px] truncate">{config.label}</span>
              </button>
            ))}
          </div>

          <div className="mt-3 flex gap-1.5">
            {periodOptions.map(option => (
              <button
                key={option.id}
                onClick={() => handleChangePeriod(option.id)}
                className={`rounded-xl px-3 py-1 text-[11px] font-semibold transition ${
                  option.id === period
                    ? 'bg-kira-500/90 text-white shadow'
                    : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700'
                }`}
                type="button"
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          {isLoading ? (
            <div className="flex min-h-[240px] items-center justify-center rounded-3xl border border-neutral-200/60 bg-white/70 dark:border-neutral-700/60 dark:bg-neutral-900/60">
              <LoadingSpinner size="lg" />
            </div>
          ) : error ? (
            <div className="rounded-3xl border border-red-200/60 bg-red-50/80 p-6 text-center dark:border-red-700/60 dark:bg-red-900/30">
              <div className="text-lg font-semibold text-red-700 dark:text-red-200">
                {t.leaderboard.failedToLoad}
              </div>
              <div className="mt-2 text-sm text-red-600 dark:text-red-300">
                {error.message}
              </div>
              <Button
                variant="secondary"
                size="sm"
                className="mt-4"
                onClick={() => {
                  void refetch()
                }}
              >
                {t.leaderboard.tryAgain}
              </Button>
            </div>
          ) : entries.length === 0 ? (
            <div className="rounded-3xl border border-neutral-200/60 bg-white/70 p-6 text-center dark:border-neutral-700/60 dark:bg-neutral-900/60">
              <div className="text-lg font-semibold text-neutral-800 dark:text-neutral-100">
                {t.leaderboard.noOneYet}
              </div>
              <div className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
                {t.leaderboard.beFirst}
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {entries.map(entry => renderEntry(entry, entry.rank <= 3))}
            </div>
          )}

          {!isViewerInList && viewerPosition != null && (
            <div className="mt-6 space-y-2">
              <div className="text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
                {t.leaderboard.yourPosition}
              </div>
              {renderEntry(
                {
                  ...viewerPosition,
                  category,
                  period,
                },
                false
              )}
            </div>
          )}
        </div>

        {leaderboardData?.timestamp != null ? (
          <div className="text-center text-xs text-neutral-500 dark:text-neutral-400">
            {t.leaderboard.updated}:{' '}
            {new Date(leaderboardData.timestamp).toLocaleString(
              locale === 'en' ? 'en-US' : 'ru-RU',
              {
                day: 'numeric',
                month: 'long',
                hour: '2-digit',
                minute: '2-digit',
              }
            )}
          </div>
        ) : null}

        <Modal
          isOpen={isGardenModalOpen}
          onClose={closeGardenModal}
          size="xl"
          title={t.leaderboard.gardenerGarden}
        >
          <ModalBody className="bg-gradient-to-br from-kira-50 to-garden-50 dark:from-neutral-900 dark:to-neutral-800">
            {gardenFriendId != null && currentUser != null ? (
              <FriendGardenView
                friendTelegramId={gardenFriendId}
                currentUser={currentUser}
                onBack={closeGardenModal}
              />
            ) : (
              <div className="p-6 text-center text-sm text-neutral-600 dark:text-neutral-300">
                {t.leaderboard.toViewGarden}
              </div>
            )}
          </ModalBody>
        </Modal>
      </motion.div>
    </div>
  )
}

export default LeaderboardPage
