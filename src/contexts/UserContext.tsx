import { createContext, useContext, ReactNode } from 'react'
import { useTelegram } from '@/hooks'

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

  const value: UserContextType = {
    telegramId: telegramUser?.telegramId,
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
