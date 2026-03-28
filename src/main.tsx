import React from 'react'
import ReactDOM from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import App from './App'
import { ErrorBoundary } from './components/ErrorBoundary'
import { ensureTelegramWebAppSdk } from '@/utils/loadTelegramWebAppSdk'
import './styles/index.css'

// 🔧 НАСТРОЙКА REACT QUERY
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // ✅ ОПТИМИЗАЦИЯ: Увеличено staleTime для снижения нагрузки на сервер
      // Время, в течение которого данные считаются свежими (stale time)
      staleTime: 1000 * 60 * 10, // 10 минут (было 5 минут)
      // Время кэширования данных в памяти
      gcTime: 1000 * 60 * 30, // 30 минут (раньше cacheTime в v4)
      // ❌ ОТКЛЮЧЕНО: Повторный запрос при возврате фокуса на окно
      // Это вызывало слишком много запросов при переключении вкладок
      refetchOnWindowFocus: false, // было true
      // Повторный запрос при переподключении к сети
      refetchOnReconnect: true,
      // Количество попыток при ошибке (снижено для быстрой обработки ошибок)
      retry: 1, // было 2
      // Функция для определения, нужно ли повторять запрос
      retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
    mutations: {
      // Количество попыток при ошибке мутации
      retry: 1,
    },
  },
})

// PWA registration теперь обрабатывается через virtual:pwa-register в UpdatePrompt компоненте

// Get root element
const rootElement = document.getElementById('root')

if (!rootElement) {
  throw new Error('Failed to find the root element')
}

// Create root and render app
const root = ReactDOM.createRoot(rootElement)

function renderApp(): void {
  root.render(
    <React.StrictMode>
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <App />
        </QueryClientProvider>
      </ErrorBoundary>
    </React.StrictMode>
  )
}

void ensureTelegramWebAppSdk()
  .then(() => {
    renderApp()
  })
  .catch(error => {
    console.warn('Telegram WebApp SDK:', error)
    renderApp()
  })
