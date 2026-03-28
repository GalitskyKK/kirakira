/**
 * Синтетические telegram_id для входа по почте (см. миграцию next_kirakira_internal_telegram_id).
 * Реальные Telegram user id всегда меньше этого порога.
 */
export const KIRAKIRA_INTERNAL_TELEGRAM_ID_MIN = 9_000_000_000_001 as const

export function isKirakiraSyntheticTelegramId(telegramId: number): boolean {
  return Number.isFinite(telegramId) && telegramId >= KIRAKIRA_INTERNAL_TELEGRAM_ID_MIN
}
