/**
 * 💰 Currency Sync Hook (v2 - React Query)
 * Синхронизирует React Query данные валюты с currencyStore для обратной совместимости
 * 
 * @deprecated Это временное решение для обратной совместимости
 * В будущем все компоненты должны использовать useCurrencyBalance() напрямую
 */

import { useEffect } from 'react'
import { useCurrencyBalance, useCurrencyTransactions } from '@/hooks/queries'
import { useCurrencyClientStore } from '@/stores/currencyStore.v2'
import { useTelegramId } from '@/hooks/useTelegramId'

/**
 * Хук для синхронизации валюты из React Query в v2 store
 * Используйте этот хук в компонентах, где нужна обратная совместимость
 */
export function useCurrencySync() {
  const telegramId = useTelegramId()
  const { data: currencyData } = useCurrencyBalance(telegramId, !!telegramId)
  const { data: transactionsData } = useCurrencyTransactions(
    telegramId,
    50,
    !!telegramId
  )
  const { updateCurrencyFromQuery, updateTransactionsFromQuery } =
    useCurrencyClientStore()

  // Синхронизируем React Query данные в v2 store
  useEffect(() => {
    if (currencyData && updateCurrencyFromQuery) {
      updateCurrencyFromQuery(currencyData)
    }
  }, [currencyData, updateCurrencyFromQuery])

  useEffect(() => {
    if (transactionsData && updateTransactionsFromQuery) {
      updateTransactionsFromQuery(transactionsData)
    }
  }, [transactionsData, updateTransactionsFromQuery])

  return currencyData
}

