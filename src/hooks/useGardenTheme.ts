import { useEffect, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useTelegramTheme } from '@/hooks/useTelegram'
import { useUserStore } from '@/stores/userStore'
import { authenticatedFetch } from '@/utils/apiClient'

// =============================
// Типы
// =============================

export interface GardenTheme {
  readonly id: string
  readonly name: string
  readonly isDark: boolean
  // Градиент общего контейнера за полками
  readonly containerBackground: string
  // Градиент задней стены полок
  readonly wallBackground: string
  // Цвета частиц
  readonly particleFrom: string
  readonly particleTo: string
  // Полки
  readonly shelfSurface: string
  readonly shelfEdge: string
  readonly shelfSupport: string
  readonly shelfRadius: string
  readonly shelfShadow: string
  readonly wallRadius: string
  // Анимации/частицы
  readonly particleDensity: number
  // Commerce
  readonly priceSprouts: number
  readonly isDefault: boolean
}

const THEMES: readonly GardenTheme[] = [
  {
    id: 'light',
    name: 'Светлая',
    isDark: false,
    containerBackground:
      'linear-gradient(135deg, rgba(255,247,237,1) 0%, rgba(255,237,213,1) 50%, rgba(254,243,199,1) 100%)',
    wallBackground:
      'linear-gradient(180deg, rgba(147,197,253,1) 0%, rgba(96,165,250,1) 60%, rgba(59,130,246,1) 100%)',
    particleFrom: '#fde047',
    particleTo: '#f59e0b',
    shelfSurface: 'linear-gradient(to bottom, #fbbf24, #f59e0b, #d97706)',
    shelfEdge: 'linear-gradient(to bottom, #d97706, #b45309)',
    shelfSupport: 'linear-gradient(to bottom, #f59e0b, #d97706)',
    shelfRadius: '0.5rem',
    shelfShadow:
      '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    wallRadius: '0.5rem',
    particleDensity: 15,
    priceSprouts: 0,
    isDefault: true,
  },
  {
    id: 'dark',
    name: 'Тёмная',
    isDark: true,
    containerBackground:
      'linear-gradient(135deg, rgba(17,24,39,1) 0%, rgba(30,41,59,1) 50%, rgba(3,7,18,1) 100%)',
    wallBackground:
      'linear-gradient(180deg, rgba(30,64,175,1) 0%, rgba(30,58,138,1) 60%, rgba(17,24,39,1) 100%)',
    particleFrom: '#60a5fa',
    particleTo: '#22d3ee',
    shelfSurface: 'linear-gradient(to bottom, #374151, #1f2937, #111827)',
    shelfEdge: 'linear-gradient(to bottom, #1f2937, #0f172a)',
    shelfSupport: 'linear-gradient(to bottom, #374151, #1f2937)',
    shelfRadius: '0.5rem',
    shelfShadow:
      '0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -1px rgba(0, 0, 0, 0.2)',
    wallRadius: '0.5rem',
    particleDensity: 15,
    priceSprouts: 0,
    isDefault: true,
  },
  {
    id: 'sunset',
    name: 'Закат',
    isDark: false,
    containerBackground:
      'linear-gradient(135deg, #ffedd5 0%, #fecdd3 40%, #e9d5ff 100%)',
    wallBackground:
      'linear-gradient(180deg, #fca5a5 0%, #fb7185 60%, #f59e0b 100%)',
    particleFrom: '#fb923c',
    particleTo: '#f472b6',
    shelfSurface: 'linear-gradient(to bottom, #fb923c, #f97316, #ea580c)',
    shelfEdge: 'linear-gradient(to bottom, #ea580c, #c2410c)',
    shelfSupport: 'linear-gradient(to bottom, #f97316, #ea580c)',
    shelfRadius: '0.75rem',
    shelfShadow:
      '0 4px 6px -1px rgba(251, 146, 60, 0.3), 0 2px 4px -1px rgba(251, 146, 60, 0.2)',
    wallRadius: '0.75rem',
    particleDensity: 20,
    priceSprouts: 500,
    isDefault: false,
  },
  {
    id: 'night',
    name: 'Ночное небо',
    isDark: true,
    containerBackground:
      'linear-gradient(135deg, #0b1020 0%, #0e1730 50%, #0b1324 100%)',
    wallBackground:
      'linear-gradient(180deg, #1e293b 0%, #111827 60%, #0b1020 100%)',
    particleFrom: '#93c5fd',
    particleTo: '#a78bfa',
    shelfSurface: 'linear-gradient(to bottom, #1e40af, #1e3a8a, #1e1b4b)',
    shelfEdge: 'linear-gradient(to bottom, #1e3a8a, #312e81)',
    shelfSupport: 'linear-gradient(to bottom, #1e40af, #1e3a8a)',
    shelfRadius: '0.75rem',
    shelfShadow:
      '0 4px 6px -1px rgba(59, 130, 246, 0.3), 0 2px 4px -1px rgba(59, 130, 246, 0.2)',
    wallRadius: '0.75rem',
    particleDensity: 18,
    priceSprouts: 600,
    isDefault: false,
  },
  {
    id: 'forest',
    name: 'Лесная',
    isDark: false,
    containerBackground:
      'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 50%, #bbf7d0 100%)',
    wallBackground:
      'linear-gradient(180deg, #86efac 0%, #4ade80 60%, #22c55e 100%)',
    particleFrom: '#84cc16',
    particleTo: '#65a30d',
    shelfSurface: 'linear-gradient(to bottom, #84cc16, #65a30d, #4d7c0f)',
    shelfEdge: 'linear-gradient(to bottom, #4d7c0f, #365314)',
    shelfSupport: 'linear-gradient(to bottom, #65a30d, #4d7c0f)',
    shelfRadius: '0.5rem',
    shelfShadow:
      '0 4px 6px -1px rgba(132, 204, 22, 0.3), 0 2px 4px -1px rgba(132, 204, 22, 0.2)',
    wallRadius: '0.5rem',
    particleDensity: 12,
    priceSprouts: 700,
    isDefault: false,
  },
  {
    id: 'aqua',
    name: 'Морская',
    isDark: false,
    containerBackground:
      'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 50%, #bae6fd 100%)',
    wallBackground:
      'linear-gradient(180deg, #7dd3fc 0%, #38bdf8 60%, #0ea5e9 100%)',
    particleFrom: '#06b6d4',
    particleTo: '#0891b2',
    shelfSurface: 'linear-gradient(to bottom, #06b6d4, #0891b2, #0e7490)',
    shelfEdge: 'linear-gradient(to bottom, #0e7490, #155e75)',
    shelfSupport: 'linear-gradient(to bottom, #0891b2, #0e7490)',
    shelfRadius: '1rem',
    shelfShadow:
      '0 4px 6px -1px rgba(6, 182, 212, 0.3), 0 2px 4px -1px rgba(6, 182, 212, 0.2)',
    wallRadius: '1rem',
    particleDensity: 16,
    priceSprouts: 800,
    isDefault: false,
  },
]

