import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import type { CompanionEmotion, CompanionId, MoodType } from '@/types'
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

  setActiveCompanion: (id: CompanionId) => void
  setVisible: (visible: boolean) => void
  setBaseEmotion: (emotion: CompanionBaseEmotion) => void
  triggerCelebration: (durationMs?: number) => void
  clearCelebration: () => void
  setLastMood: (mood: MoodType | null) => void
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

