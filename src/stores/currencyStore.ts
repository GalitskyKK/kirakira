/**
 * 💰 Currency Client State Store (v2 - Refactored)
 * Хранит ТОЛЬКО клиентское UI состояние валюты
 * Серверное состояние (баланс, транзакции) управляется через React Query
 */

import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import type { UserCurrency, CurrencyTransaction } from '@/types/currency'

// ============================================
// ТИПЫ СОСТОЯНИЯ
// ============================================

interface CurrencyClientState {
  // UI состояние (кэшированные данные из React Query для обратной совместимости)
  readonly userCurrency: UserCurrency | null
  readonly recentTransactions: readonly CurrencyTransaction[]

  // UI флаги
  readonly isLoading: boolean
  readonly error: string | null

  // Actions для обновления из React Query (временное решение для обратной совместимости)
  updateCurrencyFromQuery: (currency: UserCurrency) => void
  updateTransactionsFromQuery: (
    transactions: readonly CurrencyTransaction[]
  ) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  clearError: () => void

  // Хелперы для UI
  canAfford: (cost: import('@/types/currency').ShopItemCost) => boolean
  getBalance: (currencyType: import('@/types/currency').CurrencyType) => number
}

// ============================================
// STORE
// ============================================

export const useCurrencyClientStore = create<CurrencyClientState>()(
  subscribeWithSelector((set, get) => ({
    // Начальное состояние
    userCurrency: null,
    recentTransactions: [],
    isLoading: false,
    error: null,

    // Обновление из React Query (временное решение)
    updateCurrencyFromQuery: (currency: UserCurrency) => {
      set({ userCurrency: currency })
    },

    updateTransactionsFromQuery: (
      transactions: readonly CurrencyTransaction[]
    ) => {
      set({ recentTransactions: transactions })
    },

    setLoading: (loading: boolean) => {
      set({ isLoading: loading })
    },

    setError: (error: string | null) => {
      set({ error })
    },

    clearError: () => {
      set({ error: null })
    },

    // Хелперы
    canAfford: (cost: import('@/types/currency').ShopItemCost) => {
      const { userCurrency } = get()
      if (!userCurrency) return false

      const { hasEnoughCurrency } = require('@/types/currency')
      return hasEnoughCurrency(userCurrency, cost)
    },

    getBalance: (
      currencyType: import('@/types/currency').CurrencyType
    ): number => {
      const { userCurrency } = get()
      if (!userCurrency) return 0

      return currencyType === 'sprouts'
        ? userCurrency.sprouts
        : userCurrency.gems
    },
  }))
)

/**
 * Хук для получения баланса валюты (UI только)
 * Для получения данных используйте useCurrencyBalance() из React Query
 */
export function useCurrencyBalanceUI() {
  return useCurrencyClientStore(state => state.userCurrency)
}

/**
 * Хук для проверки достаточности средств
 */
export function useCanAfford() {
  return useCurrencyClientStore(state => state.canAfford)
}
