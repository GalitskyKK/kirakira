import { useCallback, useMemo } from 'react'
import { useUserSync, useGardenSync } from '@/hooks/index.v2'
import { useTodaysMood } from '@/hooks/queries/useMoodQueries'
import {
  generateDailyElement,
  canUnlockTodaysElement,
  calculateStreak,
} from '@/utils/elementGeneration'
import { getDaysSinceRegistration } from '@/utils/dateHelpers'
import type { GardenElement, MoodType, Position2D } from '@/types'

/**
 * Hook for element generation logic and preview
 */
export function useElementGeneration() {
  // Получаем данные через React Query
  const { data: userData } = useUserSync(undefined, false)
  const { data: gardenData } = useGardenSync(undefined, false)
  const { data: todaysMoodData } = useTodaysMood(undefined, undefined, false)

  const currentUser = userData?.user
  const currentGarden = gardenData
  const todaysMood = todaysMoodData?.mood

  // Вспомогательная функция для получения последнего элемента
  const getLatestElement = () =>
    currentGarden?.elements[currentGarden.elements.length - 1] ?? null

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
          existingPositions,
          currentUser.experience ?? 0 // НОВОЕ: передаём опыт для rarityBonus
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
          [],
          currentUser.experience ?? 0 // НОВОЕ: передаём опыт для rarityBonus
        )

        return element
      } catch (error) {
        console.error('Failed to generate historical element:', error)
        return null
      }
    },
    [currentUser]
  )

  // Get next available position in garden (optimized for shelf layout)
  const getNextAvailablePosition = useCallback((): Position2D | null => {
    if (!currentGarden) return { x: 0, y: 0 }

    const occupiedPositions = new Set(
      currentGarden.elements.map(el => `${el.position.x},${el.position.y}`)
    )

    // Shelf system constants
    const SHELF_COUNT = 4 // 4 shelves (y: 0-3)
    const MAX_POSITIONS_PER_SHELF = 4 // Up to 10 positions per shelf (x: 0-9)

    // Start from top shelf, left to right, then move to next shelf
    for (let y = 0; y < SHELF_COUNT; y++) {
      for (let x = 0; x < MAX_POSITIONS_PER_SHELF; x++) {
        if (!occupiedPositions.has(`${x},${y}`)) {
          console.log('📍 Next available position found:', {
            position: { x, y },
            shelfNumber: y,
            positionOnShelf: x,
            totalOccupied: occupiedPositions.size,
          })
          return { x, y }
        }
      }
    }

    // If all positions occupied
    console.warn('⚠️ All shelf positions are occupied!')
    return null // Garden is full
  }, [currentGarden])

  // Check if garden has space for new elements
  const hasSpaceForNewElement = useMemo(() => {
    return getNextAvailablePosition() !== null
  }, [getNextAvailablePosition])

  // Get rarity distribution for current user
  const getRarityProbabilities = useCallback(
    (_mood: MoodType): Record<string, number> => {
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
      progress: nextMilestone ? (currentDay / nextMilestone.day) * 100 : 100,
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
