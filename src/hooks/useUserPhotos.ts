import { useCallback, useState } from 'react'
import { useTelegram } from './useTelegram'

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
  const { user, isTelegramEnv, showAlert } = useTelegram()
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

        const response = await fetch('/api/user/update-photo', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            telegramId: user.telegramId,
            forceUpdate,
          }),
        })

        const result = await response.json()

        if (result.success) {
          return {
            success: true,
            photoUrl: result.data.photoUrl,
            message: result.data.message,
          }
        } else {
          return {
            success: false,
            error: result.error || 'Failed to update photo',
          }
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

        const response = await fetch('/api/friends/update-photos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            telegramId: user.telegramId,
          }),
        })

        const result = await response.json()

        if (result.success) {
          const { total, updated, skipped, errors } = result.data
          const message = `Обновлено: ${updated}, пропущено: ${skipped}, ошибок: ${errors} из ${total}`

          return {
            success: true,
            total,
            updated,
            skipped,
            errors,
            message,
          }
        } else {
          return {
            success: false,
            error: result.error || 'Failed to update friends photos',
          }
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
   * Обновляет аватарку пользователя с уведомлением
   */
  const updateCurrentUserPhotoWithAlert = useCallback(
    async (forceUpdate = false) => {
      const result = await updateCurrentUserPhoto(forceUpdate)

      if (showAlert) {
        if (result.success) {
          showAlert(result.message || 'Аватарка обновлена!')
        } else {
          showAlert(result.error || 'Ошибка обновления аватарки')
        }
      }

      return result
    },
    [updateCurrentUserPhoto, showAlert]
  )

  /**
   * Обновляет аватарки друзей с уведомлением
   */
  const updateFriendsPhotosWithAlert = useCallback(async () => {
    const result = await updateFriendsPhotos()

    if (showAlert) {
      if (result.success) {
        showAlert(result.message || 'Аватарки друзей обновлены!')
      } else {
        showAlert(result.error || 'Ошибка обновления аватарок друзей')
      }
    }

    return result
  }, [updateFriendsPhotos, showAlert])

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
