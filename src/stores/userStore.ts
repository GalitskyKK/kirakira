/**
 * User Zustand Store - ГИБРИДНЫЙ ПОДХОД
 *
 * После рефакторинга этот стор управляет:
 *
 * КЛИЕНТСКОЕ СОСТОЯНИЕ (Zustand):
 * - currentUser - текущий пользователь в UI
 * - isAuthenticated - статус аутентификации
 * - hasCompletedOnboarding - статус онбординга
 *
 * СЕРВЕРНОЕ СОСТОЯНИЕ (React Query):
 * - useProfile() - получение профиля с сервера
 * - useAddExperience() - добавление опыта
 * - useUpdatePrivacy() - обновление настроек
 *
 * Минимальная серверная логика остается в store только для:
 * - Начальной загрузки пользователя (loadUser)
 * - Создания нового пользователя (createTelegramUser)
 */

import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import type { User, UserState, UserPreferences, UserStats } from '@/types'
import {
  saveUser,
  loadUser,
  saveOnboardingCompleted,
  isOnboardingCompleted,
} from '@/utils/storage'
import { telegramStorage } from '@/utils/telegramStorage'

// ============================================
// INTERFACES
// ============================================

interface TelegramUserData {
  readonly telegramId: number
  readonly firstName: string
  readonly lastName: string | undefined
  readonly username: string | undefined
  readonly photoUrl: string | undefined
  readonly authDate: Date
  readonly hash: string
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
  clearUserDataOnly: () => Promise<void>

  // ВАЖНО: Эта функция остается для обратной совместимости,
  // но в новом коде предпочтительно использовать useProfile() хук
  syncFromSupabase: (
    telegramId: number,
    userData?: Partial<{
      readonly telegram_id: number
      readonly user_id: string
      readonly username?: string
      readonly first_name?: string
      readonly last_name?: string
    }>
  ) => Promise<void>
}

type UserStore = UserState & UserActions

// ============================================
// DEFAULT VALUES
// ============================================

const DEFAULT_PREFERENCES: UserPreferences = {
  theme: 'auto',
  language: 'ru',
  notifications: {
    enabled: true,
    dailyReminder: true,
    reminderTime: '10:00',
    weeklyStats: true,
    milestones: true,
    streakLost: true,
    inactivityReminder: true,
    weeklyMotivation: true,
    achievements: true,
  },
  privacy: {
    dataCollection: false,
    analytics: false,
    cloudSync: false,
    shareGarden: true,
    showProfile: true,
    shareAchievements: true,
    allowFriendRequests: true,
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

// ============================================
// ZUSTAND STORE
// ============================================

export const useUserStore = create<UserStore>()(
  subscribeWithSelector((set, get) => ({
    // ============================================
    // INITIAL STATE
    // ============================================
    currentUser: null,
    isAuthenticated: false,
    isLoading: false,
    error: null,
    hasCompletedOnboarding: false,

    // ============================================
    // ACTIONS
    // ============================================

    /**
     * Загружает пользователя из localStorage
     * Серверная синхронизация должна вызываться отдельно через useProfile() хук
     */
    loadUser: async () => {
      set({ isLoading: true, error: null })

      try {
        let storedUser = loadUser()
        const onboardingCompleted = isOnboardingCompleted()

        console.log('🔍 loadUser - Loaded from localStorage:', {
          hasUser: !!storedUser,
          isAnonymous: storedUser?.isAnonymous,
          telegramId: storedUser?.telegramId,
        })

        // Попытка загрузки из Telegram CloudStorage
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
            isAuthenticated: false,
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
          saveOnboardingCompleted(true)

          if (telegramStorage.isAvailable) {
            telegramStorage
              .saveUser(newUser)
              .then(() => console.log('✅ User synced to CloudStorage'))
              .catch((err: unknown) =>
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

      try {
        const updatedUser: User = {
          ...currentUser,
          ...updates,
        }

        const success = saveUser(updatedUser)

        if (success) {
          set({
            currentUser: updatedUser,
          })
        } else {
          throw new Error('Failed to save user updates')
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Failed to update user'
        set({
          error: errorMessage,
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

    clearAllUserData: async () => {
      set({ isLoading: true, error: null })

      try {
        localStorage.clear()

        if (telegramStorage.isAvailable) {
          await telegramStorage.clearAllData()
          console.log('✅ CloudStorage cleared')
        }

        const { clearMoodHistory } = await import('./moodStore').then(m =>
          m.useMoodStore.getState()
        )
        const { clearGarden } = await import('./gardenStore').then(m =>
          m.useGardenStore.getState()
        )

        clearMoodHistory()
        clearGarden()
        console.log('✅ Mood and Garden stores cleared')

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

    clearUserDataOnly: async () => {
      set({ isLoading: true, error: null })

      try {
        const onboardingStatus = isOnboardingCompleted()

        const { STORAGE_KEYS } = await import('@/utils/storage')
        const keysToKeep = [STORAGE_KEYS.ONBOARDING]

        Object.values(STORAGE_KEYS).forEach((key: string) => {
          if (!keysToKeep.includes(key as any)) {
            localStorage.removeItem(key)
          }
        })

        if (telegramStorage.isAvailable) {
          await telegramStorage.clearUserData()
          console.log('✅ User data cleared from CloudStorage')
        }

        try {
          const moodStoreModule = await import('./moodStore')
          const gardenStoreModule = await import('./gardenStore')

          if (moodStoreModule?.useMoodStore?.getState) {
            const { clearMoodHistory } = moodStoreModule.useMoodStore.getState()
            clearMoodHistory()
          }

          if (gardenStoreModule?.useGardenStore?.getState) {
            const { clearGarden } = gardenStoreModule.useGardenStore.getState()
            clearGarden()
          }

          console.log('✅ Mood and Garden stores cleared')
        } catch (storeError) {
          console.warn('⚠️ Failed to clear stores:', storeError)
        }

        set({
          currentUser: null,
          isAuthenticated: false,
          hasCompletedOnboarding: onboardingStatus,
          isLoading: false,
          error: null,
        })

        if (onboardingStatus) {
          saveOnboardingCompleted(true)
        }

        console.log('✅ User data cleared (onboarding preserved)')
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Failed to clear user data'
        set({ error: errorMessage, isLoading: false })
        console.error('❌ Failed to clear user data:', error)
      }
    },

    /**
     * УСТАРЕВШАЯ ФУНКЦИЯ - Для обратной совместимости
     *
     * В новом коде используйте useProfile() хук из React Query
     * Эта функция остается только для начальной загрузки
     */
    syncFromSupabase: async (
      _telegramId: number,
      _userData?: Partial<{
        readonly telegram_id: number
        readonly user_id: string
        readonly username?: string
        readonly first_name?: string
        readonly last_name?: string
      }>
    ) => {
      console.warn(
        '⚠️ syncFromSupabase is deprecated. Use useProfile() hook instead.'
      )
      // Упрощенная версия - детальная синхронизация теперь через React Query
      set({ isLoading: false })
    },
  }))
)

// ============================================
// AUTO-SAVE SUBSCRIPTION
// ============================================

useUserStore.subscribe(
  state => state.currentUser,
  user => {
    if (user) {
      saveUser(user)
    }
  }
)
