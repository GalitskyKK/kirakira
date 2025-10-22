/**
 * 💰 ТИПЫ ВАЛЮТНОЙ СИСТЕМЫ
 * Определяет интерфейсы для ростков, кристаллов и транзакций
 */

// ===============================================
// 💎 БАЗОВЫЕ ТИПЫ
// ===============================================

export type CurrencyType = 'sprouts' | 'gems'

export type TransactionType =
  | 'earn' // Заработано
  | 'spend' // Потрачено
  | 'admin_adjust' // Админская корректировка
  | 'gift_sent' // Подарок отправлен
  | 'gift_received' // Подарок получен
  | 'reward' // Награда
  | 'refund' // Возврат

// ===============================================
// 🌿 ПРИЧИНЫ НАЧИСЛЕНИЯ/СПИСАНИЯ
// ===============================================

// Причины заработка ростков
export type SproutEarnReason =
  // Ежедневные действия
  | 'daily_mood' // Запись настроения
  | 'daily_login' // Вход в приложение
  | 'first_mood_of_day' // Первая запись за день
  // Стрики
  | 'streak_3_days'
  | 'streak_7_days'
  | 'streak_14_days'
  | 'streak_30_days'
  | 'streak_100_days'
  | 'streak_365_days'
  // Прогрессия
  | 'level_up' // За повышение уровня
  | 'achievement_unlock' // За достижение
  | 'rare_achievement' // За редкое достижение
  // Элементы
  | 'element_common'
  | 'element_uncommon'
  | 'element_rare'
  | 'element_epic'
  | 'element_legendary'
  // Социальное
  | 'friend_visit_garden'
  | 'visit_friend_garden' // Removed complex quest
  | 'like_friend_garden' // Removed complex quest
  | 'receive_like' // Removed complex quest
  | 'share_garden' // Removed complex quest
  | 'comment_on_garden'
  | 'receive_comment'
  | 'gift_to_friend'
  // Челленджи
  | 'complete_daily_quest'
  | 'complete_weekly_challenge'
  | 'complete_monthly_challenge'
  | 'participate_in_community'
  // Прочее
  | 'garden_milestone'
  | 'room_created'
  | 'perfect_week'
  | 'help_newbie'

// Причины заработка кристаллов
export type GemEarnReason =
  // Достижения
  | 'weekly_streak'
  | 'monthly_streak'
  | 'level_up_milestone_5'
  | 'level_up_milestone_10'
  | 'rare_achievement'
  | 'epic_achievement'
  // Рейтинги
  | 'daily_top_10'
  | 'weekly_top_10'
  | 'monthly_top_10'
  | 'seasonal_top_100'
  // События
  | 'seasonal_event_complete'
  | 'community_event_participate'
  | 'first_legendary'
  | 'collection_complete'
  // Battle Pass
  | 'battle_pass_free_track'
  | 'battle_pass_premium_track'
  // Покупка
  | 'purchase_telegram_stars'

// Причины траты
export type CurrencySpendReason =
  // Косметика
  | 'room_theme_basic'
  | 'room_theme_advanced'
  | 'background_pack'
  | 'animation_pack'
  | 'plant_skin_common'
  | 'plant_skin_rare'
  | 'particle_effect'
  | 'buy_theme' // Покупка темы сада
  // Геймплей - Комнаты
  | 'extra_room'
  | 'room_upgrade_slots'
  // Геймплей - Управление
  | 'rearrange_token'
  | 'rearrange_unlimited_day'
  | 'streak_protection'
  | 'streak_freeze'
  | 'mood_reroll'
  // Улучшение элементов
  | 'upgrade_to_uncommon'
  | 'upgrade_to_rare'
  | 'upgrade_to_epic'
  | 'upgrade_to_legendary'
  | 'instant_upgrade_rare'
  | 'instant_upgrade_epic'
  | 'instant_upgrade_legendary'
  // Подарки
  | 'gift_sprouts_50'
  | 'gift_sprouts_100'
  | 'gift_plant'
  | 'gift_theme'
  // Бустеры
  | 'xp_boost_2x'
  | 'xp_boost_3x'
  | 'rare_boost'
  | 'rare_boost_mega'
  | 'sprout_boost'
  | 'sprout_boost_mega'
  | 'combo_boost'
  // Случайные награды
  | 'mystery_box_small'
  | 'mystery_box_medium'
  | 'mystery_box_large'
  | 'gacha_pull_single'
  | 'gacha_pull_10x'
  // Премиум
  | 'battle_pass_premium'
  | 'battle_pass_level_skip'
  | 'convert_to_sprouts'
  // Прочее
  | 'custom'

