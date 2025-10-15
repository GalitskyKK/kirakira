import { motion } from 'framer-motion'
import { useTelegram } from '@/hooks'
import { useUserStore } from '@/stores'

export function TelegramStatus() {
  const { isTelegramEnv, user: telegramUser } = useTelegram()
  const { currentUser } = useUserStore()

  if (!isTelegramEnv) return null

  const isConnected =
    telegramUser &&
    currentUser &&
    currentUser.telegramId === telegramUser.telegramId &&
    !currentUser.isAnonymous

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-2 flex items-center justify-between rounded-full bg-gradient-to-r from-blue-50 to-indigo-50 px-3 py-1.5 shadow-sm dark:from-blue-900/30 dark:to-indigo-900/30"
    >
      <div className="flex items-center space-x-2">
        <div
          className={`h-1.5 w-1.5 rounded-full ${isConnected === true ? 'bg-green-500' : 'bg-yellow-500'}`}
        />
        <span className="text-xs text-gray-600 dark:text-gray-400">
          {isConnected === true ? 'Синхронизировано' : 'Telegram App'}
        </span>
      </div>

      {telegramUser && (
        <span className="text-xs text-gray-500 dark:text-gray-400">
          @{telegramUser.username ?? telegramUser.firstName}
        </span>
      )}
    </motion.div>
  )
}
