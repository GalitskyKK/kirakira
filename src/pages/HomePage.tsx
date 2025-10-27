import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Sprout, TrendingUp, Calendar } from 'lucide-react'
import { GardenView } from '@/components/garden'
import { MoodCheckin, MoodStats } from '@/components/mood'
import { MobileLayout } from '@/components/layout/MobileLayout'
import { Card, TextTyping } from '@/components/ui'
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
          <motion.div
            className="mb-2 text-5xl font-bold"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <TextTyping className="" />
          </motion.div>
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
              <Card padding="sm" className="glass-card mb-6">
                <div className="mb-2 flex items-center space-x-2">
                  <Calendar
                    size={16}
                    className="text-kira-600 dark:text-kira-400"
                  />
                  <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                    До достижения
                  </span>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-neutral-600 dark:text-neutral-400">
                      {milestoneInfo.nextMilestone.title}
                    </span>
                    <span className="font-medium text-neutral-900 dark:text-neutral-100">
                      {milestoneInfo.daysToNext} дн.
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-neutral-200 dark:bg-neutral-700">
                    <motion.div
                      className="from-kira-500 via-kira-400 h-2 rounded-full bg-gradient-to-r to-garden-500"
                      initial={{ width: 0 }}
                      animate={{ width: `${milestoneInfo.progress}%` }}
                      transition={{ duration: 1, delay: 0.5 }}
                    />
                  </div>
                  <div className="text-xs text-neutral-500 dark:text-neutral-400">
                    Награда: {milestoneInfo.nextMilestone.reward}
                  </div>
                </div>
              </Card>
            )}

            {/* Today's status */}
            <Card padding="sm" variant="glass">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-neutral-600 dark:text-neutral-400">
                    Настроение
                  </span>
                  <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                    {todaysMood ? '✅ Отмечено' : '⏳ Ждет отметки'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-neutral-600 dark:text-neutral-400">
                    Растение
                  </span>
                  <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
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
              <h2 className="mb-4 flex items-center space-x-2 text-xl font-semibold text-neutral-900 dark:text-neutral-100">
                <TrendingUp
                  size={24}
                  className="text-kira-600 dark:text-kira-400"
                />
                <span>Статистика настроения</span>
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
                <span>Инсайты сада</span>
              </h2>

              <div className="space-y-4">
                <Card padding="sm" variant="glass">
                  <h3 className="mb-3 text-sm font-semibold text-neutral-900 dark:text-neutral-100">
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
                      Сад пуст. Отметьте настроение, чтобы вырастить первое
                      растение!
                    </p>
                  )}
                </Card>

                <Card padding="sm" variant="glass">
                  <h3 className="mb-3 text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                    Редкость элементов
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
                      Пока нет данных о редкости
                    </p>
                  )}
                </Card>

                {gardenStats.newestElement &&
                  gardenStats.newestElement.emoji && (
                    <Card padding="sm" variant="glass">
                      <h3 className="mb-3 text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                        Последнее растение
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
