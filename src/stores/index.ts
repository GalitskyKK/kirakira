// Re-export all stores for easier importing
export { useGardenStore } from './gardenStore'
export { useMoodStore } from './moodStore'
export { useUserStore } from './userStore'
export { usePremiumStore, premiumUtils } from './premiumStore'
export { useCurrencyStore } from './currencyStore'

// Store initialization function with static imports to avoid chunk splitting warnings
import { useUserStore } from './userStore'
import { useMoodStore } from './moodStore'
import { useGardenStore } from './gardenStore'

export async function initializeStores(): Promise<void> {
  // Load user first
  await useUserStore.getState().loadUser()

  // If no user exists, create anonymous user
  const currentUser = useUserStore.getState().currentUser
  if (!currentUser) {
    await useUserStore.getState().createAnonymousUser()
  }

  // Load mood history and garden data
  await Promise.all([
    useMoodStore.getState().loadMoodHistory(),
    useGardenStore.getState().loadGarden(),
  ])

  // Create garden if it doesn't exist
  const currentGarden = useGardenStore.getState().currentGarden
  const user = useUserStore.getState().currentUser

  if (!currentGarden && user) {
    await useGardenStore.getState().createGarden(user.id)
  }
}
