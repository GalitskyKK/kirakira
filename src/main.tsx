import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { ErrorBoundary } from './components/ErrorBoundary'
import './styles/index.css'

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

// PWA registration теперь обрабатывается через virtual:pwa-register в UpdatePrompt компоненте

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
      <App />
    </ErrorBoundary>
  </React.StrictMode>
)

if (import.meta.env.DEV) {
  console.log('🔍 MAIN.TSX RENDER COMPLETE')
}
