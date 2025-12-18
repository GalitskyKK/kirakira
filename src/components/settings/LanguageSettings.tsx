/**
 * Компонент настроек языка
 */

import { useLocaleStore } from '@/stores/localeStore'
// import { useTranslation } from '@/hooks/useTranslation'
import type { Locale } from '@/i18n/types'

const LOCALE_OPTIONS: readonly {
  value: Locale
  label: string
  flag: string
}[] = [
  { value: 'ru', label: 'Русский', flag: '🇷🇺' },
  { value: 'en', label: 'English', flag: '🇺🇸' },
] as const

export function LanguageSettings() {
  const { locale, setLocale } = useLocaleStore()
  // const t = useTranslation()

  return (
    <div className="space-y-3">
      {/* <div className="flex items-center gap-2">
        <Languages className="h-5 w-5 text-neutral-600 dark:text-neutral-400" />
        <div>
          <h3 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
            {t.settings.language}
          </h3>
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            {t.settings.languageDescription}
          </p>
        </div>
      </div> */}

      <div className="grid grid-cols-2 gap-2">
        {LOCALE_OPTIONS.map(option => {
          const isSelected = locale === option.value

          return (
            <button
              key={option.value}
              type="button"
              onClick={() => setLocale(option.value)}
              className={`flex items-center gap-2 rounded-xl border-2 px-4 py-3 text-left transition-all ${
                isSelected
                  ? 'border-blue-500 bg-blue-50 dark:border-blue-400 dark:bg-blue-900/20'
                  : 'border-neutral-200 bg-white hover:border-neutral-300 dark:border-neutral-700 dark:bg-neutral-800 dark:hover:border-neutral-600'
              }`}
            >
              <span className="text-xl">{option.flag}</span>
              <span
                className={`font-medium ${
                  isSelected
                    ? 'text-blue-700 dark:text-blue-300'
                    : 'text-neutral-700 dark:text-neutral-300'
                }`}
              >
                {option.label}
              </span>
              {isSelected && <span className="ml-auto text-blue-500">✓</span>}
            </button>
          )
        })}
      </div>
    </div>
  )
}
