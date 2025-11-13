/**
 * 💰 Currency React Query Hooks
 * Хуки для работы с валютой через React Query
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { authenticatedFetch } from '@/utils/apiClient'
import type {
  StandardApiResponse,
  CurrencyApiBalanceResponse,
  CurrencyApiTransactionResponse,
} from '@/types/api'
import type {
  UserCurrency,
  CurrencyTransaction,
  CurrencyType,
  CurrencyReason,
} from '@/types/currency'

// ============================================
// QUERY KEYS - Константы для React Query
// ============================================

export const currencyKeys = {
  all: ['currency'] as const,
  balance: (telegramId: number) =>
    [...currencyKeys.all, 'balance', telegramId] as const,
  transactions: (telegramId: number) =>
    [...currencyKeys.all, 'transactions', telegramId] as const,
}

// ============================================
// API FUNCTIONS
// ============================================

/**
 * Загружает баланс валюты пользователя
 */
async function getCurrencyBalance(
  telegramId: number
): Promise<UserCurrency> {
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

  return {
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
}

/**
 * Загружает историю транзакций
 */
async function getCurrencyTransactions(
  telegramId: number,
  limit: number = 50
): Promise<readonly CurrencyTransaction[]> {
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

  return result.data.transactions.map(tx => ({
    id: tx.id,
    telegramId: tx.telegramId,
    transactionType: tx.transactionType as import('@/types/currency').TransactionType,
    currencyType: tx.currencyType as CurrencyType,
    amount: tx.amount,
    balanceBefore: tx.balanceBefore,
    balanceAfter: tx.balanceAfter,
    reason: tx.reason as CurrencyReason,
    ...(tx.description != null ? { description: tx.description } : {}),
    ...(tx.metadata != null ? { metadata: tx.metadata } : {}),
    ...(tx.relatedUserId != null ? { relatedUserId: tx.relatedUserId } : {}),
    createdAt: new Date(tx.createdAt),
  }))
}

/**
 * Начислить валюту
 */
async function earnCurrency(
  telegramId: number,
  currencyType: CurrencyType,
  amount: number,
  reason: CurrencyReason,
  description?: string,
  metadata?: Record<string, unknown>
): Promise<{
  success: boolean
  balance_after?: number
  transaction_id?: string
  error?: string
}> {
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
    return {
      success: false,
      error: result.error || 'Failed to earn currency',
    }
  }

  return {
    success: true,
    balance_after: result.data.balance_after,
    transaction_id: result.data.transaction_id,
  }
}

/**
 * Списать валюту
 */
async function spendCurrency(
  telegramId: number,
  currencyType: CurrencyType,
  amount: number,
  reason: CurrencyReason,
  description?: string,
  metadata?: Record<string, unknown>
): Promise<{
  success: boolean
  balance_after?: number
  transaction_id?: string
  error?: string
}> {
  const response = await authenticatedFetch('/api/currency?action=spend', {
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
    throw new Error(`Failed to spend currency: ${response.status}`)
  }

  const result = await response.json()

  if (!result.success) {
    return {
      success: false,
      error: result.error || 'Insufficient funds',
    }
  }

  return {
    success: true,
    balance_after: result.data.balance_after,
    transaction_id: result.data.transaction_id,
  }
}

// ============================================
// QUERY HOOKS - Получение данных
// ============================================

/**
 * Хук для получения баланса валюты
 */
export function useCurrencyBalance(
  telegramId: number | undefined,
  enabled = true
) {
  return useQuery({
    queryKey: currencyKeys.balance(telegramId ?? 0),
    queryFn: () => {
      if (!telegramId) {
        throw new Error('Telegram ID is required')
      }
      return getCurrencyBalance(telegramId)
    },
    enabled: enabled && !!telegramId,
    staleTime: 1000 * 30, // 30 секунд
    gcTime: 1000 * 60 * 5, // 5 минут в кеше
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  })
}

/**
 * Хук для получения истории транзакций
 */
export function useCurrencyTransactions(
  telegramId: number | undefined,
  limit: number = 50,
  enabled = true
) {
  return useQuery({
    queryKey: currencyKeys.transactions(telegramId ?? 0),
    queryFn: () => {
      if (!telegramId) {
        throw new Error('Telegram ID is required')
      }
      return getCurrencyTransactions(telegramId, limit)
    },
    enabled: enabled && !!telegramId,
    staleTime: 1000 * 60, // 1 минута
    gcTime: 1000 * 60 * 10, // 10 минут в кеше
  })
}

// ============================================
// MUTATION HOOKS - Изменение данных
// ============================================

/**
 * Хук для начисления валюты
 */
export function useEarnCurrency() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      telegramId,
      currencyType,
      amount,
      reason,
      description,
      metadata,
    }: {
      telegramId: number
      currencyType: CurrencyType
      amount: number
      reason: CurrencyReason
      description?: string
      metadata?: Record<string, unknown>
    }) => earnCurrency(telegramId, currencyType, amount, reason, description, metadata),
    onSuccess: (result, variables) => {
      if (result.success) {
        // Инвалидируем queries для перезагрузки баланса
        queryClient.invalidateQueries({
          queryKey: currencyKeys.balance(variables.telegramId),
        })
        queryClient.invalidateQueries({
          queryKey: currencyKeys.transactions(variables.telegramId),
        })
      }
    },
    onError: error => {
      console.error('❌ Failed to earn currency:', error)
    },
  })
}

/**
 * Хук для списания валюты
 */
export function useSpendCurrency() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      telegramId,
      currencyType,
      amount,
      reason,
      description,
      metadata,
    }: {
      telegramId: number
      currencyType: CurrencyType
      amount: number
      reason: CurrencyReason
      description?: string
      metadata?: Record<string, unknown>
    }) => spendCurrency(telegramId, currencyType, amount, reason, description, metadata),
    onSuccess: (result, variables) => {
      if (result.success) {
        // Инвалидируем queries для перезагрузки баланса
        queryClient.invalidateQueries({
          queryKey: currencyKeys.balance(variables.telegramId),
        })
        queryClient.invalidateQueries({
          queryKey: currencyKeys.transactions(variables.telegramId),
        })
      }
    },
    onError: error => {
      console.error('❌ Failed to spend currency:', error)
    },
  })
}

