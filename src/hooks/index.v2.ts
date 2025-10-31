/**
 * 🔄 V2 Hooks - Новые хуки с разделением клиентского и серверного состояния
 * Используют React Query для серверных данных и Zustand для UI состояния
 */

// Основные хуки приложения (v2 - миграция завершена)
export { useGardenState } from './useGardenState'
export { useMoodTracking } from './useMoodTracking'
export { useProfile, useFriendProfileData } from './useProfile'

// Store хуки (миграция завершена)
export {
  useUserClientStore,
  useOnboardingStatus,
  useAuthModalState,
} from '@/stores/userStore'
export {
  useGardenClientStore,
  useGardenViewMode,
  useSelectedElement,
  useCurrentRoomIndex,
} from '@/stores/gardenStore'
export {
  useChallengeClientStore,
  useCurrentChallenge,
  useChallengeLoading,
  useChallengeError,
} from '@/stores/challengeStore'

// React Query хуки для прямого использования
export * from './queries'

// Daily Quest хуки
export * from './queries/useDailyQuestQueries'

// Telegram ID Hook
export { useTelegramId } from './useTelegramId'

// Другие хуки
export { useTelegramSync } from './useTelegramSync'
export { useTelegram } from './useTelegram'
export { useTelegramStorage } from './useTelegramStorage'
export { useStoresSync } from './useStoresSync'
export { useAppInitialization } from './useAppInitialization'
export { useDeepLink } from './useDeepLink'
export { useElementGeneration } from './useElementGeneration'
export { useGardenRooms } from './useGardenRooms'
export { useLocalStorage } from './useLocalStorage'
export { useUserPhotos } from './useUserPhotos'
export { useChallengeIntegration } from './useChallengeIntegration'