export type CurrencyReason =
  | SproutEarnReason
  | GemEarnReason
  | CurrencySpendReason

// ===============================================
// 📊 ИНТЕРФЕЙСЫ
// ===============================================

export interface Currency {
  readonly sprouts: number // 🌿 Ростки
  readonly gems: number // 💎 Кристаллы
}

export interface UserCurrency extends Currency {
  readonly telegramId: number
  readonly totalSproutsEarned: number
  readonly totalGemsEarned: number
  readonly totalSproutsSpent: number
  readonly totalGemsSpent: number
  readonly createdAt: Date
  readonly lastUpdated: Date
}

export interface CurrencyTransaction {
  readonly id: string
  readonly telegramId: number
  readonly transactionType: TransactionType
  readonly currencyType: CurrencyType
  readonly amount: number
  readonly balanceBefore: number
  readonly balanceAfter: number
  readonly reason: CurrencyReason
  readonly description?: string
  readonly metadata?: Record<string, unknown>
  readonly relatedUserId?: number // Для подарков
  readonly createdAt: Date
}

// ===============================================
// 🎁 НАГРАДЫ ЗА ДЕЙСТВИЯ
// ===============================================

export interface CurrencyReward {
  readonly sprouts?: number
  readonly gems?: number
  readonly reason: CurrencyReason
  readonly description?: string
  readonly metadata?: Record<string, unknown>
}

// ===============================================
// 💰 КОНСТАНТЫ НАГРАД (из features.md)
// ===============================================

export const SPROUT_REWARDS: Record<
  SproutEarnReason,
  { readonly amount: number; readonly description: string }
> = {
  // Ежедневные действия
  daily_mood: { amount: 10, description: 'Запись настроения' },
  daily_login: { amount: 5, description: 'Вход в приложение' },
  first_mood_of_day: { amount: 15, description: 'Первая запись за день' },

  // Стрики
  streak_3_days: { amount: 25, description: 'Стрик 3 дня' },
  streak_7_days: { amount: 75, description: 'Стрик 7 дней' },
  streak_14_days: { amount: 200, description: 'Стрик 14 дней' },
  streak_30_days: { amount: 500, description: 'Стрик 30 дней' },
  streak_100_days: { amount: 2000, description: 'Стрик 100 дней' },
  streak_365_days: { amount: 10000, description: 'Стрик год!' },

  // Прогрессия
  level_up: { amount: 100, description: 'Повышение уровня (базово)' },
  achievement_unlock: { amount: 50, description: 'Достижение разблокировано' },
  rare_achievement: { amount: 150, description: 'Редкое достижение' },

  // Элементы
  element_common: { amount: 5, description: 'Получен обычный элемент' },
  element_uncommon: { amount: 10, description: 'Получен необычный элемент' },
  element_rare: { amount: 25, description: 'Получен редкий элемент' },
  element_epic: { amount: 60, description: 'Получен эпический элемент' },
  element_legendary: {
    amount: 150,
    description: 'Получен легендарный элемент',
  },

  // Социальное
  friend_visit_garden: { amount: 5, description: 'Друг посетил твой сад' },
  visit_friend_garden: { amount: 3, description: 'Посещение сада друга' }, // Removed complex quest
  like_friend_garden: { amount: 2, description: 'Лайк саду друга' }, // Removed complex quest
  receive_like: { amount: 5, description: 'Получен лайк' }, // Removed complex quest
  share_garden: { amount: 20, description: 'Поделился садом' }, // Removed complex quest
  comment_on_garden: { amount: 5, description: 'Комментарий на саду' },
  receive_comment: { amount: 8, description: 'Получен комментарий' },
  gift_to_friend: { amount: 10, description: 'Подарил другу' },

  // Челленджи
  complete_daily_quest: {
    amount: 30,
    description: 'Дневное задание выполнено',
  },
  complete_weekly_challenge: {
    amount: 150,
    description: 'Недельный челлендж',
  },
  complete_monthly_challenge: {
    amount: 500,
    description: 'Месячный челлендж',
  },
  participate_in_community: {
    amount: 25,
    description: 'Участие в комьюнити',
  },

  // Прочее
  garden_milestone: {
    amount: 100,
    description: 'Каждые 50 элементов в саду',
  },
  room_created: { amount: 50, description: 'Создана новая комната' },
  perfect_week: { amount: 200, description: 'Идеальная неделя' },
  help_newbie: { amount: 15, description: 'Помощь новичку' },
} as const

