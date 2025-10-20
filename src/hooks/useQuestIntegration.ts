/**
 * 🎯 QUEST INTEGRATION HOOK
 * Хук для автоматического обновления квестов при выполнении действий
 */

import { useCallback } from 'react'
import { useUpdateQuestProgress } from '@/hooks/queries/useDailyQuestQueries'
import { useTelegramId } from '@/hooks/useTelegramId'
import type { QuestType } from '@/types/dailyQuests'

interface QuestIntegrationOptions {
  readonly telegramId?: number
  readonly onQuestUpdated?: (questType: QuestType, isCompleted: boolean) => void
}

export function useQuestIntegration(options: QuestIntegrationOptions = {}) {
  const telegramId = useTelegramId()
  const updateMutation = useUpdateQuestProgress()

  const updateQuestProgress = useCallback(
    async (questType: QuestType, increment: number = 1) => {
      const targetTelegramId = options.telegramId || telegramId

      if (!targetTelegramId) {
        console.warn('QuestIntegration: No telegramId available')
        return false
      }

      try {
        const result = await updateMutation.mutateAsync({
          telegramId: targetTelegramId,
          questType,
          increment,
        })

        if (result.quest) {
          const isCompleted = result.isCompleted
          options.onQuestUpdated?.(questType, isCompleted)

          console.log(`🎯 Quest updated: ${questType} (+${increment})`, {
            isCompleted,
            progress: result.quest.currentProgress,
            target: result.quest.targetValue,
          })
        }

        return true
      } catch (error) {
        console.warn(
          `QuestIntegration: Failed to update quest ${questType}:`,
          error
        )
        return false
      }
    },
    [telegramId, options.telegramId, updateMutation, options.onQuestUpdated]
  )

  // Специфичные методы для разных типов действий
  const questActions = {
    // Mood quests
    recordMood: (_moodType: string, hasNote: boolean = false) => {
      const promises = [updateQuestProgress('record_specific_mood', 1)]

      if (hasNote) {
        promises.push(updateQuestProgress('record_with_note', 1))
      }

      return Promise.all(promises)
    },

    // Garden quests
    collectElement: (isRare: boolean = false) => {
      if (isRare) {
        return updateQuestProgress('collect_rare_element', 1)
      }
      return updateQuestProgress('collect_elements', 1)
    },

    upgradeElement: () => {
      return updateQuestProgress('upgrade_element', 1)
    },

    // Social quests
    visitFriendGarden: () => {
      return updateQuestProgress('visit_friend_garden', 1)
    },

    shareGarden: () => {
      return updateQuestProgress('share_garden', 1)
    },

    // Streak quests
    maintainStreak: (days: number = 1) => {
      return updateQuestProgress('maintain_streak', days)
    },

    loginStreak: () => {
      return updateQuestProgress('login_streak', 1)
    },
  }

  return {
    updateQuestProgress,
    questActions,
    isUpdating: updateMutation.isPending,
    error: updateMutation.error,
  }
}
