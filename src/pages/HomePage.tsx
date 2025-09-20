import { useEffect } from 'react'
import { motion } from 'framer-motion'
import { Sprout, TrendingUp, Calendar } from 'lucide-react'
import { GardenView } from '@/components/garden'
import { MoodCheckin, MoodStats } from '@/components/mood'
import { Card } from '@/components/ui'
import { useGardenState, useMoodTracking, useElementGeneration } from '@/hooks'
import { formatDate } from '@/utils/dateHelpers'

export function HomePage() {
  const { garden, gardenStats } = useGardenState()
  const { todaysMood, streakCount } = useMoodTracking()
  const { canUnlock, getMilestoneInfo } = useElementGeneration()

  const milestoneInfo = getMilestoneInfo

  return (
    <div className="min-h-screen bg-gradient-to-br from-garden-50 to-green-50">
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        {/* Header */}
        <motion.div
          className="text-center mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            🌸 KiraKira
          </h1>
          <p className="text-lg text-gray-600">
            Ваш цифровой сад эмоций
          </p>
          <p className="text-sm text-gray-500 mt-1">
            {formatDate(new Date(), 'EEEE, dd MMMM yyyy', 'ru')}
          </p>
        </motion.div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Mood Check-in */}
          <motion.div
            className="lg:col-span-1"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <MoodCheckin className="mb-6" />

            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              <Card padding="sm" className="text-center">
                <div className="text-2xl text-garden-600 mb-1">
                  {gardenStats.totalElements}
                </div>
                <div className="text-xs text-gray-600">Растений</div>
              </Card>
              
              <Card padding="sm" className="text-center">
                <div className="text-2xl text-orange-600 mb-1">
                  {streakCount}
                </div>
                <div className="text-xs text-gray-600">Дней подряд</div>
              </Card>
            </div>

            {/* Milestone Progress */}
            {milestoneInfo.nextMilestone && (
              <Card padding="sm" className="mb-6">
                <div className="flex items-center space-x-2 mb-2">
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
                    <span className="text-gray-900 font-medium">
                      {milestoneInfo.daysToNext} дн.
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <motion.div
                      className="bg-purple-500 h-2 rounded-full"
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
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Mood Statistics */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                <TrendingUp size={24} className="text-blue-600" />
                <span>Статистика настроения</span>
              </h2>
              <MoodStats />
            </div>

            {/* Garden Insights */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                <Sprout size={24} className="text-green-600" />
                <span>Инсайты сада</span>
              </h2>
              
              <div className="space-y-4">
                <Card padding="sm">
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">
                    Состав сада
                  </h3>
                  
                  {Object.keys(gardenStats.elementsByType).length > 0 ? (
                    <div className="space-y-2">
                      {Object.entries(gardenStats.elementsByType).map(([type, count]) => (
                        <div key={type} className="flex justify-between text-sm">
                          <span className="text-gray-600 capitalize">{type}</span>
                          <span className="font-medium">{count}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">
                      Сад пуст. Отметьте настроение, чтобы вырастить первое растение!
                    </p>
                  )}
                </Card>

                <Card padding="sm">
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">
                    Редкость элементов
                  </h3>
                  
                  {Object.keys(gardenStats.elementsByRarity).length > 0 ? (
                    <div className="space-y-2">
                      {Object.entries(gardenStats.elementsByRarity).map(([rarity, count]) => {
                        const colors: Record<string, string> = {
                          common: 'text-gray-600',
                          uncommon: 'text-green-600',
                          rare: 'text-blue-600',
                          epic: 'text-purple-600',
                          legendary: 'text-yellow-600',
                        }
                        return (
                          <div key={rarity} className="flex justify-between text-sm">
                            <span className={`capitalize ${colors[rarity] ?? 'text-gray-600'}`}>
                              {rarity}
                            </span>
                            <span className="font-medium">{count}</span>
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">
                      Пока нет данных о редкости
                    </p>
                  )}
                </Card>

                {gardenStats.newestElement && (
                  <Card padding="sm">
                    <h3 className="text-sm font-semibold text-gray-900 mb-3">
                      Последнее растение
                    </h3>
                    <div className="flex items-center space-x-3">
                      <div className="text-2xl">{gardenStats.newestElement.emoji}</div>
                      <div>
                        <p className="text-sm font-medium">{gardenStats.newestElement.name}</p>
                        <p className="text-xs text-gray-600">
                          {formatDate(gardenStats.newestElement.unlockDate, 'dd MMM в HH:mm')}
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
