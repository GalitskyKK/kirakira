import { useMemo, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { fetchRoomThemes, updateRoomTheme } from '@/api/roomThemeService'
import { useTelegramId } from './useTelegramId'
import { useUserSync } from './queries/useUserQueries'
import type { RoomTheme } from '@/types/room'

const DEFAULT_ROOM_THEME_ID = 'isoRoom'

export function useRoomTheme() {
  const telegramId = useTelegramId()
  const queryClient = useQueryClient()
  const { data: userData } = useUserSync(telegramId, !!telegramId)
  const currentUser = userData?.user

  const [pendingThemeId, setPendingThemeId] = useState<string | null>(null)

  const {
    data: themesResponse,
    isLoading: isLoadingRoomThemes,
    refetch: refetchRoomThemes,
  } = useQuery({
    queryKey: ['roomThemes', 'catalog', telegramId],
    enabled: Boolean(telegramId),
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      if (!telegramId) {
        throw new Error('No telegramId provided')
      }
      return fetchRoomThemes(telegramId)
    },
  })

  const roomThemes: readonly RoomTheme[] = themesResponse?.data?.themes ?? [
    {
      id: DEFAULT_ROOM_THEME_ID,
      name: 'Базовая',
      priceSprouts: 0,
      priceGems: 0,
      isDefault: true,
      previewUrl: '/isoRoom/isoRoom.webp',
    },
  ]

  const ownedRoomThemeIds = useMemo(() => {
    const owned = themesResponse?.data?.ownedThemeIds ?? []
    const defaults = roomThemes.filter(t => t.isDefault).map(t => t.id)
    return Array.from(new Set([...owned, ...defaults]))
  }, [themesResponse?.data?.ownedThemeIds, roomThemes])

  const activeRoomThemeId = useMemo(() => {
    if (pendingThemeId) return pendingThemeId
    return currentUser?.roomTheme ?? DEFAULT_ROOM_THEME_ID
  }, [currentUser?.roomTheme, pendingThemeId])

  const activeRoomTheme =
    roomThemes.find(t => t.id === activeRoomThemeId) ??
    roomThemes.find(t => t.isDefault) ??
    roomThemes[0]

  const canUseRoomTheme = (themeId: string): boolean => {
    const found = roomThemes.find(t => t.id === themeId)
    if (!found) return false
    return found.isDefault || ownedRoomThemeIds.includes(themeId)
  }

  const setRoomTheme = async (themeId: string) => {
    if (!telegramId || !canUseRoomTheme(themeId)) return
    setPendingThemeId(themeId)
    try {
      const result = await updateRoomTheme(telegramId, themeId)
      if (!result.success) {
        throw new Error(result.error || 'Failed to update room theme')
      }
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ['roomThemes', 'catalog', telegramId],
        }),
        queryClient.invalidateQueries({ queryKey: ['user', telegramId] }),
      ])
    } finally {
      setPendingThemeId(null)
    }
  }

  return {
    roomThemeId: activeRoomTheme?.id ?? DEFAULT_ROOM_THEME_ID,
    roomTheme: activeRoomTheme,
    roomThemes,
    ownedRoomThemeIds,
    isLoadingRoomThemes,
    refetchRoomThemes,
    canUseRoomTheme,
    setRoomTheme,
  }
}
