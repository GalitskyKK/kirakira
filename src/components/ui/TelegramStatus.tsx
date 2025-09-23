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
    currentUser.telegramId === telegramUser.telegramId

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-4 rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50 p-3 shadow-sm"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div
            className={`h-2 w-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-yellow-500'}`}
          />
          <span className="text-sm font-medium text-gray-700">
            {isConnected
              ? '🔗 Синхронизировано с Telegram'
              : '📱 Telegram Mini App'}
          </span>
        </div>

        {telegramUser && (
          <div className="text-xs text-gray-500">
            @{telegramUser.username || telegramUser.firstName}
          </div>
        )}
      </div>

      {isConnected && (
        <div className="mt-2 text-xs text-gray-600">
          ✅ Данные синхронизируются между всеми устройствами
        </div>
      )}

      {!isConnected && telegramUser && (
        <div className="mt-2 text-xs text-amber-600">
          ⚠️ Данные пока локальные. Перезапустите приложение для синхронизации.
        </div>
      )}
    </motion.div>
  )
}
