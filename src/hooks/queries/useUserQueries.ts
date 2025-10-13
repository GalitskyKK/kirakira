/**
 * 👤 User React Query Hooks
 * Хуки для работы с данными пользователя через React Query
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  syncUserFromSupabase,
  updatePrivacySettings,
  updateUserPhoto,
} from '@/api'
import type { User } from '@/types'

// ============================================
// QUERY KEYS - Константы для React Query
// ============================================

export const userKeys = {
  all: ['user'] as const,
  sync: (telegramId: number) => [...userKeys.all, 'sync', telegramId] as const,
  profile: (telegramId: number) =>
    [...userKeys.all, 'profile', telegramId] as const,
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
    staleTime: 1000 * 60 * 5, // 5 минут
    gcTime: 1000 * 60 * 30, // 30 минут в кеше
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
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

      console.log('✅ Privacy settings updated successfully')
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
        (old: { user: User; stats: any }) => {
          if (!old) return old
          return {
            ...old,
            user: {
              ...old.user,
              photoUrl,
            },
          }
        }
      )

      return { previousData }
    },
    onSuccess: (_result, variables) => {
      // Инвалидируем queries для перезагрузки данных
      queryClient.invalidateQueries({
        queryKey: userKeys.sync(variables.telegramId),
      })

      console.log('✅ User photo updated successfully')
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
