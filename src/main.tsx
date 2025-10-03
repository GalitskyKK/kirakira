import React from 'react'
import ReactDOM from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import App from './App'
import { ErrorBoundary } from './components/ErrorBoundary'
import './styles/index.css'

// ============================================
// REACT QUERY SETUP
// ============================================

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2, // Повторяем запросы при ошибке
      staleTime: 5 * 60 * 1000, // 5 минут - данные считаются свежими
      gcTime: 10 * 60 * 1000, // 10 минут - время кеширования (cacheTime в v5)
      refetchOnWindowFocus: false, // Не перезапрашивать при фокусе
      refetchOnReconnect: true, // Перезапрашивать при восстановлении соединения
    },
    mutations: {
      retry: 1, // Одна попытка для мутаций
    },
  },
})

// 🔍 КРИТИЧНАЯ ДИАГНОСТИКА СРЕДЫ ВЫПОЛНЕНИЯ (только в dev режиме)
if (import.meta.env.DEV) {
  console.log('🔍 MAIN.TSX LOADING:', {
    isTelegramEnv: !!window.Telegram?.WebApp,
    windowTelegram: !!window.Telegram,
    windowTelegramWebApp: !!window.Telegram?.WebApp,
    documentReady: document.readyState,
    userAgent: navigator.userAgent,
    viewport: {
      width: window.innerWidth,
      height: window.innerHeight,
      devicePixelRatio: window.devicePixelRatio,
    },
    timestamp: new Date().toISOString(),
  })
}

// PWA registration
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then(registration => {
        console.log('SW registered: ', registration)
      })
      .catch(registrationError => {
        console.log('SW registration failed: ', registrationError)
      })
  })
}

// Get root element
const rootElement = document.getElementById('root')

if (!rootElement) {
  throw new Error('Failed to find the root element')
}

if (import.meta.env.DEV) {
  console.log('🔍 ROOT ELEMENT FOUND, CREATING REACT ROOT...')
}

// Create root and render app
const root = ReactDOM.createRoot(rootElement)

if (import.meta.env.DEV) {
  console.log('🔍 RENDERING APP WITH ERROR BOUNDARY...')
}

root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </ErrorBoundary>
  </React.StrictMode>
)

if (import.meta.env.DEV) {
  console.log('🔍 MAIN.TSX RENDER COMPLETE')
}
