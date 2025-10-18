/**
 * 🎯 QUESTS PAGE
 * Страница для отображения ежедневных заданий
 */

import { motion } from 'framer-motion'
import { useTelegramId } from '@/hooks/useTelegramId'
import { DailyQuestList } from '@/components/quests'
// import { MobileLayout } from '@/components/layout'
import { ErrorMessage } from '@/components/ui/ErrorMessage'

export function QuestsPage() {
  const telegramId = useTelegramId()

  if (!telegramId) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <ErrorMessage
          message="Необходима авторизация для просмотра заданий"
          showRetry={false}
        />
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="min-h-screen bg-gray-50"
    >
      {/* Заголовок страницы */}
      <div className="border-b bg-white shadow-sm">
        <div className="px-4 py-6">
          <motion.h1
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="text-2xl font-bold text-gray-900"
          >
            Ежедневные задания
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
            className="mt-1 text-gray-600"
          >
            Выполняйте задания и получайте награды каждый день
          </motion.p>
        </div>
      </div>

      {/* Основной контент */}
      <div className="p-4">
        <DailyQuestList telegramId={telegramId} />
      </div>
    </motion.div>
  )
}
