/**
 * React Query хуки для работы с Profile/User API
 *
 * Эти хуки управляют серверным состоянием профиля пользователя,
 * включая статистику, опыт, уровни и достижения.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { profileApi } from '@/api/client'
import type { ProfileApiGetProfileResponse } from '@/types'

// Query keys для кеширования
export const profileKeys = {
  all: ['profile'] as const,
  detail: (telegramId: number) => ['profile', telegramId] as const,
}

/**
 * Хук для получения профиля пользователя
 */
export function useProfile(
  telegramId: number | undefined,
  userData?: {
    readonly userId: string
    readonly firstName?: string
    readonly lastName?: string
    readonly username?: string
    readonly languageCode?: string
    readonly photoUrl?: string
  }
) {
  return useQuery({
    queryKey: profileKeys.detail(telegramId!),
    queryFn: async () => {
      if (!telegramId) {
        throw new Error('No telegram ID provided')
      }

      const response = await profileApi.getProfile(telegramId, userData)

      if (!response.success || !response.data) {
        throw new Error(response.error ?? 'Failed to fetch profile')
      }

      return response.data
    },
    enabled: !!telegramId,
    staleTime: 5 * 60 * 1000, // 5 минут
    gcTime: 10 * 60 * 1000, // 10 минут
  })
}

/**
 * Мутация для добавления опыта
 */
export function useAddExperience(telegramId: number | undefined) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      experiencePoints,
      reason,
    }: {
      experiencePoints: number
      reason: string
    }) => {
      if (!telegramId) {
        throw new Error('No telegram ID provided')
      }

      const response = await profileApi.addExperience(
        telegramId,
        experiencePoints,
        reason
      )

      if (!response.success || !response.data) {
        throw new Error(response.error ?? 'Failed to add experience')
      }

      return response.data
    },
    onSuccess: data => {
      // Обновляем кеш профиля с новым опытом и уровнем
      queryClient.setQueryData<ProfileApiGetProfileResponse>(
        profileKeys.detail(telegramId!),
        old => {
          if (!old) return old

          return {
            ...old,
            user: {
              ...old.user,
              experience: data.experience,
              level: data.level,
            },
            stats: {
              ...old.stats,
              experience: data.experience,
              level: data.level,
            },
          }
        }
      )

      // Инвалидируем для гарантии синхронизации
      void queryClient.invalidateQueries({
        queryKey: profileKeys.detail(telegramId!),
      })
    },
  })
}

/**
 * Мутация для обновления настроек приватности
 */
export function useUpdatePrivacy(telegramId: number | undefined) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ settings }: { settings: Record<string, boolean> }) => {
      if (!telegramId) {
        throw new Error('No telegram ID provided')
      }

      const response = await profileApi.updatePrivacy(telegramId, settings)

      if (!response.success || !response.data) {
        throw new Error(response.error ?? 'Failed to update privacy settings')
      }

      return response.data
    },
    onSuccess: data => {
      // Обновляем кеш профиля с новыми настройками
      queryClient.setQueryData<ProfileApiGetProfileResponse>(
        profileKeys.detail(telegramId!),
        old => {
          if (!old) return old

          return {
            ...old,
            user: {
              ...old.user,
              privacy_settings: data.updatedSettings,
            },
          }
        }
      )

      void queryClient.invalidateQueries({
        queryKey: profileKeys.detail(telegramId!),
      })
    },
  })
}
