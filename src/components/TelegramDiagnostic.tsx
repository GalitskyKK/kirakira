import React from 'react'

/**
 * 🚨 КРИТИЧНАЯ ДИАГНОСТИЧЕСКАЯ СТРАНИЦА ДЛЯ TELEGRAM
 * Отображается вместо основного приложения для отладки проблем в Telegram WebView
 */
export function TelegramDiagnostic() {
  const isTelegramEnv = !!window.Telegram?.WebApp

  const diagnosticData = {
    // Основная информация
    timestamp: new Date().toISOString(),
    userAgent: navigator.userAgent,

    // Telegram API
    windowTelegram: !!window.Telegram,
    windowTelegramWebApp: !!window.Telegram?.WebApp,
    telegramWebAppVersion: window.Telegram?.WebApp?.version || 'N/A',
    telegramPlatform: window.Telegram?.WebApp?.platform || 'N/A',

    // Viewport и размеры
    viewport: {
      width: window.innerWidth,
      height: window.innerHeight,
      devicePixelRatio: window.devicePixelRatio,
      availWidth: screen.availWidth,
      availHeight: screen.availHeight,
    },

    // Telegram пользователь
    telegramInitData: !!window.Telegram?.WebApp?.initData,
    telegramUser: window.Telegram?.WebApp?.initDataUnsafe?.user
      ? {
          id: window.Telegram.WebApp.initDataUnsafe.user.id,
          firstName: window.Telegram.WebApp.initDataUnsafe.user.first_name,
          username: window.Telegram.WebApp.initDataUnsafe.user.username,
        }
      : null,

    // Telegram состояние
    telegramColorScheme: window.Telegram?.WebApp?.colorScheme || 'N/A',
    telegramIsExpanded: window.Telegram?.WebApp?.isExpanded || false,
    telegramViewportHeight: window.Telegram?.WebApp?.viewportHeight || 'N/A',
    telegramViewportStableHeight:
      window.Telegram?.WebApp?.viewportStableHeight || 'N/A',

    // Браузер информация
    localStorage: !!window.localStorage,
    sessionStorage: !!window.sessionStorage,
    fetch: !!window.fetch,

    // React информация
    reactVersion: React.version,
    documentReadyState: document.readyState,
  }

  const bgClass = isTelegramEnv
    ? 'bg-[var(--tg-bg-color,#ffffff)] text-[var(--tg-text-color,#000000)]'
    : 'bg-gray-50 text-gray-900'

  return (
    <div className={`min-h-screen p-4 ${bgClass}`}>
      <div className="mx-auto max-w-2xl">
        <div className="mb-6 text-center">
          <div className="text-6xl">🔍</div>
          <h1 className="mt-4 text-2xl font-bold">KiraKira Диагностика</h1>
          <p className="mt-2 text-sm opacity-70">
            {isTelegramEnv
              ? '📱 Telegram Mini App Environment'
              : '🌐 Browser Environment'}
          </p>
        </div>

        {/* Основной статус */}
        <div className="mb-6 rounded-lg bg-blue-100/50 p-4">
          <h2 className="mb-3 font-semibold">📊 Основной статус:</h2>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>Telegram Env: {isTelegramEnv ? '✅ ДА' : '❌ НЕТ'}</div>
            <div>
              WebApp API: {window.Telegram?.WebApp ? '✅ Есть' : '❌ НЕТ'}
            </div>
            <div>
              Init Data:{' '}
              {diagnosticData.telegramInitData ? '✅ Есть' : '❌ НЕТ'}
            </div>
            <div>
              User: {diagnosticData.telegramUser ? '✅ Есть' : '❌ НЕТ'}
            </div>
          </div>
        </div>

        {/* Telegram пользователь */}
        {diagnosticData.telegramUser && (
          <div className="mb-6 rounded-lg bg-green-100/50 p-4">
            <h2 className="mb-3 font-semibold">👤 Telegram пользователь:</h2>
            <div className="space-y-1 text-sm">
              <div>
                <strong>ID:</strong> {diagnosticData.telegramUser.id}
              </div>
              <div>
                <strong>Имя:</strong> {diagnosticData.telegramUser.firstName}
              </div>
              {diagnosticData.telegramUser.username && (
                <div>
                  <strong>Username:</strong> @
                  {diagnosticData.telegramUser.username}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Технические детали */}
        <details className="mb-6">
          <summary className="cursor-pointer rounded-lg bg-yellow-100/50 p-4 font-semibold">
            🔧 Технические детали
          </summary>
          <div className="mt-4 rounded-lg bg-gray-100/50 p-4">
            <pre className="overflow-auto text-xs">
              {JSON.stringify(diagnosticData, null, 2)}
            </pre>
          </div>
        </details>

        {/* Действия */}
        <div className="space-y-3">
          <button
            onClick={() => {
              console.log('🔍 DIAGNOSTIC DATA:', diagnosticData)
              alert('Данные диагностики выведены в консоль')
            }}
            className="w-full rounded-lg bg-blue-500 px-4 py-3 text-white hover:bg-blue-600"
          >
            📋 Вывести в консоль
          </button>

          <button
            onClick={() => window.location.reload()}
            className="w-full rounded-lg bg-green-500 px-4 py-3 text-white hover:bg-green-600"
          >
            🔄 Перезагрузить
          </button>

          {isTelegramEnv && (
            <button
              onClick={() => {
                window.Telegram?.WebApp?.close?.()
              }}
              className="w-full rounded-lg bg-red-500 px-4 py-3 text-white hover:bg-red-600"
            >
              ❌ Закрыть Mini App
            </button>
          )}

          <button
            onClick={() => {
              // Попробуем принудительно перейти в обычное приложение
              window.location.href = window.location.origin + '/?force_normal=1'
            }}
            className="w-full rounded-lg bg-purple-500 px-4 py-3 text-white hover:bg-purple-600"
          >
            🚀 Принудительный запуск приложения
          </button>
        </div>

        <div className="mt-6 text-center text-xs opacity-70">
          💡 Это диагностическая страница для отладки проблем в Telegram
        </div>
      </div>
    </div>
  )
}
