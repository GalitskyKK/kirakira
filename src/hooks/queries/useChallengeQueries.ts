/**
 * 🏆 Challenge React Query Hooks
 * Хуки для работы с челленджами через React Query
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  loadChallenges,
  loadChallengeDetails,
  joinChallenge,
  updateProgress,
  refreshLeaderboard,
  type UpdateProgressRequest,
} from '@/api'

// ============================================
// QUERY KEYS - Константы для React Query
// ============================================

export const challengeKeys = {
  all: ['challenge'] as const,
  list: (telegramId: number) =>
    [...challengeKeys.all, 'list', telegramId] as const,
  details: (challengeId: string, telegramId: number) =>
    [...challengeKeys.all, 'details', challengeId, telegramId] as const,
  leaderboard: (challengeId: string) =>
    [...challengeKeys.all, 'leaderboard', challengeId] as const,
}

// ============================================
// QUERY HOOKS - Получение данных
// ============================================

/**
 * Хук для загрузки списка челленджей
 */
export function useChallengeList(
  telegramId: number | undefined,
  enabled = true
) {
  return useQuery({
    queryKey: challengeKeys.list(telegramId ?? 0),
    queryFn: async () => {
      if (!telegramId) {
        throw new Error('Telegram ID is required')
      }
      return loadChallenges({ telegramId })
    },
    enabled: enabled && !!telegramId,
    staleTime: 1000 * 60, // 1 минута
    gcTime: 1000 * 60 * 10, // 10 минут в кеше
    refetchOnWindowFocus: true,
  })
}

/**
 * Хук для загрузки деталей челленджа
 */
export function useChallengeDetails(
  challengeId: string | undefined,
  telegramId: number | undefined,
  enabled = true
) {
  return useQuery({
    queryKey: challengeKeys.details(challengeId ?? '', telegramId ?? 0),
    queryFn: async () => {
      if (!challengeId || !telegramId) {
        throw new Error('Challenge ID and Telegram ID are required')
      }
      return loadChallengeDetails({ challengeId, telegramId })
    },
    enabled: enabled && !!challengeId && !!telegramId,
    staleTime: 1000 * 30, // 30 секунд
    gcTime: 1000 * 60 * 5, // 5 минут в кеше
    refetchOnWindowFocus: true,
    refetchInterval: 1000 * 60, // Автоматическое обновление каждую минуту
  })
}

// ============================================
// MUTATION HOOKS - Изменение данных
// ============================================

/**
 * Хук для присоединения к челленджу
 */
export function useJoinChallenge() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: joinChallenge,
    onSuccess: (result, request) => {
      // Инвалидируем список челленджей для обновления участия
      queryClient.invalidateQueries({
        queryKey: challengeKeys.list(request.telegramId),
      })

      // Инвалидируем детали челленджа
      queryClient.invalidateQueries({
        queryKey: challengeKeys.details(
          request.challengeId,
          request.telegramId
        ),
      })

      console.log(`✅ Joined challenge: ${result.challenge.title}`)
    },
    onError: error => {
      console.error('❌ Failed to join challenge:', error)
    },
  })
}

/**
 * Хук для обновления прогресса в челлендже
 */
export function useUpdateChallengeProgress() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: updateProgress,
    onMutate: async (request: UpdateProgressRequest) => {
      // Отменяем текущие запросы для избежания конфликтов
      await queryClient.cancelQueries({
        queryKey: challengeKeys.details(
          request.challengeId,
          request.telegramId
        ),
      })

      // Сохраняем предыдущее состояние
      const previousDetails = queryClient.getQueryData(
        challengeKeys.details(request.challengeId, request.telegramId)
      )

      // Оптимистично обновляем прогресс
      queryClient.setQueryData(
        challengeKeys.details(request.challengeId, request.telegramId),
        (old: any) => {
          if (!old) return old
          return {
            ...old,
            progress: {
              ...old.progress,
              progress: request.value,
            },
          }
        }
      )

      return { previousDetails }
    },
    onSuccess: (result, request) => {
      // Обновляем детали с финальными данными с сервера
      queryClient.setQueryData(
        challengeKeys.details(request.challengeId, request.telegramId),
        (old: any) => {
          if (!old) return old
          return {
            ...old,
            progress: result.progress,
            leaderboard: result.leaderboard,
          }
        }
      )

      // Инвалидируем queries для полной синхронизации
      queryClient.invalidateQueries({
        queryKey: challengeKeys.details(
          request.challengeId,
          request.telegramId
        ),
      })

      queryClient.invalidateQueries({
        queryKey: challengeKeys.list(request.telegramId),
      })

      console.log(`✅ Updated challenge progress: ${request.value}`)
    },
    onError: (error, request, context) => {
      // Откатываем оптимистичное обновление при ошибке
      if (context?.previousDetails) {
        queryClient.setQueryData(
          challengeKeys.details(request.challengeId, request.telegramId),
          context.previousDetails
        )
      }
      console.error('❌ Failed to update challenge progress:', error)
    },
  })
}

/**
 * Хук для обновления лидерборда челленджа
 */
export function useRefreshLeaderboard() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      challengeId,
      telegramId,
    }: {
      challengeId: string
      telegramId: number
    }) => refreshLeaderboard(challengeId, telegramId),
    onSuccess: (result, variables) => {
      // Обновляем лидерборд в деталях челленджа
      queryClient.setQueryData(
        challengeKeys.details(variables.challengeId, variables.telegramId),
        (old: any) => {
          if (!old) return old
          return {
            ...old,
            leaderboard: result.leaderboard,
            progress: result.progress,
          }
        }
      )

      console.log('✅ Leaderboard refreshed')
    },
    onError: error => {
      console.error('❌ Failed to refresh leaderboard:', error)
    },
  })
}
