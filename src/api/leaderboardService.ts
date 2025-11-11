import { authenticatedFetch } from '@/utils/apiClient'
import type {
  LeaderboardCategory,
  LeaderboardPeriod,
  LeaderboardResponsePayload,
  StandardApiResponse,
} from '@/types/api'

export interface GetLeaderboardRequest {
  readonly category: LeaderboardCategory
  readonly period: LeaderboardPeriod
  readonly limit?: number | undefined
  readonly viewerTelegramId?: number | undefined
  readonly includeViewerPosition?: boolean | undefined
}

export async function getLeaderboard({
  category,
  period,
  limit = 20,
  viewerTelegramId,
  includeViewerPosition = true,
}: GetLeaderboardRequest): Promise<LeaderboardResponsePayload> {
  try {
    const params = new URLSearchParams({
      action: 'get_leaderboard',
      category,
      period,
      limit: String(limit),
      includeViewer: includeViewerPosition ? 'true' : 'false',
    })

    if (viewerTelegramId != null) {
      params.set('viewerTelegramId', String(viewerTelegramId))
    }

    const response = await authenticatedFetch(`/api/profile?${params.toString()}`)

    if (!response.ok) {
      throw new Error(`Failed to fetch leaderboard: ${response.status}`)
    }

    const result =
      (await response.json()) as StandardApiResponse<LeaderboardResponsePayload>

    if (!result.success || result.data == null) {
      throw new Error(result.error ?? 'Unknown leaderboard API error')
    }

    return result.data
  } catch (error) {
    console.error('Failed to load leaderboard:', error)
    throw error
  }
}


