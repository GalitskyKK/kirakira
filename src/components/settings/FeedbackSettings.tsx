/**
 * Компонент настроек обратной связи
 * Позволяет пользователям связаться с разработчиком через Telegram
 */

import { useCallback } from 'react'
import { motion } from 'framer-motion'
import { MessageCircle } from 'lucide-react'
import { useTelegram } from '@/hooks/useTelegram'
import { useTranslation } from '@/hooks/useTranslation'

export function FeedbackSettings() {
  const { hapticFeedback } = useTelegram()
  const t = useTranslation()

  const handleOpenFeedback = useCallback(() => {
    hapticFeedback('light')

    // Telegram username разработчика
    const developerUsername = 'NMGKK'

    // Используем deep link для открытия чата в Telegram
    // tg://resolve?domain=username - открывает чат с пользователем
    const telegramLink = `tg://resolve?domain=${developerUsername}`

    // В Telegram Mini App deep links работают через window.location
    // В браузере также можно использовать window.open
    try {
      // Пытаемся открыть через location (работает в Telegram)
      window.location.href = telegramLink
    } catch (error) {
      // Fallback: открываем в новой вкладке
      window.open(telegramLink, '_blank')
    }
  }, [hapticFeedback])

  return (
    <div className="space-y-3">
      <motion.button
        type="button"
        onClick={handleOpenFeedback}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="flex w-full items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-kira-500 to-garden-500 px-4 py-3 text-white shadow-sm transition-all hover:shadow-md focus:outline-none focus:ring-2 focus:ring-kira-400 focus:ring-offset-2 dark:from-kira-600 dark:to-garden-600"
      >
        <MessageCircle className="h-5 w-5" />
        <span className="font-semibold">{t.settings.sendFeedback}</span>
      </motion.button>
      <p className="text-sm text-neutral-600 dark:text-neutral-400">
        {t.settings.openTelegramChat}
      </p>
    </div>
  )
}

