/**
 * 🎯 DAILY QUESTS REACT QUERY HOOKS
 * Хуки для работы с ежедневными заданиями через React Query
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getDailyQuests,
  claimDailyQuest,
  updateQuestProgress,
} from '@/api/dailyQuestService'
import type { DailyQuestsResponse } from '@/types/dailyQuests'

// ===============================================
// 🎯 QUERY KEYS
// ===============================================

export const dailyQuestKeys = {
  all: ['daily-quests'] as const,
  lists: () => [...dailyQuestKeys.all, 'list'] as const,
  list: (telegramId: number) =>
    [...dailyQuestKeys.lists(), telegramId] as const,
  quests: (telegramId: number) =>
    [...dailyQuestKeys.list(telegramId), 'quests'] as const,
  quest: (questId: string) =>
    [...dailyQuestKeys.all, 'quest', questId] as const,
  stats: (telegramId: number) =>
    [...dailyQuestKeys.list(telegramId), 'stats'] as const,
} as const

// ===============================================
// 📊 QUERY HOOKS
// ===============================================

/**
 * Получает ежедневные задания пользователя
 */
export function useDailyQuests(telegramId: number, enabled: boolean = true) {
  return useQuery({
    queryKey: dailyQuestKeys.quests(telegramId),
    queryFn: () => getDailyQuests(telegramId),
    enabled: enabled && !!telegramId,
    staleTime: 5 * 60 * 1000, // 5 минут
    gcTime: 10 * 60 * 1000, // 10 минут
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    retry: 3,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
  })
}

/**
 * Получает статистику заданий пользователя
 */
export function useQuestStats(telegramId: number, enabled: boolean = true) {
  return useQuery({
    queryKey: dailyQuestKeys.stats(telegramId),
    queryFn: async () => {
      const response = await getDailyQuests(telegramId)
      return response.stats
    },
    enabled: enabled && !!telegramId,
    staleTime: 2 * 60 * 1000, // 2 минуты
    gcTime: 5 * 60 * 1000, // 5 минут
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    retry: 2,
  })
}

/**
 * Получает конкретное задание по ID
 */
export function useQuest(
  questId: string,
  telegramId: number,
  enabled: boolean = true
) {
  return useQuery({
    queryKey: dailyQuestKeys.quest(questId),
    queryFn: async () => {
      const response = await getDailyQuests(telegramId)
      return response.quests.find(quest => quest.id === questId)
    },
    enabled: enabled && !!questId && !!telegramId,
    staleTime: 1 * 60 * 1000, // 1 минута
    gcTime: 5 * 60 * 1000, // 5 минут
    retry: 2,
  })
}

// ===============================================
// 🔄 MUTATION HOOKS
// ===============================================

/**
 * Мутация для получения награды за задание
 */
export function useClaimDailyQuest() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      telegramId,
      questId,
    }: {
      telegramId: number
      questId: string
    }) => claimDailyQuest(telegramId, questId),
    onSuccess: (result, variables) => {
      // Инвалидируем кеш заданий
      queryClient.invalidateQueries({
        queryKey: dailyQuestKeys.quests(variables.telegramId),
      })

      // Инвалидируем кеш статистики
      queryClient.invalidateQueries({
        queryKey: dailyQuestKeys.stats(variables.telegramId),
      })

      // Инвалидируем кеш валюты (синхронизация баланса)
      queryClient.invalidateQueries({
        queryKey: ['currency', variables.telegramId],
      })

      // Инвалидируем кеш профиля (обновление опыта и уровня)
      queryClient.invalidateQueries({
        queryKey: ['user', variables.telegramId],
      })

      // Обновляем конкретное задание в кеше
      queryClient.setQueryData(
        dailyQuestKeys.quest(variables.questId),
        result.quest
      )
    },
    onError: error => {
      console.error('Claim daily quest error:', error)
    },
  })
}

/**
 * Мутация для обновления прогресса задания
 */
