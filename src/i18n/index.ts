/**
 * Система локализации
 */

import type { Locale, Translations } from './types'
import { ru } from './locales/ru'
import { en } from './locales/en'

const translations: Record<Locale, Translations> = {
  ru,
  en,
}

export function getTranslations(locale: Locale): Translations {
  return translations[locale] ?? translations.ru
}

export type { Locale, Translations }
