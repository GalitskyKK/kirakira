import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTelegram } from '@/hooks'
import { useUserSync } from '@/hooks/index.v2'

export function TelegramStatus() {
  const { isTelegramEnv, user: telegramUser } = useTelegram()
  const { data: userData } = useUserSync(
    telegramUser?.telegramId,
    telegramUser?.telegramId != null
  )
  const currentUser = userData?.user
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    // Скрываем через 4 секунды после монтирования
    const timer = setTimeout(() => {
      setIsVisible(false)
    }, 4000)

    return () => clearTimeout(timer)
  }, [])

  if (!isTelegramEnv) return null

  const isConnected =
    telegramUser &&
    currentUser &&
    currentUser.telegramId === telegramUser.telegramId &&
    !currentUser.isAnonymous

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -10, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.9 }}
          transition={{ duration: 0.3 }}
          className="glass-card fixed left-1/2 top-3 z-50 flex -translate-x-1/2 items-center gap-1.5 rounded-full px-2 py-0.5 shadow-lg"
          style={{
            fontSize: '10px',
          }}
        >
          <div
            className={`h-1 w-1 rounded-full ${isConnected === true ? 'bg-garden-500' : 'bg-kira-400'}`}
          />
          <span className="text-[10px] font-medium text-neutral-700 dark:text-neutral-300">
            {isConnected === true ? 'Sync' : 'No data'}
          </span>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
