import { lazy, Suspense } from 'react'
import { motion } from 'framer-motion'
import { EmailPasswordAuth } from '@/components/auth'
import { useTelegram } from '@/hooks'
import { LoadingSpinner } from '@/components/ui'

const TelegramAuthLazy = lazy(async () => {
  const module = await import('@/components/auth/TelegramAuth')
  return { default: module.TelegramAuth }
})

interface AuthPageProps {
  readonly onSuccess?: (() => void) | undefined
  readonly onError?: ((error: string) => void) | undefined
  readonly onSkip?: (() => void) | undefined
}

export function AuthPage({ onSuccess, onError, onSkip }: AuthPageProps) {
  const { isTelegramEnv } = useTelegram()

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 dark:from-neutral-900 dark:via-neutral-900 dark:to-neutral-950">
      <div className="flex min-h-screen items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex w-full max-w-md flex-col gap-6"
        >
          {isTelegramEnv ? (
            <Suspense
              fallback={
                <div className="flex justify-center py-12">
                  <LoadingSpinner />
                </div>
              }
            >
              <TelegramAuthLazy
                onSuccess={onSuccess}
                onError={onError}
                onSkip={onSkip}
              />
            </Suspense>
          ) : (
            <>
              <EmailPasswordAuth onSuccess={onSuccess} onError={onError} />
              <p className="text-center text-xs text-neutral-500 dark:text-neutral-400">
                Уже вошли по почте как новый пользователь и нужен старый прогресс из
                Telegram? После входа откройте Настройки → «Прогресс из Telegram».
              </p>
            </>
          )}
        </motion.div>
      </div>
    </div>
  )
}
