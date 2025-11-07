import { useEffect, useMemo, useRef } from 'react'
import { getCompanionDefinition } from '@/data/companions'
import { useCompanionStore } from '@/stores/companionStore'
import { useGardenState } from './useGardenState'
import { useMoodTracking } from './useMoodTracking'
import type { GardenElement, MoodType, RarityLevel } from '@/types'

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
    }

    previousMetaRef.current = elementMeta
  }, [elementMeta, triggerCelebration])

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
}

