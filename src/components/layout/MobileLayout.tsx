import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MobileTabNavigation } from './MobileTabNavigation'
import { GardenView } from '@/components/garden'
import { MoodCheckin, MoodStats } from '@/components/mood'
import { TelegramCommunity } from '@/components/telegram'
import { TelegramStatus } from '@/components/ui'
import { useGardenState, useMoodTracking } from '@/hooks'

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

const TABS = ['mood', 'garden', 'community', 'stats']

export function MobileLayout() {
  const [activeTab, setActiveTab] = useState('mood')
  const { garden, gardenStats } = useGardenState()
  const {
    todaysMood,
    canCheckinToday: _canCheckinToday,
    moodHistory,
  } = useMoodTracking()
  // Removed currentUser as it's not used in this component

  const tabIndex = TABS.indexOf(activeTab)
  const [direction, setDirection] = useState(0)

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
              <h1 className="mb-2 text-2xl font-bold text-gray-900">
                🌸 KiraKira
              </h1>
              <p className="text-sm text-gray-600">
                {todaysMood ? 'Настроение отмечено' : 'Как дела сегодня?'}
              </p>
            </div>

            {/* Mood Check-in */}
            <MoodCheckin />

            {/* Quick Stats Cards */}
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-gradient-to-br from-garden-50 to-green-50 p-4">
                <div className="text-2xl font-bold text-garden-600">
                  {gardenStats.totalElements}
                </div>
                <div className="text-sm text-gray-600">Растений</div>
              </div>

              <div className="rounded-2xl bg-gradient-to-br from-orange-50 to-yellow-50 p-4">
                <div className="text-2xl font-bold text-orange-600">
                  {garden?.streak ?? 0}
                </div>
                <div className="text-sm text-gray-600">Дней подряд</div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="space-y-3">
              <button
                onClick={() => setActiveTab('garden')}
                className="w-full rounded-2xl border border-gray-200 bg-white p-4 text-left transition-colors hover:bg-gray-50"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-gray-900">Мой сад</div>
                    <div className="text-sm text-gray-600">
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
                className="w-full rounded-2xl border border-gray-200 bg-white p-4 text-left transition-colors hover:bg-gray-50"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-gray-900">Комьюнити</div>
                    <div className="text-sm text-gray-600">
                      Челленджи и друзья
                    </div>
                  </div>
                  <div className="text-2xl">👥</div>
                </div>
              </button>

              <button
                onClick={() => setActiveTab('stats')}
                className="w-full rounded-2xl border border-gray-200 bg-white p-4 text-left transition-colors hover:bg-gray-50"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-gray-900">Статистика</div>
                    <div className="text-sm text-gray-600">
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
          <div className="p-4">
            <div className="mb-4">
              <h2 className="mb-1 text-xl font-bold text-gray-900">Мой сад</h2>
              <p className="text-sm text-gray-600">
                {gardenStats.totalElements} растений
              </p>
            </div>

            {/* Compact garden view for mobile */}
            <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
              <GardenView className="min-h-[400px]" />
            </div>
          </div>
        )

      case 'community':
        return (
          <div className="p-4">
            <TelegramCommunity
              garden={garden}
              recentMoods={moodHistory.slice(0, 7)}
            />
          </div>
        )

      case 'stats':
        return (
          <div className="p-4">
            <div className="mb-4">
              <h2 className="mb-1 text-xl font-bold text-gray-900">
                Статистика
              </h2>
              <p className="text-sm text-gray-600">
                Аналитика вашего настроения
              </p>
            </div>

            <MoodStats />
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-garden-50 to-green-50 pb-24">
      {/* Telegram Status - Always visible */}
      <div className="p-4 pb-0">
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
            className="w-full"
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
