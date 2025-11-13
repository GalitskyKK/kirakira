/**
 * 🌱 Garden State Hook (v2 - Refactored)
 * Использует React Query для серверного состояния
 * И Zustand для клиентского UI состояния
 */

import { useCallback, useMemo } from 'react'
import { useGardenClientStore } from '@/stores/gardenStore'
import {
  useGardenSync,
  useAddGardenElement,
  useUpdateElementPosition,
} from '@/hooks/queries'
import { useUserSync } from '@/hooks/index.v2'
import { useTelegramId } from '@/hooks/useTelegramId'
import {
  useUpdateQuestProgress,
  useDailyQuests,
} from '@/hooks/queries/useDailyQuestQueries'
import { useChallengeGardenIntegration } from '@/hooks/useChallengeIntegration'
import { useQuestIntegration } from '@/hooks/useQuestIntegration'
import type { MoodType, Position2D, GardenElement, Garden } from '@/types'
import { SHELVES_PER_ROOM, MAX_POSITIONS_PER_SHELF } from '@/types'
import { loadGarden, saveGarden } from '@/utils/storage'
import {
  generateDailyElement,
  canUnlockTodaysElement,
  getCurrentSeason,
} from '@/utils/elementGeneration'
import { awardElementSprouts } from '@/utils/currencyRewards'

/**
 * Хук для управления состоянием сада
 * Объединяет серверное состояние (React Query) и клиентское состояние (Zustand)
 */
const MAX_ROOMS_SUPPORTED = 200

