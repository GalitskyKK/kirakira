/**
 * 🏆 Challenge Client State Store (v2 - Refactored)
 * Хранит ТОЛЬКО клиентское UI состояние челленджей
 * Серверное состояние (челленджи, лидерборды, прогресс) управляется через React Query
 */

import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import type { Challenge } from '@/types/challenges'

// ============================================
// ТИПЫ СОСТОЯНИЯ
// ============================================

interface ChallengeClientState {
  // UI состояние
  readonly currentChallenge: Challenge | null
  readonly isLoading: boolean
  readonly error: string | null

  // Actions для UI состояния
  setCurrentChallenge: (challenge: Challenge | null) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void

  // Утилиты
  clearCurrentChallenge: () => void
}

// ============================================
// STORE
// ============================================

export const useChallengeClientStore = create<ChallengeClientState>()(
  subscribeWithSelector(set => ({
    // Начальное состояние
    currentChallenge: null,
    isLoading: false,
    error: null,

    // Actions
    setCurrentChallenge: (challenge: Challenge | null) => {
      console.log(
        '🏆 Challenge: Setting current challenge:',
        challenge?.id ?? 'none'
      )
      set({ currentChallenge: challenge })
    },

    setLoading: (loading: boolean) => {
      set({ isLoading: loading })
    },

    setError: (error: string | null) => {
      set({ error })
    },

    clearCurrentChallenge: () => {
      console.log('🧹 Challenge: Clearing current challenge')
      set({ currentChallenge: null })
    },
  }))
)

/**
 * Хук для получения только current challenge
 */
export function useCurrentChallenge() {
  return useChallengeClientStore(state => state.currentChallenge)
}

/**
 * Хук для получения только loading state
 */
export function useChallengeLoading() {
  return useChallengeClientStore(state => state.isLoading)
}

/**
 * Хук для получения только error state
 */
export function useChallengeError() {
  return useChallengeClientStore(state => state.error)
}
