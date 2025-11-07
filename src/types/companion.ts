import type { MoodType, RarityLevel } from '@/types'

export type CompanionId = 'lumina'

export type CompanionEmotion =
  | 'neutral'
  | 'joy'
  | 'calm'
  | 'sadness'
  | 'anger'
  | 'stress'
  | 'anxiety'
  | 'celebration'

export type CompanionParticleVariant = 'sparkle' | 'ember' | 'bubble' | 'drift'

export type CompanionEyeShape = 'smile' | 'calm' | 'wide' | 'sad' | 'focused'

export type CompanionMouthShape =
  | 'smile'
  | 'soft'
  | 'frown'
  | 'open'
  | 'determined'

export type CompanionAmbientAnimation = 'twirl' | 'peek' | 'pulse'

export type CompanionReactionType =
  | 'mood-checkin'
  | 'reward-earned'
  | 'quest-progress'
  | 'garden-celebration'

export interface CompanionMotionPreset {
  readonly amplitude: number
  readonly duration: number
}

export interface CompanionParticlePreset {
  readonly variant: CompanionParticleVariant
  readonly color: string
  readonly count: number
  readonly size: readonly [number, number]
  readonly opacity: readonly [number, number]
  readonly travel: CompanionMotionPreset
}

export interface CompanionEmotionVisual {
  readonly emotion: CompanionEmotion
  readonly label: string
  readonly description: string
  readonly bodyGradient: readonly [string, string]
  readonly coreGlow: readonly [string, string]
  readonly auraColor: string
  readonly auraOpacity: number
  readonly eyeShape: CompanionEyeShape
  readonly mouthShape: CompanionMouthShape
  readonly float: CompanionMotionPreset
  readonly sway: CompanionMotionPreset
  readonly scaleRange: readonly [number, number]
  readonly particlePreset?: CompanionParticlePreset
  readonly accentColor: string
  readonly celebrationRarity?: readonly RarityLevel[]
}

export interface CompanionDefinition {
  readonly id: CompanionId
  readonly name: string
  readonly description: string
  readonly unlockLevel: number
  readonly baseScale: number
  readonly emotions: Readonly<Record<CompanionEmotion, CompanionEmotionVisual>>
  readonly moodMap: Readonly<Record<MoodType | 'default', CompanionEmotion>>
}

export interface CompanionSelection {
  readonly activeCompanionId: CompanionId
  readonly isVisible: boolean
}
