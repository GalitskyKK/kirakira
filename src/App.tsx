import { useEffect, useMemo, useState, Suspense, useCallback } from 'react'
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useUserClientStore, useUserSync } from '@/hooks/index.v2'
import { UserProvider } from '@/contexts/UserContext'
import { useGardenClientStore } from '@/stores/gardenStore'
import { useReducedMotion } from '@/hooks'
import { LoadingSpinner } from '@/components/ui'
import { UpdatePrompt } from '@/components/ui/UpdatePrompt'
import { CompanionOverlay } from '@/components/layout/CompanionOverlay'
import { lazyWithRetry } from '@/utils/lazyWithRetry'

// Страницы лениво подгружаются с автоматическим retry при ошибках загрузки
// Это решает проблему 404 ошибок при деплое на Vercel
const HomePage = lazyWithRetry(() =>
  import('@/pages/HomePage').then(module => ({ default: module.HomePage }))
)
const OnboardingPage = lazyWithRetry(() =>
  import('@/pages/OnboardingPage').then(module => ({
    default: module.OnboardingPage,
  }))
)
const AuthPage = lazyWithRetry(() =>
  import('@/pages/AuthPage').then(module => ({ default: module.AuthPage }))
)
const ProfilePage = lazyWithRetry(() =>
  import('@/pages/ProfilePage').then(module => ({
    default: module.ProfilePage,
  }))
)
const MoodPage = lazyWithRetry(() =>
  import('@/pages/MoodPage').then(module => ({ default: module.MoodPage }))
)
const MoodRoadmapPage = lazyWithRetry(() =>
  import('@/pages/MoodRoadmapPage').then(module => ({
    default: module.MoodRoadmapPage,
  }))
)
const GardenPage = lazyWithRetry(() =>
  import('@/pages/GardenPage').then(module => ({ default: module.GardenPage }))
)
const TasksPage = lazyWithRetry(() =>
  import('@/pages/TasksPage').then(module => ({ default: module.TasksPage }))
)
const CommunityPage = lazyWithRetry(() =>
  import('@/pages/CommunityPage').then(module => ({
    default: module.CommunityPage,
  }))
)
const SettingsPage = lazyWithRetry(() =>
  import('@/pages/SettingsPage').then(module => ({
    default: module.SettingsPage,
  }))
)
const ShopPage = lazyWithRetry(() =>
  import('@/pages/ShopPage').then(module => ({ default: module.ShopPage }))
)
const StatsPage = lazyWithRetry(() =>
  import('@/pages/StatsPage').then(module => ({ default: module.StatsPage }))
)
const MobileLayout = lazyWithRetry(() =>
  import('@/components/layout/MobileLayout').then(module => ({
    default: module.MobileLayout,
  }))
)
const DesktopLayout = lazyWithRetry(() =>
  import('@/components/layout/DesktopLayout').then(module => ({
    default: module.DesktopLayout,
  }))
)

// Динамический импорт dev страниц только в DEV режиме
const ShowcasePage = import.meta.env.DEV
  ? lazyWithRetry(() => import('@/pages/ShowcasePage'))
  : null

const TelegramTestPage = import.meta.env.DEV
  ? lazyWithRetry(() => import('@/pages/TelegramTestPage'))
  : null

const StreakDebugPage = import.meta.env.DEV
  ? lazyWithRetry(() => import('@/pages/StreakDebugPage'))
  : null

