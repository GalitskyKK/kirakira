/**
 * 💎 СТРИК-КВЕСТЫ ЗА ГЕМЫ
 * Отображает прогресс стриков и награды за них (ростки + гемы)
 */

import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { Flame, Gem, Sprout, Lock, Check } from 'lucide-react'
import { Card } from '@/components/ui'
import { useTelegramId } from '@/hooks/useTelegramId'
import { useUserSync } from '@/hooks/queries/useUserQueries'

interface StreakMilestone {
  readonly days: number
  readonly sprouts: number
  readonly gems?: number
  readonly emoji: string
  readonly title: string
  readonly description: string
}

const STREAK_MILESTONES: readonly StreakMilestone[] = [
  {
    days: 3,
    sprouts: 25,
    emoji: '🔥',
    title: 'Новичок',
    description: 'Первые шаги к привычке',
  },
  {
    days: 7,
    sprouts: 75,
    gems: 1, // 💎 ОСОБАЯ НАГРАДА!
    emoji: '⭐',
    title: 'Неделя силы',
    description: 'Твоя первая неделя!',
  },
  {
    days: 14,
    sprouts: 200,
    emoji: '🌟',
    title: 'Две недели',
    description: 'Привычка закрепляется',
  },
  {
    days: 30,
    sprouts: 500,
    gems: 5, // 💎 ОСОБАЯ НАГРАДА!
    emoji: '🏆',
    title: 'Месяц триумфа',
    description: 'Невероятное достижение!',
  },
  {
    days: 100,
    sprouts: 2000,
    emoji: '👑',
    title: 'Легенда',
    description: 'Ты в топе лучших!',
  },
  {
    days: 365,
    sprouts: 10000,
    emoji: '🌈',
    title: 'Годовой герой',
    description: 'Целый год успеха!',
  },
] as const

export function StreakGemQuests() {
  const telegramId = useTelegramId()
  const { data: userData } = useUserSync(telegramId, !!telegramId)
  const currentStreak = userData?.user?.stats?.currentStreak ?? 0

  // Вычисляем статус каждой вехи
  const milestones = useMemo(() => {
    return STREAK_MILESTONES.map(milestone => {
      const isCompleted = currentStreak >= milestone.days
      const isActive = !isCompleted && currentStreak < milestone.days
      const progress = isCompleted
        ? 100
        : Math.min((currentStreak / milestone.days) * 100, 100)

      return {
        ...milestone,
        isCompleted,
        isActive,
        progress,
      }
    })
  }, [currentStreak])

  return (
    <div className="space-y-4">
      {/* Заголовок */}
      <div className="flex items-center gap-2">
        <Flame className="h-5 w-5 text-orange-500" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Стрик-квесты
        </h3>
        <div className="ml-auto flex items-center gap-2 rounded-full bg-orange-50 px-3 py-1 dark:bg-orange-900/20">
          <Flame className="h-4 w-4 text-orange-500" />
          <span className="text-sm font-bold text-orange-600 dark:text-orange-400">
            {currentStreak} дней
          </span>
        </div>
      </div>

      {/* Список вех */}
      <div className="space-y-3">
        {milestones.map((milestone, index) => (
          <motion.div
            key={milestone.days}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <Card
              className={`relative overflow-hidden transition-all ${
                milestone.isCompleted
                  ? 'border-green-300 bg-green-50 dark:border-green-700 dark:bg-green-900/20'
                  : milestone.isActive
                    ? 'border-blue-300 bg-blue-50 dark:border-blue-700 dark:bg-blue-900/20'
                    : 'border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800'
              }`}
            >
              {/* Прогресс-бар для активной вехи */}
              {milestone.isActive && (
                <div className="absolute left-0 top-0 h-1 w-full bg-gray-200 dark:bg-gray-700">
                  <motion.div
                    className="h-full bg-gradient-to-r from-blue-400 to-blue-600"
                    initial={{ width: 0 }}
                    animate={{ width: `${milestone.progress}%` }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
              )}

              <div className="flex items-center gap-3 p-3">
                {/* Иконка статуса */}
                <div
                  className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full text-2xl ${
                    milestone.isCompleted
                      ? 'bg-green-100 dark:bg-green-800'
                      : milestone.isActive
                        ? 'bg-blue-100 dark:bg-blue-800'
                        : 'bg-gray-200 dark:bg-gray-700'
                  }`}
                >
                  {milestone.isCompleted ? (
                    <Check className="h-6 w-6 text-green-600 dark:text-green-400" />
                  ) : milestone.isActive ? (
                    <span>{milestone.emoji}</span>
                  ) : (
                    <Lock className="h-5 w-5 text-gray-400" />
                  )}
                </div>

                {/* Информация */}
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h4
                      className={`font-semibold ${
                        milestone.isCompleted
                          ? 'text-green-700 dark:text-green-300'
                          : milestone.isActive
                            ? 'text-blue-700 dark:text-blue-300'
                            : 'text-gray-500 dark:text-gray-400'
                      }`}
                    >
                      {milestone.title}
                    </h4>
                    <span
                      className={`text-xs font-medium ${
                        milestone.isCompleted
                          ? 'text-green-600 dark:text-green-400'
                          : milestone.isActive
                            ? 'text-blue-600 dark:text-blue-400'
                            : 'text-gray-400'
                      }`}
                    >
                      {milestone.days} дней
                    </span>
                  </div>
                  <p
                    className={`text-xs ${
                      milestone.isCompleted
                        ? 'text-green-600 dark:text-green-400'
                        : milestone.isActive
                          ? 'text-blue-600 dark:text-blue-400'
                          : 'text-gray-400'
                    }`}
                  >
                    {milestone.description}
                  </p>

                  {/* Прогресс для активной вехи */}
                  {milestone.isActive && (
                    <p className="mt-1 text-xs font-medium text-blue-600 dark:text-blue-400">
                      {currentStreak} / {milestone.days} дней (
                      {Math.round(milestone.progress)}%)
                    </p>
                  )}
                </div>

                {/* Награды */}
                <div className="flex flex-col items-end gap-1">
                  <div className="flex items-center gap-1">
                    <Sprout className="h-4 w-4 text-green-500" />
                    <span
                      className={`text-sm font-bold ${
                        milestone.isCompleted
                          ? 'text-green-600 dark:text-green-400'
                          : 'text-gray-600 dark:text-gray-400'
                      }`}
                    >
                      {milestone.sprouts}
                    </span>
                  </div>

                  {/* 💎 Особая награда гемами */}
                  {milestone.gems && (
                    <div className="flex items-center gap-1 rounded-full bg-purple-100 px-2 py-0.5 dark:bg-purple-900/30">
                      <Gem className="h-4 w-4 text-purple-500" />
                      <span
                        className={`text-sm font-bold ${
                          milestone.isCompleted
                            ? 'text-purple-600 dark:text-purple-400'
                            : 'text-purple-500 dark:text-purple-400'
                        }`}
                      >
                        +{milestone.gems}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Подсказка */}
      <div className="rounded-lg bg-blue-50 p-3 dark:bg-blue-900/20">
        <p className="text-xs text-blue-700 dark:text-blue-300">
          💡 <strong>Совет:</strong> Отмечай настроение каждый день, чтобы
          получать награды за стрики! Гемы можно использовать для покупки
          премиум тем.
        </p>
      </div>
    </div>
  )
}
