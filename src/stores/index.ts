// ============================================
// v2 Stores (React Query + UI State only)
// ============================================
export { useGardenClientStore } from './gardenStore.v2'
export { useMoodClientStore } from './moodStore.v2'
export { useUserClientStore } from './userStore.v2'
export { useCurrencyClientStore } from './currencyStore.v2'
export { useChallengeClientStore } from './challengeStore.v2'

// ============================================
// Other Stores (not yet migrated)
// ============================================
export { usePremiumStore, premiumUtils } from './premiumStore'
export { useDailyQuestStore } from './dailyQuestStore'

// ============================================
// DEPRECATED: Old stores (will be removed)
// Используйте v2 stores или React Query хуки
// ============================================
/** @deprecated Используйте useGardenClientStore() или useGardenSync() */
export { useGardenStore } from './gardenStore'
/** @deprecated Используйте useMoodClientStore() или useMoodSync() */
export { useMoodStore } from './moodStore'
/** @deprecated Используйте useUserClientStore() или useUserSync() */
export { useUserStore } from './userStore'
/** @deprecated Используйте useCurrencyClientStore() или useCurrencyBalance() */
export { useCurrencyStore } from './currencyStore'

// ⚠️ DEPRECATED: initializeStores() удалена - используйте React Query хуки
// Для синхронизации данных используйте:
// - useUserSync() для пользователя
// - useMoodSync() для настроений
// - useGardenSync() для сада
// Или useStoresSync() для комплексной синхронизации
