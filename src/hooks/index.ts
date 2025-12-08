// Re-export all hooks for easier importing
// ✅ Миграция завершена: все хуки используют React Query
export { useGardenState } from './useGardenState'
export { useGardenRooms } from './useGardenRooms'
export { useMoodTracking } from './useMoodTracking'
export { useElementGeneration } from './useElementGeneration'
export {
  useLocalStorage,
  useSessionStorage,
  useStorageAvailable,
} from './useLocalStorage'
export {
  useTelegram,
  useTelegramButtons,
  useTelegramTheme,
} from './useTelegram'
export { useTelegramStorage } from './useTelegramStorage'
export { useAppInitialization } from './useAppInitialization'
export { useTelegramSync } from './useTelegramSync'
export { useReducedMotion, useAnimationConfig } from './useReducedMotion'
export { useStoresSync } from './useStoresSync'
export { useDeepLink } from './useDeepLink'
export { useUserPhotos } from './useUserPhotos'
export { useProfile } from './useProfile'
export {
  useChallengeIntegration,
  useChallengeGardenIntegration,
  useChallengeMoodIntegration,
} from './useChallengeIntegration'
export { useStreakFreeze } from './useStreakFreeze'
export { useScrollToTop } from './useScrollToTop'
export { useCurrencySync } from './useCurrencySync'
export {
  useFriendsData,
  type Friend,
  type FriendRequest,
  type FriendsListData,
  type SearchResult,
} from './useFriendsData'

// Additional utility hooks can be added here
export { useGardenTheme } from './useGardenTheme'
export { useRoomTheme } from './useRoomTheme'
