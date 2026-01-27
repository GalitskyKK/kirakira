import { createContext, useContext, ReactNode, useMemo, useEffect, useState } from 'react'
import { useTelegram } from '@/hooks'
import {
  AUTH_RESET_EVENT,
  JWT_STORAGE_KEY,
  getTelegramIdFromJWT,
  refreshJWTTokenIfNeeded,
} from '@/utils/apiClient'

interface UserContextType {
  telegramId: number | undefined
  isTelegramEnv: boolean
}

const UserContext = createContext<UserContextType | null>(null)

interface UserProviderProps {
  children: ReactNode
}

export function UserProvider({ children }: UserProviderProps) {
  const { user: telegramUser } = useTelegram()
  const [jwtTelegramId, setJwtTelegramId] = useState<number | undefined>(() => {
    const id = getTelegramIdFromJWT()
    return id ?? undefined
  })

  useEffect(() => {
    const refreshJwtId = () => {
      const id = getTelegramIdFromJWT()
      setJwtTelegramId(id ?? undefined)
    }

    const handleStorage = (event: StorageEvent) => {
      if (event.key === JWT_STORAGE_KEY) {
        refreshJwtId()
      }
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('storage', handleStorage)
      window.addEventListener(AUTH_RESET_EVENT, refreshJwtId)
    }

    void refreshJWTTokenIfNeeded()
    const intervalId = window.setInterval(() => {
      void refreshJWTTokenIfNeeded()
    }, 1000 * 60 * 60 * 6)

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('storage', handleStorage)
        window.removeEventListener(AUTH_RESET_EVENT, refreshJwtId)
      }
      window.clearInterval(intervalId)
    }
  }, [])

  // Определяем, является ли среда реальным Telegram Mini App (а не расширение)
  const isTelegramEnv = useMemo(() => {
    if (typeof window === 'undefined') return false
    const webApp = window.Telegram?.WebApp
    if (!webApp) return false
    const hasInitData =
      Boolean(webApp.initData && webApp.initData.length > 0) ||
      Boolean(webApp.initDataUnsafe?.user)
    return hasInitData
  }, [])

  // Получаем telegramId: приоритет Telegram WebApp > JWT токен из localStorage
  const telegramId = useMemo(() => {
    // Если в Telegram Mini App - используем данные из WebApp
    if (telegramUser?.telegramId) {
      return telegramUser.telegramId
    }

    // Если в браузере - пытаемся получить из JWT токена
    return jwtTelegramId ?? undefined
  }, [telegramUser?.telegramId, jwtTelegramId])

  const value: UserContextType = {
    telegramId,
    isTelegramEnv,
  }

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>
}

export function useUserContext(): UserContextType {
  const context = useContext(UserContext)
  if (!context) {
    throw new Error('useUserContext must be used within UserProvider')
  }
  return context
}
