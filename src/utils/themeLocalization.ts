import type { Translations } from '@/i18n/types'

/**
 * Получить локализованное название темы по её ID
 */
export function getLocalizedThemeName(
  themeId: string,
  t: Translations
): string {
  const themeNameKey = themeId as keyof typeof t.themeNames
  if (themeNameKey in t.themeNames) {
    return t.themeNames[themeNameKey]
  }
  // Fallback на оригинальное название, если локализация не найдена
  return themeId
}
