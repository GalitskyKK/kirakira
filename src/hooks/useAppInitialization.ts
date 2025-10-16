import { useState, useEffect, useCallback } from 'react'
import { useTelegram } from '@/hooks'
import { useUserSync } from '@/hooks/index.v2'
import { useUserClientStore } from '@/hooks/index.v2'
import {
  InitializationState,
  InitializationStage,
  InitializationConfig,
  UseAppInitializationReturn,
} from '@/types/initialization'

const DEFAULT_CONFIG: InitializationConfig = {
  enableTelegram: true,
  enableStoresSync: true,
  timeout: 10000, // 10 секунд
  isDevelopment: import.meta.env.DEV,
}

/**
 * Главный хук инициализации приложения
 * Использует React Query для синхронизации данных пользователя
 */
export function useAppInitialization(
  config: Partial<InitializationConfig> = {}
): UseAppInitializationReturn {
  const finalConfig = { ...DEFAULT_CONFIG, ...config }

  const [state, setState] = useState<InitializationState>({
    stage: InitializationStage.IDLE,
    isLoading: false,
    error: null,
    progress: 0,
  })

  const { user: telegramUser } = useTelegram()
  const { completeOnboarding } = useUserClientStore()

  // Используем React Query для синхронизации пользователя
  const { data: userData, isLoading: userLoading } = useUserSync(
    telegramUser?.telegramId,
    !!telegramUser?.telegramId
  )

  const updateProgress = useCallback(
    (stage: InitializationStage, progress: number, error?: string | null) => {
      setState(prev => ({
        ...prev,
        stage,
        progress,
        error: error ?? null,
        isLoading:
          stage !== InitializationStage.COMPLETED &&
          stage !== InitializationStage.FAILED,
      }))
    },
    []
  )

  const logIfDev = useCallback(
    (message: string, data?: unknown) => {
      if (finalConfig.isDevelopment) {
        console.log(message, data || '')
      }
    },
    [finalConfig.isDevelopment]
  )

  const initialize = useCallback(async () => {
    if (state.isLoading) return // Предотвращаем повторные запуски

    logIfDev('🚀 Начало инициализации приложения')

    try {
      updateProgress(InitializationStage.TELEGRAM_SETUP, 10)

      // Определяем режим работы
      const isTelegramEnv = !!window.Telegram?.WebApp
      const workingMode: 'telegram' | 'browser' = isTelegramEnv
        ? 'telegram'
        : 'browser'

      if (workingMode === 'telegram') {
        logIfDev('📱 Telegram режим', {
          telegramId: telegramUser?.telegramId,
        })

        // React Query автоматически синхронизирует данные через useUserSync
        // Просто ждем, пока загрузятся данные
        if (userLoading) {
          logIfDev('⏳ Ожидание синхронизации пользователя...')
        } else if (userData?.user) {
          logIfDev('✅ Данные пользователя загружены', {
            telegramId: userData.user.telegramId,
          })
          completeOnboarding()
        }
      } else {
        logIfDev('🌐 Браузерный режим - работа без Telegram')
      }

      // Постепенная загрузка данных
      updateProgress(InitializationStage.STORES_SYNC, 30)

      // Ждем загрузки пользователя
      if (userLoading) {
        logIfDev('⏳ Ожидание загрузки пользователя...')
        await new Promise(resolve => {
          const checkUser = () => {
            if (!userLoading) {
              resolve(void 0)
            } else {
              setTimeout(checkUser, 100)
            }
          }
          checkUser()
        })
      }

      updateProgress(InitializationStage.STORES_SYNC, 60)
      logIfDev('✅ Пользователь загружен')

      // Ждем загрузки данных сада и настроений
      if (userData?.user) {
        updateProgress(InitializationStage.STORES_SYNC, 80)
        logIfDev('✅ Данные сада и настроений загружены')
      }

      updateProgress(InitializationStage.COMPLETED, 100)
      logIfDev('🎉 Инициализация завершена успешно')
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown initialization error'
      console.error('❌ Ошибка инициализации:', error)
      updateProgress(InitializationStage.FAILED, 0, errorMessage)
    }
  }, [
    state.isLoading,
    telegramUser,
    userData,
    userLoading,
    completeOnboarding,
    updateProgress,
    logIfDev,
  ])

  // Автоматический запуск инициализации при монтировании
  useEffect(() => {
    if (state.stage === InitializationStage.IDLE) {
      const timeoutId = setTimeout(() => {
        void initialize()
      }, 100) // Небольшая задержка для стабилизации

      // Таймаут безопасности
      const safetyTimeoutId = setTimeout(() => {
        if (state.isLoading) {
          logIfDev('⚠️ Таймаут инициализации - принудительное завершение')
          updateProgress(
            InitializationStage.FAILED,
            0,
            'Initialization timeout'
          )
        }
      }, finalConfig.timeout)

      return () => {
        clearTimeout(timeoutId)
        clearTimeout(safetyTimeoutId)
      }
    }

    // Возвращаем пустую cleanup функцию если условие не выполнено
    return () => {}
  }, [
    state.stage,
    state.isLoading,
    initialize,
    updateProgress,
    logIfDev,
    finalConfig.timeout,
  ])

  return {
    stage: state.stage,
    isLoading: state.isLoading,
    error: state.error,
    progress: state.progress,
    initialize,
    isCompleted: state.stage === InitializationStage.COMPLETED,
    isFailed: state.stage === InitializationStage.FAILED,
    canRetry: state.stage === InitializationStage.FAILED,
  }
}
