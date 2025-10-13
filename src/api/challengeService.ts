/**
 * 🏆 Challenge API Service Layer
 * Инкапсулирует все API запросы связанные с челленджами
 */

import { authenticatedFetch } from '@/utils/apiClient'
import type {
  Challenge,
  ChallengeParticipant,
  ChallengeLeaderboardEntry,
  ChallengeProgress,
  ChallengeMetric,
  ChallengeListResponse,
  ChallengeDetailsResponse,
  JoinChallengeResponse,
  ChallengeProgressResponse,
} from '@/types/challenges'

// ============================================
// ТИПЫ ДЛЯ API ЗАПРОСОВ И ОТВЕТОВ
// ============================================

export interface LoadChallengesRequest {
  readonly telegramId: number
}

export interface LoadChallengesResult {
  readonly challenges: readonly Challenge[]
  readonly userParticipations: readonly ChallengeParticipant[]
}

export interface LoadChallengeDetailsRequest {
  readonly challengeId: string
  readonly telegramId: number
}

export interface LoadChallengeDetailsResult {
  readonly challenge: Challenge
  readonly leaderboard: readonly ChallengeLeaderboardEntry[]
  readonly progress: ChallengeProgress | null
  readonly participation: ChallengeParticipant | null
}

export interface JoinChallengeRequest {
  readonly challengeId: string
  readonly telegramId: number
}

export interface JoinChallengeResult {
  readonly participation: ChallengeParticipant
  readonly challenge: Challenge
}

export interface UpdateProgressRequest {
  readonly challengeId: string
  readonly telegramId: number
  readonly metric: ChallengeMetric
  readonly value: number
}

export interface UpdateProgressResult {
  readonly progress: ChallengeProgress
  readonly leaderboard: readonly ChallengeLeaderboardEntry[]
}

// ============================================
// УТИЛИТЫ ДЛЯ КОНВЕРТАЦИИ ДАННЫХ
// ============================================

/**
 * Конвертирует строковые даты в объекты Date
 */
function convertChallengeDates(challenge: any): Challenge {
  return {
    ...challenge,
    startDate: new Date(challenge.startDate),
    endDate: new Date(challenge.endDate),
    createdAt: new Date(challenge.createdAt),
    updatedAt: new Date(challenge.updatedAt),
  }
}

/**
 * Конвертирует строковые даты участия в объекты Date
 */
function convertParticipationDates(participation: any): ChallengeParticipant {
  return {
    ...participation,
    joinedAt: new Date(participation.joinedAt),
    lastUpdateAt: new Date(participation.lastUpdateAt),
    completedAt: participation.completedAt
      ? new Date(participation.completedAt)
      : undefined,
  }
}

// ============================================
// API ФУНКЦИИ
// ============================================

/**
 * Загружает список челленджей и участия пользователя
 */
export async function loadChallenges(
  request: LoadChallengesRequest
): Promise<LoadChallengesResult> {
  try {
    const response = await authenticatedFetch(
      `/api/challenges?action=list&telegramId=${request.telegramId}`
    )

    const result = (await response.json()) as ChallengeListResponse

    if (!result.success) {
      throw new Error(result.error || 'Ошибка загрузки челленджей')
    }

    if (!result.data) {
      return { challenges: [], userParticipations: [] }
    }

    // Конвертируем даты
    const challenges = result.data.challenges.map(convertChallengeDates)
    const participations = result.data.userParticipations.map(
      convertParticipationDates
    )

    return {
      challenges,
      userParticipations: participations,
    }
  } catch (error) {
    console.error('Failed to load challenges:', error)
    throw error
  }
}

/**
 * Загружает детали конкретного челленджа
 */
export async function loadChallengeDetails(
  request: LoadChallengeDetailsRequest
): Promise<LoadChallengeDetailsResult> {
  try {
    const response = await authenticatedFetch(
      `/api/challenges?action=details&challengeId=${request.challengeId}&telegramId=${request.telegramId}`
    )

    const result = (await response.json()) as ChallengeDetailsResponse

    if (!result.success) {
      throw new Error(result.error || 'Ошибка загрузки деталей челленджа')
    }

    if (!result.data) {
      throw new Error('Нет данных о челлендже')
    }

    // Конвертируем даты
    const challenge = convertChallengeDates(result.data.challenge)
    const participation = result.data.participation
      ? convertParticipationDates(result.data.participation)
      : null

    return {
      challenge,
      leaderboard: result.data.leaderboard,
      progress: result.data.progress,
      participation,
    }
  } catch (error) {
    console.error('Failed to load challenge details:', error)
    throw error
  }
}

/**
 * Присоединяется к челленджу
 */
export async function joinChallenge(
  request: JoinChallengeRequest
): Promise<JoinChallengeResult> {
  try {
    const response = await authenticatedFetch('/api/challenges?action=join', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    })

    const result = (await response.json()) as JoinChallengeResponse

    if (!result.success) {
      throw new Error(result.error || 'Ошибка присоединения к челленджу')
    }

    if (!result.data) {
      throw new Error('Нет данных об участии')
    }

    // Конвертируем даты
    const participation = convertParticipationDates(result.data.participation)
    const challenge = convertChallengeDates(result.data.challenge)

    return {
      participation,
      challenge,
    }
  } catch (error) {
    console.error('Failed to join challenge:', error)
    throw error
  }
}

/**
 * Обновляет прогресс в челлендже
 */
export async function updateProgress(
  request: UpdateProgressRequest
): Promise<UpdateProgressResult> {
  try {
    const response = await authenticatedFetch(
      '/api/challenges?action=update_progress',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      }
    )

    const result = (await response.json()) as ChallengeProgressResponse

    if (!result.success) {
      throw new Error(result.error || 'Ошибка обновления прогресса')
    }

    if (!result.data) {
      throw new Error('Нет данных о прогрессе')
    }

    return {
      progress: result.data.progress,
      leaderboard: result.data.leaderboard,
    }
  } catch (error) {
    console.error('Failed to update progress:', error)
    throw error
  }
}

/**
 * Обновляет лидерборд челленджа
 */
export async function refreshLeaderboard(
  challengeId: string,
  telegramId: number
): Promise<{
  leaderboard: readonly ChallengeLeaderboardEntry[]
  progress: ChallengeProgress | null
}> {
  try {
    const response = await authenticatedFetch(
      `/api/challenges?action=details&challengeId=${challengeId}&telegramId=${telegramId}`
    )

    const result = (await response.json()) as ChallengeDetailsResponse

    if (!result.success || !result.data) {
      return { leaderboard: [], progress: null }
    }

    return {
      leaderboard: result.data.leaderboard,
      progress: result.data.progress,
    }
  } catch (error) {
    console.error('Failed to refresh leaderboard:', error)
    throw error
  }
}
