/**
 * Garden Zustand Store - ТОЛЬКО UI STATE
 *
 * После рефакторинга этот стор управляет ТОЛЬКО клиентским состоянием:
 * - Режим просмотра (viewMode)
 * - Выбранный элемент (selectedElement)
 * - Локальный кеш сада (currentGarden)
 *
 * Вся серверная логика вынесена в React Query хуки:
 * - useGardenHistory() - получение истории элементов
 * - useAddGardenElement() - добавление элемента
 * - useUpdateElementPosition() - обновление позиции
 */

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
import {
  generateDailyElement,
  canUnlockTodaysElement,
} from '@/utils/elementGeneration'
import { saveGarden, loadGarden } from '@/utils/storage'

// ============================================
// STORE INTERFACE - ТОЛЬКО UI STATE
// ============================================

interface GardenActions {
  // Local garden management (UI state)
  loadGarden: () => void
  createGarden: (userId: string) => void
  setCurrentGarden: (garden: Garden | null) => void
  updateGardenLocal: (updates: Partial<Garden>) => void

  // Local element generation (без API запросов)
  generateTodaysElement: (
    mood: MoodType,
    userId: string,
    existingPositions: readonly Position2D[]
  ) => GardenElement

  // Element selection (UI state)
  selectElement: (element: GardenElement | null) => void

  // View management (UI state)
  setViewMode: (mode: ViewMode) => void

  // Utility functions
  canUnlockToday: () => boolean
  getElementsCount: () => number
  getLatestElement: () => GardenElement | null
  clearGarden: () => void
}

type GardenStore = GardenState & GardenActions

// ============================================
// ZUSTAND STORE - ТОЛЬКО КЛИЕНТСКОЕ СОСТОЯНИЕ
// ============================================

export const useGardenStore = create<GardenStore>()(
  subscribeWithSelector((set, get) => ({
    // ============================================
    // INITIAL STATE
    // ============================================
    currentGarden: null,
    isLoading: false, // Устаревшее - теперь используется в React Query
    error: null, // Устаревшее - теперь используется в React Query
    viewMode: ViewMode.OVERVIEW,
    selectedElement: null,
    lastSyncTime: 0, // Устаревшее - теперь управляется React Query

    // ============================================
    // ACTIONS - ТОЛЬКО UI OPERATIONS
    // ============================================

    /**
     * Загружает сад из localStorage (UI state)
     * Серверная синхронизация выполняется через React Query хуки
     */
    loadGarden: () => {
      try {
        const storedGarden = loadGarden()

        if (storedGarden) {
          set({
            currentGarden: storedGarden,
          })
        } else {
          set({
            currentGarden: null,
          })
        }
      } catch (error) {
        console.error('Failed to load garden from localStorage:', error)
        set({
          currentGarden: null,
        })
      }
    },

    /**
     * Создает новый сад локально (UI state)
     */
    createGarden: (userId: string) => {
      try {
        const newGarden: Garden = {
          id: `garden_${userId}_${Date.now()}`,
          userId,
          elements: [],
          createdAt: new Date(),
          lastVisited: new Date(),
          streak: 0,
          season: SeasonalVariant.SPRING,
        }

        const success = saveGarden(newGarden)

        if (success) {
          set({
            currentGarden: newGarden,
          })
        } else {
          throw new Error('Failed to save garden to localStorage')
        }
      } catch (error) {
        console.error('Failed to create garden:', error)
      }
    },

    /**
     * Устанавливает текущий сад (обычно после загрузки с сервера)
     */
    setCurrentGarden: (garden: Garden | null) => {
      set({ currentGarden: garden })
      if (garden) {
        saveGarden(garden)
      }
    },

    /**
     * Обновляет сад локально (UI state)
     */
    updateGardenLocal: (updates: Partial<Garden>) => {
      const { currentGarden } = get()

      if (!currentGarden) {
        console.warn('No garden to update')
        return
      }

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
          })
        } else {
          throw new Error('Failed to save garden updates to localStorage')
        }
      } catch (error) {
        console.error('Failed to update garden:', error)
      }
    },

    /**
     * Генерирует элемент для сегодняшнего дня
     * (детерминированная генерация на основе даты и настроения)
     *
     * ВАЖНО: Это только генерация на клиенте.
     * Сохранение на сервер происходит через useAddGardenElement() хук.
     */
    generateTodaysElement: (
      mood: MoodType,
      userId: string,
      existingPositions: readonly Position2D[]
    ) => {
      const { currentGarden } = get()

      if (!currentGarden) {
        throw new Error('No garden available')
      }

      // Generate new element deterministically
      const newElement = generateDailyElement(
        userId,
        new Date(currentGarden.createdAt),
        new Date(),
        mood,
        existingPositions
      )

      console.log('🌱 Generated element (client-side):', {
        id: newElement.id,
        position: `(${newElement.position.x},${newElement.position.y})`,
        name: newElement.name,
        type: newElement.type,
      })

      return newElement
    },

    /**
     * Выбрать элемент (UI state)
     */
    selectElement: (element: GardenElement | null) => {
      set({ selectedElement: element })
    },

    /**
     * Изменить режим просмотра (UI state)
     */
    setViewMode: (mode: ViewMode) => {
      set({ viewMode: mode })
    },

    // ============================================
    // UTILITY FUNCTIONS
    // ============================================

    /**
     * Проверяет, можно ли разблокировать элемент сегодня
     */
    canUnlockToday: () => {
      const latestElement = get().getLatestElement()
      return canUnlockTodaysElement(latestElement?.unlockDate ?? null)
    },

    /**
     * Получить количество элементов
     */
    getElementsCount: () => {
      const { currentGarden } = get()
      return currentGarden?.elements.length ?? 0
    },

    /**
     * Получить последний добавленный элемент
     */
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

    /**
     * Очистить сад
     */
    clearGarden: () => {
      set({
        currentGarden: null,
        selectedElement: null,
        viewMode: ViewMode.OVERVIEW,
      })
    },
  }))
)

// ============================================
// AUTO-SAVE SUBSCRIPTION
// ============================================

useGardenStore.subscribe(
  state => state.currentGarden,
  garden => {
    if (garden) {
      saveGarden(garden)
    }
  }
)
