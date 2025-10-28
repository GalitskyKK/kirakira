import { useState, useEffect, useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useTelegram } from '@/hooks'
import { useUserSync } from '@/hooks/index.v2'
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
  const queryClient = useQueryClient()

  // Используем React Query для синхронизации пользователя
  const { data: userData, isLoading: userLoading } = useUserSync(
    telegramUser?.telegramId,
    Boolean(telegramUser?.telegramId)
  )

  // Отслеживаем все критические зависимости для завершения инициализации
  const [allDependenciesReady, setAllDependenciesReady] = useState(false)

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

  // Проверяем готовность всех критических зависимостей
  useEffect(() => {
    const checkDependencies = () => {
      // В DEV режиме пропускаем проверку БД, но ждем загрузки пользователя
      // if (
      //   finalConfig.isDevelopment &&
      //   finalConfig.enableTelegram &&
      //   Boolean(telegramUser?.telegramId)
      // ) {
        // В dev режиме ждем только загрузки пользователя
      //   const userDataReady = !userLoading && Boolean(userData?.user)
      //   if (userDataReady) {
      //     setAllDependenciesReady(true)
      //     return true
      //   }
      //   return false
      // }

      // В DEV режиме без Telegram сразу готовы
      // if (finalConfig.isDevelopment && !finalConfig.enableTelegram) {
      //   setAllDependenciesReady(true)
      //   return true
      // }

      // В Telegram режиме ждем готовности Telegram и загрузки пользователя
      if (finalConfig.enableTelegram && Boolean(telegramUser?.telegramId)) {
        const telegramReady = Boolean(telegramUser)
        const userDataReady = !userLoading && Boolean(userData?.user)

        if (telegramReady && userDataReady) {
          setAllDependenciesReady(true)
          return true
        }
        return false
      }

      // В браузерном режиме - только базовая готовность
      if (!finalConfig.enableTelegram) {
        setAllDependenciesReady(true)
        return true
      }

      return false
    }

    checkDependencies()
  }, [
    telegramUser,
    userLoading,
    userData,
    finalConfig.enableTelegram,
    // finalConfig.isDevelopment,
  ])

  const logIfDev = useCallback(
    (message: string, data?: unknown) => {
      if (finalConfig.isDevelopment) {
        console.log(message, data ?? '')
      }
    },
    [finalConfig.isDevelopment]
  )

  // ✅ Синхронизация челленджей при инициализации - ТОЛЬКО ЧТЕНИЕ данных
  const syncChallengesOnInit = useCallback(async () => {
    if (!telegramUser?.telegramId || !userData?.user) {
      logIfDev('⚠️ Cannot sync challenges: missing telegramId or userData')
      return
    }

    try {
      logIfDev('🔄 Loading challenges on app initialization...')

      // ✅ ТОЛЬКО ЧТЕНИЕ: Инвалидируем кеш для загрузки актуальных данных
      // React Query автоматически загрузит данные через useChallengeList
      await queryClient.invalidateQueries({
        queryKey: ['challenge', 'list', telegramUser?.telegramId],
      })

      logIfDev(
        '✅ Challenges cache invalidated - React Query will fetch fresh data'
      )
    } catch (error) {
      console.error('❌ Challenge sync error:', error)
    }
  }, [telegramUser?.telegramId, userData?.user, queryClient, logIfDev])

  const initialize = useCallback(() => {
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
        } else {
          logIfDev('🌐 Браузерный режим - работа без Telegram')
        }
      }

      updateProgress(InitializationStage.STORES_SYNC, 60)
      logIfDev('✅ Пользователь загружен')

      // Ждем загрузки данных сада и настроений
      if (userData?.user) {
        updateProgress(InitializationStage.STORES_SYNC, 80)
        logIfDev('✅ Данные сада и настроений загружены')
      }

      // Проверяем daily quests
      updateProgress(InitializationStage.DAILY_QUESTS_CHECK, 85)
      if (userData?.user?.telegramId) {
        logIfDev('🎯 Проверка ежедневных заданий...')

        // Daily quests будут загружены автоматически через React Query
        // когда компонент DailyQuestList будет отрендерен
      }

      // ✅ Синхронизируем челленджи после успешной инициализации
      updateProgress(InitializationStage.CHALLENGES_SYNC, 90)
      if (userData?.user?.telegramId) {
        logIfDev('🏆 Синхронизация челленджей...')
        syncChallengesOnInit().catch(console.error)
      }

      // ⚠️ КРИТИЧЕСКОЕ ИЗМЕНЕНИЕ: Не завершаем инициализацию, пока не готовы все зависимости
      if (allDependenciesReady) {
        updateProgress(InitializationStage.COMPLETED, 100)
        logIfDev('🎉 Инициализация завершена успешно')
      } else {
        logIfDev('⏳ Ожидание готовности всех зависимостей...')
        updateProgress(InitializationStage.STORES_SYNC, 95)
      }
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
    allDependenciesReady,
    updateProgress,
    logIfDev,
    syncChallengesOnInit,
  ])

  // Автоматический запуск инициализации при монтировании
  useEffect(() => {
    if (state.stage === InitializationStage.IDLE) {
      const timeoutId = setTimeout(() => {
        initialize()
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

  // Перезапускаем инициализацию, когда зависимости станут готовы
  useEffect(() => {
    if (
      allDependenciesReady &&
      state.stage === InitializationStage.STORES_SYNC &&
      state.progress === 95
    ) {
      logIfDev('🔄 Зависимости готовы - завершаем инициализацию')
      updateProgress(InitializationStage.COMPLETED, 100)
      logIfDev('🎉 Инициализация завершена успешно')
    }
  }, [
    allDependenciesReady,
    state.stage,
    state.progress,
    updateProgress,
    logIfDev,
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