// Lazy import для страницы профиля друга
const FriendProfilePage = lazyWithRetry(
  () => import('@/pages/FriendProfilePage')
)
const LeaderboardPage = lazyWithRetry(() => import('@/pages/LeaderboardPage'))
import { TelegramDiagnostic } from '@/components/TelegramDiagnostic'
import { useTelegram, useTelegramTheme, useAppInitialization } from '@/hooks'
import { InitializationStage } from '@/types/initialization'
import { getTelegramIdFromJWT } from '@/utils/apiClient'
import { hasGuestData, clearGuestData, loadGuestBundle } from '@/utils/storage'
import { telegramStorage } from '@/utils/telegramStorage'
import { importGuestData } from '@/api'

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
  const shouldReduceMotion = useReducedMotion()
  const fallback = <LoadingSpinner />
  const { displayMode, setDisplayMode } = useGardenClientStore()

  const withSuspense = useCallback(
    (node: JSX.Element) => <Suspense fallback={fallback}>{node}</Suspense>,
    [fallback]
  )

  // 🚨 ПРОВЕРКА ДИАГНОСТИЧЕСКОГО РЕЖИМА
  const urlParams = new URLSearchParams(window.location.search)
  const forceDiagnostic =
    urlParams.get('diagnostic') === '1' ||
    urlParams.get('force_diagnostic') === '1'

  // Определяем Telegram окружение: проверяем не только наличие WebApp, но и initData
  // Это важно, так как в браузере может быть определен window.Telegram через расширения
  const isTelegramEnv = !!(
    window.Telegram?.WebApp &&
    (window.Telegram.WebApp.initData ||
      window.Telegram.WebApp.initDataUnsafe?.user)
  )

  // ✅ ВСЕ ХУКИ ДОЛЖНЫ БЫТЬ ВЫЗВАНЫ ДО ЛЮБОГО УСЛОВНОГО ВОЗВРАТА
  const {
    hasCompletedOnboarding,
    isGuestModeEnabled,
    isLoading: userStoreLoading,
  } = useUserClientStore()

  // В Telegram при пустом localStorage (например, открытие с кнопки «ОТКРЫТЬ») сначала проверяем Cloud Storage
  const [onboardingCloudCheckDone, setOnboardingCloudCheckDone] = useState(false)

  // Telegram интеграция
  const {
    user: telegramUser,
    isTelegramEnv: _isTelegramEnv, // уже объявлено выше
    isReady: telegramReady,
  } = useTelegram()

  // Получаем telegramId из JWT токена (если не в Telegram)
  let jwtTelegramId: number | null = null
  if (!isTelegramEnv) {
    try {
      const id = getTelegramIdFromJWT()
      jwtTelegramId = id ?? null
    } catch {
      jwtTelegramId = null
    }
  }

  // Определяем актуальный telegramId: Telegram WebApp > JWT токен
  const actualTelegramId: number | undefined =
    telegramUser?.telegramId ?? jwtTelegramId ?? undefined

  // Получаем данные пользователя через React Query
  const { data: userData, isLoading: userLoading } = useUserSync(
    actualTelegramId,
    actualTelegramId != null
  )

  const currentUser = userData?.user
  // Считаем авторизованным, если есть telegramId (даже если данные еще загружаются)
  // или если загрузились данные пользователя
  const isAuthenticated = actualTelegramId != null || currentUser != null

  const { colorScheme } = useTelegramTheme()

  // ✨ ПРОФЕССИОНАЛЬНАЯ ИНИЦИАЛИЗАЦИЯ
  const initState = useAppInitialization({
    enableTelegram: isTelegramEnv,
    isDevelopment,
  }) as AppInitState

  // Оптимизированные параметры анимации для роутов
  const routeTransition = useMemo(
    () =>
      shouldReduceMotion
        ? { duration: 0.15, ease: 'easeOut' }
        : { duration: 0.3, ease: 'easeInOut' },
    [shouldReduceMotion]
  )

  // Синхронизируем клиентский режим отображения сада с предпочтением из профиля
  useEffect(() => {
    const preferredMode = userData?.user?.preferences.garden.displayMode
    if (preferredMode && preferredMode !== displayMode) {
      setDisplayMode(preferredMode)
    }
  }, [
    userData?.user?.preferences.garden.displayMode,
    displayMode,
    setDisplayMode,
  ])

  // Применяем тему Telegram к корневому элементу
  useEffect(() => {
    if (isTelegramEnv) {
      document.documentElement.classList.toggle('dark', colorScheme === 'dark')
    }
  }, [isTelegramEnv, colorScheme])

  // Проверка онбординга из Telegram Cloud Storage (только когда локально «не пройден» — избегаем повторного онбординга при открытии с кнопки «ОТКРЫТЬ»)
  useEffect(() => {
    if (!isTelegramEnv || hasCompletedOnboarding || onboardingCloudCheckDone) return
    let cancelled = false
    const ONBOARDING_CLOUD_CHECK_TIMEOUT_MS = 3000

    const run = async (): Promise<void> => {
      telegramStorage.initialize()
      const completed = await Promise.race([
        telegramStorage.isOnboardingCompleted(),
        new Promise<boolean>(resolve =>
          setTimeout(() => resolve(false), ONBOARDING_CLOUD_CHECK_TIMEOUT_MS)
        ),
      ])
      if (cancelled) return
      if (completed) {
        useUserClientStore.getState().completeOnboarding()
      }
      setOnboardingCloudCheckDone(true)
    }
    void run()
    return () => {
      cancelled = true
    }
  }, [isTelegramEnv, hasCompletedOnboarding, onboardingCloudCheckDone])

  // В Telegram WebApp отключаем Service Worker, чтобы избежать 404 на чанки
  useEffect(() => {
    if (!isTelegramEnv || !('serviceWorker' in navigator)) return

    const unregisterAndClearCaches = async (): Promise<void> => {
      try {
        const registrations = await navigator.serviceWorker.getRegistrations()
        await Promise.all(
          registrations.map(registration => registration.unregister())
        )
      } catch {
        console.warn('Не удалось удалить Service Worker в Telegram WebApp')
      }

      if ('caches' in window) {
        try {
          const cacheNames = await caches.keys()
          await Promise.all(
            cacheNames.map(cacheName => caches.delete(cacheName))
          )
        } catch {
          console.warn('Не удалось очистить Cache Storage в Telegram WebApp')
        }
      }
    }

    void unregisterAndClearCaches()
  }, [isTelegramEnv])

  // ✅ ЛОГИРОВАНИЕ ПОСЛЕ ВСЕХ ХУКОВ
  // 🚨 ПОКАЗАТЬ ДИАГНОСТИКУ ПРИ ПРОБЛЕМАХ В TELEGRAM (после всех хуков)
  if (forceDiagnostic || (isTelegramEnv && urlParams.get('debug') === '1')) {
    return <TelegramDiagnostic />
  }

  // Handle onboarding completion
  const handleOnboardingComplete = () => {
    // Обновляем состояние в userStore без reload
    const { completeOnboarding } = useUserClientStore.getState()
    completeOnboarding()
  }

  const handleAuthSuccess = useCallback(async () => {
    if (hasGuestData()) {
      const shouldImportGuestData = window.confirm(
        'Найден прогресс из гостевого режима. Импортировать его в аккаунт? Если у вас уже есть данные в аккаунте, мы НЕ будем их перезаписывать.'
      )

      if (shouldImportGuestData) {
        const guestBundle = loadGuestBundle()
        const targetTelegramId = actualTelegramId ?? telegramUser?.telegramId

        if (targetTelegramId) {
          try {
            await importGuestData({
              telegramId: targetTelegramId,
              user: guestBundle.user,
              garden: guestBundle.garden ?? null,
              moodHistory: guestBundle.moodHistory,
              onlyIfNew: true, // не трогаем существующие аккаунты
            })
          } catch (error) {
            console.error('Импорт гостевых данных не удался:', error)
          }
        } else {
          console.warn(
            'Импорт гостевых данных пропущен: telegramId не определён'
          )
        }
      } else {
        clearGuestData()
      }
    }

    const { disableGuestMode } = useUserClientStore.getState()
    disableGuestMode()
    window.location.reload()
  }, [actualTelegramId, telegramUser?.telegramId])

  const handleSkipAuth = useCallback(() => {
    const { enableGuestMode } = useUserClientStore.getState()
    enableGuestMode()
    window.history.replaceState(null, '', '/')
  }, [])

  // Show loading state during initialization или пока проверяем онбординг в Cloud (Telegram, кнопка «ОТКРЫТЬ»)
  const isResolvingOnboardingFromCloud =
    isTelegramEnv && !hasCompletedOnboarding && !onboardingCloudCheckDone
  if (initState.isLoading || isResolvingOnboardingFromCloud) {
    // 🔍 ОТЛАДКА ЭКРАНА ЗАГРУЗКИ (только в dev режиме)
    const bgClass = isTelegramEnv
      ? 'bg-[var(--tg-bg-color,#ffffff)]'
      : 'from-kira-50 bg-gradient-to-br via-garden-50 to-neutral-50 dark:from-neutral-900 dark:via-neutral-800 dark:to-neutral-900'

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
          <motion.div
            className="mx-auto mb-4"
            style={{ width: '120px', height: '120px' }}
            animate={{
              y: [0, -10, 0],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          >
            <img
              src="/logo.png"
              alt="KiraKira"
              className="h-full w-full object-contain drop-shadow-lg dark:drop-shadow-[0_4px_12px_rgba(255,255,255,0.1)]"
            />
          </motion.div>
          <h1 className="mb-6 bg-gradient-to-r from-kira-600 via-kira-500 to-garden-500 bg-clip-text text-4xl font-bold text-transparent">
            KiraKira
          </h1>
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-neutral-600 dark:text-neutral-400">
            {isTelegramEnv
              ? '🌱 Инициализируем ваш эмоциональный сад...'
              : 'Загружаем ваш сад...'}
          </p>

          {/* Прогресс бар инициализации */}
          {initState.progress > 0 && (
            <div className="mt-4 w-full max-w-xs">
              <div className="mb-2 flex justify-between text-xs text-neutral-600 dark:text-neutral-400">
                <span>Прогресс</span>
                <span>{initState.progress}%</span>
              </div>
              <div className="h-2 w-full rounded-full bg-neutral-200 dark:bg-neutral-700">
                <div
                  className="h-2 rounded-full bg-gradient-to-r from-kira-400 via-kira-500 to-garden-400 transition-all duration-300"
                  style={{ width: `${initState.progress}%` }}
                />
              </div>
            </div>
          )}

          {/* Дружелюбное приветствие для Telegram пользователей в проде */}
          {isTelegramEnv && telegramUser && !isDevelopment && (
            <div className="glass-card mt-4 rounded-2xl p-4">
              <p className="text-sm text-neutral-700 dark:text-neutral-200">
                👋 Добро пожаловать, {telegramUser.firstName}!
              </p>
              <p className="mt-1 text-xs text-neutral-600 dark:text-neutral-300">
                🔄 Подготавливаем ваш персональный сад
              </p>
            </div>
          )}

          {/* 🔍 РАСШИРЕННАЯ ДИАГНОСТИКА - только в development режиме */}
          {isDevelopment && isTelegramEnv && (
            <div className="glass-card mt-4 space-y-2 rounded-2xl bg-yellow-50/50 p-3 text-xs dark:bg-yellow-900/20">
              <div className="font-semibold">
                🔍 Диагностика Telegram (Dev Mode):
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  Init: {initState.isLoading ? '⏳ Инициализация' : '✅ Готов'}
                </div>
                <div>
                  Loading:{' '}
                  {userStoreLoading || userLoading
                    ? '⏳ Загрузка'
                    : '✅ Загружен'}
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
            <div className="glass-card mt-4 rounded-2xl p-3">
              <p className="text-sm text-neutral-700 dark:text-neutral-200">
                👋 Добро пожаловать, {telegramUser.firstName}!
              </p>
              <p className="mt-1 text-xs text-neutral-600 dark:text-neutral-300">
                🔄 Автоматическая синхронизация через Telegram
              </p>
            </div>
          )}
        </motion.div>
      </div>
    )
  }

  // Show error state if initialization failed
  if (initState.isFailed && Boolean(initState.error?.trim())) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-red-50 via-orange-50 to-neutral-50 dark:from-neutral-900 dark:to-neutral-800">
        <motion.div
          className="mx-auto max-w-md p-8 text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="mb-4 text-6xl">⚠️</div>
          <h1 className="mb-4 text-2xl font-bold text-neutral-900 dark:text-neutral-100">
            Ошибка инициализации
          </h1>
          <p className="mb-6 text-neutral-600 dark:text-neutral-400">
            {initState.error}
          </p>
          <div className="space-y-3">
            {initState.canRetry && (
              <button
                onClick={() => initState.initialize()}
                className="w-full rounded-2xl bg-kira-500 px-6 py-3 text-white transition-all hover:bg-kira-600 hover:shadow-lg"
              >
                🔄 Попробовать снова
              </button>
            )}
            <button
              onClick={() => window.location.reload()}
              className="w-full rounded-2xl bg-red-500 px-6 py-3 text-white transition-all hover:bg-red-600 hover:shadow-lg"
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
    return withSuspense(
      <OnboardingPage onComplete={handleOnboardingComplete} />
    )
  }

  // Проверяем авторизацию только после завершения инициализации и загрузки данных
  // Не показываем ошибки во время загрузки
  const shouldCheckAuth = !initState.isLoading && !userLoading

  const isDevShowcaseRoute =
    import.meta.env.DEV && window.location.pathname.startsWith('/showcase')

  // Show auth screen for non-authenticated users in browser
  // В Telegram Mini App авторизация автоматическая, если нет telegramId - это ошибка
  if (
    shouldCheckAuth &&
    !isAuthenticated &&
    !isTelegramEnv &&
    !isDevShowcaseRoute &&
    !isGuestModeEnabled
  ) {
    return withSuspense(
      <AuthPage
        onSuccess={handleAuthSuccess}
        onSkip={handleSkipAuth}
        onError={(error: unknown) => console.error('Auth error:', error)}
      />
    )
  }

  // В Telegram Mini App без telegramId - показываем ошибку только после завершения загрузки
  // и только если действительно нет telegramId (не во время загрузки)
  const hasNoTelegramId =
    telegramUser?.telegramId == null || telegramUser.telegramId === 0
  if (
    shouldCheckAuth &&
    !isAuthenticated &&
    isTelegramEnv &&
    hasNoTelegramId &&
    !userLoading
  ) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-red-50 via-orange-50 to-neutral-50 dark:from-neutral-900 dark:to-neutral-800">
        <motion.div
          className="mx-auto max-w-md p-8 text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="mb-4 text-6xl">⚠️</div>
          <h1 className="mb-4 text-2xl font-bold text-neutral-900 dark:text-neutral-100">
            Ошибка авторизации
          </h1>
          <p className="mb-6 text-neutral-600 dark:text-neutral-400">
            Не удалось получить данные пользователя из Telegram. Пожалуйста,
            попробуйте перезапустить приложение.
          </p>
          {isDevelopment && (
            <div className="mb-4 rounded-lg bg-yellow-50 p-4 text-left text-xs text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-200">
              <p className="font-semibold">Debug Info:</p>
              <p>
                Telegram WebApp: {window.Telegram?.WebApp != null ? '✅' : '❌'}
              </p>
              <p>
                InitData:{' '}
                {(window.Telegram?.WebApp?.initData?.length ?? 0) > 0
                  ? '✅'
                  : '❌'}
              </p>
              <p>
                User in initData:{' '}
                {window.Telegram?.WebApp?.initDataUnsafe?.user != null
                  ? '✅'
                  : '❌'}
              </p>
            </div>
          )}
          <button
            onClick={() => window.location.reload()}
            className="w-full rounded-2xl bg-kira-500 px-6 py-3 text-white transition-all hover:bg-kira-600 hover:shadow-lg"
          >
            🔄 Перезагрузить
          </button>
        </motion.div>
      </div>
    )
  }

  // Main app routing
  return (
    <UserProvider>
      <div className="App">
        <Router>
          {/* AnimatePresence только если не включен режим уменьшения анимаций */}
          {shouldReduceMotion ? (
            <Routes>
              <Route path="/desktop" element={withSuspense(<DesktopLayout />)}>
                <Route index element={withSuspense(<HomePage />)} />
                <Route path="profile" element={withSuspense(<ProfilePage />)} />
                <Route
                  path="challenges"
                  element={withSuspense(<TasksPage />)}
                />
                <Route
                  path="friends"
                  element={withSuspense(<CommunityPage />)}
                />
              </Route>
              <Route path="/" element={<Navigate to="/desktop" replace />} />
              <Route path="/mobile" element={withSuspense(<MobileLayout />)}>
                <Route index element={withSuspense(<MoodPage />)} />
                <Route path="garden" element={withSuspense(<GardenPage />)} />
                <Route path="tasks" element={withSuspense(<TasksPage />)} />
                <Route
                  path="community"
                  element={withSuspense(<CommunityPage />)}
                />
                <Route path="profile" element={withSuspense(<ProfilePage />)} />
              </Route>
              <Route
                path="/mobile/settings"
                element={withSuspense(<SettingsPage />)}
              />
              <Route
                path="/mobile/stats"
                element={withSuspense(<StatsPage />)}
              />
              <Route path="/mobile/shop" element={withSuspense(<ShopPage />)} />
              <Route
                path="/mobile/mood-roadmap"
                element={withSuspense(<MoodRoadmapPage />)}
              />
              {import.meta.env.DEV && ShowcasePage && (
                <Route
                  path="/showcase"
                  element={
                    <Suspense fallback={<LoadingSpinner />}>
                      <ShowcasePage />
                    </Suspense>
                  }
                />
              )}
              {import.meta.env.DEV && TelegramTestPage && (
                <Route
                  path="/telegram-test"
                  element={
                    <Suspense fallback={<LoadingSpinner />}>
                      <TelegramTestPage />
                    </Suspense>
                  }
                />
              )}
              {import.meta.env.DEV && StreakDebugPage && (
                <Route
                  path="/streak-debug"
                  element={
                    <Suspense fallback={<LoadingSpinner />}>
                      <StreakDebugPage />
                    </Suspense>
                  }
                />
              )}
              <Route
                path="/auth"
                element={withSuspense(
                  <AuthPage
                    onSuccess={handleAuthSuccess}
                    onSkip={handleSkipAuth}
                    onError={(error: unknown) =>
                      console.error('Auth error:', error)
                    }
                  />
                )}
              />
              <Route path="/profile" element={withSuspense(<ProfilePage />)} />
              <Route
                path="/friend/:friendTelegramId"
                element={withSuspense(<FriendProfilePage />)}
              />
              <Route
                path="/leaderboard"
                element={withSuspense(<LeaderboardPage />)}
              />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          ) : (
            <AnimatePresence mode="wait">
              <Routes>
                <Route
                  path="/desktop"
                  element={withSuspense(<DesktopLayout />)}
                >
                  <Route
                    index
                    element={
                      <motion.div
                        key="home"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={routeTransition}
                      >
                        {withSuspense(<HomePage />)}
                      </motion.div>
                    }
                  />
                  <Route
                    path="profile"
                    element={
                      <motion.div
                        key="desktop-profile"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={routeTransition}
                      >
                        {withSuspense(<ProfilePage />)}
                      </motion.div>
                    }
                  />
                  <Route
                    path="challenges"
                    element={
                      <motion.div
                        key="desktop-challenges"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={routeTransition}
                      >
                        {withSuspense(<TasksPage />)}
                      </motion.div>
                    }
                  />
                  <Route
                    path="friends"
                    element={
                      <motion.div
                        key="desktop-friends"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={routeTransition}
                      >
                        {withSuspense(<CommunityPage />)}
                      </motion.div>
                    }
                  />
                </Route>
                <Route path="/" element={<Navigate to="/desktop" replace />} />
                <Route path="/mobile" element={withSuspense(<MobileLayout />)}>
                  <Route index element={withSuspense(<MoodPage />)} />
                  <Route path="garden" element={withSuspense(<GardenPage />)} />
                  <Route path="tasks" element={withSuspense(<TasksPage />)} />
                  <Route
                    path="community"
                    element={withSuspense(<CommunityPage />)}
                  />
                  <Route
                    path="profile"
                    element={withSuspense(<ProfilePage />)}
                  />
                </Route>
                <Route
                  path="/mobile/settings"
                  element={
                    <motion.div
                      key="settings"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={routeTransition}
                    >
                      {withSuspense(<SettingsPage />)}
                    </motion.div>
                  }
                />
                <Route
                  path="/mobile/stats"
                  element={
                    <motion.div
                      key="stats"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={routeTransition}
                    >
                      {withSuspense(<StatsPage />)}
                    </motion.div>
                  }
                />
                <Route
                  path="/mobile/shop"
                  element={
                    <motion.div
                      key="shop"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={routeTransition}
                    >
                      {withSuspense(<ShopPage />)}
                    </motion.div>
                  }
                />
                <Route
                  path="/mobile/mood-roadmap"
                  element={
                    <motion.div
                      key="mood-roadmap"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={routeTransition}
                    >
                      {withSuspense(<MoodRoadmapPage />)}
                    </motion.div>
                  }
                />
                {import.meta.env.DEV && ShowcasePage && (
                  <Route
                    path="/showcase"
                    element={
                      <motion.div
                        key="showcase"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={routeTransition}
                      >
                        <Suspense fallback={<LoadingSpinner />}>
                          {withSuspense(<ShowcasePage />)}
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
                        transition={routeTransition}
                      >
                        <Suspense fallback={<LoadingSpinner />}>
                          {withSuspense(<TelegramTestPage />)}
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
                        transition={routeTransition}
                      >
                        <Suspense fallback={<LoadingSpinner />}>
                          {withSuspense(<StreakDebugPage />)}
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
                      transition={routeTransition}
                    >
                      {withSuspense(
                        <AuthPage
                          onSuccess={handleAuthSuccess}
                          onSkip={handleSkipAuth}
                          onError={(error: unknown) =>
                            console.error('Auth error:', error)
                          }
                        />
                      )}
                    </motion.div>
                  }
                />
                <Route
                  path="/profile"
                  element={
                    <motion.div
                      key="profile"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={routeTransition}
                    >
                      {withSuspense(<ProfilePage />)}
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
                      transition={routeTransition}
                    >
                      {withSuspense(<FriendProfilePage />)}
                    </motion.div>
                  }
                />
                <Route
                  path="/leaderboard"
                  element={
                    <motion.div
                      key="leaderboard"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={routeTransition}
                    >
                      {withSuspense(<LeaderboardPage />)}
                    </motion.div>
                  }
                />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </AnimatePresence>
          )}
        </Router>

        <CompanionOverlay />

        {/* PWA Update Prompt - отключен для Telegram WebApp */}
        {!isTelegramEnv && <UpdatePrompt />}
      </div>
    </UserProvider>
  )
}

export default App
