import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { CheckCircle, XCircle, AlertTriangle, Smartphone } from 'lucide-react'
import { useTelegram } from '@/hooks'
import { Button, Card } from '@/components/ui'

interface TestResult {
  name: string
  status: 'pass' | 'fail' | 'warning' | 'pending'
  message: string
}

export function TelegramTestSuite() {
  const {
    webApp,
    user,
    isTelegramEnv,
    themeParams,
    hapticFeedback,
    showAlert,
  } = useTelegram()
  const [tests, setTests] = useState<TestResult[]>([])
  const [isRunning, setIsRunning] = useState(false)

  const runTests = async () => {
    setIsRunning(true)
    const testResults: TestResult[] = []

    // Тест 1: Проверка среды Telegram
    testResults.push({
      name: 'Telegram Environment Detection',
      status: isTelegramEnv ? 'pass' : 'fail',
      message: isTelegramEnv
        ? 'Приложение запущено в Telegram WebApp'
        : 'Приложение НЕ запущено в Telegram (будет fallback на браузер)',
    })

    // Тест 2: WebApp API доступность
    testResults.push({
      name: 'WebApp API Availability',
      status: webApp ? 'pass' : 'fail',
      message: webApp
        ? `WebApp API доступен (версия: ${webApp.version || 'unknown'})`
        : 'WebApp API недоступен',
    })

    // Тест 3: Пользовательские данные
    testResults.push({
      name: 'User Data Access',
      status: user ? 'pass' : 'warning',
      message: user
        ? `Данные пользователя: ${user.firstName} (ID: ${user.telegramId})`
        : 'Данные пользователя недоступны (возможно, приватный режим)',
    })

    // Тест 4: Тема приложения
    testResults.push({
      name: 'Theme Parameters',
      status: themeParams ? 'pass' : 'warning',
      message: themeParams?.bg_color
        ? `Тема: ${themeParams.bg_color} (светлая/темная)`
        : 'Параметры темы недоступны',
    })

    // Тест 5: Haptic Feedback
    try {
      if (
        webApp &&
        typeof webApp.HapticFeedback?.impactOccurred === 'function'
      ) {
        webApp.HapticFeedback.impactOccurred('light')
        testResults.push({
          name: 'Haptic Feedback',
          status: 'pass',
          message: 'Тактильная обратная связь доступна',
        })
      } else {
        testResults.push({
          name: 'Haptic Feedback',
          status: 'warning',
          message: 'Тактильная обратная связь недоступна',
        })
      }
    } catch (error) {
      testResults.push({
        name: 'Haptic Feedback',
        status: 'fail',
        message: `Ошибка haptic feedback: ${String(error)}`,
      })
    }

    // Тест 6: CloudStorage
    try {
      if (webApp && webApp.CloudStorage) {
        await new Promise(resolve => {
          webApp.CloudStorage.setItem('test_key', 'test_value', () => {
            webApp.CloudStorage.getItem('test_key', (error, value) => {
              testResults.push({
                name: 'Cloud Storage',
                status: error ? 'fail' : 'pass',
                message: error
                  ? `Ошибка CloudStorage: ${error}`
                  : `CloudStorage работает (тест: ${value})`,
              })
              resolve(undefined)
            })
          })
        })
      } else {
        testResults.push({
          name: 'Cloud Storage',
          status: 'warning',
          message: 'CloudStorage недоступен',
        })
      }
    } catch (error) {
      testResults.push({
        name: 'Cloud Storage',
        status: 'fail',
        message: `Ошибка CloudStorage: ${String(error)}`,
      })
    }

    // Тест 7: MainButton
    try {
      if (webApp && webApp.MainButton) {
        webApp.MainButton.setText('Тест MainButton')
        webApp.MainButton.show()

        setTimeout(() => {
          webApp.MainButton.hide()
        }, 2000)

        testResults.push({
          name: 'Main Button',
          status: 'pass',
          message: 'MainButton доступна (показана на 2 сек)',
        })
      } else {
        testResults.push({
          name: 'Main Button',
          status: 'warning',
          message: 'MainButton недоступна',
        })
      }
    } catch (error) {
      testResults.push({
        name: 'Main Button',
        status: 'fail',
        message: `Ошибка MainButton: ${String(error)}`,
      })
    }

    // Тест 8: Share функциональность (только тест API, не отправляем)
    testResults.push({
      name: 'Share Message API',
      status:
        webApp && typeof webApp.shareMessage === 'function'
          ? 'pass'
          : 'warning',
      message:
        webApp && typeof webApp.shareMessage === 'function'
          ? 'shareMessage API доступен'
          : 'shareMessage API недоступен',
    })

    // Тест 9: Inline Query API
    testResults.push({
      name: 'Inline Query API',
      status:
        webApp && typeof webApp.switchInlineQuery === 'function'
          ? 'pass'
          : 'warning',
      message:
        webApp && typeof webApp.switchInlineQuery === 'function'
          ? 'switchInlineQuery API доступен'
          : 'switchInlineQuery API недоступен',
    })

    setTests(testResults)
    setIsRunning(false)
  }

  const testFriendSearch = () => {
    if (!webApp) {
      showAlert('WebApp недоступен!')
      return
    }

    hapticFeedback('light')

    // Имитируем поиск друга
    showAlert('Тест: поиск по реферальному коду ABC12345')

    // В реальном приложении здесь был бы API вызов
    setTimeout(() => {
      showAlert('✅ Тест поиска завершен!')
    }, 1500)
  }

  const testFriendRequest = () => {
    if (!webApp) {
      showAlert('WebApp недоступен!')
      return
    }

    hapticFeedback('medium')
    showAlert('Тест: отправка запроса дружбы')
  }

  const testInlineQuery = () => {
    if (!webApp || typeof webApp.switchInlineQuery !== 'function') {
      showAlert('switchInlineQuery недоступен!')
      return
    }

    hapticFeedback('light')

    // Тестируем inline query для приглашения
    webApp.switchInlineQuery('🌸 Тест KiraKira Bot!', ['users'])
  }

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'pass':
        return <CheckCircle className="h-5 w-5 text-green-600" />
      case 'fail':
        return <XCircle className="h-5 w-5 text-red-600" />
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-600" />
      default:
        return (
          <div className="h-5 w-5 animate-pulse rounded-full bg-gray-300" />
        )
    }
  }

  const getStatusColor = (status: TestResult['status']) => {
    switch (status) {
      case 'pass':
        return 'border-green-200 bg-green-50'
      case 'fail':
        return 'border-red-200 bg-red-50'
      case 'warning':
        return 'border-yellow-200 bg-yellow-50'
      default:
        return 'border-gray-200 bg-gray-50'
    }
  }

  useEffect(() => {
    // Автоматически запускаем тесты при загрузке
    if (!isRunning && tests.length === 0) {
      runTests()
    }
  }, [])

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      {/* Заголовок */}
      <div className="text-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200 }}
          className="mb-4"
        >
          <Smartphone className="mx-auto h-16 w-16 text-blue-500" />
        </motion.div>
        <h1 className="mb-2 text-3xl font-bold text-gray-900 dark:text-gray-100">
          Telegram WebApp Test Suite
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Проверка совместимости с Telegram Mini Apps API
        </p>
      </div>

      {/* Кнопки управления */}
      <div className="flex flex-wrap justify-center gap-4">
        <Button
          onClick={runTests}
          disabled={isRunning}
          className="bg-blue-500 hover:bg-blue-600"
        >
          {isRunning ? 'Выполняется...' : '🔄 Перезапустить тесты'}
        </Button>

        <Button
          onClick={testFriendSearch}
          variant="outline"
          className="border-green-200 text-green-700 hover:bg-green-50"
        >
          🔍 Тест поиска друга
        </Button>

        <Button
          onClick={testFriendRequest}
          variant="outline"
          className="border-orange-200 text-orange-700 hover:bg-orange-50"
        >
          🤝 Тест запроса дружбы
        </Button>

        <Button
          onClick={testInlineQuery}
          variant="outline"
          className="border-purple-200 text-purple-700 hover:bg-purple-50"
        >
          📤 Тест inline query
        </Button>
      </div>

      {/* Результаты тестов */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
          Результаты тестов ({tests.filter(t => t.status === 'pass').length}/
          {tests.length} прошли)
        </h2>

        {tests.map((test, index) => (
          <motion.div
            key={test.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className={`p-4 ${getStatusColor(test.status)}`}>
              <div className="flex items-start space-x-3">
                {getStatusIcon(test.status)}
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                    {test.name}
                  </h3>
                  <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                    {test.message}
                  </p>
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Информация о среде */}
      <Card className="bg-gray-50 p-6">
        <h3 className="mb-3 font-semibold text-gray-900 dark:text-gray-100">
          Информация о среде
        </h3>
        <div className="grid grid-cols-1 gap-4 text-sm md:grid-cols-2">
          <div>
            <strong>User Agent:</strong>
            <p className="break-all text-gray-600 dark:text-gray-400">
              {navigator.userAgent}
            </p>
          </div>
          <div>
            <strong>Window Location:</strong>
            <p className="break-all text-gray-600 dark:text-gray-400">
              {window.location.href}
            </p>
          </div>
          <div>
            <strong>Screen Size:</strong>
            <p className="text-gray-600 dark:text-gray-400">
              {window.screen.width}x{window.screen.height}
            </p>
          </div>
          <div>
            <strong>Viewport Size:</strong>
            <p className="text-gray-600 dark:text-gray-400">
              {window.innerWidth}x{window.innerHeight}
            </p>
          </div>
        </div>
      </Card>

      {/* Инструкции для тестирования */}
      <Card className="border-blue-200 bg-blue-50 p-6">
        <h3 className="mb-3 font-semibold text-blue-900">
          📋 Инструкции для тестирования
        </h3>
        <div className="space-y-2 text-sm text-blue-800">
          <p>
            <strong>1. В браузере:</strong> Многие функции будут недоступны, но
            приложение должно работать с fallback'ами.
          </p>
          <p>
            <strong>2. В Telegram Desktop:</strong> Откройте через @BotFather
            бота и протестируйте WebApp.
          </p>
          <p>
            <strong>3. На мобильном:</strong> Лучший опыт - все API должны
            работать полностью.
          </p>
          <p>
            <strong>4. Проверьте:</strong> Haptic feedback, уведомления, кнопки,
            inline queries, cloud storage.
          </p>
        </div>
      </Card>
    </div>
  )
}
