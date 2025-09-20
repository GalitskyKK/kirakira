import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import type {
  Garden,
  GardenElement,
  GardenState,
  Position2D,
  MoodType,
} from '@/types'
import { ViewMode } from '@/types'
import {
  generateDailyElement,
  canUnlockTodaysElement,
} from '@/utils/elementGeneration'
import { saveGarden, loadGarden } from '@/utils/storage'

interface GardenActions {
  // Garden management
  loadGarden: () => Promise<void>
  createGarden: (userId: string) => Promise<void>
  updateGarden: (updates: Partial<Garden>) => Promise<void>

  // Element management
  unlockTodaysElement: (mood: MoodType) => Promise<GardenElement | null>
  moveElement: (elementId: string, newPosition: Position2D) => Promise<void>
  selectElement: (element: GardenElement | null) => void

  // View management
  setViewMode: (mode: ViewMode) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void

  // Utility actions
  canUnlockToday: () => boolean
  getElementsCount: () => number
  getLatestElement: () => GardenElement | null
  clearGarden: () => void
}

type GardenStore = GardenState & GardenActions

export const useGardenStore = create<GardenStore>()(
  subscribeWithSelector((set, get) => ({
    // Initial state
    currentGarden: null,
    isLoading: false,
    error: null,
    viewMode: ViewMode.OVERVIEW,
    selectedElement: null,

    // Actions
    loadGarden: async () => {
      set({ isLoading: true, error: null })

      try {
        const storedGarden = loadGarden()

        if (storedGarden) {
          set({
            currentGarden: storedGarden,
            isLoading: false,
          })
        } else {
          set({
            currentGarden: null,
            isLoading: false,
          })
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Failed to load garden'
        set({
          error: errorMessage,
          isLoading: false,
        })
      }
    },

    createGarden: async (userId: string) => {
      set({ isLoading: true, error: null })

      try {
        const newGarden: Garden = {
          id: `garden_${userId}_${Date.now()}`,
          userId,
          elements: [],
          createdAt: new Date(),
          lastVisited: new Date(),
          streak: 0,
          season: 'spring', // Will be updated based on current date
        }

        const success = saveGarden(newGarden)

        if (success) {
          set({
            currentGarden: newGarden,
            isLoading: false,
          })
        } else {
          throw new Error('Failed to save garden')
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Failed to create garden'
        set({
          error: errorMessage,
          isLoading: false,
        })
      }
    },

    updateGarden: async (updates: Partial<Garden>) => {
      const { currentGarden } = get()

      if (!currentGarden) {
        set({ error: 'No garden to update' })
        return
      }

      set({ isLoading: true, error: null })

      try {
        const updatedGarden: Garden = {
          ...currentGarden,
          ...updates,
          lastVisited: new Date(),
        }

        const success = saveGarden(updatedGarden)

        if (success) {
          set({
            currentGarden: updatedGarden,
            isLoading: false,
          })
        } else {
          throw new Error('Failed to save garden updates')
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Failed to update garden'
        set({
          error: errorMessage,
          isLoading: false,
        })
      }
    },

    unlockTodaysElement: async (mood: MoodType) => {
      const { currentGarden } = get()

      if (!currentGarden) {
        set({ error: 'No garden available' })
        return null
      }

      // Check if user can unlock today's element
      const lastElement = get().getLatestElement()
      const canUnlock = canUnlockTodaysElement(lastElement?.unlockDate ?? null)

      if (!canUnlock) {
        set({ error: "Already unlocked today's element" })
        return null
      }

      set({ isLoading: true, error: null })

      try {
        // Get existing positions to avoid overlap
        const existingPositions = currentGarden.elements.map(el => el.position)

        // Generate new element
        const newElement = generateDailyElement(
          currentGarden.userId,
          new Date(currentGarden.createdAt), // Registration date approximation
          new Date(),
          mood,
          existingPositions
        )

        // Update garden with new element
        const updatedGarden: Garden = {
          ...currentGarden,
          elements: [...currentGarden.elements, newElement],
          lastVisited: new Date(),
        }

        const success = saveGarden(updatedGarden)

        if (success) {
          set({
            currentGarden: updatedGarden,
            isLoading: false,
            selectedElement: newElement, // Auto-select new element
          })
          return newElement
        } else {
          throw new Error('Failed to save new element')
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Failed to unlock element'
        set({
          error: errorMessage,
          isLoading: false,
        })
        return null
      }
    },

    moveElement: async (elementId: string, newPosition: Position2D) => {
      const { currentGarden } = get()

      if (!currentGarden) {
        set({ error: 'No garden available' })
        return
      }

      set({ isLoading: true, error: null })

      try {
        // Check if position is already occupied
        const isOccupied = currentGarden.elements.some(
          el =>
            el.id !== elementId &&
            el.position.x === newPosition.x &&
            el.position.y === newPosition.y
        )

        if (isOccupied) {
          throw new Error('Position is already occupied')
        }

        // Update element position
        const updatedElements = currentGarden.elements.map(element =>
          element.id === elementId
            ? { ...element, position: newPosition }
            : element
        )

        const updatedGarden: Garden = {
          ...currentGarden,
          elements: updatedElements,
          lastVisited: new Date(),
        }

        const success = saveGarden(updatedGarden)

        if (success) {
          set({
            currentGarden: updatedGarden,
            isLoading: false,
          })
        } else {
          throw new Error('Failed to save element position')
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Failed to move element'
        set({
          error: errorMessage,
          isLoading: false,
        })
      }
    },

    selectElement: (element: GardenElement | null) => {
      set({ selectedElement: element })
    },

    setViewMode: (mode: ViewMode) => {
      set({ viewMode: mode })
    },

    setLoading: (loading: boolean) => {
      set({ isLoading: loading })
    },

    setError: (error: string | null) => {
      set({ error })
    },

    // Utility functions
    canUnlockToday: () => {
      const latestElement = get().getLatestElement()
      return canUnlockTodaysElement(latestElement?.unlockDate ?? null)
    },

    getElementsCount: () => {
      const { currentGarden } = get()
      return currentGarden?.elements.length ?? 0
    },

    getLatestElement: () => {
      const { currentGarden } = get()

      if (!currentGarden || currentGarden.elements.length === 0) {
        return null
      }

      // Find element with latest unlock date
      return currentGarden.elements.reduce((latest, current) =>
        current.unlockDate > latest.unlockDate ? current : latest
      )
    },

    clearGarden: () => {
      set({
        currentGarden: null,
        selectedElement: null,
        viewMode: ViewMode.OVERVIEW,
        error: null,
        isLoading: false,
      })
    },
  }))
)

// Subscribe to garden changes and auto-save
useGardenStore.subscribe(
  state => state.currentGarden,
  garden => {
    if (garden) {
      saveGarden(garden)
    }
  }
)
