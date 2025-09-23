import { useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { TelegramLoginWidget } from './TelegramLoginWidget'
import { useTelegram } from '@/hooks'
import { useUserStore } from '@/stores'
import { Card } from '@/components/ui'

interface TelegramUser {
  id: number
  first_name: string
  last_name?: string
  username?: string
  photo_url?: string
  auth_date: number
  hash: string
}

interface TelegramAuthProps {
  onSuccess?: (() => void) | undefined
  onError?: ((error: string) => void) | undefined
}

export function TelegramAuth({ onSuccess, onError }: TelegramAuthProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [authError, setAuthError] = useState<string | null>(null)

  const { isTelegramEnv, user: telegramUser } = useTelegram()
  const { createTelegramUser, updateLastVisit } = useUserStore()

  const handleTelegramAuth = useCallback(
    async (telegramData: TelegramUser) => {
      setIsLoading(true)
      setAuthError(null)

      try {
        console.log('Обрабатываем авторизацию Telegram:', telegramData)

        // Создаем пользователя в системе на основе данных Telegram
        const user = await createTelegramUser({
          telegramId: telegramData.id,
          firstName: telegramData.first_name,
          lastName: telegramData.last_name,
          username: telegramData.username,
          photoUrl: telegramData.photo_url,
          authDate: new Date(telegramData.auth_date * 1000),
          hash: telegramData.hash,
        })

        console.log('Пользователь создан:', user)

        // Обновляем время последнего визита
        updateLastVisit()

        onSuccess?.()
      } catch (error) {
        console.error('Ошибка авторизации:', error)
        const errorMessage =
          error instanceof Error ? error.message : 'Неизвестная ошибка'
        setAuthError(errorMessage)
        onError?.(errorMessage)
      } finally {
        setIsLoading(false)
      }
    },
    [createTelegramUser, updateLastVisit, onSuccess, onError]
  )

  const handleAuthError = useCallback(
    (error: string) => {
      console.error('Ошибка виджета Telegram:', error)
      setAuthError(error)
      onError?.(error)
    },
    [onError]
  )

  // Если уже в Telegram, показываем информацию
  if (isTelegramEnv && telegramUser) {
    return (
      <Card className="p-6 text-center">
        <div className="mb-4 text-6xl">🎉</div>
        <h2 className="mb-2 text-xl font-bold text-gray-800">
          Добро пожаловать, {telegramUser.firstName}!
        </h2>
        <p className="mb-4 text-gray-600">
          Вы уже авторизованы через Telegram Mini App
        </p>
        <motion.button
          onClick={onSuccess}
          className="rounded-lg bg-blue-500 px-6 py-3 text-white transition-colors hover:bg-blue-600"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          Продолжить
        </motion.button>
      </Card>
    )
  }

  return (
    <div className="mx-auto max-w-md">
      <Card className="p-8">
        <div className="mb-6 text-center">
          <div className="mb-4 text-6xl">🔐</div>
          <h1 className="mb-2 text-2xl font-bold text-gray-800">
            Вход в KiraKira
          </h1>
          <p className="text-gray-600">
            Войдите через Telegram, чтобы синхронизировать ваш эмоциональный сад
            между устройствами
          </p>
        </div>

        {authError && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 rounded-lg bg-red-50 p-4 text-center text-red-700"
          >
            ❌ {authError}
          </motion.div>
        )}

        {isLoading ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="py-8 text-center"
          >
            <div className="mb-4 text-4xl">⏳</div>
            <p className="text-gray-600">Обрабатываем авторизацию...</p>
          </motion.div>
        ) : (
          <div className="space-y-6">
            <div className="rounded-lg bg-blue-50 p-4">
              <h3 className="mb-2 font-semibold text-blue-800">
                ✨ Преимущества входа через Telegram:
              </h3>
              <ul className="space-y-1 text-sm text-blue-700">
                <li>🔄 Синхронизация между устройствами</li>
                <li>☁️ Резервное копирование в облаке</li>
                <li>🚀 Быстрый доступ к премиум функциям</li>
                <li>🔒 Безопасная авторизация</li>
              </ul>
            </div>

            <div className="text-center">
              <TelegramLoginWidget
                botName="KiraKiraGardenBot"
                onAuth={handleTelegramAuth}
                onError={handleAuthError}
                buttonSize="large"
                cornerRadius={12}
                requestAccess={true}
                lang="ru"
              />
            </div>

            <div className="text-center">
              <motion.button
                onClick={onSuccess}
                className="text-sm text-gray-500 underline hover:text-gray-700"
                whileHover={{ scale: 1.05 }}
              >
                Продолжить без авторизации
              </motion.button>
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}
