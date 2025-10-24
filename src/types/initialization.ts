/**
 * Типы для системы инициализации приложения
 */

export interface InitializationState {
  stage: InitializationStage
  isLoading: boolean
  error: string | null
  progress: number // 0-100
}

export enum InitializationStage {
  IDLE = 'idle',
  TELEGRAM_SETUP = 'telegram_setup',
  USER_SYNC = 'user_sync',
  STORES_SYNC = 'stores_sync',
  DAILY_QUESTS_CHECK = 'daily_quests_check',
  CHALLENGES_SYNC = 'challenges_sync',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

export interface TelegramSyncResult {
  success: boolean
  mode: 'telegram' | 'browser' | 'error'
  user?: {
    telegramId: number
    firstName: string
    lastName?: string
    username?: string
    photoUrl?: string
  }
  error?: string
}

export interface StoresSyncResult {
  success: boolean
  error?: string
}

export interface InitializationConfig {
  enableTelegram: boolean
  enableStoresSync: boolean
  timeout: number
  isDevelopment: boolean
}

export interface UseAppInitializationReturn {
  stage: InitializationStage
  isLoading: boolean
  error: string | null
  progress: number
  initialize: () => void
  isCompleted: boolean
  isFailed: boolean
  canRetry: boolean
}
