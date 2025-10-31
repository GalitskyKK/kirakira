// Re-export all hooks for easier importing
// 🔧 ИСПРАВЛЕНИЕ: Используем v2 хуки по умолчанию (с React Query)
export { useGardenState } from './useGardenState.v2'
export { useGardenRooms } from './useGardenRooms'
export { useMoodTracking } from './useMoodTracking.v2'
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
export { useStoresSync } from './useStoresSync'
export { useDeepLink } from './useDeepLink'
export { useUserPhotos } from './useUserPhotos'
export { useProfile } from './useProfile.v2'
export {
  useChallengeIntegration,
  useChallengeGardenIntegration,
  useChallengeMoodIntegration,
} from './useChallengeIntegration'
export { useStreakFreeze } from './useStreakFreeze'
export { useScrollToTop } from './useScrollToTop'
export { useCurrencySync } from './useCurrencySync'

// Additional utility hooks can be added here
export { useGardenTheme } from './useGardenTheme'
