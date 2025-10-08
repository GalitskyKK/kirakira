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
import type {
  DatabaseUser,
  StandardApiResponse,
  ProfileApiGetProfileResponse,
  ProfileApiAddExperienceResponse,
} from '@/types/api'
import {
  saveUser,
  loadUser,
  saveOnboardingCompleted,
  isOnboardingCompleted,
} from '@/utils/storage'
import { telegramStorage } from '@/utils/telegramStorage'
import { authenticatedFetch } from '@/utils/apiClient'

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
  clearUserDataOnly: () => Promise<void> // 🆕 Новая функция - только данные пользователя
  syncFromSupabase: (
    telegramId: number,
    userData?: Partial<DatabaseUser>
  ) => Promise<void>
  addExperienceAndSync: (
    experiencePoints: number,
    reason: string
  ) => Promise<{
    success: boolean
    data?: { experience: number; level: number; leveledUp?: boolean }
    error?: string
  }> // 🆕 Синхронизация опыта
}

type UserStore = UserState & UserActions

const DEFAULT_PREFERENCES: UserPreferences = {
  theme: 'auto',
  language: 'ru',
  notifications: {
    enabled: true,
    dailyReminder: true,
    reminderTime: '10:00', // Время в МСК для уведомлений
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

        console.log('🔍 loadUser - Loaded from localStorage:', {
          hasUser: !!storedUser,
          userExperience: storedUser?.experience,
          userLevel: storedUser?.level,
          isAnonymous: storedUser?.isAnonymous,
          telegramId: storedUser?.telegramId,
        })

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
          console.log('🔍 loadUser - Setting user to store:', {
            experience: storedUser.experience,
            level: storedUser.level,
            telegramId: storedUser.telegramId,
          })

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

    // 🗑️ ПРИНУДИТЕЛЬНАЯ ОЧИСТКА ВСЕХ ДАННЫХ (включая онбординг)
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

    // 🎯 УМНАЯ ОЧИСТКА - только данные пользователя, сохраняет онбординг
    clearUserDataOnly: async () => {
      set({ isLoading: true, error: null })

      try {
        // 1. Сохраняем состояние онбординга ПЕРЕД очисткой
        const onboardingStatus = isOnboardingCompleted()

        // 2. Очищаем только пользовательские данные в localStorage
        const { STORAGE_KEYS } = await import('@/utils/storage')
        const keysToKeep = [STORAGE_KEYS.ONBOARDING] // Сохраняем онбординг

        // Очищаем все ключи кроме тех что нужно сохранить
        Object.values(STORAGE_KEYS).forEach((key: string) => {
          if (!keysToKeep.includes(key as any)) {
            localStorage.removeItem(key)
          }
        })

        // 3. Очистить пользовательские данные в Telegram CloudStorage
        if (telegramStorage.isAvailable) {
          await telegramStorage.clearUserData() // Используем более селективную очистку
          console.log('✅ User data cleared from CloudStorage')
        }

        // 4. Очистить другие stores (сад и настроения)
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
          // Не критично, продолжаем
        }

        // 5. Сбросить состояние пользователя НО сохранить онбординг
        set({
          currentUser: null,
          isAuthenticated: false,
          hasCompletedOnboarding: onboardingStatus, // 🎯 Сохраняем статус онбординга!
          isLoading: false,
          error: null,
        })

        // 6. Восстанавливаем онбординг в localStorage (на случай если был затёрт)
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

    // 🔄 СИНХРОНИЗАЦИЯ ИЗ SUPABASE (ИСПРАВЛЕНО)
    syncFromSupabase: async (
      telegramId: number,
      userData?: Partial<DatabaseUser>
    ) => {
      set({ isLoading: true, error: null })

      try {
        console.log(`🔄 Syncing user data from Supabase for ${telegramId}`)

        // Используем POST если есть userData, иначе GET
        let response: Response
        if (userData) {
          console.log('📤 Sending user data to API:', userData)
          response = await authenticatedFetch(
            `/api/profile?action=get_profile`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ telegramId, userData }),
            }
          )
        } else {
          response = await authenticatedFetch(
            `/api/profile?action=get_profile&telegramId=${telegramId}`
          )
        }

        console.log('🔍 API Response status:', response.status, response.ok)

        if (!response.ok) {
          throw new Error(`Failed to fetch user data: ${response.status}`)
        }

        const result =
          (await response.json()) as StandardApiResponse<ProfileApiGetProfileResponse>

        console.log('🔍 API Response data:', {
          success: result.success,
          hasUser: !!result.data?.user,
          userExperience: result.data?.user?.experience,
          userLevel: result.data?.user?.level,
          fullResult: result,
        })

        if (!result.success || !result.data?.user) {
          console.log(
            `📝 No server data for user ${telegramId} - keeping current state`
          )
          set({ isLoading: false })
          return
        }

        // Создаем пользователя на основе данных с сервера (ИСПРАВЛЕННЫЙ ФОРМАТ)
        const serverUser = result.data.user
        const serverStats = result.data.stats || {}

        const syncedUser = {
          id: `tg_${telegramId}`,
          telegramId: telegramId,
          firstName: serverUser.first_name,
          lastName: serverUser.last_name,
          username: serverUser.username,
          photoUrl: serverUser.photo_url,
          registrationDate: serverUser.registration_date
            ? new Date(serverUser.registration_date)
            : new Date(),
          lastVisitDate: serverUser.last_visit_date
            ? new Date(serverUser.last_visit_date)
            : new Date(),
          preferences: {
            ...DEFAULT_PREFERENCES,
            // Мержим настройки приватности из БД
            privacy: {
              ...DEFAULT_PREFERENCES.privacy,
              ...(serverUser.privacy_settings || {}),
            },
          },
          stats: {
            ...createDefaultStats(),
            // 🔥 ПРИОРИТЕТ БД: Используем статистику из БД (serverStats приоритетнее serverUser)
            totalDays:
              serverStats.totalDays !== undefined
                ? serverStats.totalDays
                : serverUser.total_days !== undefined
                  ? serverUser.total_days
                  : 0,
            currentStreak:
              serverStats.currentStreak !== undefined
                ? serverStats.currentStreak
                : serverUser.current_streak !== undefined
                  ? serverUser.current_streak
                  : 0,
            longestStreak:
              serverStats.longestStreak !== undefined
                ? serverStats.longestStreak
                : serverUser.longest_streak !== undefined
                  ? serverUser.longest_streak
                  : 0,
            totalElements:
              serverStats.totalElements !== undefined
                ? serverStats.totalElements
                : serverUser.total_elements !== undefined
                  ? serverUser.total_elements
                  : 0,
            rareElementsFound:
              serverStats.rareElementsFound !== undefined
                ? serverStats.rareElementsFound
                : serverUser.rare_elements_found !== undefined
                  ? serverUser.rare_elements_found
                  : 0,
            gardensShared:
              serverStats.gardensShared !== undefined
                ? serverStats.gardensShared
                : serverUser.gardens_shared !== undefined
                  ? serverUser.gardens_shared
                  : 0,
          },
          // 🔥 ПРИОРИТЕТ БД: Используем данные из БД, fallback только если undefined/null
          experience:
            serverUser.experience !== undefined ? serverUser.experience : 0,
          level: serverUser.level !== undefined ? serverUser.level : 1,
          isAnonymous: false,
        }

        // Сохраняем локально
        const success = saveUser(syncedUser as User)

        if (success) {
          set({
            currentUser: syncedUser as User,
            isAuthenticated: true,
            isLoading: false,
          })

          console.log(`✅ User data synced from Supabase for ${telegramId}:`, {
            experience: syncedUser.experience,
            level: syncedUser.level,
            savedSuccessfully: success,
            storeState: get().currentUser,
          })
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

    // 🏆 ДОБАВЛЕНИЕ ОПЫТА С СИНХРОНИЗАЦИЕЙ ЛОКАЛЬНОГО STORE
    addExperienceAndSync: async (experiencePoints: number, reason: string) => {
      const { currentUser } = get()

      if (!currentUser?.telegramId) {
        return { success: false, error: 'No user logged in' }
      }

      try {
        console.log(
          `🏆 Adding ${experiencePoints} XP to user ${currentUser.telegramId} for ${reason}`
        )

        // Отправляем запрос на сервер
        const response = await authenticatedFetch(
          '/api/profile?action=add_experience',
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              telegramId: currentUser.telegramId,
              experiencePoints,
              reason,
            }),
          }
        )

        if (!response.ok) {
          throw new Error(`Failed to add experience: ${response.status}`)
        }

        const result =
          (await response.json()) as StandardApiResponse<ProfileApiAddExperienceResponse>

        if (!result.success) {
          throw new Error(result.error ?? 'Failed to add experience')
        }

        // 🔄 СИНХРОНИЗИРУЕМ ЛОКАЛЬНЫЕ ДАННЫЕ С СЕРВЕРОМ
        if (result.data?.experience !== undefined) {
          const updatedUser = {
            ...currentUser,
            experience: result.data.experience,
            level: result.data.level ?? currentUser.level,
          }

          // Обновляем локальный store
          set({ currentUser: updatedUser })

          // Сохраняем в localStorage
          saveUser(updatedUser)

          console.log(
            `✅ Local user data updated: XP=${updatedUser.experience}, Level=${updatedUser.level}`
          )
        }

        return {
          success: true,
          data: result.data ?? { experience: 0, level: 1 },
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Failed to add experience'
        console.error('❌ Experience add failed:', error)
        return { success: false, error: errorMessage }
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
