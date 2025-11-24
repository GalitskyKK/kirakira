/**
 * 🌈 Vibe Companion Body - WebGL-based companion visualization
 * Uses the same vibe-canvas technology as mood palette
 */

import { useMemo } from 'react'
import { VibeCanvas } from '@/components/garden/VibeCanvas'
import type { CompanionEmotion } from '@/types'

interface VibeCompanionBodyProps {
  readonly emotion: CompanionEmotion
  readonly width?: number
  readonly height?: number
}

/**
 * Maps companion emotion to mood colors
 */
function getEmotionColors(emotion: CompanionEmotion): [number, number, number][] {
  const emotionToMoodMap: Record<CompanionEmotion, string[]> = {
    neutral: ['#94a3b8', '#cbd5e1'], // Gray
    joy: ['#fbbf24', '#f59e0b', '#fb923c'], // Yellow-Orange
    calm: ['#06b6d4', '#0891b2', '#67e8f9'], // Cyan
    sadness: ['#3b82f6', '#2563eb', '#60a5fa'], // Blue
    anger: ['#dc2626', '#b91c1c', '#f87171'], // Red
    stress: ['#ef4444', '#dc2626', '#fb7185'], // Red-Pink
    anxiety: ['#8b5cf6', '#7c3aed', '#a78bfa'], // Purple
    celebration: ['#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4'], // Rainbow
  }

  const hexColors = emotionToMoodMap[emotion] || emotionToMoodMap.neutral
  
  return hexColors.map(hex => {
    const r = parseInt(hex.slice(1, 3), 16) / 255
    const g = parseInt(hex.slice(3, 5), 16) / 255
    const b = parseInt(hex.slice(5, 7), 16) / 255
    return [r, g, b] as [number, number, number]
  })
}

export function VibeCompanionBody({
  emotion,
  width = 160,
  height = 160,
}: VibeCompanionBodyProps) {
  // Generate colors based ONLY on current emotion (always respond to emotion changes)
  const colors = useMemo(() => {
    return getEmotionColors(emotion)
  }, [emotion])

  // Higher energy for active emotions
  const energy = useMemo(() => {
    const energyMap: Record<CompanionEmotion, number> = {
      neutral: 0.15,
      joy: 0.35,
      calm: 0.2,
      sadness: 0.15,
      anger: 0.4,
      stress: 0.35,
      anxiety: 0.3,
      celebration: 0.5,
    }
    return energyMap[emotion] || 0.2
  }, [emotion])

  return (
    <div
      style={{
        width: `${width}px`,
        height: `${height}px`,
        position: 'relative',
      }}
    >
      <VibeCanvas
        width={width}
        height={height}
        config={{
          colors,
          baseScale: 1.2, // Slightly larger for companion
          energy,
          blobCount: colors.length,
          circularMask: true, // Enable soft circular mask
        }}
      />
    </div>
  )
}

