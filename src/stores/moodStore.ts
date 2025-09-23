import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import { useUserStore } from './userStore'
import type {
  MoodState,
  MoodEntry,
  MoodType,
  MoodIntensity,
  MoodStats,
} from '@/types'
import { calculateMoodStats } from '@/utils/moodMapping'
import { isTimeForCheckin } from '@/utils/dateHelpers'
import { saveMoodHistory, loadMoodHistory } from '@/utils/storage'

interface MoodActions {
  // Mood management
  loadMoodHistory: () => void
  syncMoodHistory: () => Promise<void>
  addMoodEntry: (
    mood: MoodType,
    intensity: MoodIntensity,
    note?: string
  ) => Promise<MoodEntry | null>
  updateTodaysMood: (
    mood: MoodType,
    intensity: MoodIntensity,
    note?: string
  ) => Promise<MoodEntry | null>

  // Checkin management
  canCheckinToday: () => boolean
  getTodaysMood: () => MoodEntry | null
  getRecentMoods: (days: number) => readonly MoodEntry[]

  // Statistics
  getMoodStats: () => MoodStats
  getStreakInfo: () => { current: number; longest: number }

  // Utility actions
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  clearMoodHistory: () => void
}

type MoodStore = MoodState & MoodActions

export const useMoodStore = create<MoodStore>()(
  subscribeWithSelector((set, get) => ({
    // Initial state
    todaysMood: null,
    moodHistory: [],
    isLoading: false,
    error: null,
    streakCount: 0,
    lastCheckin: null,

    // Actions
    loadMoodHistory: () => {
      set({ isLoading: true, error: null })

      try {
        const storedHistory = loadMoodHistory()

        // Find today's mood if it exists
        const today = new Date()
        today.setHours(0, 0, 0, 0)

        const todaysMood =
          storedHistory.find(entry => {
            const entryDate = new Date(entry.date)
            entryDate.setHours(0, 0, 0, 0)
            return entryDate.getTime() === today.getTime()
          }) ?? null

        // Calculate streak
        const stats = calculateMoodStats(storedHistory)
        const lastEntry = storedHistory.length > 0 ? storedHistory[0] : null

        set({
          moodHistory: storedHistory,
          todaysMood,
          streakCount: stats.currentStreak,
          lastCheckin: lastEntry?.date ?? null,
          isLoading: false,
        })

        // 🔄 Автоматически синхронизируем с сервером
        void get().syncMoodHistory()
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Failed to load mood history'
        set({
          error: errorMessage,
          isLoading: false,
        })
      }
    },

    // 🔄 СИНХРОНИЗАЦИЯ С SUPABASE
    syncMoodHistory: async () => {
      try {
        const userStore = useUserStore.getState()
        const currentUser = userStore.currentUser

        if (!currentUser?.telegramId) {
          console.log('📝 No Telegram user - skipping mood sync')
          return
        }

        console.log(
          `🔄 Syncing mood history for user ${currentUser.telegramId}`
        )

        // Получаем актуальные данные пользователя с сервера
        const response = await fetch(
          `/api/user/stats?telegramId=${currentUser.telegramId}`
        )

        if (!response.ok) {
          throw new Error(`Failed to fetch user data: ${response.status}`)
        }

        const result = await response.json()

        if (result.success && result.data.hasData) {
          // Если есть данные на сервере - обновляем локальное состояние
          // TODO: Здесь нужно получить полную историю настроений из API
          console.log('✅ Server has mood data - local state may need update')
        } else {
          console.log('📝 No server mood data - local state is primary')
        }
      } catch (error) {
        console.warn('⚠️ Mood sync failed:', error)
      }
    },

    addMoodEntry: async (
      mood: MoodType,
      intensity: MoodIntensity,
      note?: string
    ) => {
      const { moodHistory } = get()

      // Check if already checked in today
      if (!get().canCheckinToday()) {
        set({ error: 'Already checked in today' })
        return null
      }

      set({ isLoading: true, error: null })

      try {
        // Get current user from user store
        const userStore = useUserStore.getState()
        const currentUser = userStore.currentUser

        if (!currentUser) {
          throw new Error('No user found')
        }

        const newEntry: MoodEntry = {
          id: `mood_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          userId: currentUser.id,
          date: new Date(),
          mood,
          intensity,
          note,
          createdAt: new Date(),
        }

        // 🔄 СИНХРОНИЗАЦИЯ: Сохраняем локально И на сервер
        const updatedHistory = [newEntry, ...moodHistory]
        const localSuccess = saveMoodHistory(updatedHistory)

        if (localSuccess) {
          // 📡 ОТПРАВЛЯЕМ НА СЕРВЕР для синхронизации между устройствами
          try {
            const response = await fetch('/api/mood/record', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                telegramId: currentUser.telegramId,
                mood,
                intensity,
                note,
                date: newEntry.date.toISOString(),
              }),
            })

            if (!response.ok) {
              console.warn('⚠️ Failed to sync mood to server:', response.status)
            } else {
              console.log('✅ Mood synced to server successfully')
            }
          } catch (serverError) {
            console.warn(
              '⚠️ Server sync failed, but local save succeeded:',
              serverError
            )
          }

          // Update local state
          const stats = calculateMoodStats(updatedHistory)

          set({
            moodHistory: updatedHistory,
            todaysMood: newEntry,
            streakCount: stats.currentStreak,
            lastCheckin: newEntry.date,
            isLoading: false,
          })

          return newEntry
        } else {
          throw new Error('Failed to save mood entry locally')
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Failed to add mood entry'
        set({
          error: errorMessage,
          isLoading: false,
        })
        return null
      }
    },

    updateTodaysMood: async (
      mood: MoodType,
      intensity: MoodIntensity,
      note?: string
    ) => {
      const { moodHistory, todaysMood } = get()

      if (!todaysMood) {
        // If no mood today, create new entry
        return get().addMoodEntry(mood, intensity, note)
      }

      set({ isLoading: true, error: null })

      try {
        const updatedEntry: MoodEntry = {
          ...todaysMood,
          mood,
          intensity,
          note,
        }

        // Update history
        const updatedHistory = moodHistory.map(entry =>
          entry.id === todaysMood.id ? updatedEntry : entry
        )

        const success = saveMoodHistory(updatedHistory)

        if (success) {
          set({
            moodHistory: updatedHistory,
            todaysMood: updatedEntry,
            isLoading: false,
          })

          return updatedEntry
        } else {
          throw new Error('Failed to update mood entry')
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Failed to update mood entry'
        set({
          error: errorMessage,
          isLoading: false,
        })
        return null
      }
    },

    // Utility functions
    canCheckinToday: () => {
      const { lastCheckin } = get()
      return isTimeForCheckin(lastCheckin)
    },

    getTodaysMood: () => {
      return get().todaysMood
    },

    getRecentMoods: (days: number) => {
      const { moodHistory } = get()
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - days)

      return moodHistory.filter(entry => entry.date >= cutoffDate)
    },

    getMoodStats: () => {
      const { moodHistory } = get()
      return calculateMoodStats(moodHistory)
    },

    getStreakInfo: () => {
      const stats = get().getMoodStats()
      return {
        current: stats.currentStreak,
        longest: stats.longestStreak,
      }
    },

    setLoading: (loading: boolean) => {
      set({ isLoading: loading })
    },

    setError: (error: string | null) => {
      set({ error })
    },

    clearMoodHistory: () => {
      saveMoodHistory([])
      set({
        moodHistory: [],
        todaysMood: null,
        streakCount: 0,
        lastCheckin: null,
        error: null,
      })
    },
  }))
)

// Subscribe to mood history changes and auto-save
useMoodStore.subscribe(
  state => state.moodHistory,
  history => {
    saveMoodHistory(history)
  }
)
