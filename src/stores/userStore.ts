import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import type {
  User,
  UserState,
  UserPreferences,
  UserStats,
  // NotificationSettings,
  // PrivacySettings,
  // GardenPreferences,
} from '@/types'
import {
  saveUser,
  loadUser,
  saveOnboardingCompleted,
  isOnboardingCompleted,
} from '@/utils/storage'
import { telegramStorage } from '@/utils/telegramStorage'

interface TelegramUserData {
  telegramId: number
  firstName: string
  lastName: string | undefined
  username: string | undefined
  photoUrl: string | undefined
  authDate: Date
  hash: string
}

interface UserActions {
  // User management
  loadUser: () => Promise<void>
  createAnonymousUser: () => Promise<User>
  createTelegramUser: (telegramData: TelegramUserData) => User
  updateUser: (updates: Partial<User>) => void
  updatePreferences: (preferences: Partial<UserPreferences>) => Promise<void>
  updateStats: (stats: Partial<UserStats>) => Promise<void>

  // Authentication
  signOut: () => Promise<void>

  // Onboarding
  completeOnboarding: () => void
  checkOnboardingStatus: () => boolean

  // Utility actions
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  incrementVisitCount: () => void
  updateLastVisit: () => void
  clearAllUserData: () => Promise<void>
  syncFromSupabase: (telegramId: number) => Promise<void>
}

type UserStore = UserState & UserActions

const DEFAULT_PREFERENCES: UserPreferences = {
  theme: 'auto',
  language: 'ru',
  notifications: {
    enabled: true,
    dailyReminder: true,
    reminderTime: '09:00',
    weeklyStats: true,
    milestones: true,
  },
  privacy: {
    dataCollection: false,
    analytics: false,
    cloudSync: false,
    shareGarden: true,
  },
  garden: {
    autoArrange: false,
    showAnimations: true,
    soundEffects: false,
    hapticFeedback: true,
    seasonalThemes: true,
  },
}

function createDefaultStats(): UserStats {
  const now = new Date()
  return {
    totalDays: 0,
    currentStreak: 0,
    longestStreak: 0,
    totalElements: 0,
    rareElementsFound: 0,
    gardensShared: 0,
    firstVisit: now,
    lastVisit: now,
  }
}

