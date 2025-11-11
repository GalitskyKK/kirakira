import { useQuery, type UseQueryResult } from '@tanstack/react-query'
import { getLeaderboard } from '@/api/leaderboardService'
import type {
  LeaderboardCategory,
  LeaderboardPeriod,
  LeaderboardResponsePayload,
} from '@/types/api'

export const leaderboardKeys = {
  all: ['leaderboard'] as const,
  list: (
    category: LeaderboardCategory,
    period: LeaderboardPeriod,
    limit: number,
    viewerTelegramId?: number
  ) =>
    [
      ...leaderboardKeys.all,
      category,
      period,
      limit,
      viewerTelegramId ?? 'anonymous',
    ] as const,
}

export interface UseLeaderboardOptions {
  readonly category: LeaderboardCategory
  readonly period: LeaderboardPeriod
  readonly limit?: number | undefined
  readonly viewerTelegramId?: number | undefined
  readonly enabled?: boolean | undefined
}

export function useLeaderboard({
  category,
  period,
  limit = 20,
  viewerTelegramId,
  enabled = true,
}: UseLeaderboardOptions): UseQueryResult<LeaderboardResponsePayload, Error> {
  return useQuery({
    queryKey: leaderboardKeys.list(category, period, limit, viewerTelegramId),
    queryFn: () =>
      getLeaderboard({
        category,
        period,
        limit,
        viewerTelegramId,
        includeViewerPosition: true,
      }),
    staleTime: 1000 * 60, // 1 минута
    gcTime: 1000 * 60 * 10, // 10 минут
    enabled,
    refetchOnWindowFocus: false,
  })
}

export interface UseViewerLeaderboardPositionOptions {
  readonly category: LeaderboardCategory
  readonly period: LeaderboardPeriod
  readonly viewerTelegramId?: number | undefined
  readonly enabled?: boolean | undefined
}

export function useViewerLeaderboardPosition({
  category,
  period,
  viewerTelegramId,
  enabled = true,
}: UseViewerLeaderboardPositionOptions): UseQueryResult<
  LeaderboardResponsePayload['viewerPosition'] | null,
  Error
> {
  return useQuery({
    queryKey: [
      ...leaderboardKeys.list(category, period, 1, viewerTelegramId),
      'viewer',
    ],
    queryFn: async () => {
      const payload = await getLeaderboard({
        category,
        period,
        limit: 1,
        viewerTelegramId,
        includeViewerPosition: true,
      })
      return payload.viewerPosition ?? null
    },
    enabled: enabled && viewerTelegramId != null,
    staleTime: 1000 * 60,
    gcTime: 1000 * 60 * 10,
    refetchOnWindowFocus: false,
  })
}


