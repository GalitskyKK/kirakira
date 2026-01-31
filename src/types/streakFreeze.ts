/**
 * 🧊 ТИПЫ ДЛЯ ЗАМОРОЗОК СТРИКА
 * Покупка, использование и управление заморозками
 */

import type { ShopItemCost } from './currency'

// ===============================================
// 🧊 ТИПЫ ЗАМОРОЗОК
// ===============================================

export type FreezeType = 'manual' | 'auto'

export interface StreakFreezeData {
  readonly manual: number // Количество ручных заморозок
  readonly auto: number // Количество авто-заморозок
  readonly max: number // Максимальное накопление ручных заморозок (зависит от уровня)
  readonly canAccumulate: boolean // Можно ли накапливать больше
}

// ===============================================
// 🛒 ПОКУПКА ЗАМОРОЗОК
// ===============================================

export interface BuyStreakFreezeRequest {
  readonly telegramId: number
  readonly freezeType: FreezeType
  readonly quantity?: number // По умолчанию 1
}

export interface BuyStreakFreezeResponse {
  readonly success: boolean
  readonly data?: {
    readonly freezeType: FreezeType
    readonly quantityBought: number
    readonly newAmount: number // Новое количество заморозок этого типа
    readonly totalCost: number
    readonly currencyUsed: 'sprouts' | 'gems'
    readonly newBalance: number
    readonly transactionId?: string
  }
  readonly error?: string
}

// ===============================================
// 📊 КОНФИГУРАЦИЯ МАГАЗИНА ЗАМОРОЗОК
// ===============================================

/**
 * Конфигурация стоимости заморозок
 * Легко меняется с sprouts на gems или обратно
 */
export interface FreezeShopConfig {
  readonly manual: ShopItemCost
  readonly auto: ShopItemCost
}

export const FREEZE_SHOP_CONFIG: FreezeShopConfig = {
  // 🔧 Ручные заморозки стрика
  manual: {
    sprouts: 1500, // 🌿 Обычная заморозка
    // gems: 5,    // 💎 Альтернатива: раскомментировать для гемов
  },
  // 🤖 Авто-заморозки (дороже, так как автоматические)
  auto: {
    sprouts: 3000, // 🌿 Автозаморозка
    // gems: 10,   // 💎 Альтернатива: раскомментировать для гемов
  },
} as const

/**
 * Получить стоимость заморозки
 */
export function getFreezeCost(
  freezeType: FreezeType,
  quantity: number = 1
): {
  cost: ShopItemCost
  totalSprouts: number
  totalGems: number
} {
  const itemCost = FREEZE_SHOP_CONFIG[freezeType]

  return {
    cost: itemCost,
    totalSprouts: (itemCost.sprouts ?? 0) * quantity,
    totalGems: (itemCost.gems ?? 0) * quantity,
  }
}

/**
 * Определить, какая валюта используется для покупки
 */
export function getFreezeCurrencyType(
  freezeType: FreezeType
): 'sprouts' | 'gems' {
  const cost = FREEZE_SHOP_CONFIG[freezeType]
  // Приоритет: gems > sprouts
  if (cost.gems && cost.gems > 0) return 'gems'
  return 'sprouts'
}

/**
 * Получить название валюты для UI
 */
export function getFreezeCurrencyLabel(freezeType: FreezeType): string {
  const currencyType = getFreezeCurrencyType(freezeType)
  return currencyType === 'gems' ? '💎 Гемы' : '🌿 Ростки'
}

// ===============================================
// 📝 ОПИСАНИЯ ДЛЯ UI
// ===============================================

export const FREEZE_DESCRIPTIONS = {
  manual: {
    name: 'Заморозка стрика',
    emoji: '🧊',
    description: 'Защищает стрик на 1 пропущенный день.',
    shortDescription: 'Ручная защита стрика',
  },
  auto: {
    name: 'Авто-заморозка',
    emoji: '❄️',
    description:
      'Автоматически защищает стрик при пропуске дня.',
    shortDescription: 'Автоматическая защита',
  },
} as const
