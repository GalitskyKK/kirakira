/**
 * 🏆 Challenge Reward Store
 * Store для управления показом модалки награды за челлендж
 */

import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import type { ChallengeRewards } from '@/types/challenges'

interface ChallengeRewardState {
  readonly isShowingReward: boolean
  readonly lastRewards: ChallengeRewards | null
  readonly challengeTitle: string | null
}

interface ChallengeRewardActions {
  showReward: (rewards: ChallengeRewards, challengeTitle: string) => void
  hideReward: () => void
}

export const useChallengeRewardStore = create<
  ChallengeRewardState & ChallengeRewardActions
>()(
  devtools(
    (set) => ({
      // State
      isShowingReward: false,
      lastRewards: null,
      challengeTitle: null,

      // Actions
      showReward: (rewards, challengeTitle) => {
        set({
          isShowingReward: true,
          lastRewards: rewards,
          challengeTitle,
        })
      },

      hideReward: () => {
        set({
          isShowingReward: false,
          lastRewards: null,
          challengeTitle: null,
        })
      },
    }),
    { name: 'ChallengeRewardStore' }
  )
)

