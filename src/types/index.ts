// Re-export all types for easier importing
export type * from './garden'
export type * from './mood'
export type * from './user'
export type * from './api'
export type * from './telegram'
export type * from './initialization'

// Re-export enums and constants (can't use "export type *" for these)
export {
  ElementType,
  RarityLevel,
  SeasonalVariant,
  ViewMode,
  GARDEN_GRID_SIZE,
  MAX_ELEMENTS_PER_DAY,
  ELEMENT_SIZE,
} from './garden'

export { MoodIntensity, MOOD_CONFIG } from './mood'

export { InitializationStage } from './initialization'

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