const STORAGE_KEY = 'gardenThemeId'
const OWNED_THEMES_KEY = 'ownedThemeIds'

// =============================
// API Types
// =============================

interface ThemesCatalogResponse {
  success: boolean
  data?: {
    themes: Array<{
      id: string
      name: string
      priceSprouts: number
      isDefault: boolean
    }>
    ownedThemeIds: string[]
  }
  error?: string
}

// =============================
// Helper Functions
// =============================

function resolveInitialTheme(
  preferred: 'light' | 'dark' | 'auto',
  isTelegramDark: boolean,
  ownedThemeIds: string[] = []
): GardenTheme {
  // Приоритет: URL -> localStorage -> user preference/telegram -> светлая
  const url = new URL(window.location.href)
  const fromUrl = url.searchParams.get('gardenTheme')
  if (fromUrl && fromUrl.length > 0) {
    const found = THEMES.find(t => t.id === fromUrl)
    if (found && (found.isDefault || ownedThemeIds.includes(found.id)))
      return found
  }

  const saved = localStorage.getItem(STORAGE_KEY)
  if (saved && saved.length > 0) {
    const found = THEMES.find(t => t.id === saved)
    if (found && (found.isDefault || ownedThemeIds.includes(found.id)))
      return found
  }

  if (preferred === 'dark' || (preferred === 'auto' && isTelegramDark)) {
    const darkTheme = THEMES.find(t => t.id === 'dark')
    if (darkTheme) return darkTheme
  }
  const lightTheme = THEMES.find(t => t.id === 'light')
  return (
    lightTheme ??
    THEMES[0] ?? {
      id: 'light',
      name: 'Светлая',
      isDark: false,
      containerBackground:
        'linear-gradient(135deg, rgba(255,247,237,1) 0%, rgba(255,237,213,1) 50%, rgba(254,243,199,1) 100%)',
      wallBackground:
        'linear-gradient(180deg, rgba(147,197,253,1) 0%, rgba(96,165,250,1) 60%, rgba(59,130,246,1) 100%)',
      particleFrom: '#fde047',
      particleTo: '#f59e0b',
      shelfSurface: 'linear-gradient(to bottom, #fbbf24, #f59e0b, #d97706)',
      shelfEdge: 'linear-gradient(to bottom, #d97706, #b45309)',
      shelfSupport: 'linear-gradient(to bottom, #f59e0b, #d97706)',
      shelfRadius: '0.5rem',
      shelfShadow:
        '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
      wallRadius: '0.5rem',
      particleDensity: 15,
      priceSprouts: 0,
      isDefault: true,
    }
  )
}

