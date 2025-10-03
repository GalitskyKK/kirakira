/**
 * Hook for managing garden state and operations
 *
 * ПОСЛЕ РЕФАКТОРИНГА:
 * - UI state управляется через Zustand (gardenStore)
 * - Серверное состояние через React Query хуки (useGardenQueries)
 */

import { useCallback, useMemo } from 'react'
import { useGardenStore } from '@/stores'
import type { Position2D, MoodType, GardenElement } from '@/types'

/**
 * Hook for managing garden UI state and local operations
 *
 * Для серверных операций используйте:
 * - useGardenHistory() - загрузка элементов с сервера
 * - useAddGardenElement() - добавление элемента
 * - useUpdateElementPosition() - обновление позиции
 */
export function useGardenState() {
  const {
    currentGarden,
    isLoading, // Deprecated - используйте isLoading из React Query хуков
    error, // Deprecated - используйте error из React Query хуков
    viewMode,
    selectedElement,
    loadGarden,
    createGarden,
    updateGardenLocal,
    selectElement,
    setViewMode,
    canUnlockToday,
    getElementsCount,
    getLatestElement,
    clearGarden,
    generateTodaysElement,
  } = useGardenStore()

  // Memoized garden statistics
  const gardenStats = useMemo(() => {
    if (!currentGarden) {
      return {
        totalElements: 0,
        elementsByType: {},
        elementsByRarity: {},
        averageAge: 0,
        newestElement: null,
        oldestElement: null,
      }
    }

    const elements = currentGarden.elements
    const totalElements = elements.length

    // Group by type
    const elementsByType = elements.reduce(
      (acc, element) => {
        acc[element.type] = (acc[element.type] ?? 0) + 1
        return acc
      },
      {} as Record<string, number>
    )

    // Group by rarity
    const elementsByRarity = elements.reduce(
      (acc, element) => {
        acc[element.rarity] = (acc[element.rarity] ?? 0) + 1
        return acc
      },
      {} as Record<string, number>
    )

    // Calculate average age in days
    const now = new Date()
    const totalAge = elements.reduce((sum, element) => {
      const age = Math.floor(
        (now.getTime() - element.unlockDate.getTime()) / (1000 * 60 * 60 * 24)
      )
      return sum + age
    }, 0)
    const averageAge =
      totalElements > 0 ? Math.round(totalAge / totalElements) : 0

    // Find newest and oldest elements
    const sortedByDate = [...elements].sort(
      (a, b) => b.unlockDate.getTime() - a.unlockDate.getTime()
    )
    const newestElement = sortedByDate[0] ?? null
    const oldestElement = sortedByDate[sortedByDate.length - 1] ?? null

    return {
      totalElements,
      elementsByType,
      elementsByRarity,
      averageAge,
      newestElement,
      oldestElement,
    }
  }, [currentGarden])

  // Check if a position is occupied
  const isPositionOccupied = useCallback(
    (position: Position2D): boolean => {
      if (!currentGarden) return false

      return currentGarden.elements.some(
        element =>
          element.position.x === position.x && element.position.y === position.y
      )
    },
    [currentGarden]
  )

  // Get available positions
  const getAvailablePositions = useCallback((): Position2D[] => {
    const availablePositions: Position2D[] = []

    for (let x = 0; x < 10; x++) {
      for (let y = 0; y < 10; y++) {
        const position = { x, y }
        if (!isPositionOccupied(position)) {
          availablePositions.push(position)
        }
      }
    }

    return availablePositions
  }, [isPositionOccupied])

  // Initialize garden for new user
  const initializeGarden = useCallback(
    async (userId: string): Promise<boolean> => {
      try {
        await createGarden(userId)
        return true
      } catch (error) {
        console.error('Failed to create garden:', error)
        return false
      }
    },
    [createGarden]
  )

  // Deprecated: Unlock element (use useAddGardenElement from React Query)
  const unlockElement = useCallback(
    async (_mood: MoodType): Promise<GardenElement | null> => {
      console.warn(
        'unlockElement is deprecated. Use useAddGardenElement() from React Query'
      )
      return null
    },
    []
  )

  // Deprecated: Move element (use useUpdateElementPosition from React Query)
  const moveElementSafely = useCallback(
    async (_elementId: string, _newPosition: Position2D): Promise<boolean> => {
      console.warn(
        'moveElementSafely is deprecated. Use useUpdateElementPosition() from React Query'
      )
      return false
    },
    []
  )

  return {
    // State
    garden: currentGarden,
    isLoading, // Deprecated - используйте isLoading из useGardenHistory()
    error, // Deprecated - используйте error из useGardenHistory()
    viewMode,
    selectedElement,

    // Statistics
    gardenStats,

    // Actions
    loadGarden,
    initializeGarden,
    updateGarden: updateGardenLocal,
    selectElement,
    setViewMode,
    clearGarden,

    // Utility functions
    canUnlockToday,
    getElementsCount,
    getLatestElement,
    isPositionOccupied,
    getAvailablePositions,
    generateTodaysElement,

    // Deprecated - for backward compatibility
    // Components should migrate to React Query hooks
    unlockElement,
    moveElementSafely,
  }
}
