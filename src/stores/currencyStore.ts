/**
 * 💰 ВАЛЮТНЫЙ STORE
 * Управление ростками и кристаллами
 */

import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import type {
  CurrencyStore,
  UserCurrency,
  CurrencyTransaction,
  CurrencyType,
  CurrencyReason,
  ShopItemCost,
} from '@/types/currency'
import { hasEnoughCurrency } from '@/types/currency'
import { authenticatedFetch } from '@/utils/apiClient'
import type {
  CurrencyApiTransactionResponse,
  CurrencyApiBalanceResponse,
  StandardApiResponse,
} from '@/types/api'

// ===============================================
// 🏪 STORE IMPLEMENTATION
// ===============================================

export const useCurrencyStore = create<CurrencyStore>()(
  subscribeWithSelector((set, get) => ({
    // ===============================================
    // 📊 STATE
    // ===============================================
    userCurrency: null,
    recentTransactions: [],
    isLoading: false,
    error: null,

    // ===============================================
    // 📥 ДЕЙСТВИЯ: Получение данных
    // ===============================================

    /**
     * Загрузить баланс валют пользователя
     */
    loadCurrency: async (telegramId: number) => {
      set({ isLoading: true, error: null })

      try {
        console.log(`💰 Loading currency for user ${telegramId}`)

        const response = await authenticatedFetch(
          `/api/currency?action=balance&telegramId=${telegramId}`
        )

        if (!response.ok) {
          throw new Error(`Failed to load currency: ${response.status}`)
        }

        const result = (await response.json()) as StandardApiResponse<CurrencyApiBalanceResponse>

        if (!result.success || !result.data) {
          throw new Error(result.error || 'Failed to load currency')
        }

        const currency: UserCurrency = {
          telegramId: result.data.telegramId,
          sprouts: result.data.sprouts,
          gems: result.data.gems,
          totalSproutsEarned: result.data.totalSproutsEarned,
          totalGemsEarned: result.data.totalGemsEarned,
          totalSproutsSpent: result.data.totalSproutsSpent,
          totalGemsSpent: result.data.totalGemsSpent,
          createdAt: new Date(result.data.createdAt),
          lastUpdated: new Date(result.data.lastUpdated),
        }

        set({ userCurrency: currency, isLoading: false })

        console.log(`✅ Currency loaded:`, {
          sprouts: currency.sprouts,
          gems: currency.gems,
        })
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Failed to load currency'
        console.error('❌ Error loading currency:', error)
        set({ error: errorMessage, isLoading: false })
      }
    },

    /**
     * Загрузить историю транзакций
     */
    loadTransactions: async (
      telegramId: number,
      limit: number = 50
    ): Promise<CurrencyTransaction[]> => {
      try {
        console.log(`📜 Loading transactions for user ${telegramId}`)

        const response = await authenticatedFetch(
          `/api/currency?action=transactions&telegramId=${telegramId}&limit=${limit}`
        )

        if (!response.ok) {
          throw new Error(`Failed to load transactions: ${response.status}`)
        }

        const result = (await response.json()) as StandardApiResponse<CurrencyApiTransactionResponse>

        if (!result.success || !result.data) {
          throw new Error(result.error || 'Failed to load transactions')
        }

        const transactions: CurrencyTransaction[] = result.data.transactions.map(
          (tx) => ({
            id: tx.id,
            telegramId: tx.telegramId,
            transactionType: tx.transactionType as import('@/types/currency').TransactionType,
            currencyType: tx.currencyType as import('@/types/currency').CurrencyType,
            amount: tx.amount,
            balanceBefore: tx.balanceBefore,
            balanceAfter: tx.balanceAfter,
            reason: tx.reason as import('@/types/currency').CurrencyReason,
            ...(tx.description != null ? { description: tx.description } : {}),
            ...(tx.metadata != null ? { metadata: tx.metadata } : {}),
            ...(tx.relatedUserId != null ? { relatedUserId: tx.relatedUserId } : {}),
            createdAt: new Date(tx.createdAt),
          })
        )

        set({ recentTransactions: transactions })

        console.log(`✅ Loaded ${transactions.length} transactions`)

        return transactions
      } catch (error) {
        console.error('❌ Error loading transactions:', error)
        return []
      }
    },

    // ===============================================
    // 💰 ДЕЙСТВИЯ: Операции с валютой
    // ===============================================

    /**
     * Начислить валюту
     */
    earnCurrency: async (
      telegramId: number,
      currencyType: CurrencyType,
      amount: number,
      reason: CurrencyReason,
      description?: string,
      metadata?: Record<string, unknown>
    ) => {
      try {
        console.log(
          `💰 Earning ${amount} ${currencyType} for user ${telegramId}: ${reason}`
        )

        const response = await authenticatedFetch('/api/currency?action=earn', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            telegramId,
            currencyType,
            amount,
            reason,
            description,
            metadata,
          }),
        })

        if (!response.ok) {
          throw new Error(`Failed to earn currency: ${response.status}`)
        }

        const result = await response.json()

        if (!result.success) {
          throw new Error(result.error || 'Failed to earn currency')
        }

        // Обновляем локальный баланс
        const { userCurrency } = get()
        if (userCurrency && result.data.balance_after !== undefined) {
          const updatedCurrency: UserCurrency = {
            ...userCurrency,
            [currencyType]: result.data.balance_after,
            ...(currencyType === 'sprouts'
              ? {
                  totalSproutsEarned: userCurrency.totalSproutsEarned + amount,
                }
              : {
                  totalGemsEarned: userCurrency.totalGemsEarned + amount,
                }),
            lastUpdated: new Date(),
          }

          set({ userCurrency: updatedCurrency })

          console.log(
            `✅ Currency earned. New balance: ${result.data.balance_after}`
          )
        } else if (result.data.balance_after === undefined) {
          console.warn(
            '⚠️ Warning: balance_after is undefined, not updating local state'
          )
        }

        return {
          success: true,
          balance_after: result.data.balance_after,
          transaction_id: result.data.transaction_id,
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Failed to earn currency'
        console.error('❌ Error earning currency:', error)
        return {
          success: false,
          error: errorMessage,
        }
      }
    },

    /**
     * Списать валюту
     */
    spendCurrency: async (
      telegramId: number,
      currencyType: CurrencyType,
      amount: number,
      reason: CurrencyReason,
      description?: string,
      metadata?: Record<string, unknown>
    ) => {
      try {
        console.log(
          `💸 Spending ${amount} ${currencyType} for user ${telegramId}: ${reason}`
        )

        const response = await authenticatedFetch(
          '/api/currency?action=spend',
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              telegramId,
              currencyType,
              amount,
              reason,
              description,
              metadata,
            }),
          }
        )

        if (!response.ok) {
          throw new Error(`Failed to spend currency: ${response.status}`)
        }

        const result = await response.json()

        if (!result.success) {
          return {
            success: false,
            error: result.error || 'Insufficient funds',
          }
        }

        // Обновляем локальный баланс
        const { userCurrency } = get()
        if (userCurrency && result.data.balance_after !== undefined) {
          const updatedCurrency: UserCurrency = {
            ...userCurrency,
            [currencyType]: result.data.balance_after,
            ...(currencyType === 'sprouts'
              ? {
                  totalSproutsSpent: userCurrency.totalSproutsSpent + amount,
                }
              : {
                  totalGemsSpent: userCurrency.totalGemsSpent + amount,
                }),
            lastUpdated: new Date(),
          }

          set({ userCurrency: updatedCurrency })

          console.log(
            `✅ Currency spent. New balance: ${result.data.balance_after}`
          )
        } else if (result.data.balance_after === undefined) {
          console.warn(
            '⚠️ Warning: balance_after is undefined, not updating local state'
          )
        }

        return {
          success: true,
          balance_after: result.data.balance_after,
          transaction_id: result.data.transaction_id,
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Failed to spend currency'
        console.error('❌ Error spending currency:', error)
        return {
          success: false,
          error: errorMessage,
        }
      }
    },

    // ===============================================
    // 🛠️ ХЕЛПЕРЫ
    // ===============================================

    /**
     * Проверить, хватает ли средств для покупки
     */
    canAfford: (cost: ShopItemCost): boolean => {
      const { userCurrency } = get()
      if (!userCurrency) return false

      return hasEnoughCurrency(userCurrency, cost)
    },

    /**
     * Получить текущий баланс валюты
     */
    getBalance: (currencyType: CurrencyType): number => {
      const { userCurrency } = get()
      if (!userCurrency) return 0

      return currencyType === 'sprouts'
        ? userCurrency.sprouts
        : userCurrency.gems
    },

    // ===============================================
    // 🎯 STATE MANAGEMENT
    // ===============================================

    setLoading: (loading: boolean) => {
      set({ isLoading: loading })
    },

    setError: (error: string | null) => {
      set({ error })
    },

    clearError: () => {
      set({ error: null })
    },
  }))
)

// ===============================================
// 🔔 ПОДПИСКИ
// ===============================================

// Автоматическая синхронизация валюты при изменении пользователя
import { useUserStore } from './userStore'

useUserStore.subscribe(
  state => state.currentUser?.telegramId,
  telegramId => {
    if (telegramId) {
      const { loadCurrency } = useCurrencyStore.getState()
      void loadCurrency(telegramId)
    }
  }
)