export function useGardenState() {
  // Получаем telegramId через контекст для оптимизации
  const telegramId = useTelegramId()
  const { data: userData } = useUserSync(telegramId, !!telegramId)
  const currentUser = userData?.user

  // Серверное состояние через React Query
  const {
    data: gardenData,
    isLoading,
    error: queryError,
    refetch: syncGarden,
  } = useGardenSync(telegramId, !!telegramId)

  const addElementMutation = useAddGardenElement()
  const updatePositionMutation = useUpdateElementPosition()
  const updateQuestProgress = useUpdateQuestProgress()
  const { onGardenElementAdded } = useChallengeGardenIntegration()

  // Получаем квесты для умной валидации
  const { data: questsData } = useDailyQuests(telegramId || 0)
  const { updateQuestsWithValidation } = useQuestIntegration({
    onQuestUpdated: (questType, isCompleted) => {
      if (isCompleted) {
        console.log(`🎉 Quest completed: ${questType}`)
      }
    },
  })

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

  // 🔧 КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: Объединенное состояние с приоритетом серверным данным
  // Если после очистки localStorage нет сада, но есть серверные данные - создаём сад из них
  const currentGarden = useMemo(() => {
    const localGarden = loadGarden()

    // Если есть серверные данные - они приоритетнее
    if (gardenData && currentUser) {
      const updatedGarden: Garden = {
        id: `garden_${currentUser.id}`,
        userId: currentUser.id,
        createdAt: currentUser.registrationDate,
        streak: gardenData.streak,
        elements: gardenData.elements,
        lastVisited: new Date(),
        season: getCurrentSeason(new Date()),
      }

      // Сохраняем обновленный сад локально
      saveGarden(updatedGarden)

      return updatedGarden
    }

    // Fallback на локальные данные (offline-first)
    if (localGarden) {
      return localGarden
    }

    // Если нет ни серверных, ни локальных данных, но есть пользователь - создаём пустой сад
    if (currentUser && !isLoading) {
      const emptyGarden: Garden = {
        id: `garden_${currentUser.id}`,
        userId: currentUser.id,
        createdAt: currentUser.registrationDate,
        streak: 0,
        elements: [],
        lastVisited: new Date(),
        season: getCurrentSeason(new Date()),
      }
      saveGarden(emptyGarden)
      return emptyGarden
    }

    return null
  }, [gardenData, currentUser, isLoading])

  const resolveTotalRooms = useCallback((): number => {
    if (!currentGarden) {
      return 1
    }

    const { elements } = currentGarden

    if (elements.length === 0) {
      return 1
    }

    const maxRoomIndex = elements.reduce((max, element) => {
      const elementRoomIndex = Math.floor(element.position.y / SHELVES_PER_ROOM)
      return elementRoomIndex > max ? elementRoomIndex : max
    }, 0)

    const totalRooms = maxRoomIndex + 2

    return Math.min(totalRooms, MAX_ROOMS_SUPPORTED)
  }, [currentGarden])

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
    const totalRooms = resolveTotalRooms()
    const totalShelves = totalRooms * SHELVES_PER_ROOM

    for (let shelfIndex = 0; shelfIndex < totalShelves; shelfIndex++) {
      for (let x = 0; x < MAX_POSITIONS_PER_SHELF; x++) {
        const position: Position2D = { x, y: shelfIndex }
        if (!isPositionOccupied(position)) {
          availablePositions.push(position)
        }
      }
    }

    return availablePositions
  }, [isPositionOccupied, resolveTotalRooms])

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
          existingPositions,
          currentUser?.experience ?? 0 // НОВОЕ: передаём опыт для rarityBonus
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
            seasonalVariant:
              newElement.seasonalVariant ??
              getCurrentSeason(newElement.unlockDate),
          },
          telegramUserData,
        })

        if (result) {

          // 💰 Начисляем валюту за получение элемента
          const currencyResult = await awardElementSprouts(
            currentUser.telegramId,
            result.element.rarity,
            result.element.id
          )

          if (currencyResult.success) {
          }

          // 🎯 Обновляем прогресс daily quests с умной валидацией
          if (
            telegramId &&
            questsData?.quests &&
            questsData.quests.length > 0
          ) {
            try {

              await updateQuestsWithValidation(
                {
                  elementType: newElement.type,
                  isRareElement:
                    newElement.rarity === 'rare' ||
                    newElement.rarity === 'epic' ||
                    newElement.rarity === 'legendary',
                },
                questsData.quests
              )
            } catch (questError) {
              console.error('❌ Failed to update quest progress:', questError)
            }
          } else if (telegramId) {
            // Fallback к старому методу если квесты не загружены
            try {

              const gardenQuests = ['collect_elements']
              if (
                newElement.rarity === 'rare' ||
                newElement.rarity === 'epic' ||
                newElement.rarity === 'legendary'
              ) {
                // gardenQuests.push('collect_rare_element') // Removed complex quest
              }

              for (const questType of gardenQuests) {
                try {
                  await updateQuestProgress.mutateAsync({
                    telegramId,
                    questType,
                    increment: 1,
                  })
                } catch (error) {
                  console.warn(`⚠️ Failed to update quest ${questType}:`, error)
                }
              }
            } catch (questError) {
              console.error(
                '❌ Failed to update quest progress (fallback):',
                questError
              )
            }
          }

          // 🏆 Обновляем прогресс челенджей
          try {
            await onGardenElementAdded()
          } catch (challengeError) {
            console.warn(
              '⚠️ Failed to update challenge progress:',
              challengeError
            )
          }

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

      if (!currentGarden) {
        console.error('❌ No garden data available')
        return false
      }

      const totalRooms = resolveTotalRooms()
      const maxShelfIndex = totalRooms * SHELVES_PER_ROOM - 1

      // Валидация позиции
      if (newPosition.x < 0 || newPosition.x >= MAX_POSITIONS_PER_SHELF) {
        console.error('❌ Position is out of bounds (horizontal)')
        return false
      }

      if (newPosition.y < 0 || newPosition.y > maxShelfIndex) {
        console.error('❌ Position is out of bounds')
        return false
      }

      // Проверка занятости позиции
      if (
        currentGarden.elements.some(
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
    [currentUser, currentGarden, resolveTotalRooms, updatePositionMutation]
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
