// Re-export all types for easier importing
export type * from './garden'
export type * from './mood'
export type * from './user'
export type * from './api'
export type * from './telegram'
export type * from './initialization'
export type * from './challenges'
export type * from './currency'
export type * from './dailyQuests'
export type * from './streakFreeze'
export type * from './companion'
export type * from './room'

// Re-export enums and constants (can't use "export type *" for these)
export {
  ElementType,
  RarityLevel,
  SeasonalVariant,
  ViewMode,
  GardenDisplayMode,
  GARDEN_GRID_SIZE,
  MAX_ELEMENTS_PER_DAY,
  ELEMENT_SIZE,
  SHELVES_PER_ROOM,
  MAX_POSITIONS_PER_SHELF,
  ELEMENTS_PER_ROOM,
  ROOM_TRANSITION_DURATION,
} from './garden'

export { MoodIntensity, MOOD_CONFIG } from './mood'

export { AchievementCategory } from './user'

export { InitializationStage } from './initialization'

export {
  FREEZE_SHOP_CONFIG,
  FREEZE_DESCRIPTIONS,
  getFreezeCost,
  getFreezeCurrencyType,
  getFreezeCurrencyLabel,
} from './streakFreeze'

// Common utility types
export type DeepReadonly<T> = {
  readonly [P in keyof T]: T[P] extends object ? DeepReadonly<T[P]> : T[P]
}

export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>

export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>

export type WithId<T> = T & { readonly id: string }

export type WithTimestamps<T> = T & {
  readonly createdAt: Date
  readonly updatedAt: Date
}

// Animation types for Framer Motion
export interface AnimationConfig {
  readonly initial?: Record<string, unknown>
  readonly animate?: Record<string, unknown>
  readonly exit?: Record<string, unknown>
  readonly transition?: Record<string, unknown>
}

// Screen size breakpoints
export const BREAKPOINTS = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
} as const

export type Breakpoint = keyof typeof BREAKPOINTS

// Theme types
export interface Theme {
  readonly colors: Record<string, string>
  readonly fonts: Record<string, string>
  readonly spacing: Record<string, string>
  readonly breakpoints: typeof BREAKPOINTS
}
