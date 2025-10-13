/**
 * 🏆 Challenge Client State Store (v2 - Refactored)
 * Хранит ТОЛЬКО клиентское UI состояние челленджей
 * Серверное состояние (челленджи, участие) управляется через React Query
 */

import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'

// ============================================
// ТИПЫ СОСТОЯНИЯ
// ============================================

interface ChallengeClientState {
  // UI состояние
  readonly selectedChallengeId: string | null
  readonly isJoinModalOpen: boolean
  readonly selectedFilter: 'all' | 'active' | 'completed' | 'mine'
  readonly sortBy: 'startDate' | 'endDate' | 'participants' | 'progress'

  // Actions для UI состояния
  selectChallenge: (challengeId: string | null) => void
  setJoinModalOpen: (isOpen: boolean) => void
  setSelectedFilter: (filter: 'all' | 'active' | 'completed' | 'mine') => void
  setSortBy: (
    sortBy: 'startDate' | 'endDate' | 'participants' | 'progress'
  ) => void
  clearSelection: () => void
}

// ============================================
// STORE
// ============================================

export const useChallengeClientStore = create<ChallengeClientState>()(
  subscribeWithSelector(set => ({
    // Начальное состояние
    selectedChallengeId: null,
    isJoinModalOpen: false,
    selectedFilter: 'all',
    sortBy: 'startDate',

    // Actions
    selectChallenge: (challengeId: string | null) => {
      console.log('🎯 Challenge: Selecting challenge:', challengeId)
      set({ selectedChallengeId: challengeId })
    },

    setJoinModalOpen: (isOpen: boolean) => {
      console.log('🚪 Challenge: Setting join modal:', isOpen)
      set({ isJoinModalOpen: isOpen })
    },

    setSelectedFilter: (filter: 'all' | 'active' | 'completed' | 'mine') => {
      console.log('🔍 Challenge: Setting filter:', filter)
      set({ selectedFilter: filter })
    },

    setSortBy: (
      sortBy: 'startDate' | 'endDate' | 'participants' | 'progress'
    ) => {
      console.log('📊 Challenge: Setting sort by:', sortBy)
      set({ sortBy: sortBy })
    },

    clearSelection: () => {
      console.log('🧹 Challenge: Clearing selection')
      set({
        selectedChallengeId: null,
        isJoinModalOpen: false,
      })
    },
  }))
)

/**
 * Хук для получения выбранного челленджа
 */
export function useSelectedChallenge() {
  return useChallengeClientStore(state => state.selectedChallengeId)
}

/**
 * Хук для получения фильтров челленджей
 */
export function useChallengeFilters() {
  return useChallengeClientStore(state => ({
    filter: state.selectedFilter,
    sortBy: state.sortBy,
  }))
}
