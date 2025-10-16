/**
 * 🎯 Оптимизированный хук для получения telegramId
 * Использует контекст для избежания дублирования запросов
 */

import { useUserContext } from '@/contexts/UserContext'

export function useTelegramId(): number | undefined {
  const { telegramId } = useUserContext()
  return telegramId
}
