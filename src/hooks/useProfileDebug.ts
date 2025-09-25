import { useState, useCallback } from 'react'
import { useUserStore } from '@/stores'

interface ProfileData {
  user: any
  stats: any
  achievements: any[]
  newlyUnlocked?: any[]
}

// interface ExperienceResult {
//   experience: any
//   newAchievements: any[]
//   reason: string
// }

export function useProfileDebug() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [debugInfo, setDebugInfo] = useState<any>(null)
  const { currentUser } = useUserStore()

  /**
   * Запускает диагностику системы
   */
  const runDiagnostics = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      console.log('🔍 Running profile diagnostics...')

      const response = await fetch('/api/profile-debug?action=debug')

      if (!response.ok) {
        throw new Error(
          `Diagnostics failed: ${response.status} ${response.statusText}`
        )
      }

      const result = await response.json()
      console.log('📊 Diagnostics result:', result)
      setDebugInfo(result)

      return result
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Diagnostics failed'
      setError(errorMessage)
      console.error('💥 Diagnostics error:', err)
      return null
    } finally {
      setIsLoading(false)
    }
  }, [])

  /**
   * Загружает полный профиль пользователя (debug версия)
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
        console.log(
          '📱 Loading profile with telegramId:',
          telegramId || currentUser!.telegramId
        )

        const response = await fetch(
          `/api/profile-debug?action=get_profile&telegramId=${telegramId || currentUser!.telegramId}`
        )

        console.log('📡 Response status:', response.status, response.statusText)

        if (!response.ok) {
          const errorText = await response.text()
          console.error('❌ Response error:', errorText)
          throw new Error(
            `Failed to load profile: ${response.status} - ${errorText}`
          )
        }

        const result = await response.json()
        console.log('✅ Profile loaded:', result)

        if (!result.success) {
          throw new Error(result.error || 'Failed to load profile')
        }

        return result.data
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to load profile'
        setError(errorMessage)
        console.error('💥 Profile load error:', err)
        return null
      } finally {
        setIsLoading(false)
      }
    },
    [currentUser]
  )

  /**
   * Обновляет настройки приватности (debug версия)
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
        console.log('🔒 Updating privacy settings:', privacySettings)

        const response = await fetch(
          '/api/profile-debug?action=update_privacy',
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              telegramId: currentUser.telegramId,
              privacySettings,
            }),
          }
        )

        console.log(
          '📡 Privacy update response:',
          response.status,
          response.statusText
        )

        if (!response.ok) {
          const errorText = await response.text()
          console.error('❌ Privacy update error:', errorText)
          throw new Error(
            `Failed to update privacy: ${response.status} - ${errorText}`
          )
        }

        const result = await response.json()
        console.log('✅ Privacy updated:', result)

        if (!result.success) {
          throw new Error(result.error || 'Failed to update privacy settings')
        }

        return true
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to update privacy'
        setError(errorMessage)
        console.error('💥 Privacy update error:', err)
        return false
      } finally {
        setIsLoading(false)
      }
    },
    [currentUser]
  )

  /**
   * Загружает профиль друга (debug версия)
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
        console.log('👥 Loading friend profile:', {
          currentUser: currentUser.telegramId,
          friend: friendTelegramId,
        })

        const response = await fetch(
          `/api/profile-debug?action=get_friend_profile&telegramId=${currentUser.telegramId}&friendTelegramId=${friendTelegramId}`
        )

        console.log(
          '📡 Friend profile response:',
          response.status,
          response.statusText
        )

        if (!response.ok) {
          const errorText = await response.text()
          console.error('❌ Friend profile error:', errorText)

          if (response.status === 403) {
            throw new Error('Профиль недоступен или пользователь не в друзьях')
          }
          throw new Error(
            `Failed to load friend profile: ${response.status} - ${errorText}`
          )
        }

        const result = await response.json()
        console.log('✅ Friend profile loaded:', result)

        if (!result.success) {
          throw new Error(result.error || 'Failed to load friend profile')
        }

        return result.data
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to load friend profile'
        setError(errorMessage)
        console.error('💥 Friend profile load error:', err)
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
    debugInfo,
    runDiagnostics,
    loadProfile,
    updatePrivacySettings,
    loadFriendProfile,
    clearError: () => setError(null),
  }
}
