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
              : 'bg-red-50 text-gray-900'
          }`}
        >
          <div className="mx-auto max-w-md">
            <div className="mb-4 text-center">
              <div className="text-6xl">💥</div>
              <h1 className="mt-4 text-2xl font-bold">Ошибка приложения</h1>
            </div>

            <div className="rounded-lg bg-red-100/50 p-4 text-sm">
              <div className="font-semibold text-red-800">
                🚨 React Error Boundary
              </div>

              <div className="mt-2 space-y-2">
                <div>
                  <strong>Ошибка:</strong> {this.state.error?.message}
                </div>

                {isTelegramEnv && (
                  <div>
                    <strong>Telegram WebView:</strong> ✅ Detected
                  </div>
                )}

                <div>
                  <strong>User Agent:</strong>
                  <div className="break-all text-xs">{navigator.userAgent}</div>
                </div>
              </div>
            </div>

            {this.state.error?.stack && (
              <details className="mt-4">
                <summary className="cursor-pointer font-semibold">
                  📋 Технические детали
                </summary>
                <pre className="mt-2 overflow-auto rounded bg-gray-100 p-2 text-xs">
                  {this.state.error.stack}
                </pre>
              </details>
            )}

            <div className="mt-6 space-y-3">
              <button
                onClick={() => window.location.reload()}
                className="w-full rounded-lg bg-blue-500 px-4 py-3 text-white hover:bg-blue-600"
              >
                🔄 Перезагрузить приложение
              </button>

              {isTelegramEnv && (
                <button
                  onClick={() => {
                    window.Telegram?.WebApp?.close?.()
                  }}
                  className="w-full rounded-lg bg-gray-500 px-4 py-3 text-white hover:bg-gray-600"
                >
                  ❌ Закрыть Mini App
                </button>
              )}
            </div>

            <div className="mt-4 text-center text-xs text-gray-600">
              💡 Если проблема повторяется, сообщите разработчику
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
