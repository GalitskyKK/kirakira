/**
 * Hook for syncing stores with server state
 *
 * ПОСЛЕ РЕФАКТОРИНГА:
 * Этот хук больше не нужен для ручной синхронизации.
 * React Query автоматически управляет кешированием и синхронизацией.
 *
 * Оставлен для обратной совместимости, но помечен как deprecated.
 *
 * Используйте вместо него:
 * - useGardenHistory() - автоматически синхронизирует сад
 * - useMoodHistory() - автоматически синхронизирует настроения
 * - useProfile() - автоматически синхронизирует профиль
 */

import { useEffect, useRef } from 'react'
import { useUserStore } from '@/stores'

/**
 * @deprecated Этот хук устарел после внедрения React Query.
 * Используйте соответствующие React Query хуки напрямую.
 */
export function useStoresSync(enabled = true) {
  const { currentUser } = useUserStore()
  const hasInitializedRef = useRef(false)

  useEffect(() => {
    if (!enabled || !currentUser?.telegramId || hasInitializedRef.current) {
      return
    }

    console.warn(
      '⚠️ useStoresSync is deprecated. Use React Query hooks (useGardenHistory, useMoodHistory, useProfile) instead.'
    )

    hasInitializedRef.current = true

    // Больше не выполняем ручную синхронизацию
    // React Query хуки должны быть вызваны в компонентах напрямую
  }, [enabled, currentUser])

  return {
    isInitialized: true,
    syncStores: async (_retryOnError = false) => {
      console.warn('syncStores is deprecated. Use React Query hooks instead.')
      // No-op для обратной совместимости
      return { success: true, error: null }
    },
  }
}