export const useUserStore = create<UserStore>()(
  subscribeWithSelector((set, get) => ({
    // Initial state
    currentUser: null,
    isAuthenticated: false,
    isLoading: false,
    error: null,
    hasCompletedOnboarding: false,

    // Actions
    loadUser: async () => {
      set({ isLoading: true, error: null })

      try {
        let storedUser = loadUser()
        const onboardingCompleted = isOnboardingCompleted()

        // 🔥 РЕАЛЬНАЯ СИНХРОНИЗАЦИЯ - загружаем из CloudStorage если доступно
        if (telegramStorage.isAvailable && !storedUser) {
          try {
            const cloudUser = await telegramStorage.loadUser()
            if (cloudUser) {
              storedUser = cloudUser
              console.log('✅ User loaded from CloudStorage and synced locally')
            }
          } catch (err) {
            console.warn('⚠️ CloudStorage load failed:', err)
          }
        }

        if (storedUser) {
          set({
            currentUser: storedUser,
            isAuthenticated: !storedUser.isAnonymous,
            hasCompletedOnboarding: onboardingCompleted,
            isLoading: false,
          })
        } else {
          set({
            currentUser: null,
            isAuthenticated: false,
            hasCompletedOnboarding: onboardingCompleted,
            isLoading: false,
          })
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Failed to load user'
        set({
          error: errorMessage,
          isLoading: false,
        })
      }
    },

    createAnonymousUser: async () => {
      set({ isLoading: true, error: null })

      try {
        const newUser: User = {
          id: `anon_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          registrationDate: new Date(),
          preferences: DEFAULT_PREFERENCES,
          stats: createDefaultStats(),
          isAnonymous: true,
        }

        const success = saveUser(newUser)

        if (success) {
          // 🔥 РЕАЛЬНАЯ СИНХРОНИЗАЦИЯ с CloudStorage для анонимных пользователей тоже
          if (telegramStorage.isAvailable) {
            try {
              await telegramStorage.saveUser(newUser)
              console.log('✅ Anonymous user synced to CloudStorage')
            } catch (err) {
              console.warn(
                '⚠️ CloudStorage sync failed for anonymous user:',
                err
              )
            }
          }

          set({
            currentUser: newUser,
            isAuthenticated: false, // Anonymous users are not "authenticated"
            isLoading: false,
          })

          return newUser
        } else {
          throw new Error('Failed to save user')
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Failed to create user'
        set({
          error: errorMessage,
          isLoading: false,
        })
        throw error
      }
    },

    createTelegramUser: (telegramData: TelegramUserData) => {
      set({ isLoading: true, error: null })

      try {
        // Проверяем, есть ли уже пользователь с таким Telegram ID
        const existingUser = loadUser()
        if (
          existingUser &&
          existingUser.telegramId === telegramData.telegramId
        ) {
          console.log('Пользователь с таким Telegram ID уже существует')
          set({
            currentUser: existingUser,
            isAuthenticated: true,
            isLoading: false,
          })
          return existingUser
        }

        const newUser: User = {
          id: `tg_${telegramData.telegramId}`,
          telegramId: telegramData.telegramId,
          firstName: telegramData.firstName,
          ...(telegramData.lastName && { lastName: telegramData.lastName }),
          ...(telegramData.username && { username: telegramData.username }),
          ...(telegramData.photoUrl && { photoUrl: telegramData.photoUrl }),
          registrationDate: new Date(),
          lastVisitDate: new Date(),
          preferences: DEFAULT_PREFERENCES,
          stats: createDefaultStats(),
          isAnonymous: false,
        }

        const success = saveUser(newUser)

        if (success) {
          // Отмечаем онбординг как завершенный для Telegram пользователей
          saveOnboardingCompleted(true)

          // 🔥 РЕАЛЬНАЯ СИНХРОНИЗАЦИЯ с CloudStorage
          if (telegramStorage.isAvailable) {
            telegramStorage
              .saveUser(newUser)
              .then(() => console.log('✅ User synced to CloudStorage'))
              .catch((err: any) =>
                console.warn('⚠️ CloudStorage sync failed:', err)
              )
          }

          set({
            currentUser: newUser,
            isAuthenticated: true,
            hasCompletedOnboarding: true,
            isLoading: false,
          })

          console.log('Telegram пользователь создан:', newUser)
          return newUser
        } else {
          throw new Error('Failed to save Telegram user')
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error
            ? error.message
            : 'Failed to create Telegram user'
        set({
          error: errorMessage,
          isLoading: false,
        })
        throw error
      }
    },

    updateUser: (updates: Partial<User>) => {
      const { currentUser } = get()

      if (!currentUser) {
        set({ error: 'No user to update' })
        return
      }

      set({ isLoading: true, error: null })

      try {
        const updatedUser: User = {
          ...currentUser,
          ...updates,
        }

        const success = saveUser(updatedUser)

        if (success) {
          set({
            currentUser: updatedUser,
            isLoading: false,
          })
        } else {
          throw new Error('Failed to save user updates')
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Failed to update user'
        set({
          error: errorMessage,
          isLoading: false,
        })
      }
    },

    updatePreferences: async (preferences: Partial<UserPreferences>) => {
      const { currentUser } = get()

      if (!currentUser) {
        set({ error: 'No user to update' })
        return
      }

      const updatedPreferences: UserPreferences = {
        ...currentUser.preferences,
        ...preferences,
        // Handle nested objects
        notifications: {
          ...currentUser.preferences.notifications,
          ...(preferences.notifications ?? {}),
        },
        privacy: {
          ...currentUser.preferences.privacy,
          ...(preferences.privacy ?? {}),
        },
        garden: {
          ...currentUser.preferences.garden,
          ...(preferences.garden ?? {}),
        },
      }

      await get().updateUser({ preferences: updatedPreferences })
    },

    updateStats: async (stats: Partial<UserStats>) => {
      const { currentUser } = get()

      if (!currentUser) {
        set({ error: 'No user to update' })
        return
      }

      const updatedStats: UserStats = {
        ...currentUser.stats,
        ...stats,
      }

      await get().updateUser({ stats: updatedStats })
    },

    signOut: async () => {
      set({ isLoading: true, error: null })

      try {
        // Clear user data but keep as anonymous user
        await get().createAnonymousUser()

        set({
          isAuthenticated: false,
          hasCompletedOnboarding: false,
          isLoading: false,
        })

        saveOnboardingCompleted(false)
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Failed to sign out'
        set({
          error: errorMessage,
          isLoading: false,
        })
      }
    },

    completeOnboarding: () => {
      set({ hasCompletedOnboarding: true })
      saveOnboardingCompleted(true)
    },

    checkOnboardingStatus: () => {
      return get().hasCompletedOnboarding
    },

    setLoading: (loading: boolean) => {
      set({ isLoading: loading })
    },

    setError: (error: string | null) => {
      set({ error })
    },

    incrementVisitCount: () => {
      const { currentUser } = get()

      if (currentUser) {
        const updatedStats: UserStats = {
          ...currentUser.stats,
          totalDays: currentUser.stats.totalDays + 1,
          lastVisit: new Date(),
        }

        void get().updateStats(updatedStats)
      }
    },

    updateLastVisit: () => {
      const { currentUser } = get()

      if (currentUser) {
        const updatedStats: UserStats = {
          ...currentUser.stats,
          lastVisit: new Date(),
        }

        void get().updateStats(updatedStats)
      }
    },

    // 🗑️ ПРИНУДИТЕЛЬНАЯ ОЧИСТКА ВСЕХ ДАННЫХ
    clearAllUserData: async () => {
      set({ isLoading: true, error: null })

      try {
        // 1. Очистить localStorage
        localStorage.clear()

        // 2. Очистить Telegram CloudStorage
        if (telegramStorage.isAvailable) {
          await telegramStorage.clearAllData()
          console.log('✅ CloudStorage cleared')
        }

        // 3. Очистить другие stores
        const { clearMoodHistory } = await import('./moodStore').then(m =>
          m.useMoodStore.getState()
        )
        const { clearGarden } = await import('./gardenStore').then(m =>
          m.useGardenStore.getState()
        )

        clearMoodHistory()
        clearGarden()
        console.log('✅ Mood and Garden stores cleared')

        // 4. Сбросить состояние пользователя
        set({
          currentUser: null,
          isAuthenticated: false,
          hasCompletedOnboarding: false,
          isLoading: false,
          error: null,
        })

        console.log('✅ All user data cleared')
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Failed to clear data'
        set({ error: errorMessage, isLoading: false })
        console.error('❌ Failed to clear user data:', error)
      }
    },

    // 🔄 СИНХРОНИЗАЦИЯ ИЗ SUPABASE
    syncFromSupabase: async (telegramId: number) => {
      set({ isLoading: true, error: null })

      try {
        console.log(`🔄 Syncing user data from Supabase for ${telegramId}`)

        // Запрашиваем данные из API
        const response = await fetch(`/api/user/stats?telegramId=${telegramId}`)

        if (!response.ok) {
          throw new Error(`Failed to fetch user data: ${response.status}`)
        }

        const result = await response.json()

        if (!result.success || !result.data.hasData) {
          console.log(
            `📝 No server data for user ${telegramId} - keeping current state`
          )
          set({ isLoading: false })
          return
        }

        // Создаем пользователя на основе данных с сервера
        const serverStats = result.data
        const syncedUser: User = {
          id: `tg_${telegramId}`,
          telegramId: telegramId,
          registrationDate: new Date(), // Берем из серверных данных если есть
          preferences: DEFAULT_PREFERENCES,
          stats: {
            ...createDefaultStats(),
            totalDays: serverStats.totalDays || 0,
            currentStreak: serverStats.currentStreak || 0,
            longestStreak: serverStats.longestStreak || 0,
            totalElements: serverStats.totalElements || 0,
            rareElementsFound: serverStats.rareElementsFound || 0,
            gardensShared: serverStats.gardensShared || 0,
          },
          isAnonymous: false,
        }

        // Сохраняем локально
        const success = saveUser(syncedUser)

        if (success) {
          set({
            currentUser: syncedUser,
            isAuthenticated: true,
            isLoading: false,
          })

          console.log(`✅ User data synced from Supabase for ${telegramId}`)
        } else {
          throw new Error('Failed to save synced user')
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error
            ? error.message
            : 'Failed to sync from Supabase'
        set({ error: errorMessage, isLoading: false })
        console.error('❌ Supabase sync failed:', error)
      }
    },
  }))
)

// Subscribe to user changes and auto-save
useUserStore.subscribe(
  state => state.currentUser,
  user => {
    if (user) {
      saveUser(user)
    }
  }
)
