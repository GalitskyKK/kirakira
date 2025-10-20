/**
 * 🎯 DAILY QUESTS ZUSTAND STORE
 * Store для управления состоянием ежедневных заданий
 */

import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import type { DailyQuest, QuestRewards, QuestStatus } from '@/types/dailyQuests'

// ===============================================
// 🎯 STATE INTERFACES
// ===============================================

interface DailyQuestState {
  // UI состояние
  readonly selectedQuestId: string | null
  readonly showQuestModal: boolean
  readonly isShowingRewardAnimation: boolean
  readonly lastClaimedRewards: QuestRewards | null

  // Кеш данных
  readonly quests: readonly DailyQuest[]
  readonly lastUpdated: Date | null

  // Статистика
  readonly completedToday: number
  readonly totalToday: number
  readonly canClaimBonus: boolean
  readonly bonusRewards: QuestRewards | null

  // Состояние загрузки
  readonly isLoading: boolean
  readonly isRefreshing: boolean
  readonly error: string | null
}

interface DailyQuestActions {
  // UI действия
  selectQuest: (questId: string | null) => void
  openQuestModal: () => void
  closeQuestModal: () => void
  showRewardAnimation: (rewards: QuestRewards) => void
  hideRewardAnimation: () => void

  // Данные
  setQuests: (quests: readonly DailyQuest[]) => void
  updateQuest: (quest: DailyQuest) => void
  updateQuestProgress: (
    questId: string,
    progress: number,
    status?: string
  ) => void
  completeQuest: (questId: string) => void
  claimQuest: (questId: string, claimedAt: Date) => void

  // Статистика
  updateStats: (stats: {
    completedToday: number
    totalToday: number
    canClaimBonus: boolean
    bonusRewards?: QuestRewards | null
  }) => void

  // Состояние загрузки
  setLoading: (loading: boolean) => void
  setRefreshing: (refreshing: boolean) => void
  setError: (error: string | null) => void
  clearError: () => void

  // Утилиты
  reset: () => void
  getQuestById: (questId: string) => DailyQuest | undefined
  getQuestsByCategory: (category: string) => readonly DailyQuest[]
  getQuestsByStatus: (status: string) => readonly DailyQuest[]
  getActiveQuests: () => readonly DailyQuest[]
  getCompletedQuests: () => readonly DailyQuest[]
  getClaimableQuests: () => readonly DailyQuest[]
  getExpiredQuests: () => readonly DailyQuest[]
}

// ===============================================
// 🎯 INITIAL STATE
// ===============================================

const initialState: DailyQuestState = {
  // UI состояние
  selectedQuestId: null,
  showQuestModal: false,
  isShowingRewardAnimation: false,
  lastClaimedRewards: null,

  // Кеш данных
  quests: [],
  lastUpdated: null,

  // Статистика
  completedToday: 0,
  totalToday: 0,
  canClaimBonus: false,
  bonusRewards: null,

  // Состояние загрузки
  isLoading: false,
  isRefreshing: false,
  error: null,
}

// ===============================================
// 🎯 STORE IMPLEMENTATION
// ===============================================

