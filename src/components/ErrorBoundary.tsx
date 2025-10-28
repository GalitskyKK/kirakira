import React from 'react'

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
  errorInfo: React.ErrorInfo | null
}

interface ErrorBoundaryProps {
  children: React.ReactNode
}

export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null, errorInfo: null }
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error }
  }

  override componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('🚨 REACT ERROR BOUNDARY:', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      isTelegramEnv: !!window.Telegram?.WebApp,
      userAgent: navigator.userAgent,
    })

    this.setState({
      error,
      errorInfo,
    })
  }

  override render() {
    if (this.state.hasError) {
      const isTelegramEnv = !!window.Telegram?.WebApp
      const isDevelopment = import.meta.env.DEV

      // В продакшене показываем дружелюбный интерфейс
      if (!isDevelopment) {
        return (
          <div
            className={`flex min-h-screen items-center justify-center p-4 ${
              isTelegramEnv
                ? 'bg-[var(--tg-bg-color,#ffffff)] text-[var(--tg-text-color,#000000)]'
                : 'bg-gradient-to-br from-purple-50 to-pink-50 text-gray-900 dark:from-purple-900/20 dark:to-pink-900/20 dark:text-gray-100'
            }`}
          >
            <div className="mx-auto max-w-md text-center">
              <div className="mb-6">
                <div className="text-6xl">🌸</div>
                <h1 className="mt-4 text-2xl font-bold">
                  Упс! Что-то пошло не так
                </h1>
                <p className="mt-2 text-sm opacity-70">
                  Не переживайте, мы быстро это исправим
                </p>
              </div>

              <div className="mb-6 rounded-2xl bg-white/50 p-6 backdrop-blur-sm dark:bg-gray-800/50">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  🌱 Ваш эмоциональный сад временно недоступен, но все ваши
                  данные сохранены в безопасности
                </p>
              </div>

              <div className="space-y-3">
                <button
                  onClick={() => window.location.reload()}
                  className="w-full rounded-2xl bg-gradient-to-r from-green-500 to-emerald-500 px-4 py-4 font-semibold text-white shadow-lg transition-transform hover:scale-105"
                >
                  🔄 Попробовать снова
                </button>

                {isTelegramEnv && (
                  <button
                    onClick={() => {
                      window.Telegram?.WebApp?.close?.()
                    }}
                    className="w-full rounded-2xl bg-gradient-to-r from-gray-400 to-gray-500 px-4 py-3 text-white transition-transform hover:scale-105"
                  >
                    ↩️ Вернуться в Telegram
                  </button>
                )}
              </div>

              <div className="mt-6 text-center text-xs text-gray-500">
                💝 Спасибо за терпение
              </div>
            </div>
          </div>
        )
      }

      // В режиме разработки показываем подробную диагностику
      return (
        <div
          className={`min-h-screen p-4 ${
            isTelegramEnv
              ? 'bg-[var(--tg-bg-color,#ffffff)] text-[var(--tg-text-color,#000000)]'
              : 'bg-gradient-to-br from-red-50 to-orange-50 text-gray-900 dark:from-red-900/20 dark:to-orange-900/20 dark:text-gray-100'
          }`}
        >
          <div className="mx-auto max-w-md">
            <div className="mb-6 text-center">
              <div className="text-6xl">🚨</div>
              <h1 className="mt-4 text-2xl font-bold text-red-600">
                Error Boundary (Dev Mode)
              </h1>
              <p className="mt-2 text-sm opacity-70">
                Техническая информация для разработчика
              </p>
            </div>

            <div className="mb-6 rounded-2xl bg-red-100/50 p-6 backdrop-blur-sm">
              <div className="space-y-2 text-sm">
                <div className="font-semibold text-red-700">Ошибка:</div>
                <div className="font-mono text-xs text-red-800">
                  {this.state.error?.message || 'Unknown error'}
                </div>

                {this.state.error?.stack && (
                  <details className="mt-4">
                    <summary className="cursor-pointer font-semibold text-red-700">
                      Stack Trace
                    </summary>
                    <pre className="mt-2 max-h-40 overflow-auto rounded bg-red-200/50 p-2 text-xs">
                      {this.state.error.stack}
                    </pre>
                  </details>
                )}

                {this.state.errorInfo?.componentStack && (
                  <details className="mt-4">
                    <summary className="cursor-pointer font-semibold text-red-700">
                      Component Stack
                    </summary>
                    <pre className="mt-2 max-h-40 overflow-auto rounded bg-red-200/50 p-2 text-xs">
                      {this.state.errorInfo.componentStack}
                    </pre>
                  </details>
                )}
              </div>
            </div>

            <div className="mb-6 rounded-lg bg-yellow-100/50 p-3 text-xs">
              <div className="font-semibold text-yellow-700">
                Диагностика среды:
              </div>
              <div className="mt-2 space-y-1">
                <div>
                  Platform: {isTelegramEnv ? 'Telegram Mini App' : 'Web'}
                </div>
                <div>User Agent: {navigator.userAgent}</div>
                <div>
                  Telegram API:{' '}
                  {window.Telegram?.WebApp ? 'Available' : 'Not available'}
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => window.location.reload()}
                className="w-full rounded-2xl bg-gradient-to-r from-red-500 to-red-600 px-4 py-4 font-semibold text-white shadow-lg transition-transform hover:scale-105"
              >
                🔄 Перезагрузить приложение
              </button>

              {isTelegramEnv && (
                <button
                  onClick={() => {
                    window.Telegram?.WebApp?.close?.()
                  }}
                  className="w-full rounded-2xl bg-gradient-to-r from-gray-400 to-gray-500 px-4 py-3 text-white transition-transform hover:scale-105"
                >
                  ↩️ Вернуться в Telegram
                </button>
              )}
            </div>

            <div className="mt-6 text-center text-xs text-gray-500">
              🔧 Development Mode - подробная диагностика включена
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
