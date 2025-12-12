import { createContext, useContext, ReactNode, useMemo } from 'react'
import { useTelegram } from '@/hooks'
import { getTelegramIdFromJWT } from '@/utils/apiClient'

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
    const jwtTelegramId = getTelegramIdFromJWT()
    return jwtTelegramId ?? undefined
  }, [telegramUser?.telegramId])

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