export const useDailyQuestStore = create<DailyQuestState & DailyQuestActions>()(
  devtools(
    (set, get) => ({
      ...initialState,

      // ===============================================
      // 🎯 UI ДЕЙСТВИЯ
      // ===============================================

      selectQuest: questId => {
        set({ selectedQuestId: questId }, false, 'selectQuest')
      },

      openQuestModal: () => {
        set({ showQuestModal: true }, false, 'openQuestModal')
      },

      closeQuestModal: () => {
        set(
          {
            showQuestModal: false,
            selectedQuestId: null,
          },
          false,
          'closeQuestModal'
        )
      },

      showRewardAnimation: rewards => {
        set(
          {
            isShowingRewardAnimation: true,
            lastClaimedRewards: rewards,
          },
          false,
          'showRewardAnimation'
        )
      },

      hideRewardAnimation: () => {
        set(
          {
            isShowingRewardAnimation: false,
            lastClaimedRewards: null,
          },
          false,
          'hideRewardAnimation'
        )
      },

      // ===============================================
      // 📊 ДАННЫЕ
      // ===============================================

      setQuests: quests => {
        set(
          {
            quests,
            lastUpdated: new Date(),
            error: null,
          },
          false,
          'setQuests'
        )
      },

      updateQuest: updatedQuest => {
        set(
          state => ({
            quests: state.quests.map(quest =>
              quest.id === updatedQuest.id ? updatedQuest : quest
            ),
            lastUpdated: new Date(),
          }),
          false,
          'updateQuest'
        )
      },

      updateQuestProgress: (questId, progress, status) => {
        set(
          state => ({
            quests: state.quests.map(quest => {
              if (quest.id === questId) {
                const newProgress = Math.min(progress, quest.targetValue)
                const newStatus =
                  status ||
                  (newProgress >= quest.targetValue
                    ? 'completed'
                    : quest.status)
                const completedAt =
                  newStatus === 'completed' && quest.status !== 'completed'
                    ? new Date()
                    : quest.completedAt

                return {
                  ...quest,
                  currentProgress: newProgress,
                  status: newStatus as QuestStatus,
                  completedAt: completedAt,
                } as DailyQuest
              }
              return quest
            }),
            lastUpdated: new Date(),
          }),
          false,
          'updateQuestProgress'
        )
      },

      completeQuest: questId => {
        set(
          state => ({
            quests: state.quests.map(quest => {
              if (quest.id === questId) {
                return {
                  ...quest,
                  status: 'completed' as QuestStatus,
                  completedAt: new Date(),
                } as DailyQuest
              }
              return quest
            }),
            lastUpdated: new Date(),
          }),
          false,
          'completeQuest'
        )
      },

      claimQuest: (questId, claimedAt) => {
        set(
          state => ({
            quests: state.quests.map(quest => {
              if (quest.id === questId) {
                return {
                  ...quest,
                  status: 'claimed' as QuestStatus,
                  claimedAt,
                } as DailyQuest
              }
              return quest
            }),
            lastUpdated: new Date(),
          }),
          false,
          'claimQuest'
        )
      },

      // ===============================================
      // 📈 СТАТИСТИКА
      // ===============================================

      updateStats: stats => {
        set(
          {
            completedToday: stats.completedToday,
            totalToday: stats.totalToday,
            canClaimBonus: stats.canClaimBonus,
            bonusRewards: stats.bonusRewards || null,
          },
          false,
          'updateStats'
        )
      },

      // ===============================================
      // 🔄 СОСТОЯНИЕ ЗАГРУЗКИ
      // ===============================================

      setLoading: loading => {
        set({ isLoading: loading }, false, 'setLoading')
      },

      setRefreshing: refreshing => {
        set({ isRefreshing: refreshing }, false, 'setRefreshing')
      },

      setError: error => {
        set({ error, isLoading: false, isRefreshing: false }, false, 'setError')
      },

      clearError: () => {
        set({ error: null }, false, 'clearError')
      },

      // ===============================================
      // 🎯 УТИЛИТЫ
      // ===============================================

      reset: () => {
        set(initialState, false, 'reset')
      },

      getQuestById: questId => {
        const state = get()
        return state.quests.find(quest => quest.id === questId)
      },

      getQuestsByCategory: category => {
        const state = get()
        return state.quests.filter(quest => quest.questCategory === category)
      },

      getQuestsByStatus: status => {
        const state = get()
        return state.quests.filter(quest => quest.status === status)
      },

      getActiveQuests: () => {
        const state = get()
        return state.quests.filter(quest => quest.status === 'active')
      },

      getCompletedQuests: () => {
        const state = get()
        return state.quests.filter(quest => quest.status === 'completed')
      },

      getClaimableQuests: () => {
        const state = get()
        return state.quests.filter(
          quest => quest.status === 'completed' && quest.expiresAt > new Date()
        )
      },

      getExpiredQuests: () => {
        const state = get()
        return state.quests.filter(quest => quest.status === 'expired')
      },
    }),
    {
      name: 'daily-quest-store',
      partialize: (state: DailyQuestState & DailyQuestActions) => ({
        // Сохраняем только UI состояние в localStorage
        selectedQuestId: state.selectedQuestId,
        showQuestModal: state.showQuestModal,
      }),
    }
  )
)

// ===============================================
// 🎯 SELECTORS
// ===============================================

/**
 * Селектор для получения прогресса выполнения заданий
 */
