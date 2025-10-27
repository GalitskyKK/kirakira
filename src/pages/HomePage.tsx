import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Sprout, TrendingUp, Calendar } from 'lucide-react'
import { GardenView } from '@/components/garden'
import { MoodCheckin, MoodStats } from '@/components/mood'
import { MobileLayout } from '@/components/layout/MobileLayout'
import { Card } from '@/components/ui'
import { useGardenState, useMoodTracking, useElementGeneration } from '@/hooks'
import { formatDate } from '@/utils/dateHelpers'
import { useNavigate } from 'react-router-dom'

export function HomePage() {
  const { garden: _garden, gardenStats } = useGardenState()
  const { todaysMood, streakCount } = useMoodTracking()
  const { canUnlock, getMilestoneInfo } = useElementGeneration()
  const [isMobile, setIsMobile] = useState(false)
  const navigate = useNavigate()

  const milestoneInfo = getMilestoneInfo

  // Check screen size
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768) // md breakpoint
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Mobile layout - redirect to mobile mood page
  useEffect(() => {
    if (isMobile) {
      navigate('/mobile', { replace: true })
    }
  }, [isMobile, navigate])

  // Mobile layout
  if (isMobile) {
    return <MobileLayout />
  }

  // Desktop layout
  return (
    <div className="from-kira-50 min-h-screen bg-gradient-to-br via-garden-50 to-neutral-50 dark:from-neutral-900 dark:via-neutral-800 dark:to-neutral-900">
      <div className="container mx-auto max-w-7xl px-4 py-6">
        {/* Header */}
        <motion.div
          className="mb-8 text-center"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <motion.h1
            className="from-kira-600 via-kira-500 mb-2 bg-gradient-to-r to-garden-500 bg-clip-text text-5xl font-bold text-transparent"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            KiraKira
          </motion.h1>
          <motion.p
            className="mb-2 text-2xl text-neutral-700 dark:text-neutral-300"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            きらきら
          </motion.p>
          <p className="text-lg text-neutral-600 dark:text-neutral-400">
            Ваш цифровой сад эмоций
          </p>
          <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-500">
            {formatDate(new Date(), 'EEEE, dd MMMM yyyy', 'ru')}
          </p>
        </motion.div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Mood Check-in */}
          <motion.div
            className="lg:col-span-1"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <MoodCheckin className="mb-6" />

            {/* Quick Stats */}
            <div className="mb-6 grid grid-cols-2 gap-3">
              <Card padding="sm" className="glass-card text-center">
                <div className="mb-1 text-3xl font-bold text-garden-600 dark:text-garden-400">
                  {gardenStats.totalElements}
                </div>
                <div className="text-xs font-medium text-neutral-600 dark:text-neutral-400">
                  Растений
                </div>
              </Card>

              <Card padding="sm" className="glass-card text-center">
                <div className="text-kira-600 dark:text-kira-400 mb-1 text-3xl font-bold">
                  {streakCount}
                </div>
                <div className="text-xs font-medium text-neutral-600 dark:text-neutral-400">
                  Дней подряд
                </div>
              </Card>
            </div>

            {/* Milestone Progress */}
            {milestoneInfo.nextMilestone && (
              <Card padding="sm" className="mb-6">
                <div className="mb-2 flex items-center space-x-2">
                  <Calendar size={16} className="text-purple-600" />
                  <span className="text-sm font-medium text-gray-900">
                    До достижения
                  </span>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">
                      {milestoneInfo.nextMilestone.title}
                    </span>
                    <span className="font-medium text-gray-900">
                      {milestoneInfo.daysToNext} дн.
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-gray-200">
                    <motion.div
                      className="h-2 rounded-full bg-purple-500"
                      initial={{ width: 0 }}
                      animate={{ width: `${milestoneInfo.progress}%` }}
                      transition={{ duration: 1, delay: 0.5 }}
                    />
                  </div>
                  <div className="text-xs text-gray-500">
                    Награда: {milestoneInfo.nextMilestone.reward}
                  </div>
                </div>
              </Card>
            )}

            {/* Today's status */}
            <Card padding="sm" variant="glass">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Настроение</span>
                  <span className="text-sm font-medium">
                    {todaysMood ? '✅ Отмечено' : '⏳ Ждет отметки'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Растение</span>
                  <span className="text-sm font-medium">
                    {canUnlock ? '🌱 Готово к росту' : '✅ Выращено'}
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
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <GardenView />
          </motion.div>
        </div>

        {/* Stats Section */}
        <motion.div
          className="mt-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Mood Statistics */}
            <div>
              <h2 className="mb-4 flex items-center space-x-2 text-xl font-semibold text-gray-900">
                <TrendingUp size={24} className="text-blue-600" />
                <span>Статистика настроения</span>
              </h2>
              <MoodStats />
            </div>

            {/* Garden Insights */}
            <div>
              <h2 className="mb-4 flex items-center space-x-2 text-xl font-semibold text-gray-900">
                <Sprout size={24} className="text-green-600" />
                <span>Инсайты сада</span>
              </h2>

              <div className="space-y-4">
                <Card padding="sm">
                  <h3 className="mb-3 text-sm font-semibold text-gray-900">
                    Состав сада
                  </h3>

                  {Object.keys(gardenStats.elementsByType).length > 0 ? (
                    <div className="space-y-2">
                      {Object.entries(gardenStats.elementsByType).map(
                        ([type, count]) => (
                          <div
                            key={type}
                            className="flex justify-between text-sm"
                          >
                            <span className="capitalize text-gray-600">
                              {type}
                            </span>
                            <span className="font-medium">{count}</span>
                          </div>
                        )
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">
                      Сад пуст. Отметьте настроение, чтобы вырастить первое
                      растение!
                    </p>
                  )}
                </Card>

                <Card padding="sm">
                  <h3 className="mb-3 text-sm font-semibold text-gray-900">
                    Редкость элементов
                  </h3>

                  {Object.keys(gardenStats.elementsByRarity).length > 0 ? (
                    <div className="space-y-2">
                      {Object.entries(gardenStats.elementsByRarity).map(
                        ([rarity, count]) => {
                          const colors: Record<string, string> = {
                            common: 'text-gray-600',
                            uncommon: 'text-green-600',
                            rare: 'text-blue-600',
                            epic: 'text-purple-600',
                            legendary: 'text-yellow-600',
                          }
                          return (
                            <div
                              key={rarity}
                              className="flex justify-between text-sm"
                            >
                              <span
                                className={`capitalize ${colors[rarity] ?? 'text-gray-600'}`}
                              >
                                {rarity}
                              </span>
                              <span className="font-medium">{count}</span>
                            </div>
                          )
                        }
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">
                      Пока нет данных о редкости
                    </p>
                  )}
                </Card>

                {gardenStats.newestElement &&
                  gardenStats.newestElement.emoji && (
                    <Card padding="sm">
                      <h3 className="mb-3 text-sm font-semibold text-gray-900">
                        Последнее растение
                      </h3>
                      <div className="flex items-center space-x-3">
                        <div className="text-2xl">
                          {gardenStats.newestElement.emoji}
                        </div>
                        <div>
                          <p className="text-sm font-medium">
                            {gardenStats.newestElement.name}
                          </p>
                          <p className="text-xs text-gray-600">
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
