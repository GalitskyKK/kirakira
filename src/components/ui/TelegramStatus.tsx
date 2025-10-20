import { motion } from 'framer-motion'
import { useState } from 'react'
import { useTelegram } from '@/hooks'
import { useUserSync } from '@/hooks/index.v2'
import { CurrencyDisplay } from './CurrencyDisplay'
import { ThemeShop } from './ThemeShop'

export function TelegramStatus() {
  const { isTelegramEnv, user: telegramUser } = useTelegram()
  const { data: userData } = useUserSync(
    telegramUser?.telegramId,
    telegramUser?.telegramId != null
  )
  const currentUser = userData?.user
  const [isThemeShopOpen, setIsThemeShopOpen] = useState(false)

  if (!isTelegramEnv) return null

  const isConnected =
    telegramUser &&
    currentUser &&
    currentUser.telegramId === telegramUser.telegramId &&
    !currentUser.isAnonymous

  return (
    <>
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

        <div className="flex items-center space-x-3">
          {/* Currency Display with click to open shop */}
          <CurrencyDisplay
            onClick={() => setIsThemeShopOpen(true)}
            size="sm"
            showBorder={true}
          />

          {telegramUser && (
            <span className="text-xs text-gray-500 dark:text-gray-400">
              @{telegramUser.username ?? telegramUser.firstName}
            </span>
          )}
        </div>
      </motion.div>

      {/* Theme Shop Modal */}
      <ThemeShop
        isOpen={isThemeShopOpen}
        onClose={() => setIsThemeShopOpen(false)}
      />
    </>
  )
}