export const useQuestProgress = () => {
  const quests = useDailyQuestStore(state => state.quests)
  const completedToday = useDailyQuestStore(state => state.completedToday)
  const totalToday = useDailyQuestStore(state => state.totalToday)

  const activeQuests = quests.filter(quest => quest.status === 'active')
  const completedQuests = quests.filter(
    quest => quest.status === 'completed' || quest.status === 'claimed'
  )

  const overallProgress = quests.reduce(
    (total, quest) => {
      return {
        completed: total.completed + quest.currentProgress,
        target: total.target + quest.targetValue,
      }
    },
    { completed: 0, target: 0 }
  )

  const completionRate =
    totalToday > 0 ? Math.round((completedToday / totalToday) * 100) : 0
  const overallPercentage =
    overallProgress.target > 0
      ? Math.round((overallProgress.completed / overallProgress.target) * 100)
      : 0

  return {
    activeQuests,
    completedQuests,
    completedToday,
    totalToday,
    completionRate,
    overallProgress,
    overallPercentage,
  }
}

/**
 * Селектор для получения наград
 */
export const useQuestRewards = () => {
  const quests = useDailyQuestStore(state => state.quests)
  const canClaimBonus = useDailyQuestStore(state => state.canClaimBonus)
  const bonusRewards = useDailyQuestStore(state => state.bonusRewards)

  const claimedQuests = quests.filter(quest => quest.status === 'claimed')
  const totalRewards = claimedQuests.reduce(
    (total, quest) => ({
      sprouts: total.sprouts + quest.rewards.sprouts,
      gems: total.gems + (quest.rewards.gems || 0),
      experience: total.experience + quest.rewards.experience,
    }),
    { sprouts: 0, gems: 0, experience: 0 }
  )

  const claimableQuests = quests.filter(
    quest => quest.status === 'completed' && quest.expiresAt > new Date()
  )

  const potentialRewards = claimableQuests.reduce(
    (total, quest) => ({
      sprouts: total.sprouts + quest.rewards.sprouts,
      gems: total.gems + (quest.rewards.gems || 0),
      experience: total.experience + quest.rewards.experience,
    }),
    { sprouts: 0, gems: 0, experience: 0 }
  )

  return {
    totalRewards,
    potentialRewards,
    canClaimBonus,
    bonusRewards,
    claimableQuests: claimableQuests.length,
  }
}

/**
 * Селектор для получения UI состояния
 */
export const useQuestUI = () => {
  const selectedQuestId = useDailyQuestStore(state => state.selectedQuestId)
  const showQuestModal = useDailyQuestStore(state => state.showQuestModal)
  const isShowingRewardAnimation = useDailyQuestStore(
    state => state.isShowingRewardAnimation
  )
  const showRewardAnimation = useDailyQuestStore(
    state => state.showRewardAnimation
  )
  const hideRewardAnimation = useDailyQuestStore(
    state => state.hideRewardAnimation
  )
  const lastClaimedRewards = useDailyQuestStore(
    state => state.lastClaimedRewards
  )
  const isLoading = useDailyQuestStore(state => state.isLoading)
  const isRefreshing = useDailyQuestStore(state => state.isRefreshing)
  const error = useDailyQuestStore(state => state.error)

  return {
    selectedQuestId,
    showQuestModal,
    isShowingRewardAnimation,
    showRewardAnimation,
    hideRewardAnimation,
    lastClaimedRewards,
    isLoading,
    isRefreshing,
    error,
  }
}

/**
 * Селектор для получения статистики по категориям
 */
export const useQuestCategoryStats = () => {
  const quests = useDailyQuestStore(state => state.quests)

  const categoryStats = quests.reduce(
    (stats, quest) => {
      const category = quest.questCategory
      if (!stats[category]) {
        stats[category] = {
          total: 0,
          completed: 0,
          active: 0,
          claimed: 0,
        }
      }

      stats[category].total++

      switch (quest.status) {
        case 'active':
          stats[category].active++
          break
        case 'completed':
          stats[category].completed++
          break
        case 'claimed':
          stats[category].claimed++
          break
      }

      return stats
    },
    {} as Record<
      string,
      { total: number; completed: number; active: number; claimed: number }
    >
  )

  return categoryStats
}
