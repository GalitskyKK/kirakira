import { useState, useCallback } from 'react'
import { useUserStore } from '@/stores'

interface ProfileData {
  user: any
  stats: any
  achievements: any[]
  newlyUnlocked?: any[]
}

interface ExperienceResult {
  experience: any
  newAchievements: any[]
  reason: string
}

export function useProfile() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { currentUser } = useUserStore()

  /**
   * Загружает полный профиль пользователя
   */
  const loadProfile = useCallback(
    async (telegramId?: number): Promise<ProfileData | null> => {
      if (!telegramId && !currentUser?.telegramId) {
        setError('No Telegram ID available')
        return null
      }

      setIsLoading(true)
      setError(null)

      try {
        const response = await fetch(
          `/api/profile?action=get_profile&telegramId=${telegramId || currentUser!.telegramId}`
        )

        if (!response.ok) {
          throw new Error(`Failed to load profile: ${response.status}`)
        }

        const result = await response.json()

        if (!result.success) {
          throw new Error(result.error || 'Failed to load profile')
        }

        return result.data
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to load profile'
        setError(errorMessage)
        console.error('Profile load error:', err)
        return null
      } finally {
        setIsLoading(false)
      }
    },
    [currentUser]
  )

  /**
   * Обновляет настройки приватности
   */
  const updatePrivacySettings = useCallback(
    async (privacySettings: any): Promise<boolean> => {
      if (!currentUser?.telegramId) {
        setError('No user logged in')
        return false
      }

      setIsLoading(true)
      setError(null)

      try {
        const response = await fetch('/api/profile?action=update_privacy', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            telegramId: currentUser.telegramId,
            privacySettings,
          }),
        })

        if (!response.ok) {
          throw new Error(`Failed to update privacy: ${response.status}`)
        }

        const result = await response.json()

        if (!result.success) {
          throw new Error(result.error || 'Failed to update privacy settings')
        }

        return true
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to update privacy'
        setError(errorMessage)
        console.error('Privacy update error:', err)
        return false
      } finally {
        setIsLoading(false)
      }
    },
    [currentUser]
  )

  /**
   * Добавляет опыт пользователю
   */
  const addExperience = useCallback(
    async (
      experiencePoints: number,
      reason: string = 'Manual'
    ): Promise<ExperienceResult | null> => {
      if (!currentUser?.telegramId) {
        setError('No user logged in')
        return null
      }

      setIsLoading(true)
      setError(null)

      try {
        const response = await fetch('/api/profile?action=add_experience', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            telegramId: currentUser.telegramId,
            experiencePoints,
            reason,
          }),
        })

        if (!response.ok) {
          throw new Error(`Failed to add experience: ${response.status}`)
        }

        const result = await response.json()

        if (!result.success) {
          throw new Error(result.error || 'Failed to add experience')
        }

        return result.data
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to add experience'
        setError(errorMessage)
        console.error('Experience add error:', err)
        return null
      } finally {
        setIsLoading(false)
      }
    },
    [currentUser]
  )

  /**
   * Загружает профиль друга
   */
  const loadFriendProfile = useCallback(
    async (friendTelegramId: number): Promise<ProfileData | null> => {
      if (!currentUser?.telegramId) {
        setError('No user logged in')
        return null
      }

      setIsLoading(true)
      setError(null)

      try {
        const response = await fetch(
          `/api/profile?action=get_friend_profile&telegramId=${currentUser.telegramId}&friendTelegramId=${friendTelegramId}`
        )

        if (!response.ok) {
          if (response.status === 403) {
            throw new Error('Профиль недоступен или пользователь не в друзьях')
          }
          throw new Error(`Failed to load friend profile: ${response.status}`)
        }

        const result = await response.json()

        if (!result.success) {
          throw new Error(result.error || 'Failed to load friend profile')
        }

        return result.data
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to load friend profile'
        setError(errorMessage)
        console.error('Friend profile load error:', err)
        return null
      } finally {
        setIsLoading(false)
      }
    },
    [currentUser]
  )

  return {
    isLoading,
    error,
    loadProfile,
    updatePrivacySettings,
    addExperience,
    loadFriendProfile,
    clearError: () => setError(null),
  }
}
