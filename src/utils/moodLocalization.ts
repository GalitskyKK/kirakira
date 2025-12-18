/**
 * Утилита для получения локализованных настроений
 */

import { MOOD_CONFIG } from '@/types/mood'
import type { MoodType } from '@/types'
import type { Translations } from '@/i18n/types'

export function getLocalizedMoodConfig(
  mood: MoodType,
  t: Translations
): {
  label: string
  description: string
  color: string
  emoji: string
  imagePath: string
} {
  const baseConfig = MOOD_CONFIG[mood]

  return {
    ...baseConfig,
    label: t.moodLabels[mood],
    description: t.moodDescriptions[mood],
  }
}

export function getLocalizedMoodLabel(mood: MoodType, t: Translations): string {
  return t.moodLabels[mood]
}

export function getLocalizedMoodDescription(
  mood: MoodType,
  t: Translations
): string {
  return t.moodDescriptions[mood]
}
