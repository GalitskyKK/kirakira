import { useState } from 'react'
import { motion } from 'framer-motion'
import { Button, LoadingSpinner } from '@/components/ui'
import { useProfileDebug } from '@/hooks/useProfileDebug'
import { useUserStore } from '@/stores'

export default function ProfileDebugPage() {
  const { currentUser } = useUserStore()
  const {
    isLoading,
    error,
    debugInfo,
    runDiagnostics,
    loadProfile,
    updatePrivacySettings,
    loadFriendProfile,
  } = useProfileDebug()

  const [testResults, setTestResults] = useState<any[]>([])

  const addTestResult = (test: string, success: boolean, details?: any) => {
    setTestResults(prev => [
      ...prev,
      {
        test,
        success,
        details,
        timestamp: new Date().toLocaleTimeString(),
      },
    ])
  }

  const runFullTest = async () => {
    setTestResults([])

    try {
      // Тест 1: Диагностика системы
      console.log('🔍 Test 1: System diagnostics')
      const diagnostics = await runDiagnostics()
      addTestResult('System Diagnostics', !!diagnostics, diagnostics)

      // Тест 2: Загрузка собственного профиля
      if (currentUser?.telegramId) {
        console.log('📱 Test 2: Load own profile')
        const profile = await loadProfile()
        addTestResult('Load Own Profile', !!profile, profile)

        // Тест 3: Обновление настроек приватности
        console.log('🔒 Test 3: Update privacy settings')
        const privacyUpdate = await updatePrivacySettings({
          dataCollection: false,
          analytics: false,
          cloudSync: false,
          shareGarden: true,
          showProfile: true,
          shareAchievements: true,
          allowFriendRequests: true,
        })
        addTestResult('Update Privacy Settings', privacyUpdate)

        // Тест 4: Загрузка профиля "друга" (самого себя для теста)
        console.log('👥 Test 4: Load friend profile (self)')
        try {
          const friendProfile = await loadFriendProfile(currentUser.telegramId)
          addTestResult('Load Friend Profile', !!friendProfile, friendProfile)
        } catch (err) {
          addTestResult('Load Friend Profile', false, {
            error: err instanceof Error ? err.message : String(err),
          })
        }
      } else {
        addTestResult('User Authentication', false, 'No telegram ID available')
      }
    } catch (error) {
      console.error('💥 Test failed:', error)
      addTestResult('Full Test', false, {
        error: error instanceof Error ? error.message : String(error),
      })
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-4">
      <div className="mx-auto max-w-4xl space-y-6">
        {/* Header */}
        <motion.div
          className="rounded-2xl border border-blue-200 bg-white p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="mb-4 text-2xl font-bold text-blue-900">
            🔧 Profile System Diagnostics
          </h1>
          <p className="text-blue-600">
            Диагностика системы профилей, достижений и API endpoints
          </p>

          {currentUser && (
            <div className="mt-4 rounded-lg bg-blue-50 p-3">
              <p className="text-sm text-blue-700">
                <span className="font-medium">Current User:</span>{' '}
                {currentUser.firstName || currentUser.username || 'Unknown'}
                {currentUser.telegramId && (
                  <span className="ml-2 text-blue-500">
                    (ID: {currentUser.telegramId})
                  </span>
                )}
              </p>
            </div>
          )}
        </motion.div>

        {/* Controls */}
        <motion.div
          className="rounded-2xl border border-gray-200 bg-white p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="flex items-center space-x-4">
            <Button
              onClick={runFullTest}
              disabled={isLoading}
              className="bg-blue-500 hover:bg-blue-600"
            >
              {isLoading ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  Тестирование...
                </>
              ) : (
                '🚀 Запустить полный тест'
              )}
            </Button>

            <Button
              onClick={runDiagnostics}
              disabled={isLoading}
              variant="outline"
            >
              🔍 Только диагностика
            </Button>
          </div>

          {error && (
            <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3">
              <p className="text-sm text-red-700">
                <span className="font-medium">Error:</span> {error}
              </p>
            </div>
          )}
        </motion.div>

        {/* Debug Info */}
        {debugInfo && (
          <motion.div
            className="rounded-2xl border border-green-200 bg-white p-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h2 className="mb-4 text-xl font-bold text-green-900">
              📊 System Diagnostics Results
            </h2>

            <div className="space-y-4">
              <div>
                <h3 className="font-medium text-gray-900">Environment:</h3>
                <div className="mt-1 grid grid-cols-2 gap-2 text-sm">
                  <div
                    className={`rounded p-2 ${debugInfo.checks?.environment?.supabaseUrl ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}
                  >
                    Supabase URL:{' '}
                    {debugInfo.checks?.environment?.supabaseUrl ? '✅' : '❌'}
                  </div>
                  <div
                    className={`rounded p-2 ${debugInfo.checks?.environment?.supabaseKey ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}
                  >
                    Supabase Key:{' '}
                    {debugInfo.checks?.environment?.supabaseKey ? '✅' : '❌'}
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-medium text-gray-900">Database:</h3>
                <div className="mt-1 grid grid-cols-2 gap-2 text-sm">
                  <div
                    className={`rounded p-2 ${debugInfo.checks?.database?.schema ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}
                  >
                    Schema: {debugInfo.checks?.database?.schema ? '✅' : '❌'}
                  </div>
                  <div
                    className={`rounded p-2 ${debugInfo.checks?.database?.functions ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}
                  >
                    Functions:{' '}
                    {debugInfo.checks?.database?.functions ? '✅' : '❌'}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Test Results */}
        {testResults.length > 0 && (
          <motion.div
            className="rounded-2xl border border-gray-200 bg-white p-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <h2 className="mb-4 text-xl font-bold text-gray-900">
              🧪 Test Results
            </h2>

            <div className="space-y-3">
              {testResults.map((result, index) => (
                <div
                  key={index}
                  className={`rounded-lg border p-4 ${
                    result.success
                      ? 'border-green-200 bg-green-50'
                      : 'border-red-200 bg-red-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <h3
                      className={`font-medium ${
                        result.success ? 'text-green-900' : 'text-red-900'
                      }`}
                    >
                      {result.success ? '✅' : '❌'} {result.test}
                    </h3>
                    <span className="text-xs text-gray-500">
                      {result.timestamp}
                    </span>
                  </div>

                  {result.details && (
                    <details className="mt-2">
                      <summary className="cursor-pointer text-sm text-gray-600 hover:text-gray-900">
                        View Details
                      </summary>
                      <pre className="mt-2 max-h-40 overflow-auto rounded bg-gray-100 p-2 text-xs">
                        {JSON.stringify(result.details, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Instructions */}
        <motion.div
          className="rounded-2xl border border-yellow-200 bg-yellow-50 p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <h2 className="mb-4 text-xl font-bold text-yellow-900">
            📋 Instructions
          </h2>

          <div className="space-y-2 text-sm text-yellow-800">
            <p>1. Убедитесь что применены все PostgreSQL миграции</p>
            <p>
              2. Проверьте что переменные окружения SUPABASE_URL и
              SUPABASE_SERVICE_ROLE_KEY установлены
            </p>
            <p>3. Убедитесь что все таблицы созданы в БД</p>
            <p>4. Проверьте логи сервера для детальной информации</p>
          </div>

          <div className="mt-4 rounded bg-yellow-100 p-3">
            <p className="text-sm font-medium text-yellow-900">
              💡 Если тесты падают, откройте Developer Console (F12) для
              детальных логов
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
