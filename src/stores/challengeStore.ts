/**
 * Zustand store для управления состоянием челленджей
 */

import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import type {
  Challenge,
  ChallengeParticipant,
  ChallengeLeaderboardEntry,
  ChallengeProgress,
  ChallengeListResponse,
  ChallengeDetailsResponse,
  JoinChallengeResponse,
  ChallengeProgressResponse,
  ChallengeMetric,
  UserChallengeStats,
} from '@/types/challenges'

interface ChallengeStore {
  // State
  readonly challenges: readonly Challenge[]
  readonly userParticipations: readonly ChallengeParticipant[]
  readonly currentChallenge: Challenge | null
  readonly currentLeaderboard: readonly ChallengeLeaderboardEntry[]
  readonly currentProgress: ChallengeProgress | null
  readonly userStats: UserChallengeStats | null
  readonly isLoading: boolean
  readonly error: string | null

  // Actions
  loadChallenges: (telegramId: number) => Promise<void>
  loadChallengeDetails: (
    challengeId: string,
    telegramId: number
  ) => Promise<void>
  joinChallenge: (challengeId: string, telegramId: number) => Promise<boolean>
  updateProgress: (
    challengeId: string,
    telegramId: number,
    metric: ChallengeMetric,
    value: number
  ) => Promise<void>
  refreshLeaderboard: (challengeId: string, telegramId: number) => Promise<void>
  clearCurrentChallenge: () => void
  setError: (error: string | null) => void

  // Getters
  getParticipationForChallenge: (
    challengeId: string
  ) => ChallengeParticipant | null
  getUserRankInChallenge: (
    challengeId: string,
    telegramId: number
  ) => number | null
  getActiveChallenges: () => readonly Challenge[]
  getCompletedChallenges: () => readonly Challenge[]
  isUserParticipating: (challengeId: string) => boolean
  canJoinChallenge: (
    challenge: Challenge,
    telegramId: number
  ) => { canJoin: boolean; reason?: string }
}

