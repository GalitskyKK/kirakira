import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { authenticatedFetch } from '@/utils/apiClient'
import type { FriendApiSearchUsersResponse } from '@/types/api'

export interface Friend {
  readonly telegramId: number
  readonly firstName: string
  readonly lastName?: string
  readonly username?: string
  readonly photoUrl?: string
  readonly gardenElements: number
  readonly currentStreak: number
  readonly friendshipDate?: string
  readonly isOnline: boolean
  readonly id?: string
  readonly lastSeen?: string
  readonly joinedChallenges?: readonly string[]
}

export interface FriendRequest {
  readonly requestId: string
  readonly telegramId: number
  readonly firstName: string
  readonly lastName?: string
  readonly username?: string
  readonly photoUrl?: string
  readonly gardenElements: number
  readonly currentStreak: number
  readonly requestDate: string
}

export interface SearchResult {
  readonly user: {
    readonly telegramId: number
    readonly firstName: string
    readonly lastName?: string
    readonly username?: string
    readonly photoUrl?: string
    readonly gardenElements: number
    readonly currentStreak: number
  }
  readonly relationshipStatus:
    | 'none'
    | 'pending'
    | 'accepted'
    | 'declined'
    | 'blocked'
  readonly canSendRequest: boolean
}

interface FriendsListResponse {
  readonly success: boolean
  readonly data?: {
    readonly friends?: readonly Friend[]
    readonly incomingRequests?: readonly FriendRequest[]
    readonly outgoingRequests?: readonly FriendRequest[]
    readonly referralCode?: string
  }
  readonly error?: string
}

interface FriendActionResponse {
  readonly success: boolean
  readonly data?: { readonly message: string }
  readonly error?: string
}

export interface FriendsListData {
  readonly friends: readonly Friend[]
  readonly incomingRequests: readonly FriendRequest[]
  readonly outgoingRequests: readonly FriendRequest[]
  readonly referralCode: string
}

const fetchFriendsList = async (
  telegramId: number
): Promise<FriendsListData> => {
  const response = await authenticatedFetch(
    `/api/friends?action=list&telegramId=${telegramId}&type=all`
  )
  const result = (await response.json()) as FriendsListResponse

  if (!result.success || !result.data) {
    throw new Error(result.error ?? 'Ошибка загрузки данных о друзьях')
  }

  return {
    friends: result.data.friends ?? [],
    incomingRequests: result.data.incomingRequests ?? [],
    outgoingRequests: result.data.outgoingRequests ?? [],
    referralCode: result.data.referralCode ?? '',
  }
}

export function useFriendsData(telegramId?: number) {
  const queryClient = useQueryClient()

  const friendsQuery = useQuery({
    queryKey: ['friends', telegramId],
    enabled: Boolean(telegramId),
    queryFn: () => {
      if (!telegramId) throw new Error('telegramId is required')
      return fetchFriendsList(telegramId)
    },
    staleTime: 1000 * 60 * 5,
  })

  const searchByReferral = useMutation({
    mutationFn: async (referralCode: string) => {
      if (!telegramId) throw new Error('telegramId is required')
      const response = await authenticatedFetch(
        `/api/friends?action=search&referralCode=${referralCode}&searcherTelegramId=${telegramId}`
      )
      const result = (await response.json()) as {
        success: boolean
        data?: SearchResult
        error?: string
      }
      if (!result.success || !result.data) {
        throw new Error(result.error ?? 'Пользователь не найден')
      }
      return result.data
    },
  })

  const searchGlobal = useMutation({
    mutationFn: async ({
      query,
      page,
    }: {
      query: string
      page?: number
    }): Promise<FriendApiSearchUsersResponse> => {
      if (!telegramId) throw new Error('telegramId is required')
      const response = await authenticatedFetch(
        `/api/friends?action=search&query=${encodeURIComponent(
          query
        )}&searcherTelegramId=${telegramId}&page=${page ?? 1}&limit=10`
      )
      const result = (await response.json()) as {
        success: boolean
        data?: FriendApiSearchUsersResponse
        error?: string
      }
      if (!result.success || !result.data) {
        throw new Error(result.error ?? 'Пользователи не найдены')
      }
      return result.data
    },
  })

  const invalidateFriends = () => {
    if (telegramId) {
      void queryClient.invalidateQueries({ queryKey: ['friends', telegramId] })
    }
  }

  const sendFriendRequest = useMutation({
    mutationFn: async (targetTelegramId: number) => {
      if (!telegramId) throw new Error('telegramId is required')
      const response = await authenticatedFetch(
        '/api/friends?action=send-request',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            requesterTelegramId: telegramId,
            addresseeTelegramId: targetTelegramId,
          }),
        }
      )
      const result = (await response.json()) as FriendActionResponse
      if (!result.success || !result.data) {
        throw new Error(result.error ?? 'Ошибка отправки запроса')
      }
      return result.data.message
    },
    onSuccess: invalidateFriends,
  })

  const respondRequest = useMutation({
    mutationFn: async ({
      requesterTelegramId,
      action,
    }: {
      requesterTelegramId: number
      action: 'accept' | 'decline'
    }) => {
      if (!telegramId) throw new Error('telegramId is required')
      const response = await authenticatedFetch(
        '/api/friends?action=respond-request',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            telegramId,
            requesterTelegramId,
            action,
          }),
        }
      )
      const result = (await response.json()) as FriendActionResponse
      if (!result.success || !result.data) {
        throw new Error(result.error ?? 'Ошибка обработки запроса')
      }
      return result.data.message
    },
    onSuccess: invalidateFriends,
  })

  return {
    friendsQuery,
    searchByReferral,
    searchGlobal,
    sendFriendRequest,
    respondRequest,
  }
}
