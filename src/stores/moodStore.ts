/**
 * Mood Zustand Store - ТОЛЬКО UI STATE
 *
 * После рефакторинга этот стор управляет ТОЛЬКО клиентским состоянием:
 * - Локальный кеш настроений (moodHistory, todaysMood)
 * - UI состояния (не связанные с сервером)
 *
 * Вся серверная логика вынесена в React Query хуки:
 * - useMoodHistory() - получение истории настроений
 * - useTodaysMood() - получение сегодняшнего настроения
 * - useRecordMood() - запись настроения
 */

import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import type { MoodState, MoodEntry, MoodStats } from '@/types'
import { calculateMoodStats } from '@/utils/moodMapping'
import { saveMoodHistory, loadMoodHistory } from '@/utils/storage'

// ============================================
// STORE INTERFACE - ТОЛЬКО UI STATE
// ============================================

interface MoodActions {
  // Local mood management (UI state)
  loadMoodHistory: () => void
  setMoodHistory: (history: readonly MoodEntry[]) => void
  setTodaysMood: (mood: MoodEntry | null) => void
  updateMoodHistoryLocal: (entry: MoodEntry) => void

  // Checkin management (UI helpers)
  canCheckinToday: () => boolean
  getTodaysMood: () => MoodEntry | null
  getRecentMoods: (days: number) => readonly MoodEntry[]

  // Statistics (computed from local data)
  getMoodStats: () => MoodStats
  getStreakInfo: () => { readonly current: number; readonly longest: number }

  // Utility actions
  clearMoodHistory: () => void
}

type MoodStore = MoodState & MoodActions

// ============================================
// ZUSTAND STORE - ТОЛЬКО КЛИЕНТСКОЕ СОСТОЯНИЕ
// ============================================

export const useMoodStore = create<MoodStore>()(
  subscribeWithSelector((set, get) => ({
    // ============================================
    // INITIAL STATE
    // ============================================
    todaysMood: null,
    moodHistory: [],
    isLoading: false, // Устаревшее - теперь используется в React Query
    error: null, // Устаревшее - теперь используется в React Query
    streakCount: 0,
    lastCheckin: null,
    lastSyncTime: 0, // Устаревшее - теперь управляется React Query

    // ============================================
    // ACTIONS - ТОЛЬКО UI OPERATIONS
    // ============================================

    /**
     * Загружает историю настроений из localStorage (UI state)
     * Серверная синхронизация выполняется через React Query хуки
     */
    loadMoodHistory: () => {
      try {
        const storedHistory = loadMoodHistory()

        // Find today's mood if it exists
        const today = new Date()
        today.setHours(0, 0, 0, 0)

        const todaysMood =
          storedHistory.find(entry => {
            const entryDateStr = new Date(entry.date)
              .toISOString()
              .split('T')[0]
            const todayStr = today.toISOString().split('T')[0]
            return entryDateStr === todayStr
          }) ?? null

        // Calculate streak
        const stats = calculateMoodStats(storedHistory)
        const lastEntry = storedHistory.length > 0 ? storedHistory[0] : null

        set({
          moodHistory: storedHistory,
          todaysMood,
          streakCount: stats.currentStreak,
          lastCheckin: lastEntry?.date ?? null,
        })
      } catch (error) {
        console.error('Failed to load mood history from localStorage:', error)
        set({
          moodHistory: [],
          todaysMood: null,
        })
      }
    },

    /**
     * Устанавливает историю настроений (обычно после загрузки с сервера)
     */
    setMoodHistory: (history: readonly MoodEntry[]) => {
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      const todaysMood =
        history.find(entry => {
          const entryDateStr = new Date(entry.date).toISOString().split('T')[0]
          const todayStr = today.toISOString().split('T')[0]
          return entryDateStr === todayStr
        }) ?? null

      const stats = calculateMoodStats(history)
      const lastEntry = history.length > 0 ? history[0] : null

      set({
        moodHistory: history,
        todaysMood,
        streakCount: stats.currentStreak,
        lastCheckin: lastEntry?.date ?? null,
      })

      // Сохраняем локально для кеширования
      saveMoodHistory(history)
    },

    /**
     * Устанавливает настроение за сегодня
     */
    setTodaysMood: (mood: MoodEntry | null) => {
      set({ todaysMood: mood })
    },

    /**
     * Обновляет локальный кеш после добавления настроения
     */
    updateMoodHistoryLocal: (entry: MoodEntry) => {
      const { moodHistory } = get()
      const updatedHistory = [entry, ...moodHistory]

      const stats = calculateMoodStats(updatedHistory)

      set({
        moodHistory: updatedHistory,
        todaysMood: entry,
        streakCount: stats.currentStreak,
        lastCheckin: entry.date,
      })

      saveMoodHistory(updatedHistory)
    },

    // ============================================
    // UTILITY FUNCTIONS
    // ============================================

    /**
     * Проверяет, можно ли отмечать настроение сегодня
     */
    canCheckinToday: () => {
      const { todaysMood } = get()
      return !todaysMood
    },

    /**
     * Получить настроение за сегодня
     */
    getTodaysMood: () => {
      return get().todaysMood
    },

    /**
     * Получить недавние настроения
     */
    getRecentMoods: (days: number) => {
      const { moodHistory } = get()
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - days)

      return moodHistory.filter(entry => entry.date >= cutoffDate)
    },

    /**
     * Получить статистику настроений
     */
    getMoodStats: () => {
      const { moodHistory } = get()
      return calculateMoodStats(moodHistory)
    },

    /**
     * Получить информацию о стриках
     */
    getStreakInfo: () => {
      const stats = get().getMoodStats()
      return {
        current: stats.currentStreak,
        longest: stats.longestStreak,
      }
    },

    /**
     * Очистить историю настроений
     */
    clearMoodHistory: () => {
      saveMoodHistory([])
      set({
        moodHistory: [],
        todaysMood: null,
        streakCount: 0,
        lastCheckin: null,
      })
    },
  }))
)

// ============================================
// AUTO-SAVE SUBSCRIPTION
// ============================================

useMoodStore.subscribe(
  state => state.moodHistory,
  history => {
    saveMoodHistory(history)
  }
)
