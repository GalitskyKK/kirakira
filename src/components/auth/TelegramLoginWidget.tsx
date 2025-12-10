import { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'

interface TelegramLoginData {
  id: number
  first_name: string
  last_name?: string
  username?: string
  photo_url?: string
  auth_date: number
  hash: string
}

interface TelegramLoginWidgetProps {
  botName: string
  onAuth: (user: TelegramLoginData) => void
  onError?: (error: string) => void
  buttonSize?: 'large' | 'medium' | 'small'
  cornerRadius?: number
  requestAccess?: boolean
  lang?: string
}

declare global {
  interface Window {
    TelegramLoginWidget?: {
      dataOnauth: (user: TelegramLoginData) => void
    }
  }
}

export function TelegramLoginWidget({
  botName,
  onAuth,
  onError,
  buttonSize = 'large',
  cornerRadius = 10,
  requestAccess = true,
  lang = 'ru',
}: TelegramLoginWidgetProps) {
  const ref = useRef<HTMLDivElement>(null)
  const callbackNameRef = useRef(
    `telegramCallback_${Math.random().toString(36).slice(2, 11)}`
  )

  useEffect(() => {
    if (!ref.current) return

    const container = ref.current
    const callbackName = callbackNameRef.current

    const globalCallbacks = window as unknown as Record<
      string,
      (user: TelegramLoginData) => void
    >
    globalCallbacks[callbackName] = (user: TelegramLoginData) => {
      console.info('[TelegramLoginWidget] onAuth', user)
      onAuth(user)
    }

    // Очистка контейнера
    container.innerHTML = ''

    // Создаем скрипт для Telegram Login Widget
    const script = document.createElement('script')
    script.async = true
    script.src = 'https://telegram.org/js/telegram-widget.js?22'
    script.setAttribute('data-telegram-login', botName)
    script.setAttribute('data-size', buttonSize)
    script.setAttribute('data-radius', cornerRadius.toString())
    script.setAttribute('data-request-access', requestAccess ? 'write' : '')
    script.setAttribute('data-lang', lang)
    // Telegram ожидает JS-выражение с вызовом коллбэка и передачей user
    script.setAttribute('data-onauth', `${callbackName}(user)`)

    script.onerror = () => {
      console.error('Failed to load Telegram login widget')
      onError?.('Не удалось загрузить виджет авторизации Telegram')
    }

    script.onload = () => {
      console.info(
        '[TelegramLoginWidget] script loaded, callback:',
        callbackName
      )
    }

    // Добавляем скрипт в контейнер
    container.appendChild(script)

    // Cleanup функция
    return () => {
      const windowWithCallback = window as unknown as Record<
        string,
        (user: TelegramLoginData) => void
      >
      Reflect.deleteProperty(windowWithCallback, callbackName)
      container.innerHTML = ''
    }
  }, [botName, onAuth, onError, buttonSize, cornerRadius, requestAccess, lang])

  return (
    <motion.div
      ref={ref}
      className="flex justify-center"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    />
  )
}
