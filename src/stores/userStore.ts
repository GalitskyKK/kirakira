/**
 * 👤 User Client State Store (v2 - Refactored)
 * Хранит ТОЛЬКО клиентское UI состояние пользователя
 * Серверное состояние (профиль, статистика) управляется через React Query
 */

import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import {
  saveOnboardingCompleted,
  saveGuestModeEnabled,
  isOnboardingCompleted,
  isGuestModeEnabled as loadGuestModeEnabled,
} from '@/utils/storage'

// ============================================
// ТИПЫ СОСТОЯНИЯ
// ============================================

interface UserClientState {
  // Клиентское состояние
  readonly hasCompletedOnboarding: boolean
  readonly isGuestModeEnabled: boolean
  readonly isAuthModalOpen: boolean
  readonly selectedTab: string
  readonly isLoading: boolean
  readonly error: string | null

  // Actions для UI состояния
  completeOnboarding: () => void
  checkOnboardingStatus: () => boolean
  enableGuestMode: () => void
  disableGuestMode: () => void
  setAuthModalOpen: (isOpen: boolean) => void
  setSelectedTab: (tab: string) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
}

// ============================================
// STORE
// ============================================

export const useUserClientStore = create<UserClientState>()(
  subscribeWithSelector((set, get) => ({
    // Начальное состояние
    hasCompletedOnboarding: isOnboardingCompleted(),
    isGuestModeEnabled: loadGuestModeEnabled(),
    isAuthModalOpen: false,
    selectedTab: 'profile',
    isLoading: false,
    error: null,

    // Actions
    completeOnboarding: () => {
      set({ hasCompletedOnboarding: true })
      saveOnboardingCompleted(true)
    },

    checkOnboardingStatus: () => {
      return get().hasCompletedOnboarding
    },

    enableGuestMode: () => {
      set({ isGuestModeEnabled: true })
      saveGuestModeEnabled(true)
    },

    disableGuestMode: () => {
      set({ isGuestModeEnabled: false })
      saveGuestModeEnabled(false)
    },

    setAuthModalOpen: (isOpen: boolean) => {
      set({ isAuthModalOpen: isOpen })
    },

    setSelectedTab: (tab: string) => {
      set({ selectedTab: tab })
    },

    setLoading: (loading: boolean) => {
      set({ isLoading: loading })
    },

    setError: (error: string | null) => {
      set({ error })
    },
  }))
)

/**
 * Хук для получения статуса онбординга
 */
export function useOnboardingStatus() {
  return useUserClientStore(state => state.hasCompletedOnboarding)
}

/**
 * Хук для получения состояния auth modal
 */
export function useAuthModalState() {
  return useUserClientStore(state => ({
    isOpen: state.isAuthModalOpen,
    setOpen: state.setAuthModalOpen,
  }))
}
