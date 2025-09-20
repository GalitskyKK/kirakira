// Re-export all stores for easier importing
export { useGardenStore } from './gardenStore'
export { useMoodStore } from './moodStore'
export { useUserStore } from './userStore'

// Store initialization function
export async function initializeStores(): Promise<void> {
  const { useUserStore } = await import('./userStore')
  const { useMoodStore } = await import('./moodStore')
  const { useGardenStore } = await import('./gardenStore')
  
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
