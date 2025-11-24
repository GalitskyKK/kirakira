/**
 * 🌱 Garden React Query Hooks
 * Хуки для работы с данными сада через React Query
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  syncGarden,
  getGardenHistory,
  addGardenElement,
  updateElementPosition,
  upgradeElement,
  getElementUpgradeInfo,
  type AddElementRequest,
  type UpdatePositionRequest,
} from '@/api'
import type { GardenElement } from '@/types'
import { saveGarden, loadGarden } from '@/utils/storage'

// ============================================
// QUERY KEYS - Константы для React Query
// ============================================

export const gardenKeys = {
  all: ['garden'] as const,
  sync: (telegramId: number) =>
    [...gardenKeys.all, 'sync', telegramId] as const,
  history: (telegramId: number) =>
    [...gardenKeys.all, 'history', telegramId] as const,
  upgradeInfo: (telegramId: number, elementId: string) =>
    [...gardenKeys.all, 'upgradeInfo', telegramId, elementId] as const,
}

// ============================================
// QUERY HOOKS - Получение данных
// ============================================

/**
 * Хук для синхронизации сада с сервером
 * Получает streak и полную историю элементов
 */
export function useGardenSync(telegramId: number | undefined, enabled = true) {
  return useQuery({
    queryKey: gardenKeys.sync(telegramId ?? 0),
    queryFn: async () => {
      if (!telegramId) {
        throw new Error('Telegram ID is required')
      }
      return syncGarden(telegramId)
    },
    enabled: enabled && !!telegramId,
    staleTime: 1000 * 30, // 30 секунд - относительно свежие данные
    gcTime: 1000 * 60 * 5, // 5 минут в кеше
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  })
}

/**
 * Хук для получения истории элементов сада
 */
export function useGardenHistory(
  telegramId: number | undefined,
  enabled = true
) {
  return useQuery({
    queryKey: gardenKeys.history(telegramId ?? 0),
    queryFn: async () => {
      if (!telegramId) {
        throw new Error('Telegram ID is required')
      }
      return getGardenHistory(telegramId)
    },
    enabled: enabled && !!telegramId,
    staleTime: 1000 * 60, // 1 минута
    gcTime: 1000 * 60 * 10, // 10 минут в кеше
  })
}

// ============================================
// MUTATION HOOKS - Изменение данных
// ============================================

/**
 * Хук для добавления нового элемента в сад
 * Включает оптимистичные обновления и синхронизацию с локальным хранилищем
 */
export function useAddGardenElement() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: addGardenElement,
    onMutate: async (request: AddElementRequest) => {
      // Отменяем текущие запросы для избежания конфликтов
      await queryClient.cancelQueries({
        queryKey: gardenKeys.sync(request.telegramId),
      })

      // Сохраняем предыдущее состояние для возможного отката
      const previousData = queryClient.getQueryData(
        gardenKeys.sync(request.telegramId)
      )

      // Оптимистично обновляем UI
      // Примечание: Здесь мы НЕ обновляем query data напрямую,
      // т.к. нам нужен серверный UUID для финального элемента

      return { previousData }
    },
    onSuccess: (result, request) => {
      if (result) {
        // Инвалидируем queries для перезагрузки данных с сервера
        queryClient.invalidateQueries({
          queryKey: gardenKeys.sync(request.telegramId),
        })
        queryClient.invalidateQueries({
          queryKey: gardenKeys.history(request.telegramId),
        })

        // Обновляем локальное хранилище
        const currentGarden = loadGarden()
      if (currentGarden) {
        const updatedGarden = {
          ...currentGarden,
          elements: [...currentGarden.elements, result.element],
          lastVisited: new Date(),
        }
        saveGarden(updatedGarden)
      }
      }
    },
    onError: (error, _request, context) => {
      // Откатываем оптимистичное обновление при ошибке
      if (context?.previousData) {
        queryClient.setQueryData(
          gardenKeys.sync(_request.telegramId),
          context.previousData
        )
      }
      console.error('❌ Failed to add garden element:', error)
    },
  })
}

/**
 * Хук для обновления позиции элемента в саду
 * Включает оптимистичные обновления
 */
