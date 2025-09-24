import { useCallback } from 'react'
import { useUserStore } from '@/stores'
import { useTelegram } from '@/hooks'
import { telegramStorage } from '@/utils/telegramStorage'
import { isOnboardingCompleted } from '@/utils/storage'
import type { TelegramSyncResult } from '@/types/initialization'

/**
 * Хук для синхронизации пользователя с Telegram
 */
export function useTelegramSync() {
  const { user: telegramUser, isReady: telegramReady } = useTelegram()
  const {
    currentUser,
    clearAllUserData,
    clearUserDataOnly,
    syncFromSupabase,
    createTelegramUser,
  } = useUserStore()

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

        if (needsSync) {
          // Проверяем статус онбординга ПЕРЕД очисткой
          const hadCompletedOnboarding = isOnboardingCompleted()

          // Используем умную очистку для существующих пользователей
          if (hadCompletedOnboarding) {
            // Пользователь уже прошёл онбординг - сохраняем его статус
            await clearUserDataOnly()
          } else {
            // Новый пользователь - можно очистить всё
            await clearAllUserData()
          }

          await syncFromSupabase(telegramUser.telegramId)

          // Если пользователя нет на сервере - создаем
          const { currentUser: syncedUser } = useUserStore.getState()
          if (!syncedUser) {
            createTelegramUser({
              telegramId: telegramUser.telegramId,
              firstName: telegramUser.firstName,
              lastName: telegramUser.lastName ?? undefined,
              username: telegramUser.username ?? undefined,
              photoUrl: telegramUser.photoUrl ?? undefined,
              authDate: new Date(),
              hash: 'telegram_miniapp',
            })
          }
        } else {
          // Принудительная синхронизация для существующих пользователей
          await syncFromSupabase(telegramUser.telegramId)
        }

        return { success: true, mode: 'telegram', user: telegramUser }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error'
        return { success: false, mode: 'error', error: errorMessage }
      }
    }, [
      telegramUser,
      telegramReady,
      currentUser,
      clearAllUserData,
      clearUserDataOnly,
      syncFromSupabase,
      createTelegramUser,
    ])

  return {
    syncTelegramUser,
    telegramUser,
    telegramReady,
    hasTelegramUser: !!telegramUser,
  }
}
