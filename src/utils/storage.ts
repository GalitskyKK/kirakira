/**
 * Local storage utilities with type safety and error handling
 */

import type { Garden, MoodEntry, User, CompanionSelection } from '@/types'

// Storage keys
export const STORAGE_KEYS = {
  USER: 'kirakira_user',
  GARDEN: 'kirakira_garden',
  MOOD_HISTORY: 'kirakira_mood_history',
  PREFERENCES: 'kirakira_preferences',
  ONBOARDING: 'kirakira_onboarding_completed',
  LAST_VISIT: 'kirakira_last_visit',
  COMPANION: 'kirakira_companion',
} as const

/**
 * Safely parse JSON with error handling
 */
function safeJsonParse<T>(json: string, fallback: T): T {
  try {
    const parsed = JSON.parse(json) as unknown
    return parsed as T
  } catch {
    return fallback
  }
}

/**
 * Safely stringify JSON with error handling
 */
function safeJsonStringify(data: unknown): string | null {
  try {
    return JSON.stringify(data)
  } catch {
    return null
  }
}

/**
 * Generic storage interface
 */
interface StorageAdapter {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
  removeItem(key: string): void
  clear(): void
}

/**
 * Local storage wrapper with fallback
 */
class SafeStorage implements StorageAdapter {
  private storage: Storage | null = null
  private memoryStorage: Map<string, string> = new Map()

  constructor() {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        // Test localStorage availability
        const testKey = '__kirakira_test__'
        window.localStorage.setItem(testKey, 'test')
        window.localStorage.removeItem(testKey)
        this.storage = window.localStorage
      }
    } catch {
      // localStorage not available, use memory storage
      console.warn('localStorage not available, using memory storage')
    }
  }

  getItem(key: string): string | null {
    if (this.storage) {
      return this.storage.getItem(key)
    }
    return this.memoryStorage.get(key) ?? null
  }

  setItem(key: string, value: string): void {
    if (this.storage) {
      try {
        this.storage.setItem(key, value)
      } catch (error) {
        console.error('Failed to save to localStorage:', error)
        this.memoryStorage.set(key, value)
      }
    } else {
      this.memoryStorage.set(key, value)
    }
  }

  removeItem(key: string): void {
    if (this.storage) {
      this.storage.removeItem(key)
    }
    this.memoryStorage.delete(key)
  }

  clear(): void {
    if (this.storage) {
      this.storage.clear()
    }
    this.memoryStorage.clear()
  }
}

const storage = new SafeStorage()

/**
 * Save user data to storage
 */
export function saveUser(user: User): boolean {
  const serialized = safeJsonStringify(user)
  if (serialized === null) return false
  
  try {
    storage.setItem(STORAGE_KEYS.USER, serialized)
    return true
  } catch {
    return false
  }
}

/**
 * Load user data from storage
 */
export function loadUser(): User | null {
  const stored = storage.getItem(STORAGE_KEYS.USER)
  if (stored === null) return null
  
  const user = safeJsonParse<User | null>(stored, null)
  
  // Validate user object structure
  if (user && typeof user === 'object' && 'id' in user && 'registrationDate' in user) {
    // Convert date strings back to Date objects
    return {
      ...user,
      registrationDate: new Date(user.registrationDate),
      stats: {
        ...user.stats,
        firstVisit: new Date(user.stats.firstVisit),
        lastVisit: new Date(user.stats.lastVisit),
      },
    }
  }
  
  return null
}

/**
 * Save garden data to storage
 */
export function saveGarden(garden: Garden): boolean {
  const serialized = safeJsonStringify(garden)
  if (serialized === null) return false
  
  try {
    storage.setItem(STORAGE_KEYS.GARDEN, serialized)
    return true
  } catch {
    return false
  }
}

/**
 * Load garden data from storage
 */
