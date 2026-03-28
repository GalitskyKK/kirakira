import { useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { useQueryClient } from '@tanstack/react-query'
import { TelegramLoginWidget } from './TelegramLoginWidget'
import { useTelegram } from '@/hooks'
import { useUserClientStore } from '@/hooks/index.v2'
import { syncUserFromSupabase } from '@/api'
import { AUTH_RESET_EVENT, setJWTToken } from '@/utils/apiClient'
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
  readonly onSuccess?: (() => void) | undefined
  readonly onError?: ((error: string) => void) | undefined
  readonly onSkip?: (() => void) | undefined
}

export function TelegramAuth({
  onSuccess,
  onError,
  onSkip,
}: TelegramAuthProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [authError, setAuthError] = useState<string | null>(null)

  const { isTelegramEnv, user: telegramUser } = useTelegram()
  const { completeOnboarding } = useUserClientStore()
  const queryClient = useQueryClient()

  const handleTelegramAuth = useCallback(
    async (telegramData: TelegramUser) => {
      setIsLoading(true)
      setAuthError(null)

      try {
        const hasInitData =
          typeof window !== 'undefined' &&
          !!window.Telegram?.WebApp?.initData &&
          window.Telegram.WebApp.initData.length > 0

        // Если нет initData (браузерный сценарий) - получаем JWT токен через API
        if (!hasInitData) {
          try {
            const authResponse = await fetch('/api/auth', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                loginData: {
                  id: telegramData.id,
                  first_name: telegramData.first_name,
                  last_name: telegramData.last_name,
                  username: telegramData.username,
                  photo_url: telegramData.photo_url,
                  auth_date: telegramData.auth_date,
                  hash: telegramData.hash,
                },
              }),
            })

            if (!authResponse.ok) {
              throw new Error('Ошибка авторизации на сервере')
            }

            const authResult = (await authResponse.json()) as {
              success: boolean
              data?: { token?: string }
              error?: string
            }
            if (!authResult.success || !authResult.data?.token) {
              throw new Error('Не удалось получить токен авторизации')
            }

            // Сохраняем JWT токен в localStorage
            setJWTToken(authResult.data.token)
            window.dispatchEvent(new Event(AUTH_RESET_EVENT))

            // Синхронизируем пользователя с сервером через API
            await syncUserFromSupabase(telegramData.id)

            // Инвалидируем кеш, чтобы приложение подтянуло свежие данные
            await queryClient.invalidateQueries({ queryKey: ['user'] })

            // Помечаем, что онбординг пройден
            completeOnboarding()

            onSuccess?.()
            return
          } catch (authError) {
            console.error('Ошибка получения JWT токена:', authError)
            throw authError
          }
        }

        // В Telegram Mini App - просто синхронизируем (авторизация уже есть)
        await syncUserFromSupabase(telegramData.id)

        // Инвалидируем кеш, чтобы приложение подтянуло свежие данные
        await queryClient.invalidateQueries({ queryKey: ['user'] })

        // Помечаем, что онбординг пройден
        completeOnboarding()

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
    [queryClient, completeOnboarding, onSuccess, onError]
  )

  const handleAuthError = useCallback(
    (error: string) => {
      console.error('Ошибка виджета Telegram:', error)
      setAuthError(error)
      onError?.(error)
    },
    [onError]
  )

  const handleSkipAuth = useCallback(() => {
    if (onSkip) {
      onSkip()
      return
    }

    onSuccess?.()
  }, [onSkip, onSuccess])

  // Если уже в Telegram, показываем информацию
  if (isTelegramEnv && telegramUser) {
    return (
      <Card className="p-6 text-center">
        <div className="mb-4 text-6xl">🎉</div>
        <h2 className="mb-2 text-xl font-bold text-gray-800 dark:text-gray-100">
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
                onAuth={telegramData => {
                  void handleTelegramAuth(telegramData)
                }}
                onError={handleAuthError}
                buttonSize="large"
                cornerRadius={12}
                requestAccess={true}
                lang="ru"
              />
            </div>

            <div className="text-center">
              <motion.button
                onClick={handleSkipAuth}
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
