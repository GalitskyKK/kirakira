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
  const { hapticFeedback, isTelegramEnv } = useTelegram()
  const t = useTranslation()

  const handleOpenFeedback = useCallback(() => {
    hapticFeedback('light')

    // Telegram username разработчика
    const developerUsername = 'NMGKK'

    // Предустановленный текст сообщения
    const messageText = encodeURIComponent(
      'Привет! У меня вопрос/проблема с KiraKira:'
    )

    // Используем HTTPS ссылку - работает везде
    // В Telegram Mini App откроется в Telegram, в браузере - в новой вкладке
    const telegramLink = `https://t.me/${developerUsername}?text=${messageText}`

    // В Mini App используем location.href для перехода в Telegram
    // В браузере открываем в новой вкладке
    if (isTelegramEnv) {
      window.location.href = telegramLink
    } else {
      window.open(telegramLink, '_blank', 'noopener,noreferrer')
    }
  }, [hapticFeedback, isTelegramEnv])

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
