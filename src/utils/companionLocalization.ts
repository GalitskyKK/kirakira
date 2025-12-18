import type { CompanionEmotion } from '@/types'
import type { Translations } from '@/i18n/types'

/**
 * Получить локализованное имя компаньона
 */
export function getLocalizedCompanionName(
  companionId: string,
  t: Translations
): string {
  if (companionId === 'lumina') {
    return t.companion.name
  }
  return companionId
}

/**
 * Получить локализованное описание компаньона
 */
export function getLocalizedCompanionDescription(
  companionId: string,
  t: Translations
): string {
  if (companionId === 'lumina') {
    return t.companion.description
  }
  return ''
}

/**
 * Получить локализованную эмоцию компаньона
 */
export function getLocalizedCompanionEmotion(
  emotion: CompanionEmotion,
  t: Translations
): { label: string; description: string } {
  const emotionKey = emotion as keyof typeof t.companion.emotions
  if (emotionKey in t.companion.emotions) {
    return t.companion.emotions[emotionKey]
  }
  return {
    label: emotion,
    description: '',
  }
}
