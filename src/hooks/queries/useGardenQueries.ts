/**
 * React Query хуки для работы с Garden API
 *
 * Эти хуки управляют серверным состоянием сада,
 * включая кеширование, оптимистичные обновления и синхронизацию.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { gardenApi } from '@/api/client'
import type {
  GardenElement,
  Position2D,
  MoodType,
  ElementType,
  RarityLevel,
  DatabaseGardenElement,
} from '@/types'
import {
  getElementName,
  getElementDescription,
  getElementEmoji,
  getElementColor,
  getElementScale,
} from '@/utils/elementNames'

// Query keys для кеширования
export const gardenKeys = {
  all: ['garden'] as const,
  history: (telegramId: number) => ['garden', 'history', telegramId] as const,
}

/**
 * Конвертирует DatabaseGardenElement в GardenElement
 */
function convertDatabaseElement(
  serverElement: DatabaseGardenElement
): GardenElement {
  const moodInfluence = (serverElement.mood_influence ?? 'joy') as MoodType
  const elementType = serverElement.element_type as ElementType
  const rarity = serverElement.rarity as RarityLevel

  const seed = `${serverElement.id}-${serverElement.unlock_date}`
  const name = getElementName(elementType, rarity, seed)
  const description = getElementDescription(elementType, rarity, name)
  const emoji = getElementEmoji(elementType)
  const color = getElementColor(elementType, moodInfluence, seed)
  const scale = getElementScale(seed)

  return {
    id: serverElement.id,
    type: elementType,
    position: {
      x: serverElement.position_x,
      y: serverElement.position_y,
    },
    unlockDate: new Date(serverElement.unlock_date),
    moodInfluence,
    rarity,
    name,
    description,
    emoji,
    color,
    scale,
  }
}

/**
 * Хук для получения истории элементов сада
 */
export function useGardenHistory(telegramId: number | undefined) {
  return useQuery({
    queryKey: gardenKeys.history(telegramId!),
    queryFn: async () => {
      if (!telegramId) {
        throw new Error('No telegram ID provided')
      }

      const response = await gardenApi.getHistory(telegramId)

      if (!response.success || !response.data) {
        throw new Error(response.error ?? 'Failed to fetch garden history')
      }

      // Конвертируем в формат приложения
      return response.data.gardenElements.map(convertDatabaseElement)
    },
    enabled: !!telegramId,
    staleTime: 5 * 60 * 1000, // 5 минут
    gcTime: 10 * 60 * 1000, // 10 минут (cacheTime в v5)
  })
}

/**
 * Мутация для добавления элемента в сад
 */
export function useAddGardenElement(telegramId: number | undefined) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      element,
      telegramUserData,
    }: {
      element: {
        readonly type: ElementType
        readonly position: Position2D
        readonly unlockDate: string
        readonly moodInfluence: MoodType
        readonly rarity: RarityLevel
      }
      telegramUserData: {
        readonly userId: string
        readonly firstName?: string
        readonly lastName?: string
        readonly username?: string
        readonly languageCode?: string
        readonly photoUrl?: string
      }
    }) => {
      if (!telegramId) {
        throw new Error('No telegram ID provided')
      }

      const response = await gardenApi.addElement(
        telegramId,
        element,
        telegramUserData
      )

      if (!response.success || !response.data) {
        throw new Error(response.error ?? 'Failed to add garden element')
      }

      return convertDatabaseElement(response.data.element)
    },
    onSuccess: newElement => {
      // Инвалидируем кеш истории, чтобы обновить список
      void queryClient.invalidateQueries({
        queryKey: gardenKeys.history(telegramId!),
      })

      // Опционально: можем сразу обновить кеш оптимистично
      queryClient.setQueryData<GardenElement[]>(
        gardenKeys.history(telegramId!),
        old => {
          if (!old) return [newElement]
          return [...old, newElement]
        }
      )
    },
  })
}

/**
 * Мутация для обновления позиции элемента
 */
export function useUpdateElementPosition(telegramId: number | undefined) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      elementId,
      position,
    }: {
      elementId: string
      position: Position2D
    }) => {
      if (!telegramId) {
        throw new Error('No telegram ID provided')
      }

      const response = await gardenApi.updatePosition(
        telegramId,
        elementId,
        position
      )

      if (!response.success) {
        throw new Error(response.error ?? 'Failed to update element position')
      }

      return { elementId, position }
    },
    // Оптимистичное обновление
    onMutate: async ({ elementId, position }) => {
      // Отменяем текущие запросы
      await queryClient.cancelQueries({
        queryKey: gardenKeys.history(telegramId!),
      })

      // Сохраняем предыдущее состояние
      const previousElements = queryClient.getQueryData<GardenElement[]>(
        gardenKeys.history(telegramId!)
      )

      // Оптимистично обновляем UI
      if (previousElements) {
        queryClient.setQueryData<GardenElement[]>(
          gardenKeys.history(telegramId!),
          previousElements.map(el =>
            el.id === elementId ? { ...el, position } : el
          )
        )
      }

      return { previousElements }
    },
    // Если ошибка - откатываем
    onError: (_err, _variables, context) => {
      if (context?.previousElements) {
        queryClient.setQueryData(
          gardenKeys.history(telegramId!),
          context.previousElements
        )
      }
    },
    // После успеха - инвалидируем для гарантии синхронизации
    onSettled: () => {
      void queryClient.invalidateQueries({
        queryKey: gardenKeys.history(telegramId!),
      })
    },
  })
}
