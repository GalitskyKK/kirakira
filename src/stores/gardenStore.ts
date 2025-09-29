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
import type {
  DatabaseGardenElement,
  StandardApiResponse,
  ProfileApiGetProfileResponse,
} from '@/types/api'
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
          `/api/profile?action=get_profile&telegramId=${currentUser.telegramId}`
        )

        if (!response.ok) {
          throw new Error(`Failed to fetch user data: ${response.status}`)
        }

        const result =
          (await response.json()) as StandardApiResponse<ProfileApiGetProfileResponse>

        console.log('🔍 Garden sync - User profile result:', result)

        // Проверяем наличие пользователя и его данных (приоритет БД над локальными данными)
        if (result.success && result.data?.user && result.data?.stats) {
          console.log('✅ Server has garden data - loading full history')

          // 🔄 ОБНОВЛЯЕМ STREAK В САДУ на основе данных с сервера (приоритет БД)
          const currentGarden = get().currentGarden
          const serverStreak = result.data.stats.currentStreak
          if (currentGarden && serverStreak !== undefined) {
            const updatedGarden = {
              ...currentGarden,
              streak: serverStreak || 0,
              lastVisited: new Date(),
            }
            set({ currentGarden: updatedGarden })
            saveGarden(updatedGarden)
            console.log(
              `🔄 Updated garden streak to: ${serverStreak} (from server)`
            )
          }

          // 🌱 Загружаем полную историю элементов сада с сервера
          const historyResponse = await fetch(
            `/api/garden?action=history&telegramId=${currentUser.telegramId}`
          )

          console.log(
            '🔍 Garden history response status:',
            historyResponse.status
          )

          if (historyResponse.ok) {
            const historyResult =
              (await historyResponse.json()) as StandardApiResponse<{
                gardenElements: DatabaseGardenElement[]
              }>
            console.log('🔍 Garden history result:', historyResult)

            if (
              historyResult.success &&
              historyResult.data?.gardenElements &&
              historyResult.data.gardenElements.length > 0
            ) {
              const serverElements = historyResult.data.gardenElements

              // Конвертируем серверные данные в формат приложения
              // 🔧 ИСПРАВЛЕНИЕ: используем UUID напрямую без префикса для совместимости с базой данных
              const convertedElements = serverElements.map(
                (serverElement: DatabaseGardenElement) => ({
                  id: serverElement.id || `temp_${Date.now()}`, // UUID без префикса
                  type: serverElement.element_type as any, // Temporary cast to fix build
                  position: {
                    x: serverElement.position_x,
                    y: serverElement.position_y,
                  },
                  unlockDate: new Date(serverElement.unlock_date),
                  moodInfluence: (serverElement.mood_influence || 'joy') as any, // Temporary cast
                  rarity: serverElement.rarity as any, // Temporary cast
                  name: `${serverElement.element_type}`, // Generate from type
                  description: `A ${serverElement.rarity} ${serverElement.element_type}`, // Generate description
                  emoji: '🌸', // Default emoji - should be mapped from type
                  color: '#green', // Default color - should be mapped from type
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

          // 🔄 ОБНОВЛЯЕМ STREAK В САДУ - если нет данных на сервере, streak = 0
          const currentGarden = get().currentGarden
          if (currentGarden && currentGarden.streak !== 0) {
            const updatedGarden = {
              ...currentGarden,
              streak: 0,
              lastVisited: new Date(),
            }
            set({ currentGarden: updatedGarden })
            saveGarden(updatedGarden)
            console.log(`🔄 Reset garden streak to 0 (no server data)`)
          }
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
              const response = await fetch('/api/garden?action=add-element', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  telegramId: currentUser.telegramId,
                  element: {
                    type: newElement.type,
                    position: newElement.position,
                    unlockDate: newElement.unlockDate.toISOString(),
                    moodInfluence: mood,
                    rarity: newElement.rarity,
                  },
                  telegramUserData: {
                    userId: currentUser.id,
                    firstName: currentUser.firstName,
                    lastName: currentUser.lastName,
                    username: currentUser.username,
                    languageCode: currentUser.preferences.language || 'ru',
                    photoUrl: currentUser.photoUrl,
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
              const response = await fetch(
                '/api/garden?action=update-position',
                {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    telegramId: currentUser.telegramId,
                    elementId,
                    position: newPosition,
                  }),
                }
              )

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
