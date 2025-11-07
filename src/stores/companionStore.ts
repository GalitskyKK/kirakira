import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import type {
  CompanionAmbientAnimation,
  CompanionEmotion,
  CompanionId,
  CompanionReactionType,
  MoodType,
} from '@/types'
import { loadCompanionSelection, saveCompanionSelection } from '@/utils/storage'

type CompanionBaseEmotion = Exclude<CompanionEmotion, 'celebration'>

interface CompanionState {
  readonly activeCompanionId: CompanionId
  readonly isVisible: boolean
  readonly baseEmotion: CompanionBaseEmotion
  readonly currentEmotion: CompanionEmotion
  readonly isCelebrating: boolean
  readonly celebrationUntil: number | null
  readonly lastMood: MoodType | null
  readonly isInfoOpen: boolean
  readonly activeAmbientAnimation: CompanionAmbientAnimation | null
  readonly activeReaction: CompanionReactionType | null

  setActiveCompanion: (id: CompanionId) => void
  setVisible: (visible: boolean) => void
  setBaseEmotion: (emotion: CompanionBaseEmotion) => void
  triggerCelebration: (durationMs?: number) => void
  clearCelebration: () => void
  setLastMood: (mood: MoodType | null) => void
  toggleInfo: () => void
  setInfoOpen: (open: boolean) => void
  triggerAmbientAnimation: (animation: CompanionAmbientAnimation) => void
  clearAmbientAnimation: () => void
  triggerReaction: (reaction: CompanionReactionType) => void
  clearReaction: () => void
}

function persistSelectionState(
  activeCompanionId: CompanionId,
  isVisible: boolean
): void {
  saveCompanionSelection({ activeCompanionId, isVisible })
}

const persistedSelection = loadCompanionSelection()

export const useCompanionStore = create<CompanionState>()(
  subscribeWithSelector(set => ({
    activeCompanionId: persistedSelection?.activeCompanionId ?? 'lumina',
    isVisible: persistedSelection?.isVisible ?? true,
    baseEmotion: 'neutral',
    currentEmotion: 'neutral',
    isCelebrating: false,
    celebrationUntil: null,
    lastMood: null,
    isInfoOpen: false,
    activeAmbientAnimation: null,
    activeReaction: null,

    setActiveCompanion: (id: CompanionId) => {
      set(state => {
        if (state.activeCompanionId === id) {
          persistSelectionState(id, state.isVisible)
          return state
        }

        persistSelectionState(id, state.isVisible)
        return {
          activeCompanionId: id,
        }
      })
    },

    setVisible: (visible: boolean) => {
      set(state => {
        if (state.isVisible === visible) {
          persistSelectionState(state.activeCompanionId, visible)
          return state
        }

        persistSelectionState(state.activeCompanionId, visible)
        return {
          isVisible: visible,
        }
      })
    },

    setBaseEmotion: (emotion: CompanionBaseEmotion) => {
      set(state => ({
        baseEmotion: emotion,
        currentEmotion: state.isCelebrating ? state.currentEmotion : emotion,
      }))
    },

    triggerCelebration: (durationMs: number = 2800) => {
      set({
        isCelebrating: true,
        currentEmotion: 'celebration',
        celebrationUntil: Date.now() + durationMs,
      })
    },

    clearCelebration: () => {
      set(state => ({
        isCelebrating: false,
        currentEmotion: state.baseEmotion,
        celebrationUntil: null,
      }))
    },

    setLastMood: (mood: MoodType | null) => {
      set({
        lastMood: mood,
      })
    },

    toggleInfo: () => {
      set(state => ({
        isInfoOpen: !state.isInfoOpen,
      }))
    },

    setInfoOpen: (open: boolean) => {
      set({
        isInfoOpen: open,
      })
    },

    triggerAmbientAnimation: (animation: CompanionAmbientAnimation) => {
      set({
        activeAmbientAnimation: animation,
      })
    },

    clearAmbientAnimation: () => {
      set({
        activeAmbientAnimation: null,
      })
    },

    triggerReaction: (reaction: CompanionReactionType) => {
      set({
        activeReaction: reaction,
      })
    },

    clearReaction: () => {
      set({
        activeReaction: null,
      })
    },
  }))
)

export function useCompanionVisibility() {
  return useCompanionStore(state => ({
    isVisible: state.isVisible,
    setVisible: state.setVisible,
  }))
}

export function useCompanionEmotion() {
  return useCompanionStore(state => ({
    currentEmotion: state.currentEmotion,
    isCelebrating: state.isCelebrating,
  }))
}

export function useCompanionInfoPanel() {
  return useCompanionStore(state => ({
    isInfoOpen: state.isInfoOpen,
    toggleInfo: state.toggleInfo,
    setInfoOpen: state.setInfoOpen,
  }))
}

