/**
 * Store для управления языком интерфейса
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Locale } from '@/i18n/types'

interface LocaleState {
  readonly locale: Locale
  readonly setLocale: (locale: Locale) => void
}

const DEFAULT_LOCALE: Locale = 'ru'

// Определяем язык по умолчанию из браузера
function getDefaultLocale(): Locale {
  if (typeof window === 'undefined') return DEFAULT_LOCALE

  const browserLang = navigator.language.toLowerCase()
  if (browserLang.startsWith('en')) return 'en'
  if (browserLang.startsWith('ru')) return 'ru'

  return DEFAULT_LOCALE
}

export const useLocaleStore = create<LocaleState>()(
  persist<LocaleState>(
    set => ({
      locale: getDefaultLocale(),
      setLocale: (locale: Locale) => {
        set({ locale })
      },
    }),
    {
      name: 'kirakira-locale',
    }
  )
)
