import { useState, useEffect } from 'react'
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useUserStore } from '@/stores'
import { HomePage } from '@/pages/HomePage'
import { OnboardingPage } from '@/pages/OnboardingPage'
import { AuthPage } from '@/pages/AuthPage'
// ShowcasePage импортируется условно только в DEV режиме
import { LoadingSpinner } from '@/components/ui'
import { lazy, Suspense } from 'react'

// Динамический импорт dev страниц только в DEV режиме
const ShowcasePage = import.meta.env.DEV
  ? lazy(() => import('@/pages/ShowcasePage'))
  : null

const TelegramTestPage = import.meta.env.DEV
  ? lazy(() => import('@/pages/TelegramTestPage'))
  : null

const StreakDebugPage = import.meta.env.DEV
  ? lazy(() => import('@/pages/StreakDebugPage'))
  : null

const ProfileDebugPage = import.meta.env.DEV
  ? lazy(() => import('@/pages/ProfileDebugPage'))
  : null

// Lazy import для страницы профиля друга
const FriendProfilePage = lazy(() => import('@/pages/FriendProfilePage'))
import { TelegramDiagnostic } from '@/components/TelegramDiagnostic'
import { useTelegram, useTelegramTheme, useAppInitialization } from '@/hooks'
import { InitializationStage } from '@/types/initialization'

interface AppInitState {
  stage: InitializationStage
  isLoading: boolean
  error: string | null
  progress: number
  initialize: () => void
  isCompleted: boolean
  isFailed: boolean
  canRetry: boolean
}

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
    isLoading: userStoreLoading,
  } = useUserStore()

  const [showAuth, setShowAuth] = useState(false)

  // Telegram интеграция
  const {
    user: telegramUser,
    isTelegramEnv: _isTelegramEnv, // уже объявлено выше
    isReady: telegramReady,
  } = useTelegram()

  const { colorScheme } = useTelegramTheme()

  // ✨ ПРОФЕССИОНАЛЬНАЯ ИНИЦИАЛИЗАЦИЯ
  const initState = useAppInitialization({
    enableTelegram: isTelegramEnv,
    isDevelopment,
  }) as AppInitState

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
      isLoading: userStoreLoading,
    })

    console.log('🔍 TELEGRAM HOOKS LOADED:', {
      telegramUser: !!telegramUser,
      isTelegramEnv,
      telegramReady,
    })

    console.log('🔍 INITIALIZATION STATE:', {
      stage: initState.stage,
      isLoading: initState.isLoading,
      progress: initState.progress,
      error: initState.error,
    })
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
    // Обновляем состояние в userStore без reload
    const { completeOnboarding } = useUserStore.getState()
    completeOnboarding()

    if (isDevelopment) {
      console.log('✅ Онбординг завершён без reload')
    }
  }

  // Show loading state during initialization
  if (initState.isLoading || userStoreLoading) {
    // 🔍 ОТЛАДКА ЭКРАНА ЗАГРУЗКИ (только в dev режиме)
    if (isDevelopment) {
      console.log('🔍 РЕНДЕРИМ ЭКРАН ЗАГРУЗКИ:', {
        initStage: initState.stage,
        initLoading: initState.isLoading,
        initProgress: initState.progress,
        userStoreLoading,
        isTelegramEnv,
        telegramReady,
        telegramUser: !!telegramUser,
        currentUser: !!currentUser,
        hasCompletedOnboarding,
        isAuthenticated,
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

          {/* Прогресс бар инициализации */}
          {initState.progress > 0 && (
            <div className="mt-4 w-full max-w-xs">
              <div className="mb-2 flex justify-between text-xs text-[var(--tg-hint-color,#666666)]">
                <span>Прогресс</span>
                <span>{initState.progress}%</span>
              </div>
              <div className="h-2 w-full rounded-full bg-gray-200">
                <div
                  className="h-2 rounded-full bg-gradient-to-r from-green-400 to-blue-500 transition-all duration-300"
                  style={{ width: `${initState.progress}%` }}
                />
              </div>
            </div>
          )}

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
                  Init: {initState.isLoading ? '⏳ Инициализация' : '✅ Готов'}
                </div>
                <div>
                  Loading: {userStoreLoading ? '⏳ Загрузка' : '✅ Загружен'}
                </div>
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

              {Boolean(initState.error?.trim()) && (
                <div className="font-semibold text-red-600">
                  ❌ Ошибка: {initState.error}
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
                    window.location.reload()
                  }}
                  className="w-full rounded bg-red-500/70 px-3 py-2 text-xs text-white hover:bg-red-600/70"
                >
                  🚨 Перезагрузить приложение (dev only)
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
      initError: Boolean(initState.error?.trim()),
      initFailed: initState.isFailed,
      hasCompletedOnboarding,
      isAuthenticated,
      isTelegramEnv,
    })
  }

  // Show error state if initialization failed
  if (initState.isFailed && Boolean(initState.error?.trim())) {
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
          <p className="mb-6 text-gray-600">{initState.error}</p>
          <div className="space-y-3">
            {initState.canRetry && (
              <button
                onClick={() => initState.initialize()}
                className="w-full rounded-lg bg-blue-500 px-6 py-3 text-white transition-colors hover:bg-blue-600"
              >
                🔄 Попробовать снова
              </button>
            )}
            <button
              onClick={() => window.location.reload()}
              className="w-full rounded-lg bg-red-500 px-6 py-3 text-white transition-colors hover:bg-red-600"
            >
              ⚡ Перезагрузить страницу
            </button>
          </div>
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
            {/* Dev роуты доступны только в DEV режиме */}
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

            {import.meta.env.DEV && TelegramTestPage && (
              <Route
                path="/telegram-test"
                element={
                  <motion.div
                    key="telegram-test"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Suspense fallback={<LoadingSpinner />}>
                      <TelegramTestPage />
                    </Suspense>
                  </motion.div>
                }
              />
            )}

            {import.meta.env.DEV && StreakDebugPage && (
              <Route
                path="/streak-debug"
                element={
                  <motion.div
                    key="streak-debug"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Suspense fallback={<LoadingSpinner />}>
                      <StreakDebugPage />
                    </Suspense>
                  </motion.div>
                }
              />
            )}

            {import.meta.env.DEV && ProfileDebugPage && (
              <Route
                path="/profile-debug"
                element={
                  <motion.div
                    key="profile-debug"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Suspense fallback={<LoadingSpinner />}>
                      <ProfileDebugPage />
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
            <Route
              path="/friend/:friendTelegramId"
              element={
                <motion.div
                  key="friend-profile"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <Suspense fallback={<LoadingSpinner />}>
                    <FriendProfilePage />
                  </Suspense>
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
