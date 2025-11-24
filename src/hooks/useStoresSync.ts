import { useCallback, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { userKeys, moodKeys, gardenKeys } from '@/hooks/queries'
import type { StoresSyncResult } from '@/types/initialization'
import { debounce } from '@/utils/debounce'

/**
 * Хук для синхронизации stores с сервером (v2 - React Query)
 * Использует React Query invalidate вместо старых stores
 */
export function useStoresSync() {
  const queryClient = useQueryClient()

  // ✅ ОПТИМИЗАЦИЯ: Дебаунсинг для предотвращения частых синхронизаций
  const debouncedSyncRef = useRef(
    debounce(async (telegramId: number) => {
      try {
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
      } catch (error) {
        console.error('❌ Debounced sync error:', error)
      }
    }, 2000) // Дебаунсинг на 2 секунды
  )

  const syncStores = useCallback(
    async (telegramId?: number): Promise<StoresSyncResult> => {
      try {
        // Если есть Telegram ID - используем дебаунсированную синхронизацию
        if (telegramId != null && telegramId > 0) {
          debouncedSyncRef.current(telegramId)
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
