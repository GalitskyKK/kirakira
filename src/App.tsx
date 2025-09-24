import { useEffect, useState, useRef } from 'react'
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useUserStore } from '@/stores'
import { initializeStores } from '@/stores'
import { HomePage } from '@/pages/HomePage'
import { OnboardingPage } from '@/pages/OnboardingPage'
import { AuthPage } from '@/pages/AuthPage'
// ShowcasePage импортируется условно только в DEV режиме
import { LoadingSpinner } from '@/components/ui'
import { lazy, Suspense } from 'react'

// Динамический импорт ShowcasePage только в DEV режиме
const ShowcasePage = import.meta.env.DEV
  ? lazy(() => import('@/pages/ShowcasePage'))
  : null
import { TelegramDiagnostic } from '@/components/TelegramDiagnostic'
import { useTelegram, useTelegramTheme } from '@/hooks'
import { telegramStorage } from '@/utils/telegramStorage'

function App() {
  const isDevelopment = import.meta.env.DEV

  if (isDevelopment) {
    console.log('🔍 APP.TSX COMPONENT MOUNTING...')
  }

  // 🚨 ПРОВЕРКА ДИАГНОСТИЧЕСКОГО РЕЖИМА
  const urlParams = new URLSearchParams(window.location.search)
  const forceDiagnostic =
    urlParams.get('diagnostic') === '1' ||
    urlParams.get('force_diagnostic') === '1'
  const isTelegramEnv = !!window.Telegram?.WebApp

  // ✅ ВСЕ ХУКИ ДОЛЖНЫ БЫТЬ ВЫЗВАНЫ ДО ЛЮБОГО УСЛОВНОГО ВОЗВРАТА
  const {
    currentUser,
    hasCompletedOnboarding,
    isAuthenticated,
    isLoading,
    loadUser: _loadUser,
    clearAllUserData,
    syncFromSupabase,
    createTelegramUser,
  } = useUserStore()

  const [isInitializing, setIsInitializing] = useState(true)
  const [initError, setInitError] = useState<string | null>(null)
  const [showAuth, setShowAuth] = useState(false)

  // Используем ref для предотвращения повторной инициализации
  const hasInitialized = useRef(false)

  // Telegram интеграция
  const {
    user: telegramUser,
    isTelegramEnv: _isTelegramEnv, // уже объявлено выше
    isReady: telegramReady,
  } = useTelegram()

  const { colorScheme } = useTelegramTheme()

  // ✅ ВСЕ ХУКИ ДОЛЖНЫ БЫТЬ ВЫШЕ ЛЮБОГО УСЛОВНОГО ВОЗВРАТА
  // Initialize app
  useEffect(() => {
    // Предотвращаем повторную инициализацию
    if (hasInitialized.current) {
      return
    }

    hasInitialized.current = true

    const initializeApp = async () => {
      // Получаем актуальные данные в начале функции
      const currentTelegramUser = telegramUser
      const currentReady = telegramReady
      const { currentUser: currentStoreUser } = useUserStore.getState()

      if (isDevelopment) {
        console.log('🚀 НАЧАЛО ИНИЦИАЛИЗАЦИИ KiraKira App')
        console.log('🔍 TELEGRAM ДИАГНОСТИКА:', {
          isTelegramEnv,
          telegramReady: currentReady,
          windowTelegram: !!window.Telegram,
          windowTelegramWebApp: !!window.Telegram?.WebApp,
          userAgent: navigator.userAgent,
          currentUser: currentStoreUser
            ? {
                id: currentStoreUser.id,
                telegramId: currentStoreUser.telegramId,
                isAnonymous: currentStoreUser.isAnonymous,
              }
            : null,
          telegramUser: currentTelegramUser
            ? {
                id: currentTelegramUser.telegramId,
                firstName: currentTelegramUser.firstName,
                username: currentTelegramUser.username ?? undefined,
              }
            : null,
        })
      }

      // 🕐 ОБЪЯВЛЯЕМ ТАЙМАУТ В ОБЛАСТИ ВИДИМОСТИ ФУНКЦИИ
      let initTimeout: NodeJS.Timeout | null = null

      try {
        // 🕐 КРИТИЧНЫЙ ТАЙМАУТ для Telegram - если инициализация не завершится за 10 сек, принудительно продолжаем
        initTimeout = setTimeout(() => {
          if (isDevelopment) {
            console.warn('⚠️ ТАЙМАУТ ИНИЦИАЛИЗАЦИИ! Принудительно завершаем...')
          }
          setIsInitializing(false)
        }, 10000) // 10 секунд

        // Инициализируем Telegram хранилище если доступно
        if (isTelegramEnv) {
          if (isDevelopment) {
            console.log('📱 Инициализируем Telegram хранилище...')
          }
          telegramStorage.initialize()

          // 🚀 УПРОЩЕННАЯ ЛОГИКА: Ждем Telegram готовности максимум 5 секунд
          if (!telegramReady) {
            if (isDevelopment) {
              console.log('⏳ Ждем готовности Telegram WebApp (макс 5 сек)...')
            }

            await Promise.race([
              new Promise<void>(resolve => {
                const checkReady = () => {
                  if (telegramReady) {
                    if (isDevelopment) {
                      console.log('✅ Telegram WebApp готов!')
                    }
                    resolve()
                  } else {
                    setTimeout(checkReady, 100)
                  }
                }
                checkReady()
              }),
              new Promise<void>(resolve => {
                setTimeout(() => {
                  if (isDevelopment) {
                    console.warn(
                      '⚠️ Таймаут ожидания Telegram WebApp - продолжаем без него'
                    )
                  }
                  resolve()
                }, 5000) // 5 секунд таймаут
              }),
            ])
          }

          // 🔄 ПРАВИЛЬНАЯ СИНХРОНИЗАЦИЯ С TELEGRAM
          if (currentTelegramUser && currentReady) {
            if (isDevelopment) {
              console.log('🔄 Начинаем синхронизацию Telegram пользователя:', {
                telegramId: currentTelegramUser.telegramId,
                firstName: currentTelegramUser.firstName,
                currentUserTelegramId: currentStoreUser?.telegramId,
              })
            }

            // Если это другой пользователь или первый вход - очищаем данные
            if (
              !currentStoreUser ||
              currentStoreUser.telegramId !== currentTelegramUser.telegramId
            ) {
              try {
                if (isDevelopment) {
                  console.log(
                    '🗑️ Очищаем старые данные перед синхронизацией...'
                  )
                }
                await clearAllUserData()

                if (isDevelopment) {
                  console.log('🔄 Синхронизируем данные из Supabase...')
                }
                await syncFromSupabase(currentTelegramUser.telegramId)

                // Если нет данных на сервере - создаем нового пользователя
                const { currentUser: syncedUser } = useUserStore.getState()
                if (!syncedUser) {
                  if (isDevelopment) {
                    console.log('📝 Создаем нового Telegram пользователя...')
                  }
                  const userToCreate = {
                    telegramId: currentTelegramUser.telegramId,
                    firstName: currentTelegramUser.firstName,
                    lastName: currentTelegramUser.lastName ?? undefined,
                    username: currentTelegramUser.username ?? undefined,
                    photoUrl: currentTelegramUser.photoUrl ?? undefined,
                    authDate: new Date(),
                    hash: 'telegram_miniapp',
                  }
                  // createTelegramUser возвращает User, не Promise
                  createTelegramUser(userToCreate)
                }

                if (isDevelopment) {
                  console.log('✅ Telegram синхронизация завершена')
                }
              } catch (error) {
                console.error('❌ Ошибка синхронизации Telegram:', error)
                setInitError(
                  `Telegram sync failed: ${error instanceof Error ? error.message : 'Unknown error'}`
                )
              }
            } else {
              if (isDevelopment) {
                console.log('✅ Пользователь уже корректно авторизован')
              }

              // 🔄 ПРИНУДИТЕЛЬНАЯ СИНХРОНИЗАЦИЯ для существующих пользователей
              try {
                if (isDevelopment) {
                  console.log(
                    '🔄 Принудительная синхронизация данных с сервера...'
                  )
                }
                await syncFromSupabase(currentTelegramUser.telegramId)
                if (isDevelopment) {
                  console.log('✅ Принудительная синхронизация завершена')
                }
              } catch (syncError) {
                if (isDevelopment) {
                  console.warn(
                    '⚠️ Ошибка принудительной синхронизации:',
                    syncError
                  )
                }
              }
            }
          }
        }

        await initializeStores()

        // 🔄 ОДНОРАЗОВАЯ СИНХРОНИЗАЦИЯ ДАННЫХ для Telegram пользователей
        if (currentTelegramUser && currentReady) {
          try {
            if (isDevelopment) {
              console.log(
                '🔄 Одноразовая синхронизация stores с сервером при входе...'
              )
            }

            // Получаем stores и принудительно синхронизируем ОДИН РАЗ
            const { useMoodStore } = await import('@/stores/moodStore')
            const { useGardenStore } = await import('@/stores/gardenStore')

            // Принудительно синхронизируем данные (один раз при входе)
            await useMoodStore.getState().syncMoodHistory(true) // forceSync = true
            await useGardenStore.getState().syncGarden(true) // forceSync = true

            if (isDevelopment) {
              console.log('✅ Stores синхронизированы с сервером')
            }
          } catch (storesSyncError) {
            if (isDevelopment) {
              console.warn('⚠️ Ошибка синхронизации stores:', storesSyncError)
            }
          }
        }

        // updateLastVisit() перенесено в loadUser() после инициализации пользователя

        // 🏁 ОЧИЩАЕМ ТАЙМАУТ при успешной инициализации
        if (initTimeout !== null) clearTimeout(initTimeout)
        if (isDevelopment) {
          console.log('✅ ИНИЦИАЛИЗАЦИЯ ЗАВЕРШЕНА УСПЕШНО!')
        }
      } catch (error) {
        // 🏁 ОЧИЩАЕМ ТАЙМАУТ при ошибке
        if (initTimeout) clearTimeout(initTimeout)
        console.error('❌ ОШИБКА ИНИЦИАЛИЗАЦИИ:', error)
        if (isDevelopment) {
          console.error(
            '❌ Stack trace:',
            error instanceof Error ? error.stack : 'No stack'
          )
        }
        setInitError(
          error instanceof Error ? error.message : 'Initialization failed'
        )
      } finally {
        if (isDevelopment) {
          console.log('🏁 ФИНАЛИЗАЦИЯ ИНИЦИАЛИЗАЦИИ (setIsInitializing(false))')
        }
        setIsInitializing(false)
      }
    }

    void initializeApp()
  }, []) // Пустой массив зависимостей - инициализация происходит только один раз

  // Применяем тему Telegram к корневому элементу
  useEffect(() => {
    if (isTelegramEnv) {
      document.documentElement.classList.toggle('dark', colorScheme === 'dark')
    }
  }, [isTelegramEnv, colorScheme])

  // ✅ ЛОГИРОВАНИЕ ПОСЛЕ ВСЕХ ХУКОВ
  if (isDevelopment) {
    console.log('🔍 USER STORE LOADED:', {
      currentUser: !!currentUser,
      hasCompletedOnboarding,
      isAuthenticated,
      isLoading,
    })

    console.log('🔍 TELEGRAM HOOKS LOADED:', {
      telegramUser: !!telegramUser,
      isTelegramEnv,
      telegramReady,
    })

    console.log('🔍 TELEGRAM THEME LOADED:', { colorScheme })
  }

  // 🚨 ПОКАЗАТЬ ДИАГНОСТИКУ ПРИ ПРОБЛЕМАХ В TELEGRAM (после всех хуков)
  if (forceDiagnostic || (isTelegramEnv && urlParams.get('debug') === '1')) {
    if (isDevelopment) {
      console.log('🚨 ПОКАЗЫВАЕМ ДИАГНОСТИЧЕСКУЮ СТРАНИЦУ')
    }
    return <TelegramDiagnostic />
  }

  // Handle onboarding completion
  const handleOnboardingComplete = () => {
    // Reload to ensure fresh state
    window.location.reload()
  }

  // Show loading state during initialization
  if (isInitializing || isLoading) {
    const isDevelopment = import.meta.env.DEV

    // 🔍 ОТЛАДКА ЭКРАНА ЗАГРУЗКИ (только в dev режиме)
    if (isDevelopment) {
      console.log('🔍 РЕНДЕРИМ ЭКРАН ЗАГРУЗКИ:', {
        isInitializing,
        isLoading,
        isTelegramEnv,
        telegramReady,
        telegramUser: !!telegramUser,
        currentUser: !!currentUser,
        hasCompletedOnboarding,
        isAuthenticated,
        initError,
      })
    }

    const bgClass = isTelegramEnv
      ? 'bg-[var(--tg-bg-color,#ffffff)]'
      : 'bg-gradient-to-br from-garden-50 to-green-50'

    return (
      <div
        className={`flex min-h-screen items-center justify-center ${bgClass}`}
      >
        <motion.div
          className="text-center"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <div className="mb-4 text-6xl">🌸</div>
          <h1 className="mb-4 text-2xl font-bold text-[var(--tg-text-color,#000000)]">
            KiraKira
          </h1>
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-[var(--tg-hint-color,#666666)]">
            {isTelegramEnv
              ? '🌱 Инициализируем ваш эмоциональный сад...'
              : 'Загружаем ваш сад...'}
          </p>

          {/* Дружелюбное приветствие для Telegram пользователей в продакшене */}
          {isTelegramEnv && telegramUser && !isDevelopment && (
            <div className="mt-4 rounded-lg bg-blue-100/50 p-3">
              <p className="text-sm text-[var(--tg-hint-color,#666666)]">
                👋 Добро пожаловать, {telegramUser.firstName}!
              </p>
              <p className="mt-1 text-xs text-[var(--tg-hint-color,#666666)]">
                🔄 Подготавливаем ваш персональный сад
              </p>
            </div>
          )}

          {/* 🔍 РАСШИРЕННАЯ ДИАГНОСТИКА - только в development режиме */}
          {isDevelopment && isTelegramEnv && (
            <div className="mt-4 space-y-2 rounded-lg bg-yellow-100/50 p-3 text-xs">
              <div className="font-semibold">
                🔍 Диагностика Telegram (Dev Mode):
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  Init: {isInitializing ? '⏳ Инициализация' : '✅ Готов'}
                </div>
                <div>Loading: {isLoading ? '⏳ Загрузка' : '✅ Загружен'}</div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  TG Ready: {telegramReady ? '✅ Готов' : '❌ НЕ готов'}
                </div>
                <div>User: {telegramUser ? '✅ Есть' : '❌ НЕТ'}</div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  Auth:{' '}
                  {isAuthenticated ? '✅ Авторизован' : '❌ НЕ авторизован'}
                </div>
                <div>
                  TG API: {window.Telegram?.WebApp ? '✅ Есть' : '❌ НЕТ'}
                </div>
              </div>

              {telegramUser && (
                <div className="text-blue-600">
                  👤 @{telegramUser.username ?? telegramUser.firstName} (ID:{' '}
                  {telegramUser.telegramId})
                </div>
              )}

              {initError && initError.trim() !== '' && (
                <div className="font-semibold text-red-600">
                  ❌ Ошибка: {initError}
                </div>
              )}

              <div className="text-xs text-gray-500">
                💡 Development Mode - расширенная диагностика
              </div>

              {/* 🚨 АВАРИЙНАЯ КНОПКА только в dev режиме */}
              <div className="mt-2">
                <button
                  onClick={() => {
                    console.warn('🚨 АВАРИЙНЫЙ ВЫХОД ИЗ ИНИЦИАЛИЗАЦИИ!')
                    setIsInitializing(false)
                    setInitError(null)
                  }}
                  className="w-full rounded bg-red-500/70 px-3 py-2 text-xs text-white hover:bg-red-600/70"
                >
                  🚨 Пропустить инициализацию (dev only)
                </button>
              </div>
            </div>
          )}

          {/* Приветствие в dev режиме с дополнительной информацией */}
          {isDevelopment && isTelegramEnv && telegramUser && (
            <div className="mt-4 rounded-lg bg-green-100/50 p-3">
              <p className="text-sm text-[var(--tg-hint-color,#666666)]">
                👋 Добро пожаловать, {telegramUser.firstName}!
              </p>
              <p className="mt-1 text-xs text-[var(--tg-hint-color,#666666)]">
                🔄 Автоматическая синхронизация через Telegram
              </p>
            </div>
          )}
        </motion.div>
      </div>
    )
  }

  if (isDevelopment) {
    console.log('🔍 ОСНОВНАЯ ЛОГИКА РЕНДЕРИНГА:', {
      initError: initError ? initError.trim() !== '' : false,
      hasCompletedOnboarding,
      isAuthenticated,
      isTelegramEnv,
    })
  }

  // Show error state if initialization failed
  if (initError && initError.trim() !== '') {
    if (isDevelopment) {
      console.log('🔍 РЕНДЕРИМ ERROR STATE')
    }
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-red-50 to-orange-50">
        <motion.div
          className="mx-auto max-w-md p-8 text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="mb-4 text-6xl">⚠️</div>
          <h1 className="mb-4 text-2xl font-bold text-gray-900">
            Ошибка инициализации
          </h1>
          <p className="mb-6 text-gray-600">{initError}</p>
          <button
            onClick={() => window.location.reload()}
            className="rounded-lg bg-red-500 px-6 py-3 text-white transition-colors hover:bg-red-600"
          >
            Перезагрузить
          </button>
        </motion.div>
      </div>
    )
  }

  // Show onboarding for new users
  if (!hasCompletedOnboarding) {
    if (isDevelopment) {
      console.log('🔍 РЕНДЕРИМ ONBOARDING PAGE')
    }
    return <OnboardingPage onComplete={handleOnboardingComplete} />
  }

  // Show auth screen for non-authenticated users (optional)
  if (showAuth && !isAuthenticated && !isTelegramEnv) {
    if (isDevelopment) {
      console.log('🔍 РЕНДЕРИМ AUTH PAGE')
    }
    return (
      <AuthPage
        onSuccess={() => setShowAuth(false)}
        onError={error => console.error('Auth error:', error)}
      />
    )
  }

  if (isDevelopment) {
    console.log('🔍 РЕНДЕРИМ ОСНОВНОЕ ПРИЛОЖЕНИЕ (ROUTER)')
  }

  // Main app routing
  return (
    <Router>
      <div className="App">
        <AnimatePresence mode="wait">
          <Routes>
            <Route
              path="/"
              element={
                <motion.div
                  key="home"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <HomePage />
                </motion.div>
              }
            />
            {/* Showcase роут доступен только в DEV режиме */}
            {import.meta.env.DEV && ShowcasePage && (
              <Route
                path="/showcase"
                element={
                  <motion.div
                    key="showcase"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Suspense fallback={<LoadingSpinner />}>
                      <ShowcasePage />
                    </Suspense>
                  </motion.div>
                }
              />
            )}
            <Route
              path="/auth"
              element={
                <motion.div
                  key="auth"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <AuthPage
                    onSuccess={() => window.location.replace('/')}
                    onError={error => console.error('Auth error:', error)}
                  />
                </motion.div>
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AnimatePresence>
      </div>
    </Router>
  )
}

export default App
