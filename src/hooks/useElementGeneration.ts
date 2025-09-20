import { useCallback, useMemo } from 'react'
import { useUserStore, useGardenStore, useMoodStore } from '@/stores'
import { generateDailyElement, canUnlockTodaysElement, calculateStreak } from '@/utils/elementGeneration'
import { getDaysSinceRegistration } from '@/utils/dateHelpers'
import type { GardenElement, MoodType, Position2D } from '@/types'

/**
 * Hook for element generation logic and preview
 */
export function useElementGeneration() {
  const { currentUser } = useUserStore()
  const { currentGarden, getLatestElement } = useGardenStore()
  const { todaysMood } = useMoodStore()

  // Check if user can unlock today's element
  const canUnlock = useMemo(() => {
    const latestElement = getLatestElement()
    return canUnlockTodaysElement(latestElement?.unlockDate ?? null)
  }, [getLatestElement])

  // Get days since registration
  const daysSinceRegistration = useMemo(() => {
    if (!currentUser) return 0
    return getDaysSinceRegistration(currentUser.registrationDate)
  }, [currentUser])

  // Calculate current streak
  const streakInfo = useMemo(() => {
    if (!currentGarden) {
      return { current: 0, longest: 0, lastUnlock: null }
    }

    const unlockDates = currentGarden.elements.map(el => el.unlockDate)
    return calculateStreak(unlockDates)
  }, [currentGarden])

  // Preview what element would be generated for a given mood
  const previewElement = useCallback(
    (mood: MoodType): GardenElement | null => {
      if (!currentUser || !currentGarden) return null

      try {
        const existingPositions = currentGarden.elements.map(el => el.position)
        
        const element = generateDailyElement(
          currentUser.id,
          currentUser.registrationDate,
          new Date(),
          mood,
          existingPositions
        )

        return element
      } catch (error) {
        console.error('Failed to preview element:', error)
        return null
      }
    },
    [currentUser, currentGarden]
  )

  // Get element for a specific date (for historical viewing)
  const getElementForDate = useCallback(
    (date: Date, mood: MoodType): GardenElement | null => {
      if (!currentUser) return null

      try {
        // Use empty positions array for historical elements
        const element = generateDailyElement(
          currentUser.id,
          currentUser.registrationDate,
          date,
          mood,
          []
        )

        return element
      } catch (error) {
        console.error('Failed to generate historical element:', error)
        return null
      }
    },
    [currentUser]
  )

  // Get next available position in garden
  const getNextAvailablePosition = useCallback((): Position2D | null => {
    if (!currentGarden) return { x: 0, y: 0 }

    const occupiedPositions = new Set(
      currentGarden.elements.map(el => `${el.position.x},${el.position.y}`)
    )

    // Find first available position (spiral outward from center)
    const center = { x: 4, y: 4 }
    
    // Check center first
    if (!occupiedPositions.has(`${center.x},${center.y}`)) {
      return center
    }

    // Spiral outward
    for (let radius = 1; radius < 5; radius++) {
      for (let x = Math.max(0, center.x - radius); x <= Math.min(9, center.x + radius); x++) {
        for (let y = Math.max(0, center.y - radius); y <= Math.min(9, center.y + radius); y++) {
          // Only check positions on the edge of current radius
          if (
            Math.abs(x - center.x) === radius || 
            Math.abs(y - center.y) === radius
          ) {
            if (!occupiedPositions.has(`${x},${y}`)) {
              return { x, y }
            }
          }
        }
      }
    }

    // If spiral fails, try linear search
    for (let y = 0; y < 10; y++) {
      for (let x = 0; x < 10; x++) {
        if (!occupiedPositions.has(`${x},${y}`)) {
          return { x, y }
        }
      }
    }

    return null // Garden is full
  }, [currentGarden])

  // Check if garden has space for new elements
  const hasSpaceForNewElement = useMemo(() => {
    return getNextAvailablePosition() !== null
  }, [getNextAvailablePosition])

  // Get rarity distribution for current user
  const getRarityProbabilities = useCallback(
    (mood: MoodType): Record<string, number> => {
      if (!currentUser) {
        return {
          common: 50,
          uncommon: 30,
          rare: 15,
          epic: 4,
          legendary: 1,
        }
      }

      // Base probabilities
      const base = {
        common: 50,
        uncommon: 30,
        rare: 15,
        epic: 4,
        legendary: 1,
      }

      // Apply streak bonus (small increase in rare element chance)
      const streakBonus = Math.min(streakInfo.current * 0.5, 10) // Max 10% bonus
      
      // Apply mood bonus
      const moodBonus = todaysMood ? 2 : 0 // 2% bonus if mood is tracked
      
      return {
        common: Math.max(0, base.common - streakBonus - moodBonus),
        uncommon: base.uncommon,
        rare: base.rare + streakBonus * 0.5,
        epic: base.epic + streakBonus * 0.3 + moodBonus * 0.5,
        legendary: base.legendary + streakBonus * 0.2 + moodBonus * 0.5,
      }
    },
    [currentUser, streakInfo.current, todaysMood]
  )

  // Get milestone information
  const getMilestoneInfo = useMemo(() => {
    const milestones = [
      { day: 7, title: 'Первая неделя', reward: 'Редкий элемент' },
      { day: 30, title: 'Первый месяц', reward: 'Эпический элемент' },
      { day: 100, title: 'Сто дней', reward: 'Легендарный элемент' },
      { day: 365, title: 'Год в саду', reward: 'Уникальный элемент' },
    ]

    const currentDay = daysSinceRegistration
    const nextMilestone = milestones.find(m => m.day > currentDay)
    const lastMilestone = milestones
      .slice()
      .reverse()
      .find(m => m.day <= currentDay)

    return {
      currentDay,
      nextMilestone,
      lastMilestone,
      daysToNext: nextMilestone ? nextMilestone.day - currentDay : 0,
      progress: nextMilestone 
        ? (currentDay / nextMilestone.day) * 100
        : 100,
    }
  }, [daysSinceRegistration])

  return {
    // State
    canUnlock,
    daysSinceRegistration,
    streakInfo,
    hasSpaceForNewElement,

    // Actions
    previewElement,
    getElementForDate,
    getNextAvailablePosition,
    getRarityProbabilities,

    // Info
    getMilestoneInfo,
  }
}
