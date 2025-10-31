/**
 * 😊 Mood Client State Store (v2 - Refactored)
 * Хранит ТОЛЬКО клиентское UI состояние настроений
 * Серверное состояние (записи, синхронизация) управляется через React Query
 */

import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'

// ============================================
// ТИПЫ СОСТОЯНИЯ
// ============================================

interface MoodClientState {
  // UI состояние
  readonly selectedDateRange: {
    from: Date | null
    to: Date | null
  }
  readonly isFilterModalOpen: boolean
  readonly selectedMoodFilter: string | null

  // Actions для UI состояния
  setDateRange: (from: Date | null, to: Date | null) => void
  setFilterModalOpen: (isOpen: boolean) => void
  setSelectedMoodFilter: (mood: string | null) => void
  clearFilters: () => void
}

// ============================================
// STORE
// ============================================

export const useMoodClientStore = create<MoodClientState>()(
  subscribeWithSelector(set => ({
    // Начальное состояние
    selectedDateRange: {
      from: null,
      to: null,
    },
    isFilterModalOpen: false,
    selectedMoodFilter: null,

    // Actions
    setDateRange: (from: Date | null, to: Date | null) => {
      console.log('📅 Mood: Setting date range:', { from, to })
      set({
        selectedDateRange: { from, to },
      })
    },

    setFilterModalOpen: (isOpen: boolean) => {
      console.log('🔍 Mood: Setting filter modal:', isOpen)
      set({ isFilterModalOpen: isOpen })
    },

    setSelectedMoodFilter: (mood: string | null) => {
      console.log('🎭 Mood: Setting mood filter:', mood)
      set({ selectedMoodFilter: mood })
    },

    clearFilters: () => {
      console.log('🧹 Mood: Clearing filters')
      set({
        selectedDateRange: { from: null, to: null },
        selectedMoodFilter: null,
      })
    },
  }))
)

/**
 * Хук для получения фильтров настроения
 */
export function useMoodFilters() {
  return useMoodClientStore(state => ({
    dateRange: state.selectedDateRange,
    moodFilter: state.selectedMoodFilter,
  }))
}
