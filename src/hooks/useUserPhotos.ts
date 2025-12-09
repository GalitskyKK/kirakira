import { useCallback, useState } from 'react'
import { useTelegram } from './useTelegram'
import { authenticatedFetch } from '@/utils/apiClient'
import type {
  StandardApiResponse,
  UserApiUpdatePhotoResponse,
} from '@/types/api'

interface PhotoUpdateResult {
  success: boolean
  photoUrl?: string
  message?: string
  error?: string
}

interface BulkPhotoUpdateResult {
  success: boolean
  total?: number
  updated?: number
  skipped?: number
  errors?: number
  message?: string
  error?: string
}

/**
 * Хук для управления аватарками пользователей
 */
export function useUserPhotos() {
  const { user, isTelegramEnv } = useTelegram()
  const [isUpdatingPhoto, setIsUpdatingPhoto] = useState(false)
  const [isUpdatingFriendsPhotos, setIsUpdatingFriendsPhotos] = useState(false)

  /**
   * Обновляет аватарку текущего пользователя
   */
  const updateCurrentUserPhoto = useCallback(
    async (forceUpdate = false): Promise<PhotoUpdateResult> => {
      if (!isTelegramEnv || !user?.telegramId) {
        return {
          success: false,
          error: 'Telegram environment not available',
        }
      }

      try {
        setIsUpdatingPhoto(true)

        const response = await authenticatedFetch(
          '/api/user?action=update-photo',
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              telegramId: user.telegramId,
              forceUpdate,
            }),
          }
        )

        const result = (await response.json()) as StandardApiResponse<UserApiUpdatePhotoResponse>

        if (result.success && result.data) {
          return {
            success: true,
            photoUrl: result.data.photoUrl,
            message: result.data.message,
          }
        }

        return {
          success: false,
          error: result.error ?? 'Failed to update photo',
        }
      } catch (error) {
        console.error('Error updating user photo:', error)
        return {
          success: false,
          error: 'Network error occurred',
        }
      } finally {
        setIsUpdatingPhoto(false)
      }
    },
    [user?.telegramId, isTelegramEnv]
  )

  /**
   * Обновляет аватарки всех друзей пользователя
   */
  const updateFriendsPhotos =
    useCallback(async (): Promise<BulkPhotoUpdateResult> => {
      if (!isTelegramEnv || !user?.telegramId) {
        return {
          success: false,
          error: 'Telegram environment not available',
        }
      }

      try {
        setIsUpdatingFriendsPhotos(true)

        const response = await authenticatedFetch(
          '/api/friends?action=update-photos',
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              telegramId: user.telegramId,
            }),
          }
        )

        const result = (await response.json()) as StandardApiResponse<{
          total?: number
          updated?: number
          skipped?: number
          errors?: number
          message?: string
        }>

        if (result.success && result.data) {
          const {
            total = 0,
            updated = 0,
            skipped = 0,
            errors = 0,
            message: serverMessage,
          } = result.data

          // 🔥 ИСПРАВЛЕНИЕ: Упрощенное сообщение для пользователя
          let message: string
          if (errors > 0) {
            message = `Обновлено ${updated} из ${total} аватарок. Ошибок: ${errors}`
          } else if (updated > 0) {
            message = `Обновлено ${updated} аватар${updated === 1 ? 'ка' : updated < 5 ? 'ки' : 'ок'}`
          } else {
            message = 'Все аватарки актуальны'
          }

          return {
            success: true,
            total,
            updated,
            skipped,
            errors,
            message: message ?? serverMessage,
          }
        }

        return {
          success: false,
          error: result.error ?? 'Failed to update friends photos',
        }
      } catch (error) {
        console.error('Error updating friends photos:', error)
        return {
          success: false,
          error: 'Network error occurred',
        }
      } finally {
        setIsUpdatingFriendsPhotos(false)
      }
    }, [user?.telegramId, isTelegramEnv])

  /**
   * Обновляет аватарку пользователя (без уведомлений)
   * Автоматически вызывается при необходимости
   */
  const updateCurrentUserPhotoWithAlert = useCallback(
    async (forceUpdate = false) => {
      // 🔥 УБРАНО: Уведомления пользователям не нужны - это техническая операция
      const result = await updateCurrentUserPhoto(forceUpdate)
      if (!result.success) {
        console.error('❌ Failed to update user photo:', result.error)
      }
      return result
    },
    [updateCurrentUserPhoto]
  )

  /**
   * Обновляет аватарки друзей (без уведомлений)
   * Автоматически вызывается при загрузке списка друзей
   */
  const updateFriendsPhotosWithAlert = useCallback(async () => {
    // 🔥 УБРАНО: Уведомления пользователям не нужны - это техническая операция
    const result = await updateFriendsPhotos()
    if (!result.success) {
      console.error('❌ Failed to update friends photos:', result.error)
    }
    return result
  }, [updateFriendsPhotos])

  /**
   * Получает URL аватарки текущего пользователя
   */
  const getCurrentUserPhotoUrl = useCallback((): string | undefined => {
    return user?.photoUrl
  }, [user?.photoUrl])

  return {
    // Состояния загрузки
    isUpdatingPhoto,
    isUpdatingFriendsPhotos,

    // Методы обновления
    updateCurrentUserPhoto,
    updateFriendsPhotos,
    updateCurrentUserPhotoWithAlert,
    updateFriendsPhotosWithAlert,

    // Утилиты
    getCurrentUserPhotoUrl,

    // Состояния
    canUpdatePhotos: isTelegramEnv && !!user?.telegramId,
  }
}
