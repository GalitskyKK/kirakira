/**
 * 👤 User React Query Hooks
 * Хуки для работы с данными пользователя через React Query
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  syncUserFromSupabase,
  updatePrivacySettings,
  updateUserPhoto,
  addUserExperience,
  clearUserData,
  updateFriendGardenDisplay,
} from '@/api'
import type { UserSyncResponse } from '@/api/userService'
import type { GardenDisplayMode } from '@/types'

// ============================================
// QUERY KEYS - Константы для React Query
// ============================================

export const userKeys = {
  all: ['user'] as const,
  sync: (telegramId: number) => [...userKeys.all, 'sync', telegramId] as const,
  profile: (telegramId: number) =>
    [...userKeys.all, 'profile', telegramId] as const,
  experience: (telegramId: number) =>
    [...userKeys.all, 'experience', telegramId] as const,
}

// ============================================
// QUERY HOOKS - Получение данных
// ============================================

/**
 * Хук для синхронизации данных пользователя с сервером
 */
export function useUserSync(telegramId: number | undefined, enabled = true) {
  return useQuery({
    queryKey: userKeys.sync(telegramId ?? 0),
    queryFn: async () => {
      if (!telegramId) {
        throw new Error('Telegram ID is required')
      }
      return syncUserFromSupabase(telegramId)
    },
    enabled: enabled && !!telegramId,
    staleTime: 1000 * 60 * 10, // 10 минут - увеличено для снижения нагрузки
    gcTime: 1000 * 60 * 30, // 30 минут в кеше
    refetchOnWindowFocus: false, // ❌ ОТКЛЮЧЕНО: используем глобальные настройки
    refetchOnReconnect: true,
  })
}

/**
 * Хук для синхронизации пользователя с передачей данных (мутация)
 * Используется когда нужно синхронизировать с передачей обновленных данных
 */
export function useSyncUserWithData() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      telegramId,
      userData,
    }: {
      telegramId: number
      userData?: Partial<import('@/types/api').DatabaseUser>
    }) => syncUserFromSupabase(telegramId, userData),
    onSuccess: (_result, variables) => {
      // Инвалидируем queries для перезагрузки данных
      queryClient.invalidateQueries({
        queryKey: userKeys.sync(variables.telegramId),
      })
      queryClient.invalidateQueries({
        queryKey: userKeys.profile(variables.telegramId),
      })
    },
    onError: error => {
      console.error('❌ Failed to sync user with data:', error)
    },
  })
}

// ============================================
// MUTATION HOOKS - Изменение данных
// ============================================

/**
 * Хук для обновления настроек приватности
 */
export function useUpdatePrivacySettings() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      telegramId,
      privacySettings,
    }: {
      telegramId: number
      privacySettings: Record<string, boolean>
    }) => updatePrivacySettings(telegramId, privacySettings),
    onSuccess: (_result, variables) => {
      // Инвалидируем queries для перезагрузки данных
      queryClient.invalidateQueries({
        queryKey: userKeys.sync(variables.telegramId),
      })
    },
    onError: error => {
      console.error('❌ Failed to update privacy settings:', error)
    },
  })
}

/**
 * Хук для обновления фото профиля
 */
export function useUpdateUserPhoto() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      telegramId,
      photoUrl,
    }: {
      telegramId: number
      photoUrl: string
    }) => updateUserPhoto(telegramId, photoUrl),
    onMutate: async ({ telegramId, photoUrl }) => {
      // Отменяем текущие запросы
      await queryClient.cancelQueries({
        queryKey: userKeys.sync(telegramId),
      })

      const previousData = queryClient.getQueryData(userKeys.sync(telegramId))

      // Оптимистично обновляем фото
      queryClient.setQueryData(
        userKeys.sync(telegramId),
        (old: UserSyncResponse | null | undefined) =>
          old
            ? {
                ...old,
                user: {
                  ...old.user,
                  photoUrl,
                },
              }
            : old
      )

      return { previousData }
    },
    onSuccess: (_result, variables) => {
      // Инвалидируем queries для перезагрузки данных
      queryClient.invalidateQueries({
        queryKey: userKeys.sync(variables.telegramId),
      })
    },
    onError: (error, variables, context) => {
      // Откатываем изменения при ошибке
      if (context?.previousData) {
        queryClient.setQueryData(
          userKeys.sync(variables.telegramId),
          context.previousData
        )
      }
      console.error('❌ Failed to update user photo:', error)
    },
  })
}

/**
 * Хук для обновления приоритетного вида сада друзей
 */
export function useUpdateFriendGardenDisplay() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      telegramId,
      displayMode,
    }: {
      telegramId: number
      displayMode: GardenDisplayMode
    }) => updateFriendGardenDisplay(telegramId, displayMode),
    onSuccess: (_result, variables) => {
      queryClient.invalidateQueries({
        queryKey: userKeys.sync(variables.telegramId),
      })
    },
    onError: error => {
      console.error('❌ Failed to update friend garden display:', error)
    },
  })
}

/**
 * Хук для добавления опыта пользователю
 */
export function useAddUserExperience() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      telegramId,
      experiencePoints,
      reason,
    }: {
      telegramId: number
      experiencePoints: number
      reason: string
    }) => addUserExperience(telegramId, experiencePoints, reason),
    onSuccess: (_result, variables) => {
      // Инвалидируем queries для перезагрузки данных
      queryClient.invalidateQueries({
        queryKey: userKeys.sync(variables.telegramId),
      })
      queryClient.invalidateQueries({
        queryKey: userKeys.profile(variables.telegramId),
      })
    },
    onError: error => {
      console.error('❌ Failed to add user experience:', error)
    },
  })
}

/**
 * Хук для очистки данных пользователя
 */
export function useClearUserData() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ telegramId }: { telegramId: number }) =>
      clearUserData(telegramId),
    onSuccess: _result => {
      // Инвалидируем все queries пользователя
      queryClient.invalidateQueries({
        queryKey: userKeys.all,
      })
    },
    onError: error => {
      console.error('❌ Failed to clear user data:', error)
    },
  })
}
