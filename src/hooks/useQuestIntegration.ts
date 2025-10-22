/**
 * 🎯 QUEST INTEGRATION HOOK
 * Хук для автоматического обновления квестов при выполнении действий
 */

import { useCallback } from 'react'
import { useUpdateQuestProgress } from '@/hooks/queries/useDailyQuestQueries'
import { useTelegramId } from '@/hooks/useTelegramId'
import {
  validateQuestCondition,
  type QuestValidationContext,
} from '@/utils/questValidation'
import type { QuestType, DailyQuest } from '@/types/dailyQuests'

interface QuestIntegrationOptions {
  readonly telegramId?: number
  readonly onQuestUpdated?: (questType: QuestType, isCompleted: boolean) => void
}

export function useQuestIntegration(options: QuestIntegrationOptions = {}) {
  const telegramId = useTelegramId()
  const updateMutation = useUpdateQuestProgress()

  const updateQuestProgress = useCallback(
    async (questType: QuestType, increment: number = 1) => {
      const targetTelegramId = options.telegramId ?? telegramId

      if (targetTelegramId === undefined || targetTelegramId === null) {
        console.warn('QuestIntegration: No telegramId available')
        return false
      }

      try {
        const result = await updateMutation.mutateAsync({
          telegramId: targetTelegramId,
          questType,
          increment,
        })

        if (result.quest !== null && result.quest !== undefined) {
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
    [telegramId, options, updateMutation]
  )

  // Умное обновление квестов с проверкой условий
  const updateQuestsWithValidation = useCallback(
    async (context: QuestValidationContext, quests: readonly DailyQuest[]) => {
      const targetTelegramId = options.telegramId ?? telegramId

      if (targetTelegramId === undefined || targetTelegramId === null) {
        console.warn('QuestIntegration: No telegramId available')
        return false
      }

      const validUpdates = []

      for (const quest of quests) {
        const validation = validateQuestCondition(quest, context)

        if (validation.isValid) {
          validUpdates.push({
            questType: quest.questType,
            increment: validation.shouldIncrement,
          })

          console.log(`✅ Quest validation passed: ${quest.questType}`, {
            reason: validation.reason,
            increment: validation.shouldIncrement,
          })
        } else {
          console.log(`❌ Quest validation failed: ${quest.questType}`, {
            reason: validation.reason,
          })
        }
      }

      // Выполняем обновления для валидных квестов
      const promises = validUpdates.map(({ questType, increment }) =>
        updateQuestProgress(questType, increment)
      )

      try {
        await Promise.all(promises)
        return true
      } catch (error) {
        console.error('QuestIntegration: Failed to update quests:', error)
        return false
      }
    },
    [telegramId, options, updateQuestProgress]
  )

  // Специфичные методы для разных типов действий
  const questActions = {
    // Mood quests
    recordMood: (_moodType: string, hasNote: boolean = false) => {
      const promises = []

      // Обновляем квест записи настроения (любого типа)
      promises.push(updateQuestProgress('record_specific_mood', 1))

      // Обновляем квест записи с заметкой (если есть заметка)
      if (hasNote) {
        promises.push(updateQuestProgress('record_with_note', 1))
      }

      return Promise.all(promises)
    },

    // Garden quests
    collectElement: () => {
      return updateQuestProgress('collect_elements', 1)
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
    updateQuestsWithValidation,
    questActions,
    isUpdating: updateMutation.isPending,
    error: updateMutation.error,
  }
}
