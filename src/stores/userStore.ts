/**
 * 👤 User Client State Store (v2 - Refactored)
 * Хранит ТОЛЬКО клиентское UI состояние пользователя
 * Серверное состояние (профиль, статистика) управляется через React Query
 */

import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import { saveOnboardingCompleted, isOnboardingCompleted } from '@/utils/storage'

// ============================================
// ТИПЫ СОСТОЯНИЯ
// ============================================

interface UserClientState {
  // Клиентское состояние
  readonly hasCompletedOnboarding: boolean
  readonly isAuthModalOpen: boolean
  readonly selectedTab: string
  readonly isLoading: boolean
  readonly error: string | null

  // Actions для UI состояния
  completeOnboarding: () => void
  checkOnboardingStatus: () => boolean
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
    isAuthModalOpen: false,
    selectedTab: 'profile',
    isLoading: false,
    error: null,

    // Actions
    completeOnboarding: () => {
      console.log('✅ User: Completing onboarding')
      set({ hasCompletedOnboarding: true })
      saveOnboardingCompleted(true)
    },

    checkOnboardingStatus: () => {
      return get().hasCompletedOnboarding
    },

    setAuthModalOpen: (isOpen: boolean) => {
      console.log('🔐 User: Setting auth modal:', isOpen)
      set({ isAuthModalOpen: isOpen })
    },

    setSelectedTab: (tab: string) => {
      console.log('📑 User: Setting selected tab:', tab)
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