export function useUpdateQuestProgress() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      telegramId,
      questId,
      questType,
      increment,
    }: {
      telegramId: number
      questId?: string
      questType?: string
      increment: number
    }) => {
      if (!questId && !questType) {
        throw new Error('Either questId or questType must be provided')
      }

      const questIdOrType = questId || questType!
      return updateQuestProgress(telegramId, questIdOrType, increment)
    },
    onSuccess: (result, variables) => {
      // Инвалидируем кеш заданий
      queryClient.invalidateQueries({
        queryKey: dailyQuestKeys.quests(variables.telegramId),
      })

      // Обновляем конкретное задание в кеше (если есть questId)
      if (variables.questId) {
        queryClient.setQueryData(
          dailyQuestKeys.quest(variables.questId),
          result.quest
        )
      }

      // Если задание только что завершено, показываем уведомление
      if (result.isNewlyCompleted) {
        // Здесь можно добавить toast уведомление
      }
    },
    onError: error => {
      // Не логируем ошибки как критические, так как квесты могут не существовать
      console.warn(
        'Quest progress update failed (this is usually not critical):',
        error
      )
    },
  })
}

/**
 * Мутация для обновления прогресса нескольких заданий
 */
export function useUpdateMultipleQuestProgress() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      telegramId,
      questUpdates,
    }: {
      telegramId: number
      questUpdates: Array<{ questId: string; increment: number }>
    }) => {
      const promises = questUpdates.map(({ questId, increment }) =>
        updateQuestProgress(telegramId, questId, increment)
      )
      return Promise.all(promises)
    },
    onSuccess: (results, variables) => {
      // Инвалидируем кеш заданий
      queryClient.invalidateQueries({
        queryKey: dailyQuestKeys.quests(variables.telegramId),
      })

      // Обновляем каждое задание в кеше
      results.forEach((result, index) => {
        const questUpdate = variables.questUpdates[index]
        if (questUpdate) {
          queryClient.setQueryData(
            dailyQuestKeys.quest(questUpdate.questId),
            result.quest
          )
        }
      })
    },
    onError: error => {
      console.error('Update multiple quest progress error:', error)
    },
  })
}

/**
 * Мутация для получения всех доступных наград
 */
export function useClaimAllRewards() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      telegramId,
      questIds,
    }: {
      telegramId: number
      questIds: string[]
    }) => {
      // Получаем все награды последовательно
      const results = []
      for (const questId of questIds) {
        try {
          const result = await claimDailyQuest(telegramId, questId)
          results.push(result)
        } catch (error) {
          console.warn(`Failed to claim quest ${questId}:`, error)
          // Продолжаем с другими квестами даже если один не удался
        }
      }
      return results
    },
    onSuccess: (_results, variables) => {
      // Инвалидируем кеш заданий
      queryClient.invalidateQueries({
        queryKey: dailyQuestKeys.quests(variables.telegramId),
      })

      // Инвалидируем кеш статистики
      queryClient.invalidateQueries({
        queryKey: dailyQuestKeys.stats(variables.telegramId),
      })

      // Инвалидируем кеш валюты (синхронизация баланса)
      queryClient.invalidateQueries({
        queryKey: ['currency', variables.telegramId],
      })

      // Инвалидируем кеш профиля (обновление опыта и уровня)
      queryClient.invalidateQueries({
        queryKey: ['user', variables.telegramId],
      })
    },
    onError: error => {
      console.error('Claim all rewards error:', error)
    },
  })
}

// ===============================================
// 🎯 HELPER HOOKS
// ===============================================

/**
 * Проверяет, можно ли получить награду за задание
 */
export function useCanClaimQuest(questId: string, telegramId: number): boolean {
  const { data: quest } = useQuest(questId, telegramId)

  if (!quest) return false

  return (
    quest.status === 'completed' &&
    quest.expiresAt > new Date() &&
    quest.currentProgress >= quest.targetValue
  )
}

/**
 * Получает статистику выполнения заданий за сегодня
 */
export function useTodayCompletionRate(telegramId: number) {
  const { data: questsData } = useDailyQuests(telegramId)

  if (!questsData) {
    return { completed: 0, total: 0, percentage: 0 }
  }

  const { quests } = questsData
  const completed = quests.filter(
    q => q.status === 'completed' || q.status === 'claimed'
  ).length
  const total = quests.length
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0

  return { completed, total, percentage }
}

