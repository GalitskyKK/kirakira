import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Sprout, TrendingUp, Calendar } from 'lucide-react'
import { GardenView } from '@/components/garden'
import { MoodCheckin, MoodStats } from '@/components/mood'
import {
  Card,
  CurrencyDisplay,
  TextTyping,
  PageHint,
  StreakFreezeIndicator,
} from '@/components/ui'
import {
  useGardenState,
  useMoodTracking,
  useElementGeneration,
  useAnimationConfig,
  useCurrencySync,
} from '@/hooks'
import { formatDate } from '@/utils/dateHelpers'
import { Navigate, useNavigate } from 'react-router-dom'
import { useTranslation } from '@/hooks/useTranslation'
import { useLocaleStore } from '@/stores/localeStore'
import { PAGE_HINT_IDS, hasSeenPageHint } from '@/utils/storage'
import { useTelegramId } from '@/hooks/useTelegramId'
import { useUserSync } from '@/hooks/index.v2'
import { getMaxStreakFreezes } from '@/utils/levelsData'

export function HomePage() {
  const navigate = useNavigate()
  const { garden: _garden, gardenStats } = useGardenState()
  const { todaysMood, streakCount } = useMoodTracking()
  const { canUnlock, getMilestoneInfo } = useElementGeneration()
  const { transition } = useAnimationConfig()
  useCurrencySync()
  const t = useTranslation()
  const locale = useLocaleStore(state => state.locale)
  const telegramId = useTelegramId()
  const { data: userData } = useUserSync(telegramId, !!telegramId)
  const currentUser = userData?.user
  const maxStreakFreezes = getMaxStreakFreezes(currentUser?.level ?? 1)
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined'
      ? window.matchMedia('(max-width: 767px)').matches
      : false
  )

  const milestoneInfo = getMilestoneInfo
  const [hintVersion, setHintVersion] = useState(0)

  const activeHintId = useMemo(() => {
    const candidates = [
      PAGE_HINT_IDS.mood,
      PAGE_HINT_IDS.garden,
      PAGE_HINT_IDS.stats,
    ]
    return candidates.find(id => !hasSeenPageHint(id)) ?? null
  }, [hintVersion])

  // Отслеживаем изменение медиа-запроса без навигации по роуту
  useEffect(() => {
    if (typeof window === 'undefined') return
    const mediaQuery = window.matchMedia('(max-width: 767px)')
    const handleChange = (event: MediaQueryListEvent) => {
      setIsMobile(event.matches)
    }
    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  // Mobile layout
  if (isMobile) {
    return <Navigate to="/mobile" replace />
  }

  const openShop = () => {
    navigate('/mobile/shop')
  }

  // Desktop layout
  return (
    <div className="min-h-screen bg-gradient-to-br from-kira-50 via-garden-50 to-neutral-50 dark:from-neutral-900 dark:via-neutral-800 dark:to-neutral-900">
      <div className="container mx-auto max-w-7xl px-4 py-6">
        {activeHintId === PAGE_HINT_IDS.mood && (
          <PageHint
            id={PAGE_HINT_IDS.mood}
            title={t.hints.mood.title}
            description={t.hints.mood.description}
            actionLabel={t.hints.dismiss}
            targetSelector='[data-hint-target="desktop-mood-checkin"]'
            onDismiss={() => setHintVersion(prev => prev + 1)}
          />
        )}
        {activeHintId === PAGE_HINT_IDS.garden && (
          <PageHint
            id={PAGE_HINT_IDS.garden}
            title={t.hints.garden.title}
            description={t.hints.garden.description}
            actionLabel={t.hints.dismiss}
            targetSelector='[data-hint-target="garden-elements"]'
            onDismiss={() => setHintVersion(prev => prev + 1)}
          />
        )}
        {activeHintId === PAGE_HINT_IDS.stats && (
          <PageHint
            id={PAGE_HINT_IDS.stats}
            title={t.hints.stats.title}
            description={t.hints.stats.description}
            actionLabel={t.hints.dismiss}
            targetSelector='[data-hint-target="desktop-stats"]'
            onDismiss={() => setHintVersion(prev => prev + 1)}
          />
        )}

        <div className="mb-4 flex items-center justify-end">
          <div className="flex items-center gap-3 rounded-2xl bg-white/70 px-3 py-1.5 shadow-sm backdrop-blur dark:bg-neutral-900/70">
            <button
              type="button"
              onClick={openShop}
              title="Открыть магазин"
              aria-label="Открыть магазин"
              className="rounded-lg bg-gradient-to-r from-green-500/10 to-purple-500/10 px-3 py-1.5 transition-colors hover:from-green-500/20 hover:to-purple-500/20"
            >
              <CurrencyDisplay size="md" variant="compact" showBorder={false} />
            </button>

            {currentUser?.stats && (
              <>
                <div className="h-6 w-px bg-neutral-300 dark:bg-neutral-600" />
                <StreakFreezeIndicator
                  manual={currentUser.stats.streakFreezes}
                  auto={currentUser.stats.autoFreezes}
                  max={maxStreakFreezes}
                  showBorder={false}
                />
              </>
            )}
          </div>
        </div>

        {/* Header - оптимизировано */}
        <motion.div
          className="mb-8 text-center"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={transition}
        >
          <motion.div
            className="mb-2 text-5xl font-bold"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={transition}
          >
            <TextTyping className="" />
          </motion.div>
          <p className="text-lg text-neutral-600 dark:text-neutral-400">
            {t.garden.yourDigitalGarden}
          </p>
          <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-500">
            {formatDate(new Date(), 'EEEE, dd MMMM yyyy', locale)}
          </p>
        </motion.div>

        {/* Main Grid - оптимизировано */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Mood Check-in */}
          <motion.div
            className="lg:col-span-1"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={transition}
          >
            <div data-hint-target="desktop-mood-checkin">
              <MoodCheckin className="mb-6" />
            </div>

            {/* Quick Stats */}
            <div className="mb-6 grid grid-cols-2 gap-3">
              <Card padding="sm" className="glass-card text-center">
                <div className="mb-1 text-3xl font-bold text-garden-600 dark:text-garden-400">
                  {gardenStats.totalElements}
                </div>
                <div className="text-xs font-medium text-neutral-600 dark:text-neutral-400">
                  {t.garden.plants}
                </div>
              </Card>

              <Card padding="sm" className="glass-card text-center">
                <div className="mb-1 text-3xl font-bold text-kira-600 dark:text-kira-400">
                  {streakCount}
                </div>
                <div className="text-xs font-medium text-neutral-600 dark:text-neutral-400">
                  {t.garden.daysInRow}
                </div>
              </Card>
            </div>

            {/* Milestone Progress */}
            {milestoneInfo.nextMilestone && (
              <Card padding="sm" className="glass-card mb-6">
                <div className="mb-2 flex items-center space-x-2">
                  <Calendar
                    size={16}
                    className="text-kira-600 dark:text-kira-400"
                  />
                  <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                    {t.pages.mood.untilMilestone}
                  </span>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-neutral-600 dark:text-neutral-400">
                      {milestoneInfo.nextMilestone.title}
                    </span>
                    <span className="font-medium text-neutral-900 dark:text-neutral-100">
                      {milestoneInfo.daysToNext} {t.pages.mood.days}
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-neutral-200 dark:bg-neutral-700">
                    <motion.div
                      className="h-2 rounded-full bg-gradient-to-r from-kira-500 via-kira-400 to-garden-500"
                      initial={{ width: 0 }}
                      animate={{ width: `${milestoneInfo.progress}%` }}
                      transition={transition}
                    />
                  </div>
                  <div className="text-xs text-neutral-500 dark:text-neutral-400">
                    {t.pages.mood.reward}: {milestoneInfo.nextMilestone.reward}
                  </div>
                </div>
              </Card>
            )}

            {/* Today's status */}
            <Card padding="sm" variant="glass">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-neutral-600 dark:text-neutral-400">
                    {t.pages.mood.mood}
                  </span>
                  <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                    {todaysMood ? t.pages.mood.checked : t.pages.mood.waiting}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-neutral-600 dark:text-neutral-400">
                    {t.pages.mood.plant}
                  </span>
                  <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                    {canUnlock ? t.pages.mood.readyToGrow : t.pages.mood.grown}
                  </span>
                </div>
              </div>
            </Card>
          </motion.div>

          {/* Garden View */}
          <motion.div
            className="lg:col-span-2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={transition}
          >
            <GardenView compact />
          </motion.div>
        </div>

        {/* Stats Section - оптимизировано */}
        <motion.div
          className="mt-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={transition}
        >
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Mood Statistics */}
            <div data-hint-target="desktop-stats">
              <h2 className="mb-4 flex items-center space-x-2 text-xl font-semibold text-neutral-900 dark:text-neutral-100">
                <TrendingUp
                  size={24}
                  className="text-kira-600 dark:text-kira-400"
                />
                <span>{t.pages.mood.moodAnalytics}</span>
              </h2>
              <MoodStats />
            </div>

            {/* Garden Insights */}
            <div>
              <h2 className="mb-4 flex items-center space-x-2 text-xl font-semibold text-neutral-900 dark:text-neutral-100">
                <Sprout
                  size={24}
                  className="text-garden-600 dark:text-garden-400"
                />
                <span>{t.pages.mood.gardenComposition}</span>
              </h2>

              <div className="space-y-4">
                <Card padding="sm" variant="glass">
                  <h3 className="mb-3 text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                    {t.garden.composition}
                  </h3>

                  {Object.keys(gardenStats.elementsByType).length > 0 ? (
                    <div className="space-y-2">
                      {Object.entries(gardenStats.elementsByType).map(
                        ([type, count]) => (
                          <div
                            key={type}
                            className="flex justify-between text-sm"
                          >
                            <span className="capitalize text-neutral-600 dark:text-neutral-400">
                              {type}
                            </span>
                            <span className="font-medium text-neutral-900 dark:text-neutral-100">
                              {count}
                            </span>
                          </div>
                        )
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-neutral-500 dark:text-neutral-400">
                      {t.pages.mood.emptyGarden}
                    </p>
                  )}
                </Card>

                <Card padding="sm" variant="glass">
                  <h3 className="mb-3 text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                    {t.garden.elementRarity}
                  </h3>

                  {Object.keys(gardenStats.elementsByRarity).length > 0 ? (
                    <div className="space-y-2">
                      {Object.entries(gardenStats.elementsByRarity).map(
                        ([rarity, count]) => {
                          const colors: Record<string, string> = {
                            common: 'text-neutral-600 dark:text-neutral-400',
                            uncommon: 'text-garden-600 dark:text-garden-400',
                            rare: 'text-kira-600 dark:text-kira-400',
                            epic: 'text-kira-700 dark:text-kira-300',
                            legendary: 'text-yellow-600 dark:text-yellow-400',
                          }
                          return (
                            <div
                              key={rarity}
                              className="flex justify-between text-sm"
                            >
                              <span
                                className={`capitalize ${colors[rarity] ?? 'text-neutral-600'}`}
                              >
                                {rarity}
                              </span>
                              <span className="font-medium text-neutral-900 dark:text-neutral-100">
                                {count}
                              </span>
                            </div>
                          )
                        }
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-neutral-500 dark:text-neutral-400">
                      {t.garden.noRarityData}
                    </p>
                  )}
                </Card>

                {gardenStats.newestElement &&
                  gardenStats.newestElement.emoji && (
                    <Card padding="sm" variant="glass">
                      <h3 className="mb-3 text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                        {t.garden.lastPlant}
                      </h3>
                      <div className="flex items-center space-x-3">
                        <div className="text-2xl">
                          {gardenStats.newestElement.emoji}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                            {gardenStats.newestElement.name}
                          </p>
                          <p className="text-xs text-neutral-600 dark:text-neutral-400">
                            {formatDate(
                              gardenStats.newestElement.unlockDate instanceof
                                Date
                                ? gardenStats.newestElement.unlockDate
                                : new Date(
                                    gardenStats.newestElement.unlockDate
                                  ),
                              'dd MMM в HH:mm'
                            )}
                          </p>
                        </div>
                      </div>
                    </Card>
                  )}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
