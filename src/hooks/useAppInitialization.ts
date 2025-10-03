import { useState, useEffect, useCallback } from 'react'
import { useTelegramSync } from './useTelegramSync'
import { useStoresSync } from './useStoresSync'
import { useUserStore } from '@/stores'
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
 * Координирует все этапы инициализации в правильном порядке
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

  const { syncTelegramUser, hasTelegramUser, telegramReady } = useTelegramSync()
  const { syncStores } = useStoresSync()
  const { currentUser, createAnonymousUser } = useUserStore()

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

  const ensureBrowserUser = useCallback(async () => {
    if (!currentUser) {
      logIfDev('👤 Создание анонимного пользователя для браузерного режима...')
      await createAnonymousUser()
      logIfDev('✅ Анонимный пользователь создан')
    } else {
      logIfDev('👤 Пользователь уже существует:', {
        id: currentUser.id,
        isAnonymous: currentUser.isAnonymous,
      })
    }
  }, [currentUser, createAnonymousUser, logIfDev])

  const initialize = useCallback(async () => {
    if (state.isLoading) return // Предотвращаем повторные запуски

    logIfDev('🚀 Начало инициализации приложения')

    try {
      updateProgress(InitializationStage.TELEGRAM_SETUP, 10)

      // Этап 1: Определение режима работы и синхронизация
      let telegramUserId: number | undefined
      let workingMode: 'telegram' | 'browser' = 'browser'

      if (finalConfig.enableTelegram) {
        logIfDev('📱 Определение режима работы...')

        const telegramResult = await syncTelegramUser()

        if (!telegramResult.success) {
          // Только если реальная ошибка, а не просто отсутствие Telegram
          throw new Error(`Telegram sync failed: ${telegramResult.error}`)
        }

        // Безопасное присваивание режима (исключаем 'error' случай)
        if (
          telegramResult.mode === 'telegram' ||
          telegramResult.mode === 'browser'
        ) {
          workingMode = telegramResult.mode
        }
        telegramUserId = telegramResult.user?.telegramId

        if (workingMode === 'telegram') {
          logIfDev('✅ Telegram режим - синхронизация завершена', {
            telegramUserId,
          })
        } else {
          logIfDev('🌐 Браузерный режим - Telegram недоступен')

          // В браузерном режиме нужно убедиться что есть хотя бы базовый пользователь
          await ensureBrowserUser()
        }
      }

      updateProgress(InitializationStage.STORES_SYNC, 60)

      // Этап 2: Синхронизация stores (если включена)
      if (finalConfig.enableStoresSync) {
        logIfDev('🔄 Синхронизация stores...', { workingMode, telegramUserId })

        // Синхронизация через React Query хуки теперь выполняется автоматически
        // useStoresSync больше не выполняет ручную синхронизацию
        const storesResult = await syncStores()

        if (!storesResult.success) {
          throw new Error(`Stores sync failed: ${storesResult.error}`)
        }

        logIfDev('✅ Stores синхронизация завершена', { mode: workingMode })
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
    finalConfig.enableTelegram,
    finalConfig.enableStoresSync,
    hasTelegramUser,
    telegramReady,
    syncTelegramUser,
    syncStores,
    updateProgress,
    logIfDev,
    ensureBrowserUser,
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
