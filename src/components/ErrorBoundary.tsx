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

      return (
        <div
          className={`min-h-screen p-4 ${
            isTelegramEnv
              ? 'bg-[var(--tg-bg-color,#ffffff)] text-[var(--tg-text-color,#000000)]'
              : 'bg-gradient-to-br from-purple-50 to-pink-50 text-gray-900'
          }`}
        >
          <div className="mx-auto max-w-md">
            <div className="mb-6 text-center">
              <div className="text-6xl">🌱</div>
              <h1 className="mt-4 text-2xl font-bold">Обновляем ваш сад...</h1>
              <p className="mt-2 text-sm opacity-70">
                Проверка данных и синхронизация
              </p>
            </div>

            {/* Gaming-style loading */}
            <div className="mb-6 rounded-2xl bg-white/50 p-6 backdrop-blur-sm">
              <div className="mb-4 flex items-center justify-center space-x-2">
                <div className="h-2 w-2 animate-pulse rounded-full bg-green-400"></div>
                <div className="h-2 w-2 animate-pulse rounded-full bg-blue-400 delay-100"></div>
                <div className="h-2 w-2 animate-pulse rounded-full bg-purple-400 delay-200"></div>
              </div>

              <div className="space-y-2 text-center text-sm text-gray-600">
                <div>🔍 Проверка целостности данных...</div>
                <div>🌐 Синхронизация с облаком...</div>
                <div>🎮 Загрузка игрового мира...</div>
              </div>
            </div>

            {/* Скрытая техническая информация только для разработчика */}
            {process.env['NODE_ENV'] === 'development' && (
              <details className="mb-6">
                <summary className="cursor-pointer rounded-lg bg-yellow-100/50 p-3 text-sm font-semibold">
                  🔧 Техническая информация (dev only)
                </summary>
                <div className="mt-3 rounded-lg bg-gray-100/50 p-3 text-xs">
                  <div className="space-y-1">
                    <div>
                      <strong>Статус:</strong> Восстановление данных
                    </div>
                    {isTelegramEnv && (
                      <div>
                        <strong>Platform:</strong> Telegram Mini App
                      </div>
                    )}
                    {this.state.error?.message && (
                      <div>
                        <strong>Детали:</strong> {this.state.error.message}
                      </div>
                    )}
                  </div>
                </div>
              </details>
            )}

            <div className="space-y-3">
              <button
                onClick={() => window.location.reload()}
                className="w-full rounded-2xl bg-gradient-to-r from-green-500 to-emerald-500 px-4 py-4 font-semibold text-white shadow-lg transition-transform hover:scale-105"
              >
                🔄 Перезапустить сад
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
              🌸 Ваш эмоциональный сад скоро будет готов
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
