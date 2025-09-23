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
      className="mb-2 flex items-center justify-between rounded-full bg-gradient-to-r from-blue-50 to-indigo-50 px-3 py-1.5 shadow-sm"
    >
      <div className="flex items-center space-x-2">
        <div
          className={`h-1.5 w-1.5 rounded-full ${isConnected ? 'bg-green-500' : 'bg-yellow-500'}`}
        />
        <span className="text-xs text-gray-600">
          {isConnected ? 'Синхронизировано' : 'Telegram App'}
        </span>
      </div>

      {telegramUser && (
        <span className="text-xs text-gray-500">
          @{telegramUser.username || telegramUser.firstName}
        </span>
      )}
    </motion.div>
  )
}
