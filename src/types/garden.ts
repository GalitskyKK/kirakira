export interface Position2D {
  x: number
  y: number
}

export enum ElementType {
  FLOWER = 'flower',
  TREE = 'tree',
  STONE = 'stone',
  WATER = 'water',
  GRASS = 'grass',
  MUSHROOM = 'mushroom',
  CRYSTAL = 'crystal',
  DECORATION = 'decoration',
  // Премиум элементы
  RAINBOW_FLOWER = 'rainbow_flower',
  GLOWING_CRYSTAL = 'glowing_crystal',
  MYSTIC_MUSHROOM = 'mystic_mushroom',
  AURORA_TREE = 'aurora_tree',
  STARLIGHT_DECORATION = 'starlight_decoration',
}

export enum RarityLevel {
  COMMON = 'common',
  UNCOMMON = 'uncommon',
  RARE = 'rare',
  EPIC = 'epic',
  LEGENDARY = 'legendary',
}

export enum SeasonalVariant {
  SPRING = 'spring',
  SUMMER = 'summer',
  AUTUMN = 'autumn',
  WINTER = 'winter',
}

export interface GardenElement {
  readonly id: string
  readonly type: ElementType
  readonly position: Position2D
  readonly unlockDate: Date
  readonly moodInfluence: MoodType
  readonly rarity: RarityLevel
  readonly seasonalVariant?: SeasonalVariant
  readonly name: string
  readonly description: string
  readonly emoji: string
  readonly color: string
  readonly scale?: number // Масштаб элемента для разнообразия (0.85-1.15)
}

export interface Garden {
  readonly id: string
  readonly userId: string
  readonly elements: readonly GardenElement[]
  readonly createdAt: Date
  readonly lastVisited: Date
  readonly streak: number
  readonly season: SeasonalVariant
}

export interface GardenState {
  readonly currentGarden: Garden | null
  readonly isLoading: boolean
  readonly error: string | null
  readonly viewMode: ViewMode
  readonly selectedElement: GardenElement | null
  readonly lastSyncTime: number // Время последней синхронизации для ограничения запросов
  readonly currentRoomIndex: number // Текущая комната сада
}

export enum ViewMode {
  OVERVIEW = 'overview',
  DETAIL = 'detail',
  ARRANGEMENT = 'arrangement',
}

/**
 * Режимы отображения сада
 */
export enum GardenDisplayMode {
  GARDEN = 'garden', // Классический сад с полками
  PALETTE = 'palette', // Палитра настроений (Canvas)
  ISOMETRIC_ROOM = 'isometric_room', // Изометрическая 3D комната
  BONSAI = 'bonsai', // Дерево бонсай (будущее)
  BEDS = 'beds', // Грядки настроений (будущее)
}

export type MoodType =
  | 'joy'
  | 'calm'
  | 'stress'
  | 'sadness'
  | 'anger'
  | 'anxiety'

// Garden Room System - для масштабируемости сада
export interface GardenRoom {
  readonly id: string
  readonly index: number // Номер комнаты (0, 1, 2, ...)
  readonly name: string // "Первая комната", "Вторая комната", и т.д.
  readonly elements: readonly GardenElement[] // Элементы в этой комнате
  readonly capacity: number // Максимум элементов в комнате
  readonly isFull: boolean // Комната заполнена
}

export interface RoomNavigationState {
  readonly currentRoomIndex: number
  readonly totalRooms: number
  readonly canNavigateNext: boolean
  readonly canNavigatePrev: boolean
}

// Константы для сада
export const GARDEN_GRID_SIZE = 10
export const MAX_ELEMENTS_PER_DAY = 1
export const ELEMENT_SIZE = 40 // pixels

// Константы для системы комнат
export const SHELVES_PER_ROOM = 4 // 4 полки в комнате
export const MAX_POSITIONS_PER_SHELF = 4 // До 5 позиций на полке (соответствует ShelfView)
export const ELEMENTS_PER_ROOM = SHELVES_PER_ROOM * MAX_POSITIONS_PER_SHELF // 16 элементов на комнату
export const ROOM_TRANSITION_DURATION = 0.5 // Длительность анимации перехода (секунды)

// ===============================================
// ⬆️ СИСТЕМА УЛУЧШЕНИЯ ЭЛЕМЕНТОВ
// ===============================================

/**
 * Информация об улучшении элемента
 */
export interface ElementUpgrade {
  readonly id: string
  readonly elementId: string
  readonly telegramId: number
  readonly originalRarity: RarityLevel
  readonly currentRarity: RarityLevel
  readonly upgradeCount: number
  readonly failedAttempts: number
  readonly progressBonus: number
  readonly lastUpgradeAt: Date
  readonly createdAt: Date
}

/**
 * Результат попытки улучшения
 */
export interface UpgradeResult {
  readonly success: boolean
  readonly upgraded: boolean
  readonly newRarity?: RarityLevel
  readonly xpReward?: number
  readonly progressBonus?: number
  readonly failedAttempts?: number
  readonly cost: number
  readonly usedFree: boolean
  readonly error?: string
}

/**
 * Стоимость улучшения для каждой редкости (в ростках)
 */
export const UPGRADE_COSTS: Record<RarityLevel, number> = {
  [RarityLevel.COMMON]: 100,
  [RarityLevel.UNCOMMON]: 300,
  [RarityLevel.RARE]: 800,
  [RarityLevel.EPIC]: 2000,
  [RarityLevel.LEGENDARY]: 0, // Нельзя улучшить legendary
}

/**
 * Награды опытом за успешное улучшение
 */
export const UPGRADE_XP_REWARDS: Record<RarityLevel, number> = {
  [RarityLevel.COMMON]: 20,
  [RarityLevel.UNCOMMON]: 50,
  [RarityLevel.RARE]: 120,
  [RarityLevel.EPIC]: 300,
  [RarityLevel.LEGENDARY]: 0,
}

/**
 * Базовые шансы успеха улучшения (%)
 */
export const UPGRADE_SUCCESS_RATES: Record<RarityLevel, number> = {
  [RarityLevel.COMMON]: 90,
  [RarityLevel.UNCOMMON]: 75,
  [RarityLevel.RARE]: 60,
  [RarityLevel.EPIC]: 50,
  [RarityLevel.LEGENDARY]: 0,
}

/**
 * Премиум элементы, которые нельзя улучшать
 */
export const PREMIUM_ELEMENT_TYPES = new Set([
  ElementType.RAINBOW_FLOWER,
  ElementType.GLOWING_CRYSTAL,
  ElementType.MYSTIC_MUSHROOM,
  ElementType.AURORA_TREE,
  ElementType.STARLIGHT_DECORATION,
])

/**
 * Получить следующую редкость для улучшения
 */
export function getNextRarity(currentRarity: RarityLevel): RarityLevel | null {
  switch (currentRarity) {
    case RarityLevel.COMMON:
      return RarityLevel.UNCOMMON
    case RarityLevel.UNCOMMON:
      return RarityLevel.RARE
    case RarityLevel.RARE:
      return RarityLevel.EPIC
    case RarityLevel.EPIC:
      return RarityLevel.LEGENDARY
    case RarityLevel.LEGENDARY:
      return null
  }
}

/**
 * Проверить, можно ли улучшить элемент
 */
export function canUpgradeElement(element: GardenElement): boolean {
  // Нельзя улучшать премиум элементы
  if (PREMIUM_ELEMENT_TYPES.has(element.type)) {
    return false
  }

  // Нельзя улучшать legendary
  if (element.rarity === RarityLevel.LEGENDARY) {
    return false
  }

  return true
}
