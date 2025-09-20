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
import { LoadingSpinner } from '@/components/ui'

function App() {
  const {
    currentUser: _currentUser,
    hasCompletedOnboarding,
    isLoading,
    loadUser: _loadUser,
    updateLastVisit,
  } = useUserStore()

  const [isInitializing, setIsInitializing] = useState(true)
  const [initError, setInitError] = useState<string | null>(null)

  // Initialize app
  useEffect(() => {
    const initializeApp = async () => {
      try {
        await initializeStores()
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
  }, [updateLastVisit])

  // Handle onboarding completion
  const handleOnboardingComplete = () => {
    // Reload to ensure fresh state
    window.location.reload()
  }

  // Show loading state during initialization
  if (isInitializing || isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-garden-50 to-green-50">
        <motion.div
          className="text-center"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <div className="mb-4 text-6xl">🌸</div>
          <h1 className="mb-4 text-2xl font-bold text-gray-900">KiraKira</h1>
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600">Загружаем ваш сад...</p>
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
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AnimatePresence>
      </div>
    </Router>
  )
}

export default App