export function useUpdateElementPosition() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: updateElementPosition,
    onMutate: async (request: UpdatePositionRequest) => {
      // Отменяем текущие запросы
      await queryClient.cancelQueries({
        queryKey: gardenKeys.sync(request.telegramId),
      })

      const previousData = queryClient.getQueryData(
        gardenKeys.sync(request.telegramId)
      )

      // Оптимистично обновляем позицию элемента
      queryClient.setQueryData(
        gardenKeys.sync(request.telegramId),
        (old: { streak: number; elements: readonly GardenElement[] }) => {
          if (!old) return old

          return {
            ...old,
            elements: old.elements.map(element =>
              element.id === request.elementId
                ? { ...element, position: request.position }
                : element
            ),
          }
        }
      )

      // Обновляем локальное хранилище
      const currentGarden = loadGarden()
      if (currentGarden) {
        const updatedGarden = {
          ...currentGarden,
          elements: currentGarden.elements.map(element =>
            element.id === request.elementId
              ? { ...element, position: request.position }
              : element
          ),
          lastVisited: new Date(),
        }
        saveGarden(updatedGarden)
      }

      return { previousData }
    },
    onError: (error, request, context) => {
      // Откатываем изменения при ошибке
      if (context?.previousData) {
        queryClient.setQueryData(
          gardenKeys.sync(request.telegramId),
          context.previousData
        )
      }
      console.error('❌ Failed to update element position:', error)

      // Восстанавливаем локальное хранилище
      if (context?.previousData) {
        const garden = loadGarden()
        if (garden) {
          saveGarden(garden)
        }
      }
    },
    onSuccess: (_result, request) => {
      // Инвалидируем queries для консистентности
      queryClient.invalidateQueries({
        queryKey: gardenKeys.sync(request.telegramId),
      })
    },
  })
}

/**
 * Хук для получения информации об улучшении элемента
 */
export function useElementUpgradeInfo(
  telegramId: number | undefined,
  elementId: string | undefined,
  enabled = true
) {
  return useQuery({
    queryKey: gardenKeys.upgradeInfo(telegramId ?? 0, elementId ?? ''),
    queryFn: async () => {
      if (!telegramId || !elementId) {
        throw new Error('Telegram ID and Element ID are required')
      }
      return getElementUpgradeInfo(telegramId, elementId)
    },
    enabled: enabled && !!telegramId && !!elementId,
    staleTime: 0, // ✅ ИСПРАВЛЕНИЕ: Всегда получать свежие данные
    gcTime: 1000 * 60 * 10, // 10 минут в кеше
    refetchOnMount: 'always', // 🔄 Всегда обновлять при монтировании
    refetchOnWindowFocus: true, // 🔄 Обновлять при фокусе на окне
  })
}

/**
 * Хук для улучшения элемента сада
 */
export function useUpgradeElement() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      telegramId,
      elementId,
      useFree = false,
    }: {
      telegramId: number
      elementId: string
      useFree?: boolean
    }) => upgradeElement(telegramId, elementId, useFree),
    onSuccess: (_result, variables) => {
      // ✅ ИСПРАВЛЕНИЕ: Инвалидируем все связанные queries для перезагрузки данных
      queryClient.invalidateQueries({
        queryKey: gardenKeys.sync(variables.telegramId),
      })
      queryClient.invalidateQueries({
        queryKey: gardenKeys.history(variables.telegramId),
      })
      queryClient.invalidateQueries({
        queryKey: gardenKeys.upgradeInfo(
          variables.telegramId,
          variables.elementId
        ),
      })

      // 🔑 КРИТИЧЕСКИ ВАЖНО: Инвалидируем профиль пользователя
      // для обновления информации о бесплатных улучшениях (freeUpgrades)
      queryClient.invalidateQueries({
        queryKey: ['profile', 'own', variables.telegramId],
      })
      queryClient.invalidateQueries({
        queryKey: ['user', 'sync', variables.telegramId],
      })
    },
    onError: error => {
      console.error('❌ Failed to upgrade element:', error)
    },
  })
}
