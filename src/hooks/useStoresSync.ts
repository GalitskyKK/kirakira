import { useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { userKeys, moodKeys, gardenKeys } from '@/hooks/queries'
import type { StoresSyncResult } from '@/types/initialization'

/**
 * Хук для синхронизации stores с сервером (v2 - React Query)
 * Использует React Query invalidate вместо старых stores
 */
export function useStoresSync() {
  const queryClient = useQueryClient()

  const syncStores = useCallback(
    async (telegramId?: number): Promise<StoresSyncResult> => {
      try {
        // Если есть Telegram ID - инвалидируем queries для принудительной синхронизации
        if (telegramId != null && telegramId > 0) {
          // Инвалидируем все queries связанные с пользователем для перезагрузки данных
          await Promise.all([
            queryClient.invalidateQueries({
              queryKey: userKeys.sync(telegramId),
              refetchType: 'active', // Перезагружаем только активные queries
            }),
            queryClient.invalidateQueries({
              queryKey: moodKeys.sync(telegramId),
              refetchType: 'active',
            }),
            queryClient.invalidateQueries({
              queryKey: gardenKeys.sync(telegramId),
              refetchType: 'active',
            }),
          ])
        }

        return { success: true }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Stores sync failed'
        console.error('❌ Stores sync error:', error)
        return { success: false, error: errorMessage }
      }
    },
    [queryClient]
  )

  return {
    syncStores,
  }
}
