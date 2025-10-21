import { authenticatedFetch } from '@/utils/apiClient'

export interface UpdateGardenThemeResponse {
  readonly success: boolean
  readonly data?: {
    readonly gardenTheme: string
  }
  readonly error?: string
}

/**
 * Обновляет тему сада пользователя в базе данных
 * @param telegramId - ID пользователя в Telegram
 * @param gardenTheme - ID темы сада (light, dark, sunset, night, forest, aqua)
 * @returns Promise с результатом обновления
 */
export async function updateGardenTheme(
  telegramId: number,
  gardenTheme: string
): Promise<UpdateGardenThemeResponse> {
  try {
    const response = await authenticatedFetch(
      `/api/user?action=update-garden-theme&telegramId=${telegramId}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ gardenTheme }),
      }
    )

    if (!response.ok) {
      const errorData = await response.json()
      return {
        success: false,
        error: errorData.error || `HTTP ${response.status}`,
      }
    }

    const result = (await response.json()) as UpdateGardenThemeResponse
    return result
  } catch (error) {
    console.error('Failed to update garden theme:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}
