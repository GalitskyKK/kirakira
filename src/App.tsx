import { useEffect, useState } from 'react'
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
import { ShowcasePage } from '@/pages/ShowcasePage'
import { AuthPage } from '@/pages/AuthPage'
import { LoadingSpinner } from '@/components/ui'
import { TelegramDiagnostic } from '@/components/TelegramDiagnostic'
import { useTelegram, useTelegramTheme } from '@/hooks'
import { telegramStorage } from '@/utils/telegramStorage'

function App() {
  console.log('🔍 APP.TSX COMPONENT MOUNTING...')

  // 🚨 ПРОВЕРКА ДИАГНОСТИЧЕСКОГО РЕЖИМА
  const urlParams = new URLSearchParams(window.location.search)
  const forceDiagnostic =
    urlParams.get('diagnostic') === '1' ||
    urlParams.get('force_diagnostic') === '1'
  const isTelegramEnv = !!window.Telegram?.WebApp

  // 🚨 ПОКАЗАТЬ ДИАГНОСТИКУ ПРИ ПРОБЛЕМАХ В TELEGRAM
  if (forceDiagnostic || (isTelegramEnv && urlParams.get('debug') === '1')) {
    console.log('🚨 ПОКАЗЫВАЕМ ДИАГНОСТИЧЕСКУЮ СТРАНИЦУ')
    return <TelegramDiagnostic />
  }

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

  console.log('🔍 USER STORE LOADED:', {
    currentUser: !!currentUser,
    hasCompletedOnboarding,
    isAuthenticated,
    isLoading,
  })

  const [isInitializing, setIsInitializing] = useState(true)
  const [initError, setInitError] = useState<string | null>(null)
  const [showAuth, setShowAuth] = useState(false)

  // Telegram интеграция
  const {
    user: telegramUser,
    isTelegramEnv: _isTelegramEnv, // уже объявлено выше
    isReady: telegramReady,
  } = useTelegram()

  console.log('🔍 TELEGRAM HOOKS LOADED:', {
    telegramUser: !!telegramUser,
    isTelegramEnv,
    telegramReady,
  })

  const { colorScheme } = useTelegramTheme()

  console.log('🔍 TELEGRAM THEME LOADED:', { colorScheme })

  // Initialize app
  useEffect(() => {
    const initializeApp = async () => {
      console.log('🚀 НАЧАЛО ИНИЦИАЛИЗАЦИИ KiraKira App')
      console.log('🔍 TELEGRAM ДИАГНОСТИКА:', {
        isTelegramEnv,
        telegramReady,
        windowTelegram: !!window.Telegram,
        windowTelegramWebApp: !!window.Telegram?.WebApp,
        userAgent: navigator.userAgent,
        currentUser: currentUser
          ? {
              id: currentUser.id,
              telegramId: currentUser.telegramId,
              isAnonymous: currentUser.isAnonymous,
            }
          : null,
        telegramUser: telegramUser
          ? {
              id: telegramUser.telegramId,
              firstName: telegramUser.firstName,
              username: telegramUser.username,
            }
          : null,
      })

      // 🕐 ОБЪЯВЛЯЕМ ТАЙМАУТ В ОБЛАСТИ ВИДИМОСТИ ФУНКЦИИ
      let initTimeout: NodeJS.Timeout | null = null

      try {
        // 🕐 КРИТИЧНЫЙ ТАЙМАУТ для Telegram - если инициализация не завершится за 10 сек, принудительно продолжаем
        initTimeout = setTimeout(() => {
          console.warn('⚠️ ТАЙМАУТ ИНИЦИАЛИЗАЦИИ! Принудительно завершаем...')
          setIsInitializing(false)
        }, 10000) // 10 секунд

        // Инициализируем Telegram хранилище если доступно
        if (isTelegramEnv) {
          console.log('📱 Инициализируем Telegram хранилище...')
          telegramStorage.initialize()

          // 🚀 УПРОЩЕННАЯ ЛОГИКА: Ждем Telegram готовности максимум 5 секунд
          if (!telegramReady) {
            console.log('⏳ Ждем готовности Telegram WebApp (макс 5 сек)...')

            await Promise.race([
              new Promise(resolve => {
                const checkReady = () => {
                  if (telegramReady) {
                    console.log('✅ Telegram WebApp готов!')
                    resolve(void 0)
                  } else {
                    setTimeout(checkReady, 100)
                  }
                }
                checkReady()
              }),
              new Promise(resolve => {
                setTimeout(() => {
                  console.warn(
                    '⚠️ Таймаут ожидания Telegram WebApp - продолжаем без него'
                  )
                  resolve(void 0)
                }, 5000) // 5 секунд таймаут
              }),
            ])
          }

          // 🔄 ПРАВИЛЬНАЯ СИНХРОНИЗАЦИЯ С TELEGRAM
          if (telegramUser && telegramReady) {
            console.log('🔄 Начинаем синхронизацию Telegram пользователя:', {
              telegramId: telegramUser.telegramId,
              firstName: telegramUser.firstName,
              currentUserTelegramId: currentUser?.telegramId,
            })

            // Если это другой пользователь или первый вход - очищаем данные
            if (
              !currentUser ||
              currentUser.telegramId !== telegramUser.telegramId
            ) {
              try {
                console.log('🗑️ Очищаем старые данные перед синхронизацией...')
                await clearAllUserData()

                console.log('🔄 Синхронизируем данные из Supabase...')
                await syncFromSupabase(telegramUser.telegramId)

                // Если нет данных на сервере - создаем нового пользователя
                const { currentUser: syncedUser } = useUserStore.getState()
                if (!syncedUser) {
                  console.log('📝 Создаем нового Telegram пользователя...')
                  await createTelegramUser({
                    telegramId: telegramUser.telegramId,
                    firstName: telegramUser.firstName,
                    lastName: telegramUser.lastName,
                    username: telegramUser.username,
                    photoUrl: telegramUser.photoUrl,
                    authDate: new Date(),
                    hash: 'telegram_miniapp',
                  })
                }

                console.log('✅ Telegram синхронизация завершена')
              } catch (error) {
                console.error('❌ Ошибка синхронизации Telegram:', error)
                setInitError(
                  `Telegram sync failed: ${error instanceof Error ? error.message : 'Unknown error'}`
                )
              }
            } else {
              console.log('✅ Пользователь уже корректно авторизован')

              // 🔄 ПРИНУДИТЕЛЬНАЯ СИНХРОНИЗАЦИЯ для существующих пользователей
              try {
                console.log(
                  '🔄 Принудительная синхронизация данных с сервера...'
                )
                await syncFromSupabase(telegramUser.telegramId)
                console.log('✅ Принудительная синхронизация завершена')
              } catch (syncError) {
                console.warn(
                  '⚠️ Ошибка принудительной синхронизации:',
                  syncError
                )
              }
            }
          }
        }

        await initializeStores()

        // 🔄 ОДНОРАЗОВАЯ СИНХРОНИЗАЦИЯ ДАННЫХ для Telegram пользователей
        if (telegramUser && telegramReady) {
          try {
            console.log(
              '🔄 Одноразовая синхронизация stores с сервером при входе...'
            )

            // Получаем stores и принудительно синхронизируем ОДИН РАЗ
            const { useMoodStore } = await import('@/stores/moodStore')
            const { useGardenStore } = await import('@/stores/gardenStore')

            // Принудительно синхронизируем данные (один раз при входе)
            await useMoodStore.getState().syncMoodHistory(true) // forceSync = true
            await useGardenStore.getState().syncGarden(true) // forceSync = true

            console.log('✅ Stores синхронизированы с сервером')
          } catch (storesSyncError) {
            console.warn('⚠️ Ошибка синхронизации stores:', storesSyncError)
          }
        }

        // updateLastVisit() перенесено в loadUser() после инициализации пользователя

        // 🏁 ОЧИЩАЕМ ТАЙМАУТ при успешной инициализации
        if (initTimeout) clearTimeout(initTimeout)
        console.log('✅ ИНИЦИАЛИЗАЦИЯ ЗАВЕРШЕНА УСПЕШНО!')
      } catch (error) {
        // 🏁 ОЧИЩАЕМ ТАЙМАУТ при ошибке
        if (initTimeout) clearTimeout(initTimeout)
        console.error('❌ ОШИБКА ИНИЦИАЛИЗАЦИИ:', error)
        console.error(
          '❌ Stack trace:',
          error instanceof Error ? error.stack : 'No stack'
        )
        setInitError(
          error instanceof Error ? error.message : 'Initialization failed'
        )
      } finally {
        console.log('🏁 ФИНАЛИЗАЦИЯ ИНИЦИАЛИЗАЦИИ (setIsInitializing(false))')
        setIsInitializing(false)
      }
    }

    void initializeApp()
  }, []) // 🚀 УБИРАЕМ ВСЕ ЗАВИСИМОСТИ - инициализация должна происходить ТОЛЬКО ОДИН РАЗ!

  // Применяем тему Telegram к корневому элементу
  useEffect(() => {
    if (isTelegramEnv) {
      document.documentElement.classList.toggle('dark', colorScheme === 'dark')
    }
  }, [isTelegramEnv, colorScheme])

  // Handle onboarding completion
  const handleOnboardingComplete = () => {
    // Reload to ensure fresh state
    window.location.reload()
  }

  // Show loading state during initialization
  if (isInitializing || isLoading) {
    // 🔍 ОТЛАДКА ЭКРАНА ЗАГРУЗКИ
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

    console.log('🔍 НАЧАЛО РЕНДЕРИНГА LOADING SCREEN...')

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

          {/* 🔍 РАСШИРЕННАЯ ДИАГНОСТИКА для Telegram */}
          {isTelegramEnv && (
            <div className="mt-4 space-y-2 rounded-lg bg-yellow-100/50 p-3 text-xs">
              <div className="font-semibold">🔍 Диагностика Telegram:</div>

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
                  👤 @{telegramUser.username || telegramUser.firstName} (ID:{' '}
                  {telegramUser.telegramId})
                </div>
              )}

              {initError && (
                <div className="font-semibold text-red-600">
                  ❌ Ошибка: {initError}
                </div>
              )}

              <div className="text-xs text-gray-500">
                💡 Если экран не пропадает больше 10 сек - сообщите разработчику
              </div>

              {/* 🚨 АВАРИЙНАЯ КНОПКА после 15 секунд */}
              <div className="mt-2">
                <button
                  onClick={() => {
                    console.warn('🚨 АВАРИЙНЫЙ ВЫХОД ИЗ ИНИЦИАЛИЗАЦИИ!')
                    setIsInitializing(false)
                    setInitError(null)
                  }}
                  className="w-full rounded bg-red-500/70 px-3 py-2 text-xs text-white hover:bg-red-600/70"
                >
                  🚨 Пропустить инициализацию (аварийный выход)
                </button>
              </div>
            </div>
          )}
          {isTelegramEnv && telegramUser && (
            <div className="mt-4 rounded-lg bg-blue-100/50 p-3">
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

  console.log('🔍 ОСНОВНАЯ ЛОГИКА РЕНДЕРИНГА:', {
    initError: !!initError,
    hasCompletedOnboarding,
    isAuthenticated,
    isTelegramEnv,
  })

  // Show error state if initialization failed
  if (initError) {
    console.log('🔍 РЕНДЕРИМ ERROR STATE')
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
    console.log('🔍 РЕНДЕРИМ ONBOARDING PAGE')
    return <OnboardingPage onComplete={handleOnboardingComplete} />
  }

  // Show auth screen for non-authenticated users (optional)
  if (showAuth && !isAuthenticated && !isTelegramEnv) {
    console.log('🔍 РЕНДЕРИМ AUTH PAGE')
    return (
      <AuthPage
        onSuccess={() => setShowAuth(false)}
        onError={error => console.error('Auth error:', error)}
      />
    )
  }

  console.log('🔍 РЕНДЕРИМ ОСНОВНОЕ ПРИЛОЖЕНИЕ (ROUTER)')

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
                  <ShowcasePage />
                </motion.div>
              }
            />
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
