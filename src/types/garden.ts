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

export const GARDEN_GRID_SIZE = 10
export const MAX_ELEMENTS_PER_DAY = 1
export const ELEMENT_SIZE = 40 // pixels
