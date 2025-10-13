/**
 * 🌱 Garden Client State Store (v2 - Refactored)
 * Хранит ТОЛЬКО клиентское UI состояние сада
 * Серверное состояние (элементы, синхронизация) управляется через React Query
 */

import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import type { GardenElement } from '@/types'
import { ViewMode } from '@/types'

// ============================================
// ТИПЫ СОСТОЯНИЯ
// ============================================

interface GardenClientState {
  // UI состояние
  readonly viewMode: ViewMode
  readonly selectedElement: GardenElement | null
  readonly currentRoomIndex: number

  // Actions для UI состояния
  setViewMode: (mode: ViewMode) => void
  selectElement: (element: GardenElement | null) => void
  setCurrentRoomIndex: (roomIndex: number) => void

  // Утилиты
  clearSelection: () => void
}

// ============================================
// STORE
// ============================================

export const useGardenClientStore = create<GardenClientState>()(
  subscribeWithSelector(set => ({
    // Начальное состояние
    viewMode: ViewMode.OVERVIEW,
    selectedElement: null,
    currentRoomIndex: 0,

    // Actions
    setViewMode: (mode: ViewMode) => {
      console.log('🎨 Garden: Setting view mode:', mode)
      set({ viewMode: mode })
    },

    selectElement: (element: GardenElement | null) => {
      console.log('👆 Garden: Selecting element:', element?.id ?? 'none')
      set({ selectedElement: element })
    },

    setCurrentRoomIndex: (roomIndex: number) => {
      console.log('🏠 Garden: Switching to room:', roomIndex)
      set({ currentRoomIndex: roomIndex })
    },

    clearSelection: () => {
      console.log('🧹 Garden: Clearing selection')
      set({ selectedElement: null })
    },
  }))
)

/**
 * Хук для получения только view mode
 */
export function useGardenViewMode() {
  return useGardenClientStore(state => state.viewMode)
}

/**
 * Хук для получения только selected element
 */
export function useSelectedElement() {
  return useGardenClientStore(state => state.selectedElement)
}

/**
 * Хук для получения только current room index
 */
export function useCurrentRoomIndex() {
  return useGardenClientStore(state => state.currentRoomIndex)
}
