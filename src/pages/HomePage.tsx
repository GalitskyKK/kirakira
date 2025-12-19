import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Sprout, TrendingUp, Calendar } from 'lucide-react'
import { GardenView } from '@/components/garden'
import { MoodCheckin, MoodStats } from '@/components/mood'
import { Card, TextTyping } from '@/components/ui'
import {
  useGardenState,
  useMoodTracking,
  useElementGeneration,
  useAnimationConfig,
} from '@/hooks'
import { formatDate } from '@/utils/dateHelpers'
import { Navigate } from 'react-router-dom'
import { useTranslation } from '@/hooks/useTranslation'
import { useLocaleStore } from '@/stores/localeStore'

export function HomePage() {
  const { garden: _garden, gardenStats } = useGardenState()
  const { todaysMood, streakCount } = useMoodTracking()
  const { canUnlock, getMilestoneInfo } = useElementGeneration()
  const { transition } = useAnimationConfig()
  const t = useTranslation()
  const locale = useLocaleStore(state => state.locale)
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined'
      ? window.matchMedia('(max-width: 767px)').matches
      : false
  )

  const milestoneInfo = getMilestoneInfo

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

  // Desktop layout
  return (
    <div className="min-h-screen bg-gradient-to-br from-kira-50 via-garden-50 to-neutral-50 dark:from-neutral-900 dark:via-neutral-800 dark:to-neutral-900">
      <div className="container mx-auto max-w-7xl px-4 py-6">
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
            <MoodCheckin className="mb-6" />

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
            <div>
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
