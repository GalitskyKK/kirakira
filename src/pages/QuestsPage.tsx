/**
 * 🎯 QUESTS PAGE
 * Страница для отображения ежедневных заданий
 */

import { motion } from 'framer-motion'
import { useTelegramId } from '@/hooks/useTelegramId'
import { DailyQuestList } from '@/components/quests'
// import { MobileLayout } from '@/components/layout'
import { ErrorMessage } from '@/components/ui/ErrorMessage'
import { useTranslation } from '@/hooks/useTranslation'

export function QuestsPage() {
  const telegramId = useTelegramId()
  const t = useTranslation()

  if (!telegramId) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <ErrorMessage message={t.pages.quests.authRequired} showRetry={false} />
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="min-h-screen bg-gray-50 dark:bg-gray-900"
    >
      {/* Заголовок страницы */}
      <div className="border-b bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <div className="px-4 py-6">
          <motion.h1
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="text-2xl font-bold text-gray-900 dark:text-gray-100"
          >
            {t.pages.quests.title}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
            className="mt-1 text-gray-600 dark:text-gray-400"
          >
            {t.pages.quests.description}
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