function loadOwnedThemesFromStorage(): string[] {
  try {
    const stored = localStorage.getItem(OWNED_THEMES_KEY)
    if (stored && stored.length > 0) {
      const parsed = JSON.parse(stored) as unknown
      return Array.isArray(parsed) ? (parsed as string[]) : []
    }
  } catch (error) {
    console.warn('Failed to load owned themes from storage:', error)
  }
  return []
}

function saveOwnedThemesToStorage(ownedThemeIds: string[]): void {
  try {
    localStorage.setItem(OWNED_THEMES_KEY, JSON.stringify(ownedThemeIds))
  } catch (error) {
    console.warn('Failed to save owned themes to storage:', error)
  }
}

export function useGardenTheme() {
  const { isDark: isTelegramDark } = useTelegramTheme()
  const userPreferredTheme = useUserStore(
    s => s.currentUser?.preferences.theme ?? 'auto'
  )
  const currentUser = useUserStore(s => s.currentUser)

  const [themeId, setThemeId] = useState<string | null>(null)

  // Загружаем купленные темы с сервера
  const { data: themesData, isLoading: isLoadingThemes } = useQuery({
    queryKey: ['themes', 'catalog'],
    queryFn: async (): Promise<ThemesCatalogResponse> => {
      if (!currentUser?.telegramId || currentUser.telegramId === 0) {
        throw new Error('No user logged in')
      }

      const response = await authenticatedFetch(
        `/api/currency?action=list_themes&telegramId=${currentUser.telegramId}`
      )

      if (!response.ok) {
        throw new Error(`Failed to fetch themes: ${response.status}`)
      }

      const result = (await response.json()) as ThemesCatalogResponse
      return result
    },
    enabled: Boolean(currentUser?.telegramId && currentUser.telegramId > 0),
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
  })

  // Получаем список купленных тем
  const ownedThemeIds = useMemo(() => {
    if (themesData?.success === true && themesData.data?.ownedThemeIds) {
      const serverOwned = themesData.data.ownedThemeIds
      saveOwnedThemesToStorage(serverOwned)
      return serverOwned
    }
    return loadOwnedThemesFromStorage()
  }, [themesData])

  const theme = useMemo(() => {
    if (themeId) {
      const found = THEMES.find(t => t.id === themeId)
      if (found && (found.isDefault || ownedThemeIds.includes(found.id))) {
        return found
      }
    }
    return resolveInitialTheme(
      userPreferredTheme,
      isTelegramDark,
      ownedThemeIds
    )
  }, [themeId, userPreferredTheme, isTelegramDark, ownedThemeIds])

  // Сохраняем выбранную тему и следим за URL-параметром при монтировании
  useEffect(() => {
    const url = new URL(window.location.href)
    const fromUrl = url.searchParams.get('gardenTheme')
    if (fromUrl && fromUrl.length > 0 && THEMES.some(t => t.id === fromUrl)) {
      localStorage.setItem(STORAGE_KEY, fromUrl)
      setThemeId(fromUrl)
      return
    }
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved && saved.length > 0 && THEMES.some(t => t.id === saved)) {
      setThemeId(saved)
    }
  }, [])

  const setGardenTheme = (id: string) => {
    if (THEMES.some(t => t.id === id)) {
      localStorage.setItem(STORAGE_KEY, id)
      setThemeId(id)
    }
  }

  const canUseTheme = (themeId: string): boolean => {
    const theme = THEMES.find(t => t.id === themeId)
    if (!theme) return false
    return theme.isDefault || ownedThemeIds.includes(themeId)
  }

  return {
    theme,
    themes: THEMES,
    setGardenTheme,
    isDarkTheme: theme.isDark,
    ownedThemeIds,
    canUseTheme,
    isLoadingThemes,
  }
}
