/**
 * Утилиты для проверки ограничений премиум функций в демо-режиме
 */

import { PAYMENT_CONFIG } from '@/config/payment'

export interface UserPremiumState {
  registrationDate: string
  activations: Record<string, number> // featureId -> count
  tasksCompleted: {
    moodStreakDays: number
    gardenVisits: number
    sharingCount: number
    lastTaskRewardTime?: string
  }
  lastHappyHourUsed?: string // ISO string даты последнего использования
}

/**
 * Проверяет, находится ли пользователь в trial-периоде
 */
export function isInTrialPeriod(registrationDate: string): boolean {
  if (!PAYMENT_CONFIG.DEMO_MODE) return false

  const regDate = new Date(registrationDate)
  const now = new Date()
  const daysPassed = Math.floor(
    (now.getTime() - regDate.getTime()) / (1000 * 60 * 60 * 24)
  )

  return daysPassed < PAYMENT_CONFIG.DEMO_LIMITS.TRIAL_PERIOD_DAYS
}

/**
 * Проверяет, сейчас ли "счастливые часы"
 */
export function isHappyHour(): boolean {
  if (!PAYMENT_CONFIG.DEMO_MODE) return false

  const now = new Date()
  const utcHour = now.getUTCHours()

  return (
    utcHour >= PAYMENT_CONFIG.DEMO_LIMITS.HAPPY_HOURS.START &&
    utcHour < PAYMENT_CONFIG.DEMO_LIMITS.HAPPY_HOURS.END
  )
}

/**
 * Проверяет, использовал ли пользователь уже "счастливые часы" сегодня
 */
export function hasUsedHappyHourToday(lastUsed?: string): boolean {
  if (!lastUsed) return false

  const lastUsedDate = new Date(lastUsed)
  const today = new Date()

  return lastUsedDate.toDateString() === today.toDateString()
}

/**
 * Проверяет, есть ли у пользователя доступ по заданиям
 */
export function hasTaskRewardAccess(userState: UserPremiumState): boolean {
  if (!PAYMENT_CONFIG.DEMO_MODE) return false
  if (!userState.tasksCompleted.lastTaskRewardTime) return false

  const rewardTime = new Date(userState.tasksCompleted.lastTaskRewardTime)
  const now = new Date()
  const hoursPassedSinceReward =
    (now.getTime() - rewardTime.getTime()) / (1000 * 60 * 60)

  return hoursPassedSinceReward < PAYMENT_CONFIG.DEMO_LIMITS.TASK_REWARD_HOURS
}

/**
 * Проверяет, может ли пользователь выполнить новое задание
 */
export function canCompleteNewTask(userState: UserPremiumState): boolean {
  const { tasksCompleted } = userState
  const { TASKS } = PAYMENT_CONFIG.DEMO_LIMITS

  // Проверяем каждое задание
  return (
    tasksCompleted.moodStreakDays >= TASKS.MOOD_STREAK_DAYS ||
    tasksCompleted.gardenVisits >= TASKS.GARDEN_VISITS ||
    tasksCompleted.sharingCount >= TASKS.SHARING_COUNT
  )
}

/**
 * Проверяет, есть ли у пользователя бесплатные активации для функции
 */
export function hasFreeActivations(
  userState: UserPremiumState,
  featureId: string
): boolean {
  if (!PAYMENT_CONFIG.DEMO_MODE) return false

  const used = userState.activations[featureId] || 0
  return used < PAYMENT_CONFIG.DEMO_LIMITS.FREE_ACTIVATIONS_PER_FEATURE
}

/**
 * Главная функция: проверяет, может ли пользователь получить премиум функцию бесплатно
 */
