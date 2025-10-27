import { motion } from 'framer-motion'
import { useTelegram } from '@/hooks'
import { useUserSync } from '@/hooks/index.v2'

export function TelegramStatus() {
  const { isTelegramEnv, user: telegramUser } = useTelegram()
  const { data: userData } = useUserSync(
    telegramUser?.telegramId,
    telegramUser?.telegramId != null
  )
  const currentUser = userData?.user

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
      className="glass-card mb-2 flex items-center justify-between rounded-full px-3 py-1.5 opacity-50 shadow-sm"
    >
      <div className="flex items-center space-x-2">
        <div
          className={`h-1.5 w-1.5 rounded-full ${isConnected === true ? 'bg-garden-500' : 'bg-kira-400'}`}
        />
        <span className="text-xs text-neutral-600 dark:text-neutral-400">
          {isConnected === true ? 'Синхронизировано' : 'Telegram App'}
        </span>
      </div>

      <div className="flex items-center space-x-3">
        {telegramUser && (
          <span className="text-xs text-neutral-500 dark:text-neutral-400">
            @{telegramUser.username ?? telegramUser.firstName}
          </span>
        )}
      </div>
    </motion.div>
  )
}
