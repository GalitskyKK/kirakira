/**
 * 🎯 QUEST VALIDATION UTILITIES
 * Утилиты для проверки условий выполнения квестов
 */

import type { DailyQuest } from '@/types/dailyQuests'

// ===============================================
// 🎯 ИНТЕРФЕЙСЫ ДЛЯ ПРОВЕРКИ УСЛОВИЙ
// ===============================================

export interface QuestValidationContext {
  readonly moodType?: string
  readonly hasNote?: boolean
  readonly isRareElement?: boolean
  readonly elementType?: string
  readonly friendTelegramId?: number
  readonly streakDays?: number
  readonly isLogin?: boolean
}

export interface QuestValidationResult {
  readonly isValid: boolean
  readonly reason?: string
  readonly shouldIncrement: number
}

// ===============================================
// 🎯 ВАЛИДАЦИЯ УСЛОВИЙ КВЕСТОВ
// ===============================================

/**
 * Проверяет, можно ли обновить квест на основе контекста
 */
export function validateQuestCondition(
  quest: DailyQuest,
  context: QuestValidationContext
): QuestValidationResult {
  const { questType, currentProgress, targetValue } = quest

  // Если квест уже завершен, не обновляем
  if (currentProgress >= targetValue) {
    return {
      isValid: false,
      reason: 'Quest already completed',
      shouldIncrement: 0,
    }
  }

  // Проверяем условия в зависимости от типа квеста
  switch (questType) {
    case 'record_specific_mood':
      return validateMoodQuest(quest, context)

    case 'record_with_note':
      return validateNoteQuest(quest, context)

    case 'collect_elements':
      return validateCollectElementQuest(quest, context)

    case 'collect_rare_element':
      return validateRareElementQuest(quest, context)

    case 'upgrade_element':
      return validateUpgradeElementQuest(quest, context)

    case 'visit_friend_garden':
      return validateVisitFriendQuest(quest, context)

    case 'share_garden':
      return validateShareGardenQuest(quest, context)

    case 'maintain_streak':
      return validateMaintainStreakQuest(quest, context)

    case 'login_streak':
      return validateLoginStreakQuest(quest, context)

    default:
      return {
        isValid: false,
        reason: `Unknown quest type: ${questType}`,
        shouldIncrement: 0,
      }
  }
}

// ===============================================
// 🎯 СПЕЦИФИЧНЫЕ ВАЛИДАЦИИ
// ===============================================

function validateMoodQuest(
  quest: DailyQuest,
  context: QuestValidationContext
): QuestValidationResult {
  // Для квеста записи настроения проверяем, что настроение записано
  if (!context.moodType) {
    return {
      isValid: false,
      reason: 'No mood recorded',
      shouldIncrement: 0,
    }
  }

  // Проверяем, соответствует ли тип настроения требованию квеста
  const requiredMood = quest.metadata?.['requiredMood']
  if (requiredMood && context.moodType !== requiredMood) {
    return {
      isValid: false,
      reason: `Wrong mood type. Required: ${requiredMood}, got: ${context.moodType}`,
      shouldIncrement: 0,
    }
  }

  return {
    isValid: true,
    shouldIncrement: 1,
  }
}

function validateNoteQuest(
  _quest: DailyQuest,
  context: QuestValidationContext
): QuestValidationResult {
  // Для квеста записи с заметкой проверяем, что есть заметка
  if (!context.hasNote) {
    return {
      isValid: false,
      reason: 'No note provided',
      shouldIncrement: 0,
    }
  }

  return {
    isValid: true,
    shouldIncrement: 1,
  }
}

function validateCollectElementQuest(
  _quest: DailyQuest,
  context: QuestValidationContext
): QuestValidationResult {
  // Для квеста сбора элементов проверяем, что элемент получен
  if (!context.elementType) {
    return {
      isValid: false,
      reason: 'No element collected',
      shouldIncrement: 0,
    }
  }

  return {
    isValid: true,
    shouldIncrement: 1,
  }
}

function validateRareElementQuest(
  _quest: DailyQuest,
  context: QuestValidationContext
): QuestValidationResult {
  // Для квеста сбора редких элементов проверяем, что элемент редкий
  if (!context.isRareElement) {
    return {
      isValid: false,
      reason: 'Element is not rare',
      shouldIncrement: 0,
    }
  }

  return {
    isValid: true,
    shouldIncrement: 1,
  }
}

function validateUpgradeElementQuest(
  _quest: DailyQuest,
  context: QuestValidationContext
): QuestValidationResult {
  // Для квеста улучшения элементов проверяем, что элемент улучшен
  if (!context.elementType) {
    return {
      isValid: false,
      reason: 'No element upgraded',
      shouldIncrement: 0,
    }
  }

  return {
    isValid: true,
    shouldIncrement: 1,
  }
}

function validateVisitFriendQuest(
  _quest: DailyQuest,
  context: QuestValidationContext
): QuestValidationResult {
  // Для квеста посещения сада друга проверяем, что сад друга посещен
  if (!context.friendTelegramId) {
    return {
      isValid: false,
      reason: 'No friend garden visited',
      shouldIncrement: 0,
    }
  }

  return {
    isValid: true,
    shouldIncrement: 1,
  }
}

function validateShareGardenQuest(
  _quest: DailyQuest,
  _context: QuestValidationContext
): QuestValidationResult {
  // Для квеста шаринга сада проверяем, что сад поделен
  // Контекст всегда валиден, так как вызов происходит только при реальном шаринге
  return {
    isValid: true,
    shouldIncrement: 1,
  }
}

function validateMaintainStreakQuest(
  _quest: DailyQuest,
  context: QuestValidationContext
): QuestValidationResult {
  // Для квеста поддержания стрика проверяем количество дней
  if (!context.streakDays || context.streakDays < 1) {
    return {
      isValid: false,
      reason: 'No streak maintained',
      shouldIncrement: 0,
    }
  }

  return {
    isValid: true,
    shouldIncrement: context.streakDays,
  }
}

function validateLoginStreakQuest(
  _quest: DailyQuest,
  context: QuestValidationContext
): QuestValidationResult {
  // Для квеста входа в приложение проверяем, что пользователь вошел
  if (!context.isLogin) {
    return {
      isValid: false,
      reason: 'No login detected',
      shouldIncrement: 0,
    }
  }

  return {
    isValid: true,
    shouldIncrement: 1,
  }
}

// ===============================================
// 🎯 УТИЛИТЫ
// ===============================================

/**
 * Проверяет, можно ли обновить квесты на основе контекста
 */
export function validateQuestsForContext(
  quests: readonly DailyQuest[],
  context: QuestValidationContext
): Array<{ quest: DailyQuest; result: QuestValidationResult }> {
  return quests.map(quest => ({
    quest,
    result: validateQuestCondition(quest, context),
  }))
}

/**
 * Фильтрует квесты, которые можно обновить
 */
export function getValidQuestsForUpdate(
  quests: readonly DailyQuest[],
  context: QuestValidationContext
): Array<{ quest: DailyQuest; increment: number }> {
  return validateQuestsForContext(quests, context)
    .filter(({ result }) => result.isValid)
    .map(({ quest, result }) => ({
      quest,
      increment: result.shouldIncrement,
    }))
}
