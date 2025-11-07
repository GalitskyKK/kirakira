import { useEffect, useMemo, useRef } from 'react'
import { getCompanionDefinition } from '@/data/companions'
import { useCompanionStore } from '@/stores/companionStore'
import { useGardenState } from './useGardenState'
import { useMoodTracking } from './useMoodTracking'
import type {
  CompanionAmbientAnimation,
  CompanionReactionType,
  GardenElement,
  MoodType,
  RarityLevel,
} from '@/types'

interface ElementMeta {
  readonly count: number
  readonly latestId: string | null
  readonly latestRarity: RarityLevel | null
}

function extractLatestElement(elements: readonly GardenElement[]): GardenElement | null {
  if (elements.length === 0) {
    return null
  }

  return elements.reduce<GardenElement | null>((latest, element) => {
    if (latest === null) {
      return element
    }
    return element.unlockDate > latest.unlockDate ? element : latest
  }, null)
}

function buildElementMeta(elements: readonly GardenElement[] | undefined): ElementMeta {
  if (!elements || elements.length === 0) {
    return {
      count: 0,
      latestId: null,
      latestRarity: null,
    }
  }

  const latest = extractLatestElement(elements)

  return {
    count: elements.length,
    latestId: latest?.id ?? null,
    latestRarity: latest?.rarity ?? null,
  }
}

export function useCompanionController(): void {
  const activeCompanionId = useCompanionStore(state => state.activeCompanionId)
  const setBaseEmotion = useCompanionStore(state => state.setBaseEmotion)
  const setLastMood = useCompanionStore(state => state.setLastMood)
  const triggerCelebration = useCompanionStore(state => state.triggerCelebration)
  const clearCelebration = useCompanionStore(state => state.clearCelebration)
  const celebrationUntil = useCompanionStore(state => state.celebrationUntil)
  const triggerAmbientAnimation = useCompanionStore(
    state => state.triggerAmbientAnimation
  )
  const clearAmbientAnimation = useCompanionStore(
    state => state.clearAmbientAnimation
  )
  const triggerReaction = useCompanionStore(state => state.triggerReaction)
  const clearReaction = useCompanionStore(state => state.clearReaction)
  const activeAmbientAnimation = useCompanionStore(
    state => state.activeAmbientAnimation
  )
  const activeReaction = useCompanionStore(state => state.activeReaction)

  const { todaysMood } = useMoodTracking()
  const { garden } = useGardenState()

  const mood: MoodType | null = todaysMood?.mood ?? null

  useEffect(() => {
    const definition = getCompanionDefinition(activeCompanionId)
    const moodKey = mood ?? 'default'
    const targetEmotion = definition.moodMap[moodKey] ?? definition.moodMap.default

    setBaseEmotion(targetEmotion === 'celebration' ? 'neutral' : targetEmotion)
    setLastMood(mood)
  }, [activeCompanionId, mood, setBaseEmotion, setLastMood])

  const elementMeta = useMemo(() => buildElementMeta(garden?.elements), [garden])
  const previousMetaRef = useRef<ElementMeta>(elementMeta)
  const hasInitializedRef = useRef<boolean>(false)
  const previousMoodEntryRef = useRef<string | null>(null)
  const ambientTimerRef = useRef<number | null>(null)
  const ambientClearRef = useRef<number | null>(null)
  const reactionClearRef = useRef<number | null>(null)

  useEffect(() => {
    if (!hasInitializedRef.current) {
      hasInitializedRef.current = true
      previousMetaRef.current = elementMeta
      return
    }

    const previousMeta = previousMetaRef.current
    const hasNewElement = elementMeta.count > previousMeta.count
    const isDifferentElement = elementMeta.latestId !== previousMeta.latestId

    if (hasNewElement && isDifferentElement) {
      const celebrationDuration = elementMeta.latestRarity
        ? elementMeta.latestRarity === 'rare' ||
          elementMeta.latestRarity === 'epic' ||
          elementMeta.latestRarity === 'legendary'
          ? 3600
          : 2600
        : 2600

      triggerCelebration(celebrationDuration)
      triggerReaction('garden-celebration')
    }

    previousMetaRef.current = elementMeta
  }, [elementMeta, triggerCelebration, triggerReaction])

  useEffect(() => {
    if (!celebrationUntil) {
      return
    }

    const remaining = Math.max(celebrationUntil - Date.now(), 0)
    if (remaining === 0) {
      clearCelebration()
      return
    }

    const timeoutId = window.setTimeout(() => {
      clearCelebration()
    }, remaining)

    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [celebrationUntil, clearCelebration])

  useEffect(() => {
    const moodEntryId = todaysMood?.id ?? null
    if (moodEntryId === null) {
      previousMoodEntryRef.current = null
      return
    }

    if (previousMoodEntryRef.current === null) {
      previousMoodEntryRef.current = moodEntryId
      return
    }

    if (previousMoodEntryRef.current !== moodEntryId) {
      triggerReaction('mood-checkin')
    }

    previousMoodEntryRef.current = moodEntryId
  }, [todaysMood?.id, triggerReaction])

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
      if (mediaQuery.matches) {
        return () => undefined
      }
    }

    const ambientAnimations: readonly CompanionAmbientAnimation[] = [
      'twirl',
      'peek',
      'pulse',
      'orbit',
      'drift',
    ]

    function scheduleAmbient() {
      const delay = 14000 + Math.random() * 16000
      ambientTimerRef.current = window.setTimeout(() => {
        const index = Math.floor(Math.random() * ambientAnimations.length)
        const nextAnimation = ambientAnimations[index] ?? 'pulse'
        triggerAmbientAnimation(nextAnimation)
        scheduleAmbient()
      }, delay)
    }

    scheduleAmbient()

    return () => {
      if (ambientTimerRef.current !== null) {
        window.clearTimeout(ambientTimerRef.current)
        ambientTimerRef.current = null
      }
    }
  }, [triggerAmbientAnimation])

  useEffect(() => {
    if (!activeAmbientAnimation) {
      if (ambientClearRef.current !== null) {
        window.clearTimeout(ambientClearRef.current)
        ambientClearRef.current = null
      }
      return
    }

    if (ambientClearRef.current !== null) {
      window.clearTimeout(ambientClearRef.current)
    }

    ambientClearRef.current = window.setTimeout(() => {
      clearAmbientAnimation()
    }, 2200)

    return () => {
      if (ambientClearRef.current !== null) {
        window.clearTimeout(ambientClearRef.current)
        ambientClearRef.current = null
      }
    }
  }, [activeAmbientAnimation, clearAmbientAnimation])

  useEffect(() => {
    if (!activeReaction) {
      if (reactionClearRef.current !== null) {
        window.clearTimeout(reactionClearRef.current)
        reactionClearRef.current = null
      }
      return
    }

    if (reactionClearRef.current !== null) {
      window.clearTimeout(reactionClearRef.current)
    }

    const reactionDurations: Record<CompanionReactionType, number> = {
      'mood-checkin': 2200,
      'reward-earned': 2600,
      'quest-progress': 2400,
      'garden-celebration': 2800,
    }

    reactionClearRef.current = window.setTimeout(() => {
      clearReaction()
    }, reactionDurations[activeReaction] + 600)

    return () => {
      if (reactionClearRef.current !== null) {
        window.clearTimeout(reactionClearRef.current)
        reactionClearRef.current = null
      }
    }
  }, [activeReaction, clearReaction])
}

