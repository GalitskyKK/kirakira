/**
 * 🔄 V2 Hooks - Новые хуки с разделением клиентского и серверного состояния
 * Используют React Query для серверных данных и Zustand для UI состояния
 */

// Основные хуки приложения (v2)
export { useGardenState } from './useGardenState.v2'
export { useMoodTracking } from './useMoodTracking.v2'
export { useProfile, useFriendProfileData } from './useProfile.v2'

// Store v2 хуки
export {
  useUserClientStore,
  useOnboardingStatus,
  useAuthModalState,
} from '@/stores/userStore.v2'
export {
  useGardenClientStore,
  useGardenViewMode,
  useSelectedElement,
  useCurrentRoomIndex,
} from '@/stores/gardenStore.v2'
export {
  useChallengeClientStore,
  useCurrentChallenge,
  useChallengeLoading,
  useChallengeError,
} from '@/stores/challengeStore.v2'

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