export function canAccessPremiumForFree(
  userState: UserPremiumState,
  featureId: string
): {
  canAccess: boolean
  reason: 'trial' | 'happy_hour' | 'task_reward' | 'free_activation' | 'none'
  details?: string
} {
  if (!PAYMENT_CONFIG.DEMO_MODE) {
    return { canAccess: false, reason: 'none' }
  }

  // 1. Trial период (все бесплатно)
  if (isInTrialPeriod(userState.registrationDate)) {
    const daysLeft =
      PAYMENT_CONFIG.DEMO_LIMITS.TRIAL_PERIOD_DAYS -
      Math.floor(
        (new Date().getTime() -
          new Date(userState.registrationDate).getTime()) /
          (1000 * 60 * 60 * 24)
      )
    return {
      canAccess: true,
      reason: 'trial',
      details: `Пробный период: ${daysLeft} дней осталось`,
    }
  }

  // 2. Доступ по заданиям
  if (hasTaskRewardAccess(userState)) {
    const rewardTime = new Date(userState.tasksCompleted.lastTaskRewardTime!)
    const expiresIn = Math.ceil(
      (rewardTime.getTime() +
        PAYMENT_CONFIG.DEMO_LIMITS.TASK_REWARD_HOURS * 60 * 60 * 1000 -
        new Date().getTime()) /
        (1000 * 60 * 60)
    )
    return {
      canAccess: true,
      reason: 'task_reward',
      details: `Награда за задание: ${expiresIn}ч осталось`,
    }
  }

  // 3. Счастливые часы
  if (isHappyHour() && !hasUsedHappyHourToday(userState.lastHappyHourUsed)) {
    return {
      canAccess: true,
      reason: 'happy_hour',
      details: 'Счастливый час: 20:00-21:00 МСК',
    }
  }

  // 4. Бесплатные активации
  if (hasFreeActivations(userState, featureId)) {
    const used = userState.activations[featureId] || 0
    const left = PAYMENT_CONFIG.DEMO_LIMITS.FREE_ACTIVATIONS_PER_FEATURE - used
    return {
      canAccess: true,
      reason: 'free_activation',
      details: `Бесплатно: ${left} активаций осталось`,
    }
  }

  return { canAccess: false, reason: 'none' }
}

/**
 * Получает список доступных заданий для получения премиум доступа
 */
export function getAvailableTasks(userState: UserPremiumState): Array<{
  id: string
  title: string
  description: string
  progress: number
  total: number
  completed: boolean
}> {
  const { tasksCompleted } = userState
  const { TASKS } = PAYMENT_CONFIG.DEMO_LIMITS

  return [
    {
      id: 'mood_streak',
      title: 'Серия настроений',
      description: `Отмечайте настроение ${TASKS.MOOD_STREAK_DAYS} дней подряд`,
      progress: Math.min(tasksCompleted.moodStreakDays, TASKS.MOOD_STREAK_DAYS),
      total: TASKS.MOOD_STREAK_DAYS,
      completed: tasksCompleted.moodStreakDays >= TASKS.MOOD_STREAK_DAYS,
    },
    {
      id: 'garden_visits',
      title: 'Садовник',
      description: `Посетите сад ${TASKS.GARDEN_VISITS} раз`,
      progress: Math.min(tasksCompleted.gardenVisits, TASKS.GARDEN_VISITS),
      total: TASKS.GARDEN_VISITS,
      completed: tasksCompleted.gardenVisits >= TASKS.GARDEN_VISITS,
    },
    {
      id: 'sharing',
      title: 'Делитесь радостью',
      description: `Поделитесь садом ${TASKS.SHARING_COUNT} раз`,
      progress: Math.min(tasksCompleted.sharingCount, TASKS.SHARING_COUNT),
      total: TASKS.SHARING_COUNT,
      completed: tasksCompleted.sharingCount >= TASKS.SHARING_COUNT,
    },
  ]
}

/**
 * Получает описание следующей возможности получить премиум бесплатно
 */
export function getNextFreeOpportunity(userState: UserPremiumState): string {
  // Если есть незавершенные задания
  const tasks = getAvailableTasks(userState)
  const incompleteTasks = tasks.filter(task => !task.completed)

  if (incompleteTasks.length > 0) {
    const nextTask = incompleteTasks[0]
    return `Выполните задание "${nextTask.title}" (${nextTask.progress}/${nextTask.total})`
  }

  // Если нет заданий, ждем счастливые часы
  if (!isHappyHour()) {
    return 'Счастливые часы: сегодня в 20:00-21:00 МСК'
  }

  // Если уже использовал счастливые часы сегодня
  if (hasUsedHappyHourToday(userState.lastHappyHourUsed)) {
    return 'Счастливые часы: завтра в 20:00-21:00 МСК'
  }

  return 'Купите полный доступ к премиум функциям'
}