/**
 * Получает активные задания
 */
export function useActiveQuests(telegramId: number) {
  const { data: questsData } = useDailyQuests(telegramId)

  if (!questsData) return []

  return questsData.quests.filter(quest => quest.status === 'active')
}

/**
 * Получает выполненные задания
 */
export function useCompletedQuests(telegramId: number) {
  const { data: questsData } = useDailyQuests(telegramId)

  if (!questsData) return []

  return questsData.quests.filter(quest => quest.status === 'completed')
}

/**
 * Получает задания, готовые к получению награды
 */
export function useClaimableQuests(telegramId: number) {
  const { data: questsData } = useDailyQuests(telegramId)

  if (!questsData) return []

  return questsData.quests.filter(
    quest => quest.status === 'completed' && quest.expiresAt > new Date()
  )
}

/**
 * Получает задания по категории
 */
export function useQuestsByCategory(telegramId: number, category: string) {
  const { data: questsData } = useDailyQuests(telegramId)

  if (!questsData) return []

  return questsData.quests.filter(quest => quest.questCategory === category)
}

/**
 * Получает общие награды за день
 */
export function useTodayRewards(telegramId: number) {
  const { data: questsData } = useDailyQuests(telegramId)

  if (!questsData) {
    return { sprouts: 0, gems: 0, experience: 0 }
  }

  const claimedQuests = questsData.quests.filter(
    quest => quest.status === 'claimed'
  )

  return claimedQuests.reduce(
    (total, quest) => ({
      sprouts: total.sprouts + quest.rewards.sprouts,
      gems: total.gems + (quest.rewards.gems || 0),
      experience: total.experience + quest.rewards.experience,
    }),
    { sprouts: 0, gems: 0, experience: 0 }
  )
}

/**
 * Проверяет, можно ли получить бонус за выполнение всех заданий
 */
export function useCanClaimBonus(telegramId: number): boolean {
  const { data: questsData } = useDailyQuests(telegramId)

  if (!questsData) return false

  return questsData.canClaimBonus
}

/**
 * Получает бонусные награды
 */
export function useBonusRewards(telegramId: number) {
  const { data: questsData } = useDailyQuests(telegramId)

  if (!questsData) return null

  return questsData.bonusRewards || null
}

// ===============================================
// 🎯 OPTIMISTIC UPDATES
// ===============================================

/**
 * Хук для оптимистичного обновления прогресса задания
 */
export function useOptimisticQuestProgress() {
  const queryClient = useQueryClient()
  const updateMutation = useUpdateQuestProgress()

  const updateProgress = async (
    telegramId: number,
    questId: string,
    increment: number = 1
  ) => {
    // Получаем текущие данные
    const queryKey = dailyQuestKeys.quests(telegramId)
    const previousData = queryClient.getQueryData<DailyQuestsResponse>(queryKey)

    if (previousData) {
      // Оптимистично обновляем данные
      const optimisticData = {
        ...previousData,
        quests: previousData.quests.map(quest => {
          if (quest.id === questId && quest.status === 'active') {
            const newProgress = Math.min(
              quest.currentProgress + increment,
              quest.targetValue
            )
            const newStatus =
              newProgress >= quest.targetValue ? 'completed' : 'active'

            return {
              ...quest,
              currentProgress: newProgress,
              status: newStatus,
              completedAt:
                newStatus === 'completed'
                  ? new Date().toISOString()
                  : quest.completedAt,
            }
          }
          return quest
        }),
      }

      // Устанавливаем оптимистичные данные
      queryClient.setQueryData(queryKey, optimisticData)
    }

    // Выполняем реальное обновление
    try {
      await updateMutation.mutateAsync({ telegramId, questId, increment })
    } catch (error) {
      // В случае ошибки возвращаем предыдущие данные
      if (previousData) {
        queryClient.setQueryData(queryKey, previousData)
      }
      throw error
    }
  }

  return {
    updateProgress,
    isPending: updateMutation.isPending,
    error: updateMutation.error,
  }
}
