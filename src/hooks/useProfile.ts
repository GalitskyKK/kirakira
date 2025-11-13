/**
 * 📊 Profile Hook (v2 - Refactored)
 * Использует React Query вместо прямых API запросов
 * Устраняет антипаттерн прямых API вызовов в хуке
 */

import {
  useOwnProfile,
  useFriendProfile,
  useAddExperience,
} from '@/hooks/queries'
import { useUserSync } from '@/hooks/index.v2'
import { useTelegramId } from '@/hooks/useTelegramId'
import type { ProfileData } from '@/types/api'

/**
 * Хук для работы с профилем пользователя
 * Использует React Query для управления серверным состоянием
 */
export function useProfile() {
  const telegramId = useTelegramId()
  useUserSync(telegramId, !!telegramId)

  // Получение собственного профиля
  const {
    data: profileData,
    isLoading,
    error: queryError,
    refetch: reloadProfile,
  } = useOwnProfile(telegramId, !!telegramId)

  // Mutation для добавления опыта
  const addExperienceMutation = useAddExperience()

  // Загрузка профиля (просто refetch query)
  const loadProfile = async (
    customTelegramId?: number
  ): Promise<ProfileData | null> => {
    if (customTelegramId && customTelegramId !== telegramId) {
      // Если указан другой ID - это не наш профиль
      console.warn('Use useFriendProfile hook for friend profiles')
      return null
    }

    const result = await reloadProfile()
    return result.data ?? null
  }

  // Добавление опыта
  const addExperience = async (
    experiencePoints: number,
    reason: string = 'Manual'
  ) => {
    if (!telegramId) {
      console.error('❌ No user logged in')
      return null
    }

    try {
      const result = await addExperienceMutation.mutateAsync({
        telegramId,
        experiencePoints,
        reason,
      })

      if (result && result.leveledUp) {
        // Дополнительная логика при повышении уровня обрабатывается без логирования
      }

      return result
    } catch (error) {
      console.error('❌ Failed to add experience:', error)
      return null
    }
  }

  // Очистка ошибки
  const clearError = () => {
    // В React Query ошибка очищается автоматически при следующем успешном запросе
    // Но можно форсировать refetch для очистки
    reloadProfile()
  }

  return {
    // Состояние
    profile: profileData ?? null,
    isLoading: isLoading || addExperienceMutation.isPending,
    error: queryError?.message ?? addExperienceMutation.error?.message ?? null,

    // Actions
    loadProfile,
    addExperience,
    clearError,
  }
}

/**
 * Хук для загрузки профиля друга
 */
export function useFriendProfileData(friendTelegramId: number | undefined) {
  const currentUserTelegramId = useTelegramId()
  useUserSync(currentUserTelegramId, !!currentUserTelegramId)

  const {
    data: friendProfile,
    isLoading,
    error: queryError,
    refetch: reloadFriendProfile,
  } = useFriendProfile(
    currentUserTelegramId,
    friendTelegramId,
    !!currentUserTelegramId && !!friendTelegramId
  )

  // Загрузка профиля друга
  const loadFriendProfile = async (
    customFriendId: number
  ): Promise<ProfileData | null> => {
    if (!currentUserTelegramId) {
      console.error('❌ No user logged in')
      return null
    }

    if (customFriendId !== friendTelegramId) {
      console.warn('Friend ID mismatch')
      return null
    }

    const result = await reloadFriendProfile()
    return result.data ?? null
  }

  return {
    // Состояние
    friendProfile: friendProfile ?? null,
    isLoading,
    error: queryError?.message ?? null,

    // Actions
    loadFriendProfile,
  }
}
