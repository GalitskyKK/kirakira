/**
 * 🌱 Garden State Hook (v2 - Refactored)
 * Использует React Query для серверного состояния
 * И Zustand для клиентского UI состояния
 */

import { useCallback, useMemo } from 'react'
import { useGardenClientStore } from '@/stores/gardenStore.v2'
import {
  useGardenSync,
  useAddGardenElement,
  useUpdateElementPosition,
} from '@/hooks/queries'
import { useUserStore } from '@/stores'
import type { MoodType, Position2D, GardenElement } from '@/types'
import { loadGarden, saveGarden } from '@/utils/storage'
import {
  generateDailyElement,
  canUnlockTodaysElement,
} from '@/utils/elementGeneration'

/**
 * Хук для управления состоянием сада
 * Объединяет серверное состояние (React Query) и клиентское состояние (Zustand)
 */
export function useGardenState() {
  const { currentUser } = useUserStore()
  const telegramId = currentUser?.telegramId

  // Серверное состояние через React Query
  const {
    data: gardenData,
    isLoading,
    error: queryError,
    refetch: syncGarden,
  } = useGardenSync(telegramId, !!telegramId)

  const addElementMutation = useAddGardenElement()
  const updatePositionMutation = useUpdateElementPosition()

  // Клиентское UI состояние через Zustand
  const {
    viewMode,
    selectedElement,
    currentRoomIndex,
    setViewMode,
    selectElement,
    setCurrentRoomIndex,
    clearSelection,
  } = useGardenClientStore()

  // Локальное состояние из localStorage (для offline-first подхода)
  const localGarden = loadGarden()

  // Объединенное состояние: приоритет серверным данным, fallback на локальные
  const currentGarden = useMemo(() => {
    if (!localGarden) return null

    // Если есть серверные данные, обновляем локальный сад
    if (gardenData) {
      const updatedGarden = {
        ...localGarden,
        streak: gardenData.streak,
        elements: gardenData.elements,
        lastVisited: new Date(),
      }

      // Сохраняем обновленный сад локально
      saveGarden(updatedGarden)

      return updatedGarden
    }

    return localGarden
  }, [localGarden, gardenData])

  // Статистика сада
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

    // Группировка по типу
    const elementsByType = elements.reduce(
      (acc, element) => {
        acc[element.type] = (acc[element.type] ?? 0) + 1
        return acc
      },
      {} as Record<string, number>
    )

    // Группировка по редкости
    const elementsByRarity = elements.reduce(
      (acc, element) => {
        acc[element.rarity] = (acc[element.rarity] ?? 0) + 1
        return acc
      },
      {} as Record<string, number>
    )

    // Средний возраст в днях
    const now = new Date()
    const totalAge = elements.reduce((sum, element) => {
      const age = Math.floor(
        (now.getTime() - element.unlockDate.getTime()) / (1000 * 60 * 60 * 24)
      )
      return sum + age
    }, 0)
    const averageAge =
      totalElements > 0 ? Math.round(totalAge / totalElements) : 0

    // Новейший и старейший элементы
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

  // Проверка занятости позиции
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

  // Получение доступных позиций
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

  // Разблокировка элемента за сегодня
  const unlockElement = useCallback(
    async (mood: MoodType): Promise<GardenElement | null> => {
      if (!currentUser?.telegramId || !currentGarden) {
        console.error('❌ No user or garden available')
        return null
      }

      // Проверка возможности разблокировки
      const latestElement = currentGarden.elements.reduce(
        (latest, current) =>
          !latest || current.unlockDate > latest.unlockDate ? current : latest,
        null as GardenElement | null
      )

      if (!canUnlockTodaysElement(latestElement?.unlockDate ?? null)) {
        console.error("❌ Already unlocked today's element")
        return null
      }

      try {
        // Генерируем элемент локально
        const existingPositions = currentGarden.elements.map(el => el.position)
        const newElement = generateDailyElement(
          currentGarden.userId,
          new Date(currentGarden.createdAt),
          new Date(),
          mood,
          existingPositions
        )

        // Отправляем на сервер через mutation
        const telegramUserData: {
          userId: string
          firstName: string
          lastName?: string
          username?: string
          languageCode: string
          photoUrl?: string
        } = {
          userId: currentUser.id,
          firstName: currentUser.firstName ?? 'User',
          languageCode: currentUser.preferences.language || 'ru',
        }

        if (currentUser.lastName !== undefined) {
          telegramUserData.lastName = currentUser.lastName
        }
        if (currentUser.username !== undefined) {
          telegramUserData.username = currentUser.username
        }
        if (currentUser.photoUrl !== undefined) {
          telegramUserData.photoUrl = currentUser.photoUrl
        }

        const result = await addElementMutation.mutateAsync({
          telegramId: currentUser.telegramId,
          element: {
            type: newElement.type,
            position: newElement.position,
            unlockDate: newElement.unlockDate.toISOString(),
            moodInfluence: mood,
            rarity: newElement.rarity,
          },
          telegramUserData,
        })

        if (result) {
          console.log('✅ Element unlocked successfully')
          return result.element
        }

        return null
      } catch (error) {
        console.error('❌ Failed to unlock element:', error)
        return null
      }
    },
    [currentUser, currentGarden, addElementMutation]
  )

  // Безопасное перемещение элемента
  const moveElementSafely = useCallback(
    async (elementId: string, newPosition: Position2D): Promise<boolean> => {
      if (!currentUser?.telegramId) {
        console.error('❌ No user available')
        return false
      }

      // Валидация позиции
      if (
        newPosition.x < 0 ||
        newPosition.x >= 10 ||
        newPosition.y < 0 ||
        newPosition.y >= 10
      ) {
        console.error('❌ Position is out of bounds')
        return false
      }

      // Проверка занятости позиции
      if (
        currentGarden?.elements.some(
          el =>
            el.id !== elementId &&
            el.position.x === newPosition.x &&
            el.position.y === newPosition.y
        )
      ) {
        console.error('❌ Position is already occupied')
        return false
      }

      try {
        // Отправляем на сервер через mutation
        const success = await updatePositionMutation.mutateAsync({
          telegramId: currentUser.telegramId,
          elementId,
          position: newPosition,
        })

        return success
      } catch (error) {
        console.error('❌ Failed to move element:', error)
        return false
      }
    },
    [currentUser, currentGarden, updatePositionMutation]
  )

  // Проверка возможности разблокировки сегодня
  const canUnlockToday = useCallback(() => {
    if (!currentGarden) return false

    const latestElement = currentGarden.elements.reduce(
      (latest, current) =>
        !latest || current.unlockDate > latest.unlockDate ? current : latest,
      null as GardenElement | null
    )

    return canUnlockTodaysElement(latestElement?.unlockDate ?? null)
  }, [currentGarden])

  // Получение количества элементов
  const getElementsCount = useCallback(() => {
    return currentGarden?.elements.length ?? 0
  }, [currentGarden])

  // Получение последнего элемента
  const getLatestElement = useCallback(() => {
    if (!currentGarden || currentGarden.elements.length === 0) {
      return null
    }

    return currentGarden.elements.reduce((latest, current) =>
      current.unlockDate > latest.unlockDate ? current : latest
    )
  }, [currentGarden])

  return {
    // Состояние
    garden: currentGarden,
    isLoading:
      isLoading ||
      addElementMutation.isPending ||
      updatePositionMutation.isPending,
    error:
      queryError?.message ??
      addElementMutation.error?.message ??
      updatePositionMutation.error?.message ??
      null,
    viewMode,
    selectedElement,
    currentRoomIndex,

    // Статистика
    gardenStats,

    // Actions
    syncGarden,
    unlockElement,
    moveElementSafely,
    selectElement,
    setViewMode,
    setCurrentRoomIndex,
    clearSelection,

    // Utility functions
    canUnlockToday,
    getElementsCount,
    getLatestElement,
    isPositionOccupied,
    getAvailablePositions,
  }
}
