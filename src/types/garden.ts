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
