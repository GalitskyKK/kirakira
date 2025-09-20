import { useCallback, useMemo } from 'react'
import { useGardenStore } from '@/stores'
import type { MoodType, Position2D, GardenElement } from '@/types'

/**
 * Hook for managing garden state and operations
 */
export function useGardenState() {
  const {
    currentGarden,
    isLoading,
    error,
    viewMode,
    selectedElement,
    loadGarden,
    createGarden,
    updateGarden,
    unlockTodaysElement,
    moveElement,
    selectElement,
    setViewMode,
    setError,
    canUnlockToday,
    getElementsCount,
    getLatestElement,
    clearGarden,
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
    const elementsByType = elements.reduce((acc, element) => {
      acc[element.type] = (acc[element.type] ?? 0) + 1
      return acc
    }, {} as Record<string, number>)

    // Group by rarity
    const elementsByRarity = elements.reduce((acc, element) => {
      acc[element.rarity] = (acc[element.rarity] ?? 0) + 1
      return acc
    }, {} as Record<string, number>)

    // Calculate average age in days
    const now = new Date()
    const totalAge = elements.reduce((sum, element) => {
      const age = Math.floor(
        (now.getTime() - element.unlockDate.getTime()) / (1000 * 60 * 60 * 24)
      )
      return sum + age
    }, 0)
    const averageAge = totalElements > 0 ? Math.round(totalAge / totalElements) : 0

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

  // Unlock today's element with error handling
  const unlockElement = useCallback(
    async (mood: MoodType): Promise<GardenElement | null> => {
      try {
        setError(null)
        const element = await unlockTodaysElement(mood)
        return element
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Failed to unlock element'
        setError(errorMessage)
        return null
      }
    },
    [unlockTodaysElement, setError]
  )

  // Move element with validation
  const moveElementSafely = useCallback(
    async (elementId: string, newPosition: Position2D): Promise<boolean> => {
      try {
        setError(null)

        // Check if position is valid
        if (
          newPosition.x < 0 ||
          newPosition.x >= 10 ||
          newPosition.y < 0 ||
          newPosition.y >= 10
        ) {
          setError('Position is out of bounds')
          return false
        }

        // Check if position is occupied by another element
        if (
          currentGarden?.elements.some(
            el =>
              el.id !== elementId &&
              el.position.x === newPosition.x &&
              el.position.y === newPosition.y
          )
        ) {
          setError('Position is already occupied')
          return false
        }

        await moveElement(elementId, newPosition)
        return true
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Failed to move element'
        setError(errorMessage)
        return false
      }
    },
    [moveElement, setError, currentGarden]
  )

  // Initialize garden for new user
  const initializeGarden = useCallback(
    async (userId: string): Promise<boolean> => {
      try {
        setError(null)
        await createGarden(userId)
        return true
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Failed to create garden'
        setError(errorMessage)
        return false
      }
    },
    [createGarden, setError]
  )

  return {
    // State
    garden: currentGarden,
    isLoading,
    error,
    viewMode,
    selectedElement,

    // Statistics
    gardenStats,

    // Actions
    loadGarden,
    initializeGarden,
    updateGarden,
    unlockElement,
    moveElementSafely,
    selectElement,
    setViewMode,
    setError,
    clearGarden,

    // Utility functions
    canUnlockToday,
    getElementsCount,
    getLatestElement,
    isPositionOccupied,
    getAvailablePositions,
  }
}
