import { useCallback } from 'react'
import { initializeStores } from '@/stores'
import type { StoresSyncResult } from '@/types/initialization'

/**
 * Хук для синхронизации stores с сервером
 */
export function useStoresSync() {
  const syncStores = useCallback(
    async (telegramId?: number): Promise<StoresSyncResult> => {
      try {
        // Инициализируем базовые stores
        await initializeStores()

        // Если есть Telegram ID - синхронизируем данные с сервером
        if (telegramId) {
          // Динамический импорт stores для принудительной синхронизации
          const { useMoodStore } = await import('@/stores/moodStore')
          const { useGardenStore } = await import('@/stores/gardenStore')

          // Принудительная синхронизация один раз при входе
          await Promise.all([
            useMoodStore.getState().syncMoodHistory(true), // forceSync = true
            useGardenStore.getState().syncGarden(true), // forceSync = true
          ])
        }

        return { success: true }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Stores sync failed'
        return { success: false, error: errorMessage }
      }
    },
    []
  )

  return {
    syncStores,
  }
}
