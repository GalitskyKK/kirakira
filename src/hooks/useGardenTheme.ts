import { useEffect, useMemo, useState } from 'react'
import { useTelegramTheme } from '@/hooks/useTelegram'
import { useUserStore } from '@/stores/userStore'

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
  },
]

const STORAGE_KEY = 'gardenThemeId'

function resolveInitialTheme(
  preferred: 'light' | 'dark' | 'auto',
  isTelegramDark: boolean
): GardenTheme {
  // Приоритет: URL -> localStorage -> user preference/telegram -> светлая
  const url = new URL(window.location.href)
  const fromUrl = url.searchParams.get('gardenTheme')
  if (fromUrl) {
    const found = THEMES.find(t => t.id === fromUrl)
    if (found) return found
  }

  const saved = localStorage.getItem(STORAGE_KEY)
  if (saved) {
    const found = THEMES.find(t => t.id === saved)
    if (found) return found
  }

  if (preferred === 'dark' || (preferred === 'auto' && isTelegramDark)) {
    return THEMES.find(t => t.id === 'dark') || THEMES[0]
  }
  return THEMES.find(t => t.id === 'light') || THEMES[0]
}

export function useGardenTheme() {
  const { isDark: isTelegramDark } = useTelegramTheme()
  const userPreferredTheme = useUserStore(
    s => s.currentUser?.preferences.theme ?? 'auto'
  )

  const [themeId, setThemeId] = useState<string | null>(null)

  const theme = useMemo(() => {
    if (themeId) {
      return (
        THEMES.find(t => t.id === themeId) ||
        resolveInitialTheme(userPreferredTheme, isTelegramDark)
      )
    }
    return resolveInitialTheme(userPreferredTheme, isTelegramDark)
  }, [themeId, userPreferredTheme, isTelegramDark])

  // Сохраняем выбранную тему и следим за URL-параметром при монтировании
  useEffect(() => {
    const url = new URL(window.location.href)
    const fromUrl = url.searchParams.get('gardenTheme')
    if (fromUrl && THEMES.some(t => t.id === fromUrl)) {
      localStorage.setItem(STORAGE_KEY, fromUrl)
      setThemeId(fromUrl)
      return
    }
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved && THEMES.some(t => t.id === saved)) {
      setThemeId(saved)
    }
  }, [])

  const setGardenTheme = (id: string) => {
    if (THEMES.some(t => t.id === id)) {
      localStorage.setItem(STORAGE_KEY, id)
      setThemeId(id)
    }
  }

  return {
    theme,
    themes: THEMES,
    setGardenTheme,
    isDarkTheme: theme.isDark,
  }
}
