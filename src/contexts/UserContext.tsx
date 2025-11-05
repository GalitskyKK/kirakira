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
    isTelegramEnv: !!window.Telegram?.WebApp,
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
