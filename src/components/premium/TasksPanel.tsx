/**
 * Компонент для отображения заданий для получения премиум доступа
 */

import React from 'react'
import { motion } from 'framer-motion'
import { Calendar, Eye, Share2, Clock, CheckCircle } from 'lucide-react'
import { Card } from '@/components/ui'
import {
  getAvailableTasks,
  UserPremiumState,
  isHappyHour,
  hasUsedHappyHourToday,
} from '@/utils/premiumLimits'
import { PAYMENT_CONFIG } from '@/config/payment'

interface TasksPanelProps {
  userState: UserPremiumState
  onTaskComplete?: (taskId: string) => void
}

export function TasksPanel({ userState, onTaskComplete }: TasksPanelProps) {
  const tasks = getAvailableTasks(userState)
  const isCurrentlyHappyHour = isHappyHour()
  const usedHappyHourToday = hasUsedHappyHourToday(userState.lastHappyHourUsed)

  const getTaskIcon = (taskId: string) => {
    switch (taskId) {
      case 'mood_streak':
        return <Calendar className="h-5 w-5" />
      case 'garden_visits':
        return <Eye className="h-5 w-5" />
      case 'sharing':
        return <Share2 className="h-5 w-5" />
      default:
        return <CheckCircle className="h-5 w-5" />
    }
  }

  const getNextHappyHour = () => {
    const now = new Date()
    const today = new Date(now)
    today.setUTCHours(PAYMENT_CONFIG.DEMO_LIMITS.HAPPY_HOURS.START, 0, 0, 0)

    if (now.getUTCHours() >= PAYMENT_CONFIG.DEMO_LIMITS.HAPPY_HOURS.END) {
      // Следующий день
      today.setDate(today.getDate() + 1)
    }

    return today.toLocaleTimeString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Europe/Moscow',
    })
  }

  if (!PAYMENT_CONFIG.DEMO_MODE) {
    return null
  }

  return (
    <div className="space-y-4">
      {/* Заголовок */}
      <div className="text-center">
        <h3 className="text-lg font-semibold">🎁 Получите премиум бесплатно</h3>
        <p className="text-sm text-gray-600">
          Выполните задания или дождитесь счастливых часов
        </p>
      </div>

      {/* Счастливые часы */}
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div
              className={`rounded-full p-2 ${
                isCurrentlyHappyHour
                  ? 'bg-yellow-100 text-yellow-700'
                  : 'bg-gray-100 text-gray-600'
              }`}
            >
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <div className="font-medium">Счастливые часы</div>
              <div className="text-sm text-gray-600">
                Премиум бесплатно: 20:00-21:00 МСК
              </div>
            </div>
          </div>
          <div className="text-right">
            {isCurrentlyHappyHour ? (
              <div className="text-sm">
                {usedHappyHourToday ? (
                  <span className="text-gray-500">Уже использовано</span>
                ) : (
                  <span className="font-bold text-yellow-600">
                    СЕЙЧАС АКТИВНО!
                  </span>
                )}
              </div>
            ) : (
              <div className="text-sm text-gray-500">
                Следующий: {getNextHappyHour()}
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Задания */}
      <div className="space-y-3">
        {tasks.map((task, index) => (
          <motion.div
            key={task.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card
              className={`p-4 transition-all duration-200 ${
                task.completed
                  ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20'
                  : 'hover:border-blue-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div
                    className={`rounded-full p-2 ${
                      task.completed
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                        : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                    }`}
                  >
                    {task.completed ? (
                      <CheckCircle className="h-5 w-5" />
                    ) : (
                      getTaskIcon(task.id)
                    )}
                  </div>
                  <div>
                    <div className="font-medium">{task.title}</div>
                    <div className="text-sm text-gray-600">
                      {task.description}
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  {task.completed ? (
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-bold text-green-600">
                        ВЫПОЛНЕНО
                      </span>
                      {onTaskComplete && (
                        <button
                          onClick={() => onTaskComplete(task.id)}
                          className="rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400"
                        >
                          🎁 Забрать награду
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="text-right">
                      <div className="text-lg font-bold">
                        {task.progress}/{task.total}
                      </div>
                      <div className="text-xs text-gray-500">
                        {((task.progress / task.total) * 100).toFixed(0)}%
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Прогресс бар */}
              <div className="mt-3">
                <div className="h-2 rounded-full bg-gray-200 dark:bg-gray-700">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{
                      width: `${(task.progress / task.total) * 100}%`,
                    }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    className={`h-2 rounded-full ${
                      task.completed ? 'bg-green-500' : 'bg-blue-500'
                    }`}
                  />
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Подсказка */}
      <Card className="bg-blue-50 p-4 dark:bg-blue-900/20">
        <div className="text-sm">
          <div className="mb-1 font-medium text-blue-800 dark:text-blue-400">
            💡 Как это работает:
          </div>
          <ul className="list-inside list-disc space-y-1 text-xs text-blue-700 dark:text-blue-500">
            <li>Выполните любое задание → получите премиум на 24 часа</li>
            <li>Счастливые часы: ежедневно 20:00-21:00 МСК</li>
            <li>У каждой функции есть 3 бесплатные активации</li>
            <li>Новые пользователи: 7 дней бесплатного доступа</li>
          </ul>
        </div>
      </Card>
    </div>
  )
}
