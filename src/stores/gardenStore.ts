/**
 * 🌱 Garden Client State Store (v2 - Refactored)
 * Хранит ТОЛЬКО клиентское UI состояние сада
 * Серверное состояние (элементы, синхронизация) управляется через React Query
 */

import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import type { GardenElement } from '@/types'
import { ViewMode, GardenDisplayMode } from '@/types'

// ============================================
// ТИПЫ СОСТОЯНИЯ
// ============================================

interface GardenClientState {
  // UI состояние
  readonly viewMode: ViewMode
  readonly displayMode: GardenDisplayMode
  readonly selectedElement: GardenElement | null
  readonly currentRoomIndex: number
  readonly lastChangedRoomIndex: number | null
  readonly highlightedElementId: string | null
  readonly highlightedElementUntilMs: number | null
  readonly isLoading: boolean
  readonly error: string | null

  // Actions для UI состояния
  setViewMode: (mode: ViewMode) => void
  setDisplayMode: (mode: GardenDisplayMode) => void
  selectElement: (element: GardenElement | null) => void
  setCurrentRoomIndex: (roomIndex: number) => void
  setLastChangedRoomIndex: (roomIndex: number | null) => void
  highlightElement: (elementId: string, durationMs: number) => void
  clearHighlight: () => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void

  // Утилиты
  clearSelection: () => void
}

// ============================================
// STORE
// ============================================

// Загрузка displayMode из localStorage
const loadDisplayModeFromStorage = (): GardenDisplayMode => {
  try {
    const stored = localStorage.getItem('garden_display_mode')
    if (stored) {
      const mode = stored as GardenDisplayMode
      if (Object.values(GardenDisplayMode).includes(mode)) {
        return mode
      }
    }
  } catch {
    // Игнорируем ошибки
  }
  return GardenDisplayMode.ISOMETRIC_ROOM
}

// Сохранение displayMode в localStorage
const saveDisplayModeToStorage = (mode: GardenDisplayMode): void => {
  try {
    localStorage.setItem('garden_display_mode', mode)
  } catch {
    // Игнорируем ошибки
  }
}

const loadLastChangedRoomIndexFromStorage = (): number | null => {
  try {
    const stored = localStorage.getItem('garden_last_changed_room_index')
    if (!stored) {
      return null
    }
    const parsed = Number(stored)
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : null
  } catch {
    return null
  }
}

const saveLastChangedRoomIndexToStorage = (roomIndex: number | null): void => {
  try {
    if (roomIndex === null) {
      localStorage.removeItem('garden_last_changed_room_index')
      return
    }
    localStorage.setItem('garden_last_changed_room_index', String(roomIndex))
  } catch {
    // Игнорируем ошибки
  }
}

export const useGardenClientStore = create<GardenClientState>()(
  subscribeWithSelector(set => ({
    // Начальное состояние
    viewMode: ViewMode.OVERVIEW,
    displayMode: loadDisplayModeFromStorage(),
    selectedElement: null,
    currentRoomIndex: 0,
    lastChangedRoomIndex: loadLastChangedRoomIndexFromStorage(),
    highlightedElementId: null,
    highlightedElementUntilMs: null,
    isLoading: false,
    error: null,

    // Actions
    setViewMode: (mode: ViewMode) => {
      set({ viewMode: mode })
    },

    setDisplayMode: (mode: GardenDisplayMode) => {
      saveDisplayModeToStorage(mode)
      set({ displayMode: mode })
    },

    selectElement: (element: GardenElement | null) => {
      set({ selectedElement: element })
    },

    setCurrentRoomIndex: (roomIndex: number) => {
      set({ currentRoomIndex: roomIndex })
    },

    setLastChangedRoomIndex: (roomIndex: number | null) => {
      saveLastChangedRoomIndexToStorage(roomIndex)
      set({ lastChangedRoomIndex: roomIndex })
    },

    highlightElement: (elementId: string, durationMs: number) => {
      const safeDurationMs =
        Number.isFinite(durationMs) && durationMs > 0 ? durationMs : 0
      const untilMs = Date.now() + safeDurationMs
      set({
        highlightedElementId: elementId,
        highlightedElementUntilMs: safeDurationMs > 0 ? untilMs : null,
      })
    },

    clearHighlight: () => {
      set({ highlightedElementId: null, highlightedElementUntilMs: null })
    },

    setLoading: (loading: boolean) => {
      set({ isLoading: loading })
    },

    setError: (error: string | null) => {
      set({ error })
    },

    clearSelection: () => {
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
