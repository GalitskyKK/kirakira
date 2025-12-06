import { authenticatedFetch } from '@/utils/apiClient'
import type {
  RoomThemeCatalogResponse,
  RoomThemeCatalogData,
  UpdateRoomThemeResponse,
} from '@/types/room'
import type { StandardApiResponse } from '@/types/api'

export async function fetchRoomThemes(
  telegramId: number
): Promise<RoomThemeCatalogResponse> {
  const response = await authenticatedFetch(
    `/api/currency?action=list_themes&telegramId=${telegramId}&themeType=room`
  )

  if (!response.ok) {
    throw new Error(`Failed to fetch room themes: ${response.status}`)
  }

  const result =
    (await response.json()) as StandardApiResponse<RoomThemeCatalogData>

  if (!result.success || !result.data) {
    return {
      success: false,
      error: result.error || 'Failed to fetch room themes',
    }
  }

  return {
    success: true,
    data: result.data,
  }
}

export async function updateRoomTheme(
  telegramId: number,
  roomTheme: string
): Promise<UpdateRoomThemeResponse> {
  const response = await authenticatedFetch(
    `/api/user?action=update-room-theme&telegramId=${telegramId}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ roomTheme }),
    }
  )

  if (!response.ok) {
    return {
      success: false,
      error: `Failed to update room theme: ${response.status}`,
    }
  }

  const result = (await response.json()) as UpdateRoomThemeResponse
  return result
}