export const GEM_REWARDS: Record<
  GemEarnReason,
  { readonly amount: number; readonly description: string }
> = {
  // Достижения
  weekly_streak: { amount: 1, description: 'Стрик 7 дней' },
  monthly_streak: { amount: 5, description: 'Стрик 30 дней' },
  level_up_milestone_5: { amount: 3, description: 'Каждые 5 уровней' },
  level_up_milestone_10: { amount: 10, description: 'Каждые 10 уровней' },
  rare_achievement: { amount: 3, description: 'Редкое достижение' },
  epic_achievement: { amount: 8, description: 'Эпическое достижение' },

  // Рейтинги
  daily_top_10: { amount: 2, description: 'Топ-10 дня' },
  weekly_top_10: { amount: 5, description: 'Топ-10 недели' },
  monthly_top_10: { amount: 15, description: 'Топ-10 месяца' },
  seasonal_top_100: { amount: 50, description: 'Топ-100 сезона' },

  // События
  seasonal_event_complete: { amount: 10, description: 'Сезонное событие' },
  community_event_participate: {
    amount: 5,
    description: 'Комьюнити событие',
  },
  first_legendary: {
    amount: 5,
    description: 'Первый легендарный элемент',
  },
  collection_complete: { amount: 20, description: 'Коллекция собрана' },

  // Battle Pass
  battle_pass_free_track: { amount: 1, description: 'Battle Pass уровень' },
  battle_pass_premium_track: {
    amount: 3,
    description: 'Battle Pass Premium',
  },

  // Покупка
  purchase_telegram_stars: { amount: 0, description: 'Покупка за Stars' }, // Динамически
} as const

// ===============================================
// 📦 СТОИМОСТИ ПОКУПОК (из features.md)
// ===============================================

export interface ShopItemCost {
  readonly sprouts?: number
  readonly gems?: number
}

export const SHOP_COSTS: Record<CurrencySpendReason, ShopItemCost> = {
  // Косметика
  room_theme_basic: { sprouts: 200 },
  room_theme_advanced: { sprouts: 500 },
  background_pack: { sprouts: 300 },
  animation_pack: { sprouts: 400 },
  plant_skin_common: { sprouts: 150 },
  plant_skin_rare: { sprouts: 300 },
  particle_effect: { sprouts: 250 },
  buy_theme: { sprouts: 500 }, // Покупка темы сада

  // Геймплей - Комнаты
  extra_room: { sprouts: 800 },
  room_upgrade_slots: { sprouts: 1200 },

  // Геймплей - Управление
  rearrange_token: { sprouts: 50 },
  rearrange_unlimited_day: { sprouts: 200 },
  streak_protection: { sprouts: 300 },
  streak_freeze: { sprouts: 500 },
  mood_reroll: { sprouts: 75 },

  // Улучшение элементов
  upgrade_to_uncommon: { sprouts: 100 },
  upgrade_to_rare: { sprouts: 300 },
  upgrade_to_epic: { sprouts: 800 },
  upgrade_to_legendary: { sprouts: 2000 },
  instant_upgrade_rare: { gems: 10 },
  instant_upgrade_epic: { gems: 25 },
  instant_upgrade_legendary: { gems: 60 },

  // Подарки
  gift_sprouts_50: { sprouts: 50 },
  gift_sprouts_100: { sprouts: 100 },
  gift_plant: { sprouts: 200 },
  gift_theme: { sprouts: 300 },

  // Бустеры
  xp_boost_2x: { sprouts: 150 },
  xp_boost_3x: { sprouts: 400 },
  rare_boost: { sprouts: 250 },
  rare_boost_mega: { sprouts: 600 },
  sprout_boost: { sprouts: 200 },
  sprout_boost_mega: { sprouts: 500 },
  combo_boost: { sprouts: 800 },

  // Случайные награды
  mystery_box_small: { sprouts: 100 },
  mystery_box_medium: { sprouts: 300 },
  mystery_box_large: { sprouts: 800 },
  gacha_pull_single: { sprouts: 200 },
  gacha_pull_10x: { sprouts: 1800 },

  // Премиум
  battle_pass_premium: { gems: 150 },
  battle_pass_level_skip: { gems: 10 },
  convert_to_sprouts: { gems: 1 }, // 1 💎 = 250 🌿

  // Прочее
  custom: {},
} as const

