/**
 * Хук для использования переводов
 */

import { useMemo } from 'react'
import { useLocaleStore } from '@/stores/localeStore'
import { getTranslations } from '@/i18n'
import type { Translations } from '@/i18n/types'

export function useTranslation(): Translations {
  const locale = useLocaleStore(state => state.locale)

  return useMemo(() => getTranslations(locale), [locale])
}