export const useChallengeStore = create<ChallengeStore>()(
  subscribeWithSelector((set, get) => ({
    // Initial state
    challenges: [],
    userParticipations: [],
    currentChallenge: null,
    currentLeaderboard: [],
    currentProgress: null,
    userStats: null,
    isLoading: false,
    error: null,

    // Load challenges list
    loadChallenges: async (telegramId: number) => {
      set({ isLoading: true, error: null })

      try {
        const response = await fetch(
          `/api/challenges?action=list&telegramId=${telegramId}`
        )
        const result = (await response.json()) as ChallengeListResponse

        if (!result.success) {
          throw new Error(result.error || 'Ошибка загрузки челленджей')
        }

        if (result.data) {
          console.log('🔄 Converting challenge dates from API response:')

          // Convert dates from strings
          const challenges = result.data.challenges.map(challenge => {
            console.log(`📅 Challenge ${challenge.title}:`)
            console.log(`   startDate (string): ${challenge.startDate}`)
            console.log(`   endDate (string): ${challenge.endDate}`)

            const convertedChallenge = {
              ...challenge,
              startDate: new Date(challenge.startDate),
              endDate: new Date(challenge.endDate),
              createdAt: new Date(challenge.createdAt),
              updatedAt: new Date(challenge.updatedAt),
            }

            console.log(
              `   startDate (Date): ${convertedChallenge.startDate.toISOString()}`
            )
            console.log(
              `   startDate (getTime): ${convertedChallenge.startDate.getTime()}`
            )

            return convertedChallenge
          })

          const participations = result.data.userParticipations.map(
            participation => {
              console.log(`👤 Participation for ${participation.challengeId}:`)
              console.log(`   joinedAt (string): ${participation.joinedAt}`)

              const convertedParticipation = {
                ...participation,
                joinedAt: new Date(participation.joinedAt),
                lastUpdateAt: new Date(participation.lastUpdateAt),
                completedAt: participation.completedAt
                  ? new Date(participation.completedAt)
                  : undefined,
              }

              console.log(
                `   joinedAt (Date): ${convertedParticipation.joinedAt.toISOString()}`
              )
              console.log(
                `   joinedAt (getTime): ${convertedParticipation.joinedAt.getTime()}`
              )

              return convertedParticipation
            }
          )

          set({
            challenges,
            userParticipations: participations,
            isLoading: false,
          })

          console.log(
            `✅ Loaded ${challenges.length} challenges, ${participations.length} participations`
          )
        }
      } catch (error) {
        console.error('Failed to load challenges:', error)
        set({
          error:
            error instanceof Error
              ? error.message
              : 'Ошибка загрузки челленджей',
          isLoading: false,
        })
      }
    },

    // Load challenge details
    loadChallengeDetails: async (challengeId: string, telegramId: number) => {
      console.log('🚀 STORE: Making API request to load challenge details', {
        challengeId,
        telegramId,
      })
      set({ isLoading: true, error: null })

      try {
        const apiUrl = `/api/challenges?action=details&challengeId=${challengeId}&telegramId=${telegramId}`
        console.log('🚀 STORE: Fetching URL:', apiUrl)

        const response = await fetch(apiUrl)

        console.log('🚀 STORE: Response received:', {
          status: response.status,
          ok: response.ok,
          url: response.url,
        })
        const result: ChallengeDetailsResponse = await response.json()

        console.log('🚀 STORE: API result received:', {
          success: result.success,
          hasData: !!result.data,
          hasLeaderboard: !!result.data?.leaderboard,
          leaderboardLength: result.data?.leaderboard?.length || 0,
          firstLeaderboardEntry: result.data?.leaderboard?.[0],
        })

        if (!result.success) {
          throw new Error(result.error || 'Ошибка загрузки деталей челленджа')
        }

        if (result.data) {
          console.log('🔄 Converting challenge details dates:')
          console.log(`📅 Challenge ${result.data.challenge.title}:`)
          console.log(
            `   startDate (string): ${result.data.challenge.startDate}`
          )

          const challenge = {
            ...result.data.challenge,
            startDate: new Date(result.data.challenge.startDate),
            endDate: new Date(result.data.challenge.endDate),
            createdAt: new Date(result.data.challenge.createdAt),
            updatedAt: new Date(result.data.challenge.updatedAt),
          }

          console.log(
            `   startDate (Date): ${challenge.startDate.toISOString()}`
          )
          console.log(
            `   startDate (getTime): ${challenge.startDate.getTime()}`
          )

          const participation = result.data.participation
            ? {
                ...result.data.participation,
                joinedAt: new Date(result.data.participation.joinedAt),
                lastUpdateAt: new Date(result.data.participation.lastUpdateAt),
                completedAt: result.data.participation.completedAt
                  ? new Date(result.data.participation.completedAt)
                  : undefined,
              }
            : null

          if (participation && result.data.participation) {
            console.log(`👤 Participation details:`)
            console.log(
              `   joinedAt (string): ${result.data.participation.joinedAt}`
            )
            console.log(
              `   joinedAt (Date): ${participation.joinedAt.toISOString()}`
            )
            console.log(
              `   joinedAt (getTime): ${participation.joinedAt.getTime()}`
            )
          }

          set({
            currentChallenge: challenge,
            currentLeaderboard: result.data.leaderboard,
            currentProgress: result.data.progress,
            isLoading: false,
          })

          // Update participation in list if exists
          if (participation) {
            const { userParticipations } = get()
            const updatedParticipations = userParticipations.filter(
              p => p.challengeId !== challengeId
            )
            updatedParticipations.push(participation)
            set({ userParticipations: updatedParticipations })
          }

          console.log(`✅ Loaded challenge details: ${challenge.title}`)
        }
      } catch (error) {
        console.error('Failed to load challenge details:', error)
        set({
          error:
            error instanceof Error
              ? error.message
              : 'Ошибка загрузки деталей челленджа',
          isLoading: false,
        })
      }
    },

    // Join challenge
    joinChallenge: async (
      challengeId: string,
      telegramId: number
    ): Promise<boolean> => {
      set({ isLoading: true, error: null })

      try {
        const response = await fetch('/api/challenges?action=join', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            challengeId,
            telegramId,
          }),
        })

        const result: JoinChallengeResponse = await response.json()

        if (!result.success) {
          throw new Error(result.error || 'Ошибка присоединения к челленджу')
        }

        if (result.data) {
          const participation = {
            ...result.data.participation,
            joinedAt: new Date(result.data.participation.joinedAt),
            lastUpdateAt: new Date(result.data.participation.lastUpdateAt),
          }

          // Update participations list
          const { userParticipations } = get()
          const updatedParticipations = [
            ...userParticipations.filter(p => p.challengeId !== challengeId),
            participation,
          ]

          set({
            userParticipations: updatedParticipations,
            isLoading: false,
          })

          console.log(`✅ Joined challenge: ${result.data.challenge.title}`)
          return true
        }

        set({ isLoading: false })
        return false
      } catch (error) {
        console.error('Failed to join challenge:', error)
        set({
          error:
            error instanceof Error
              ? error.message
              : 'Ошибка присоединения к челленджу',
          isLoading: false,
        })
        return false
      }
    },

    // Update progress
    updateProgress: async (
      challengeId: string,
      telegramId: number,
      metric: ChallengeMetric,
      value: number
    ) => {
      try {
        const response = await fetch('/api/challenges?action=update_progress', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            challengeId,
            telegramId,
            metric,
            value,
          }),
        })

        const result: ChallengeProgressResponse = await response.json()

        if (!result.success) {
          throw new Error(result.error || 'Ошибка обновления прогресса')
        }

        if (result.data) {
          set({
            currentProgress: result.data.progress,
            currentLeaderboard: result.data.leaderboard,
          })

          // Update participation in list
          const { userParticipations } = get()
          const updatedParticipations = userParticipations.map(
            participation => {
              if (
                participation.challengeId === challengeId &&
                participation.telegramId === telegramId
              ) {
                return {
                  ...participation,
                  currentProgress: result.data?.progress.progress ?? 0,
                  lastUpdateAt: new Date(),
                }
              }
              return participation
            }
          )

          set({ userParticipations: updatedParticipations })

          console.log(
            `✅ Updated progress for challenge ${challengeId}: ${value}`
          )
        }
      } catch (error) {
        console.error('Failed to update progress:', error)
        set({
          error:
            error instanceof Error
              ? error.message
              : 'Ошибка обновления прогресса',
        })
      }
    },

    // Refresh leaderboard
    refreshLeaderboard: async (challengeId: string, telegramId: number) => {
      console.log('🔄 STORE: Refreshing leaderboard via API', {
        challengeId,
        telegramId,
      })
      try {
        const apiUrl = `/api/challenges?action=details&challengeId=${challengeId}&telegramId=${telegramId}`
        console.log('🔄 STORE: Fetching leaderboard from:', apiUrl)

        const response = await fetch(apiUrl)

        console.log('🔄 STORE: Leaderboard response:', {
          status: response.status,
          ok: response.ok,
        })
        const result: ChallengeDetailsResponse = await response.json()

        console.log('🔄 STORE: Leaderboard API result:', {
          success: result.success,
          hasLeaderboard: !!result.data?.leaderboard,
          leaderboardLength: result.data?.leaderboard?.length || 0,
          firstEntry: result.data?.leaderboard?.[0],
        })

        if (result.success && result.data) {
          set({
            currentLeaderboard: result.data.leaderboard,
            currentProgress: result.data.progress,
          })
        }
      } catch (error) {
        console.error('Failed to refresh leaderboard:', error)
      }
    },

    // Clear current challenge
    clearCurrentChallenge: () => {
      set({
        currentChallenge: null,
        currentLeaderboard: [],
        currentProgress: null,
      })
    },

    // Set error
    setError: (error: string | null) => {
      set({ error })
    },

    // Getters
    getParticipationForChallenge: (challengeId: string) => {
      const { userParticipations } = get()
      return userParticipations.find(p => p.challengeId === challengeId) || null
    },

    getUserRankInChallenge: (challengeId: string, telegramId: number) => {
      const { currentLeaderboard, currentChallenge } = get()

      if (currentChallenge?.id !== challengeId) {
        return null
      }

      const entry = currentLeaderboard.find(
        entry => entry.user.telegramId === telegramId
      )
      return entry?.rank || null
    },

    getActiveChallenges: () => {
      const { challenges } = get()
      const now = new Date()

      return challenges.filter(
        challenge =>
          challenge.status === 'active' &&
          challenge.startDate <= now &&
          challenge.endDate > now
      )
    },

    getCompletedChallenges: () => {
      const { challenges, userParticipations } = get()
      const completedParticipationIds = new Set(
        userParticipations
          .filter(p => p.status === 'completed')
          .map(p => p.challengeId)
      )

      return challenges.filter(
        challenge =>
          completedParticipationIds.has(challenge.id) ||
          challenge.status === 'completed'
      )
    },

    isUserParticipating: (challengeId: string) => {
      const { userParticipations } = get()
      return userParticipations.some(
        p => p.challengeId === challengeId && p.status !== 'dropped'
      )
    },

    canJoinChallenge: (challenge: Challenge, _telegramId: number) => {
      const { userParticipations } = get()
      const now = new Date()

      // Check if already participating
      const existingParticipation = userParticipations.find(
        p => p.challengeId === challenge.id && p.status !== 'dropped'
      )

      if (existingParticipation) {
        return { canJoin: false, reason: 'Вы уже участвуете в этом челлендже' }
      }

      // Check if challenge is active
      if (challenge.status !== 'active') {
        return { canJoin: false, reason: 'Челлендж не активен' }
      }

      // Check time bounds
      if (now < challenge.startDate) {
        return { canJoin: false, reason: 'Челлендж еще не начался' }
      }

      if (now >= challenge.endDate) {
        return { canJoin: false, reason: 'Челлендж уже завершен' }
      }

      // Check participant limit
      if (challenge.maxParticipants) {
        // Note: We don't have current participant count in this store
        // This should be checked on the server side
      }

      return { canJoin: true }
    },
  }))
)

// Subscribe to challenge store changes for debugging
// if (process.env['NODE_ENV'] === 'development') {
//   useChallengeStore.subscribe(
//     state => state.challenges,
//     challenges => {
//       console.log('📊 Challenge store - challenges updated:', challenges.length)
//     }
//   )

//   useChallengeStore.subscribe(
//     state => state.currentChallenge,
//     currentChallenge => {
//       if (currentChallenge) {
//         console.log(
//           '🎯 Challenge store - current challenge:',
//           currentChallenge.title
//         )
//       }
//     }
//   )
// }