// ===============================================
// 🔄 STATE ИНТЕРФЕЙСЫ
// ===============================================

export interface CurrencyState {
  readonly userCurrency: UserCurrency | null
  readonly recentTransactions: readonly CurrencyTransaction[]
  readonly isLoading: boolean
  readonly error: string | null
}

export interface CurrencyActions {
  // Получение данных
  loadCurrency: (telegramId: number) => Promise<void>
  loadTransactions: (
    telegramId: number,
    limit?: number
  ) => Promise<CurrencyTransaction[]>

  // Операции с валютой
  earnCurrency: (
    telegramId: number,
    currencyType: CurrencyType,
    amount: number,
    reason: CurrencyReason,
    description?: string,
    metadata?: Record<string, unknown>
  ) => Promise<{
    success: boolean
    newBalance?: number
    transactionId?: string
    error?: string
  }>

  spendCurrency: (
    telegramId: number,
    currencyType: CurrencyType,
    amount: number,
    reason: CurrencyReason,
    description?: string,
    metadata?: Record<string, unknown>
  ) => Promise<{
    success: boolean
    newBalance?: number
    transactionId?: string
    error?: string
  }>

  // Хелперы
  canAfford: (cost: ShopItemCost) => boolean
  getBalance: (currencyType: CurrencyType) => number

  // State management
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  clearError: () => void
}

export type CurrencyStore = CurrencyState & CurrencyActions

// ===============================================
// 🎯 УТИЛИТЫ
// ===============================================

/**
 * Вычисляет награду за повышение уровня
 * Формула: 100 + (level * 50)
 */
export function calculateLevelUpReward(level: number): number {
  return 100 + level * 50
}

/**
 * Проверяет достаточность средств
 */
export function hasEnoughCurrency(
  userCurrency: Currency,
  cost: ShopItemCost
): boolean {
  const hasSprouts = cost.sprouts ? userCurrency.sprouts >= cost.sprouts : true
  const hasGems = cost.gems ? userCurrency.gems >= cost.gems : true
  return hasSprouts && hasGems
}

/**
 * Получает описание причины транзакции
 */
export function getReasonDescription(reason: CurrencyReason): string {
  if (reason in SPROUT_REWARDS) {
    return SPROUT_REWARDS[reason as SproutEarnReason].description
  }
  if (reason in GEM_REWARDS) {
    return GEM_REWARDS[reason as GemEarnReason].description
  }
  return 'Транзакция'
}

/**
 * Получает сумму награды
 */
export function getRewardAmount(
  reason: SproutEarnReason | GemEarnReason,
  level?: number
): number {
  if (reason === 'level_up' && level !== undefined) {
    return calculateLevelUpReward(level)
  }

  if (reason in SPROUT_REWARDS) {
    return SPROUT_REWARDS[reason as SproutEarnReason].amount
  }

  if (reason in GEM_REWARDS) {
    return GEM_REWARDS[reason as GemEarnReason].amount
  }

  return 0
}
