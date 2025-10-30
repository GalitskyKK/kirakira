/**
 * 📊 Profile React Query Hooks
 * Хуки для работы с профилем и опытом через React Query
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getProfile,
  addExperience,
  getFriendProfile,
  type AddExperienceRequest,
} from '@/api'
import { saveUser, loadUser } from '@/utils/storage'
import type { ProfileApiGetProfileResponse } from '@/types/api'
import type { User } from '@/types'

// ============================================
// QUERY KEYS - Константы для React Query
// ============================================

export const profileKeys = {
  all: ['profile'] as const,
  own: (telegramId: number) => [...profileKeys.all, 'own', telegramId] as const,
  friend: (telegramId: number, friendId: number) =>
    [...profileKeys.all, 'friend', telegramId, friendId] as const,
}

// ============================================
// QUERY HOOKS - Получение данных
// ============================================

/**
 * Хук для получения собственного профиля
 */
export function useOwnProfile(telegramId: number | undefined, enabled = true) {
  return useQuery({
    queryKey: profileKeys.own(telegramId ?? 0),
    queryFn: async () => {
      if (!telegramId) {
        throw new Error('Telegram ID is required')
      }
      return getProfile(telegramId)
    },
    enabled: enabled && !!telegramId,
    staleTime: 1000 * 60, // 1 минута
    gcTime: 1000 * 60 * 10, // 10 минут в кеше
    refetchOnWindowFocus: true,
  })
}

/**
 * Хук для получения профиля друга
 */
export function useFriendProfile(
  telegramId: number | undefined,
  friendTelegramId: number | undefined,
  enabled = true
) {
  return useQuery({
    queryKey: profileKeys.friend(telegramId ?? 0, friendTelegramId ?? 0),
    queryFn: async () => {
      if (!telegramId || !friendTelegramId) {
        throw new Error('Telegram ID and Friend ID are required')
      }
      return getFriendProfile({ telegramId, friendTelegramId })
    },
    enabled: enabled && !!telegramId && !!friendTelegramId,
    staleTime: 1000 * 60 * 2, // 2 минуты
    gcTime: 1000 * 60 * 15, // 15 минут в кеше
  })
}

// ============================================
// MUTATION HOOKS - Изменение данных
// ============================================

/**
 * Хук для добавления опыта
 * Включает синхронизацию с локальным хранилищем
 */
export function useAddExperience() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: addExperience,
    onMutate: async (request: AddExperienceRequest) => {
      // Отменяем текущие запросы для избежания конфликтов
      await queryClient.cancelQueries({
        queryKey: profileKeys.own(request.telegramId),
      })

      // Сохраняем предыдущее состояние
      const previousProfile = queryClient.getQueryData(
        profileKeys.own(request.telegramId)
      )

      // Оптимистично обновляем опыт в профиле
      // Примечание: мы не знаем финальный level до ответа сервера,
      // поэтому только увеличиваем experience
      queryClient.setQueryData(
        profileKeys.own(request.telegramId),
        (old: ProfileApiGetProfileResponse | undefined) =>
          old
            ? {
                ...old,
                user: {
                  ...old.user,
                  experience: old.user.experience + request.experiencePoints,
                },
              }
            : old
      )

      return { previousProfile }
    },
    onSuccess: (result, request) => {
      if (result) {
        // Обновляем profile query с финальными данными
        queryClient.setQueryData(
          profileKeys.own(request.telegramId),
          (old: ProfileApiGetProfileResponse | undefined) =>
            old
              ? {
                  ...old,
                  user: {
                    ...old.user,
                    experience: result.experience,
                    level: result.level,
                  },
                }
              : old
        )

        // Обновляем локальное хранилище
        const currentUser = loadUser()
        if (currentUser) {
          const updatedUser: User = {
            ...currentUser,
            experience: result.experience,
            level: result.level,
          }
          saveUser(updatedUser)
        }

        // Инвалидируем queries для полной синхронизации
        queryClient.invalidateQueries({
          queryKey: profileKeys.own(request.telegramId),
        })

        console.log(
          `✅ Added ${request.experiencePoints} XP for ${request.reason}`
        )

        if (result.leveledUp) {
          console.log(`🎉 Level up! New level: ${result.level}`)
        }
      }
    },
    onError: (error, request, context) => {
      // Откатываем оптимистичное обновление при ошибке
      if (context?.previousProfile) {
        queryClient.setQueryData(
          profileKeys.own(request.telegramId),
          context.previousProfile
        )
      }
      console.error('❌ Failed to add experience:', error)
    },
  })
}