export function loadGarden(): Garden | null {
  const stored = storage.getItem(STORAGE_KEYS.GARDEN)
  if (stored === null) return null
  
  const garden = safeJsonParse<Garden | null>(stored, null)
  
  if (garden && typeof garden === 'object' && 'id' in garden && 'elements' in garden) {
    // Convert date strings back to Date objects
    return {
      ...garden,
      createdAt: new Date(garden.createdAt),
      lastVisited: new Date(garden.lastVisited),
      elements: garden.elements.map(element => ({
        ...element,
        unlockDate: new Date(element.unlockDate),
      })),
    }
  }
  
  return null
}

/**
 * Save mood history to storage
 */
export function saveMoodHistory(moodHistory: readonly MoodEntry[]): boolean {
  const serialized = safeJsonStringify(moodHistory)
  if (serialized === null) return false
  
  try {
    storage.setItem(STORAGE_KEYS.MOOD_HISTORY, serialized)
    return true
  } catch {
    return false
  }
}

/**
 * Load mood history from storage
 */
export function loadMoodHistory(): readonly MoodEntry[] {
  const stored = storage.getItem(STORAGE_KEYS.MOOD_HISTORY)
  if (stored === null) return []
  
  const history = safeJsonParse<MoodEntry[]>(stored, [])
  
  // Convert date strings back to Date objects
  return history.map(entry => ({
    ...entry,
    date: new Date(entry.date),
    createdAt: new Date(entry.createdAt),
  }))
}

/**
 * Save onboarding completion status
 */
export function saveOnboardingCompleted(completed: boolean): void {
  storage.setItem(STORAGE_KEYS.ONBOARDING, String(completed))
}

/**
 * Check if onboarding is completed
 */
export function isOnboardingCompleted(): boolean {
  const stored = storage.getItem(STORAGE_KEYS.ONBOARDING)
  return stored === 'true'
}

/**
 * Save last visit timestamp
 */
export function saveLastVisit(date: Date = new Date()): void {
  storage.setItem(STORAGE_KEYS.LAST_VISIT, date.toISOString())
}

/**
 * Get last visit timestamp
 */
export function getLastVisit(): Date | null {
  const stored = storage.getItem(STORAGE_KEYS.LAST_VISIT)
  if (stored === null) return null
  
  try {
    return new Date(stored)
  } catch {
    return null
  }
}

/**
 * Clear all app data from storage
 */
export function clearAllData(): void {
  Object.values(STORAGE_KEYS).forEach(key => {
    storage.removeItem(key)
  })
}

/**
 * Save companion selection to storage
 */
export function saveCompanionSelection(selection: CompanionSelection): boolean {
  const serialized = safeJsonStringify(selection)
  if (serialized === null) {
    return false
  }

  try {
    storage.setItem(STORAGE_KEYS.COMPANION, serialized)
    return true
  } catch {
    return false
  }
}

/**
 * Load companion selection from storage
 */
export function loadCompanionSelection(): CompanionSelection | null {
  const stored = storage.getItem(STORAGE_KEYS.COMPANION)
  if (stored === null) {
    return null
  }

  const selection = safeJsonParse<CompanionSelection | null>(stored, null)
  if (selection && typeof selection === 'object' && 'activeCompanionId' in selection) {
    return selection
  }

  return null
}

/**
 * Get storage usage information
 */
export function getStorageInfo(): {
  available: boolean
  used: number
  remaining: number
} {
  if (typeof window === 'undefined' || !window.localStorage) {
    return { available: false, used: 0, remaining: 0 }
  }
  
  try {
    let used = 0
    Object.values(STORAGE_KEYS).forEach(key => {
      const item = storage.getItem(key)
      if (item) {
        used += item.length
      }
    })
    
    // Estimate remaining space (5MB typical limit)
    const estimatedLimit = 5 * 1024 * 1024 // 5MB in bytes
    const remaining = Math.max(0, estimatedLimit - used)
    
    return {
      available: true,
      used,
      remaining,
    }
  } catch {
    return { available: false, used: 0, remaining: 0 }
  }
}
