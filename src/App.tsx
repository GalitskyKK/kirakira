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
import { useTelegram, useTelegramTheme } from '@/hooks'
import { telegramStorage } from '@/utils/telegramStorage'

function App() {
  const {
    currentUser,
    hasCompletedOnboarding,
    isAuthenticated,
    isLoading,
    loadUser: _loadUser,
    updateLastVisit,
    clearAllUserData,
    syncFromSupabase,
    createTelegramUser,
  } = useUserStore()

  const [isInitializing, setIsInitializing] = useState(true)
  const [initError, setInitError] = useState<string | null>(null)
  const [showAuth, setShowAuth] = useState(false)

  // Telegram интеграция
  const {
    user: telegramUser,
    isTelegramEnv,
    isReady: telegramReady,
  } = useTelegram()
  const { colorScheme } = useTelegramTheme()

  // Initialize app
  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Инициализируем Telegram хранилище если доступно
        if (isTelegramEnv) {
          telegramStorage.initialize()

          // Ждем готовности Telegram WebApp
          if (!telegramReady) {
            await new Promise(resolve => {
              const checkReady = () => {
                if (telegramReady) {
                  resolve(void 0)
                } else {
                  setTimeout(checkReady, 100)
                }
              }
              checkReady()
            })
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

        updateLastVisit()
      } catch (error) {
        console.error('Failed to initialize app:', error)
        setInitError(
          error instanceof Error ? error.message : 'Initialization failed'
        )
      } finally {
        setIsInitializing(false)
      }
    }

    void initializeApp()
  }, [updateLastVisit, isTelegramEnv, telegramReady])

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

  // Show error state if initialization failed
  if (initError) {
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
    return <OnboardingPage onComplete={handleOnboardingComplete} />
  }

  // Show auth screen for non-authenticated users (optional)
  if (showAuth && !isAuthenticated && !isTelegramEnv) {
    return (
      <AuthPage
        onSuccess={() => setShowAuth(false)}
        onError={error => console.error('Auth error:', error)}
      />
    )
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
