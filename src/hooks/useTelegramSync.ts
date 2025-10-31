import { useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useTelegram } from '@/hooks'
import { telegramStorage } from '@/utils/telegramStorage'
import { isOnboardingCompleted } from '@/utils/storage'
import {
  useClearUserData,
  useSyncUserWithData,
  useUserSync,
  userKeys,
  moodKeys,
  gardenKeys,
} from '@/hooks/queries'
import { clearAllData } from '@/utils/storage'
import type { TelegramSyncResult } from '@/types/initialization'

/**
 * Хук для синхронизации пользователя с Telegram (v2 - React Query)
 * Использует React Query мутации вместо старых stores
 */
export function useTelegramSync() {
  const { user: telegramUser, isReady: telegramReady } = useTelegram()
  const queryClient = useQueryClient()

  // Используем React Query для получения данных пользователя
  const telegramId = telegramUser?.telegramId
  const { data: userData } = useUserSync(
    telegramId ?? undefined,
    telegramId != null
  )
  const currentUser = userData?.user

  // Мутации для очистки и синхронизации
  const clearUserDataMutation = useClearUserData()
  const syncUserMutation = useSyncUserWithData()

  const syncTelegramUser =
    useCallback(async (): Promise<TelegramSyncResult> => {
      try {
        // Проверяем Telegram окружение
        const isTelegramEnv = !!window.Telegram?.WebApp

        if (!isTelegramEnv) {
          // Браузерное окружение - это нормально, не ошибка
          return {
            success: true,
            mode: 'browser',
          }
        }

        // Инициализируем Telegram хранилище только в Telegram окружении
        telegramStorage.initialize()

        // Ждем готовности Telegram WebApp с таймаутом
        if (!telegramReady) {
          await Promise.race([
            new Promise<void>(resolve => {
              const checkReady = () => {
                if (telegramReady) {
                  resolve()
                } else {
                  setTimeout(checkReady, 100)
                }
              }
              checkReady()
            }),
            new Promise<void>((_, reject) => {
              setTimeout(
                () => reject(new Error('Telegram WebApp timeout')),
                5000
              )
            }),
          ])
        }

        if (!telegramUser) {
          // В Telegram окружении, но нет пользователя - переходим в браузерный режим
          return {
            success: true,
            mode: 'browser',
          }
        }

        // Проверяем, нужна ли синхронизация
        const needsSync =
          !currentUser || currentUser.telegramId !== telegramUser.telegramId

        // Подготавливаем данные пользователя для синхронизации
        const telegramUserData: Partial<import('@/types/api').DatabaseUser> = {
          first_name: telegramUser.firstName,
          ...(telegramUser.lastName != null && telegramUser.lastName !== ''
            ? { last_name: telegramUser.lastName }
            : {}),
          ...(telegramUser.username != null && telegramUser.username !== ''
            ? { username: telegramUser.username }
            : {}),
          ...(telegramUser.photoUrl != null && telegramUser.photoUrl !== ''
            ? { photo_url: telegramUser.photoUrl }
            : {}),
          ...(telegramUser.languageCode != null &&
          telegramUser.languageCode !== ''
            ? { language_code: telegramUser.languageCode }
            : {}),
        }

        if (needsSync) {
          // Проверяем статус онбординга ПЕРЕД очисткой
          const hadCompletedOnboarding = isOnboardingCompleted()

          console.log(
            `🔄 Очистка данных для нового пользователя (onboarding: ${hadCompletedOnboarding}):`,
            telegramUser.telegramId
          )

          // Очищаем локальное хранилище (кроме онбординга если нужно)
          if (hadCompletedOnboarding) {
            // Частичная очистка - сохраняем онбординг
            // Очищаем только пользовательские данные, не трогая онбординг
            clearAllData()
            // Восстанавливаем онбординг
            if (typeof Storage !== 'undefined') {
              localStorage.setItem(
                'kirakira_onboarding_completed',
                String(true)
              )
            }
          } else {
            // Полная очистка для нового пользователя
            clearAllData()
          }

          // Очищаем Telegram CloudStorage
          if (telegramStorage.isAvailable) {
            if (hadCompletedOnboarding) {
              // Частичная очистка CloudStorage (сохраняем онбординг)
              await telegramStorage.clearUserData()
            } else {
              await telegramStorage.clearAllData()
            }
          }

          // Инвалидируем все queries перед очисткой на сервере
          await Promise.all([
            queryClient.invalidateQueries({ queryKey: userKeys.all }),
            queryClient.invalidateQueries({ queryKey: moodKeys.all }),
            queryClient.invalidateQueries({ queryKey: gardenKeys.all }),
          ])

          // Очищаем данные на сервере
          await clearUserDataMutation.mutateAsync({
            telegramId: telegramUser.telegramId,
          })

          // Синхронизируем пользователя с данными
          await syncUserMutation.mutateAsync({
            telegramId: telegramUser.telegramId,
            userData: telegramUserData,
          })

          console.log('✅ Новый пользователь синхронизирован')
        } else {
          // Принудительная синхронизация для существующих пользователей
          console.log(
            '🔄 Синхронизация существующего пользователя:',
            telegramUser.telegramId
          )

          await syncUserMutation.mutateAsync({
            telegramId: telegramUser.telegramId,
            userData: telegramUserData,
          })

          console.log('✅ Пользователь синхронизирован')
        }

        return { success: true, mode: 'telegram', user: telegramUser }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error'
        console.error('❌ Telegram sync error:', error)
        return { success: false, mode: 'error', error: errorMessage }
      }
    }, [
      telegramUser,
      telegramReady,
      currentUser,
      clearUserDataMutation,
      syncUserMutation,
      queryClient,
    ])

  return {
    syncTelegramUser,
    telegramUser,
    telegramReady,
    hasTelegramUser: !!telegramUser,
  }
}
