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
      <App />
    </ErrorBoundary>
  </React.StrictMode>
)

if (import.meta.env.DEV) {
  console.log('🔍 MAIN.TSX RENDER COMPLETE')
}
