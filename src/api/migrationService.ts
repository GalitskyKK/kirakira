import { authenticatedFetch } from '@/utils/apiClient'
import type { Garden, MoodEntry, User } from '@/types'

export interface ImportGuestDataRequest {
  readonly telegramId: number
  readonly user?: User | null | undefined
  readonly garden?: Garden | null | undefined
  readonly moodHistory?: readonly MoodEntry[] | undefined
  readonly onlyIfNew?: boolean | undefined
}

export interface ImportGuestDataResponse {
  readonly success: boolean
  readonly error?: string
}

/**
 * Импортирует гостевые данные в профиль пользователя.
 * Сервер обязан сам решать, создавать нового пользователя или мержить,
 * и не перетирать существующие данные, если пользователь уже есть.
 */
export async function importGuestData(
  payload: ImportGuestDataRequest
): Promise<boolean> {
  try {
    const response = await authenticatedFetch('/api/profile?action=import_guest', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      console.error('Failed to import guest data:', response.status, response.statusText)
      return false
    }

    const result = (await response.json()) as ImportGuestDataResponse
    if (!result.success) {
      console.error('Failed to import guest data:', result.error)
    }

    return Boolean(result.success)
  } catch (error) {
    console.error('Failed to import guest data:', error)
    return false
  }
}

