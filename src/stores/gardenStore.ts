import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import type {
  Garden,
  GardenElement,
  GardenState,
  Position2D,
  MoodType,
} from '@/types'
import { ViewMode, SeasonalVariant } from '@/types'
import { useUserStore } from './userStore'
import {
  generateDailyElement,
  canUnlockTodaysElement,
} from '@/utils/elementGeneration'
import { saveGarden, loadGarden } from '@/utils/storage'

interface GardenActions {
  // Garden management
  loadGarden: () => void
  createGarden: (userId: string) => void
  updateGarden: (updates: Partial<Garden>) => void

  // Element management
  unlockTodaysElement: (mood: MoodType) => Promise<GardenElement | null>
  syncGarden: (forceSync?: boolean) => Promise<void>
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
    lastSyncTime: 0,

    // Actions
    loadGarden: () => {
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

        // 🔄 Автоматически синхронизируем с сервером
        void get().syncGarden()
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Failed to load garden'
        set({
          error: errorMessage,
          isLoading: false,
        })
      }
    },

    // 🔄 СИНХРОНИЗАЦИЯ С SUPABASE
    syncGarden: async (forceSync = false) => {
      try {
        const userStore = useUserStore.getState()
        const currentUser = userStore.currentUser

        if (!currentUser?.telegramId) {
          console.log('📝 No Telegram user - skipping garden sync')
          return
        }

        // 🚫 ОГРАНИЧЕНИЕ: не синхронизируем чаще раз в 10 секунд
        const state = get()
        const now = Date.now()
        const lastSync = state.lastSyncTime

        if (!forceSync && now - lastSync < 10000) {
          // 10 секунд
          console.log('⏳ Skipping garden sync - too soon since last sync')
          return
        }

        console.log(
          `🔄 Syncing garden for user ${currentUser.telegramId}${forceSync ? ' (forced)' : ''}`
        )

        // Обновляем время последней синхронизации
        set({ lastSyncTime: now })

        // Получаем актуальные данные пользователя с сервера
        const response = await fetch(
          `/api/user/stats?telegramId=${currentUser.telegramId}`
        )

        if (!response.ok) {
          throw new Error(`Failed to fetch user data: ${response.status}`)
        }

        const result = await response.json()

        if (result.success && result.data.hasData) {
          console.log('✅ Server has garden data - loading full history')

          // 🌱 Загружаем полную историю элементов сада с сервера
          const historyResponse = await fetch(
            `/api/garden/history?telegramId=${currentUser.telegramId}`
          )

          if (historyResponse.ok) {
            const historyResult = await historyResponse.json()

            if (
              historyResult.success &&
              historyResult.data.gardenElements.length > 0
            ) {
              const serverElements = historyResult.data.gardenElements

              // Конвертируем серверные данные в формат приложения
              const convertedElements = serverElements.map(
                (serverElement: any) => ({
                  id: `element_${serverElement.id || Date.now()}`,
                  type: serverElement.element_type,
                  position: {
                    x: serverElement.position_x,
                    y: serverElement.position_y,
                  },
                  unlockDate: new Date(serverElement.unlock_date),
                  moodInfluence: serverElement.mood_influence || 'joy', // Use correct field name with fallback
                  rarity: serverElement.rarity,
                  createdAt: new Date(serverElement.created_at),
                })
              )

              // Обновляем сад если есть
              const { currentGarden } = get()
              if (currentGarden) {
                const updatedGarden = {
                  ...currentGarden,
                  elements: convertedElements,
                  lastVisited: new Date(),
                }

                set({ currentGarden: updatedGarden })
                saveGarden(updatedGarden)

                console.log(
                  `✅ Synced ${convertedElements.length} garden elements from server`
                )
              }
            }
          }
        } else {
          console.log('📝 No server garden data - local state is primary')
        }
      } catch (error) {
        console.warn('⚠️ Garden sync failed:', error)
      }
    },

    createGarden: (userId: string) => {
      set({ isLoading: true, error: null })

      try {
        const newGarden: Garden = {
          id: `garden_${userId}_${Date.now()}`,
          userId,
          elements: [],
          createdAt: new Date(),
          lastVisited: new Date(),
          streak: 0,
          season: SeasonalVariant.SPRING, // Will be updated based on current date
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

    updateGarden: (updates: Partial<Garden>) => {
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

        const localSuccess = saveGarden(updatedGarden)

        if (localSuccess) {
          // 📡 ОТПРАВЛЯЕМ ЭЛЕМЕНТ НА СЕРВЕР для синхронизации между устройствами
          try {
            const userStore = useUserStore.getState()
            const currentUser = userStore.currentUser

            if (currentUser?.telegramId) {
              const response = await fetch('/api/garden/add-element', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  telegramId: currentUser.telegramId,
                  element: {
                    type: newElement.type,
                    position: newElement.position,
                    unlockDate: newElement.unlockDate.toISOString(),
                    mood: mood,
                    rarity: newElement.rarity,
                  },
                }),
              })

              if (!response.ok) {
                console.warn(
                  '⚠️ Failed to sync garden element to server:',
                  response.status
                )
              } else {
                console.log('✅ Garden element synced to server successfully')
              }
            }
          } catch (serverError) {
            console.warn(
              '⚠️ Server sync failed, but local save succeeded:',
              serverError
            )
          }

          set({
            currentGarden: updatedGarden,
            isLoading: false,
            selectedElement: newElement, // Auto-select new element
          })
          return newElement
        } else {
          throw new Error('Failed to save new element locally')
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

          // 📡 ОТПРАВЛЯЕМ ОБНОВЛЕНИЕ ПОЗИЦИИ НА СЕРВЕР для синхронизации между устройствами
          const userStore = useUserStore.getState()
          const currentUser = userStore.currentUser

          if (currentUser?.telegramId) {
            try {
              const response = await fetch('/api/garden/update-position', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  telegramUserId: currentUser.telegramId,
                  elementId,
                  position: newPosition,
                }),
              })

              if (!response.ok) {
                console.warn(
                  '⚠️ Failed to sync element position to server:',
                  response.status
                )
              } else {
                console.log('✅ Element position synced to server successfully')
              }
            } catch (serverError) {
              console.warn(
                '⚠️ Server position sync failed, but local save succeeded:',
                serverError
              )
            }
          }
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
