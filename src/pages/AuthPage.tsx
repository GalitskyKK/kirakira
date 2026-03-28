import { motion } from 'framer-motion'
import { EmailPasswordAuth, TelegramAuth } from '@/components/auth'

interface AuthPageProps {
  readonly onSuccess?: (() => void) | undefined
  readonly onError?: ((error: string) => void) | undefined
  readonly onSkip?: (() => void) | undefined
}

export function AuthPage({ onSuccess, onError, onSkip }: AuthPageProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 dark:from-neutral-900 dark:via-neutral-900 dark:to-neutral-950">
      <div className="flex min-h-screen items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex w-full max-w-md flex-col gap-6"
        >
          <EmailPasswordAuth onSuccess={onSuccess} onError={onError} />

          <div className="relative flex items-center justify-center">
            <div className="absolute inset-x-0 top-1/2 h-px bg-neutral-200 dark:bg-neutral-700" />
            <span className="relative bg-gradient-to-br from-blue-50 via-white to-green-50 px-3 text-xs font-medium text-neutral-500 dark:from-neutral-900 dark:via-neutral-900 dark:to-neutral-950 dark:text-neutral-400">
              или через Telegram
            </span>
          </div>

          <TelegramAuth onSuccess={onSuccess} onError={onError} onSkip={onSkip} />

          <p className="text-center text-xs text-neutral-500 dark:text-neutral-400">
            Уже вошли по почте как новый пользователь и нужен старый прогресс из
            Telegram? После входа откройте Настройки → «Прогресс из Telegram».
          </p>
        </motion.div>
      </div>
    </div>
  )
}
