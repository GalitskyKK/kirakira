import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MobileTabNavigation } from './MobileTabNavigation'
import { GardenView } from '@/components/garden'
import { MoodCheckin, MoodStats } from '@/components/mood'
import { TelegramCommunity } from '@/components/telegram'
import { TelegramStatus } from '@/components/ui'
import { ProfilePage } from '@/pages/ProfilePage'
import { useGardenState, useMoodTracking } from '@/hooks'
import { useGardenHistory } from '@/hooks/queries/useGardenQueries'
import { useMoodHistory } from '@/hooks/queries/useMoodQueries'
import { useUserStore } from '@/stores'

const tabVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 300 : -300,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    x: direction < 0 ? 300 : -300,
    opacity: 0,
  }),
}

const TABS = ['mood', 'garden', 'community', 'stats', 'profile']

export function MobileLayout() {
  const [activeTab, setActiveTab] = useState('mood')
  const { currentUser } = useUserStore()
  const { garden, gardenStats, updateGarden } = useGardenState()
  const { canCheckinToday, setMoodHistory: updateMoodHistory } =
    useMoodTracking()

  // Load data using React Query
  const { data: gardenElements, isLoading: gardenLoading } = useGardenHistory(
    currentUser?.telegramId
  )
  const { data: moodHistory, isLoading: moodLoading } = useMoodHistory(
    currentUser?.telegramId,
    currentUser?.id ?? ''
  )

  const tabIndex = TABS.indexOf(activeTab)
  const [direction, setDirection] = useState(0)

  // Sync React Query data to local stores for UI/statistics
  useEffect(() => {
    if (gardenElements && currentUser && gardenElements.length > 0) {
      updateGarden({
        elements: gardenElements,
      })
    }
  }, [gardenElements, currentUser, updateGarden])

  useEffect(() => {
    if (moodHistory && moodHistory.length > 0) {
      updateMoodHistory(moodHistory)
    }
  }, [moodHistory, updateMoodHistory])

  // Show loading state
  if (gardenLoading || moodLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mb-4 text-4xl">🌸</div>
          <div className="text-lg text-gray-600">Загрузка данных...</div>
        </div>
      </div>
    )
  }

  const handleTabChange = (newTab: string) => {
    const newIndex = TABS.indexOf(newTab)
    setDirection(newIndex > tabIndex ? 1 : -1)
    setActiveTab(newTab)
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'mood':
        return (
          <div className="space-y-6 p-4">
            {/* Quick Status */}
            <div className="text-center">
              <h1 className="mb-2 text-2xl font-bold text-gray-900 dark:text-gray-100">
                🌸 KiraKira
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {!canCheckinToday()
                  ? 'Настроение отмечено'
                  : 'Как дела сегодня?'}
              </p>
            </div>

            {/* Mood Check-in */}
            <MoodCheckin />

            {/* Quick Stats Cards */}
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-gradient-to-br from-garden-50 to-green-50 p-4 dark:from-garden-900/30 dark:to-green-900/30">
                <div className="text-2xl font-bold text-garden-600 dark:text-garden-400">
                  {gardenStats.totalElements}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Растений
                </div>
              </div>

              <div className="rounded-2xl bg-gradient-to-br from-orange-50 to-yellow-50 p-4 dark:from-orange-900/30 dark:to-yellow-900/30">
                <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                  {garden?.streak ?? 0}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Дней подряд
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="space-y-3">
              <button
                onClick={() => setActiveTab('garden')}
                className="w-full rounded-2xl border border-gray-200 bg-white p-4 text-left transition-colors hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-gray-900 dark:text-gray-100">
                      Мой сад
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {gardenStats.totalElements > 0
                        ? `${gardenStats.totalElements} растений`
                        : 'Вырастите первое растение'}
                    </div>
                  </div>
                  <div className="text-2xl">🌱</div>
                </div>
              </button>

              <button
                onClick={() => setActiveTab('community')}
                className="w-full rounded-2xl border border-gray-200 bg-white p-4 text-left transition-colors hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-gray-900 dark:text-gray-100">
                      Комьюнити
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Челленджи и друзья
                    </div>
                  </div>
                  <div className="text-2xl">👥</div>
                </div>
              </button>

              <button
                onClick={() => setActiveTab('stats')}
                className="w-full rounded-2xl border border-gray-200 bg-white p-4 text-left transition-colors hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-gray-900 dark:text-gray-100">
                      Статистика
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Аналитика настроения
                    </div>
                  </div>
                  <div className="text-2xl">📊</div>
                </div>
              </button>
            </div>
          </div>
        )

      case 'garden':
        return (
          <div>
            <div className="mb-4">
              <h2 className="mb-1 text-xl font-bold text-gray-900 dark:text-gray-100">
                Мой сад
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {gardenStats.totalElements} растений
              </p>
            </div>

            {/* Compact garden view for mobile */}
            <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
              <GardenView className="min-h-[400px]" />
            </div>
          </div>
        )

      case 'community':
        return (
          <div>
            <TelegramCommunity
              garden={garden}
              recentMoods={moodHistory?.slice(0, 7) ?? []}
            />
          </div>
        )

      case 'stats':
        return (
          <div>
            <div className="mb-4">
              <h2 className="mb-1 text-xl font-bold text-gray-900 dark:text-gray-100">
                Статистика
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Аналитика вашего настроения
              </p>
            </div>

            <MoodStats />
          </div>
        )

      case 'profile':
        try {
          return <ProfilePage />
        } catch (error) {
          console.error('❌ ProfilePage crashed:', error)
          return (
            <div>
              <div className="rounded-xl border border-red-200 bg-red-50 p-6 dark:border-red-800 dark:bg-red-900/30">
                <h2 className="font-bold text-red-900 dark:text-red-200">
                  ProfilePage Error
                </h2>
                <p className="text-red-700 dark:text-red-300">
                  {error instanceof Error ? error.message : String(error)}
                </p>
              </div>
            </div>
          )
        }

      default:
        return null
    }
  }

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-garden-50 to-green-50 pb-20 dark:from-gray-900 dark:to-gray-800 sm:pb-24">
      {/* Telegram Status - Always visible */}
      <div className="p-3 pb-0 sm:p-4">
        <TelegramStatus />
      </div>

      {/* Content Area */}
      <div className="relative overflow-hidden">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={activeTab}
            custom={direction}
            variants={tabVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              type: 'spring',
              stiffness: 300,
              damping: 30,
            }}
            className="w-full px-3 sm:px-4"
          >
            {renderTabContent()}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Mobile Tab Navigation */}
      <MobileTabNavigation
        activeTab={activeTab}
        onTabChange={handleTabChange}
      />
    </div>
  )
}
