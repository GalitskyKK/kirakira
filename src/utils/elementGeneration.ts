import { addDays, differenceInDays, format } from 'date-fns'
import type { GardenElement, MoodType, Position2D } from '@/types'
import { ElementType, RarityLevel, SeasonalVariant, MOOD_CONFIG } from '@/types'
import { premiumUtils } from '@/stores'
import {
  getElementName,
  getElementDescription,
  getElementEmoji,
  getElementColor,
  getElementScale,
} from './elementNames'

/**
 * Упрощенный шаблон элемента без фиксированных имен/описаний
 * Имена и характеристики генерируются детерминированно на основе seed (element.id)
 */
interface ElementTemplate {
  readonly type: ElementType
  readonly rarity: RarityLevel
}

/**
 * Element templates with rarity distribution
 * Теперь хранятся только тип и редкость
 * Имя, цвет, описание и эмодзи генерируются через elementNames.ts
 */
const ELEMENT_TEMPLATES: readonly ElementTemplate[] = [
  // Common flowers (for Joy)
  { type: ElementType.FLOWER, rarity: RarityLevel.COMMON },
  { type: ElementType.FLOWER, rarity: RarityLevel.COMMON },
  { type: ElementType.FLOWER, rarity: RarityLevel.COMMON },

  // Common grass (for Calm)
  { type: ElementType.GRASS, rarity: RarityLevel.COMMON },
  { type: ElementType.GRASS, rarity: RarityLevel.COMMON },

  // Common mushrooms (for Sadness)
  { type: ElementType.MUSHROOM, rarity: RarityLevel.COMMON },
  { type: ElementType.MUSHROOM, rarity: RarityLevel.COMMON },

  // Common decorations (for Joy/Anxiety)
  { type: ElementType.DECORATION, rarity: RarityLevel.COMMON },
  { type: ElementType.DECORATION, rarity: RarityLevel.COMMON },

  // Uncommon elements (30% chance)
  { type: ElementType.FLOWER, rarity: RarityLevel.UNCOMMON },
  { type: ElementType.TREE, rarity: RarityLevel.UNCOMMON },
  { type: ElementType.STONE, rarity: RarityLevel.UNCOMMON },
  { type: ElementType.STONE, rarity: RarityLevel.UNCOMMON },

  // Water elements (for Calm)
  { type: ElementType.WATER, rarity: RarityLevel.COMMON },
  { type: ElementType.WATER, rarity: RarityLevel.COMMON },
  { type: ElementType.WATER, rarity: RarityLevel.UNCOMMON },

  // More stone elements for Stress/Anger
  { type: ElementType.STONE, rarity: RarityLevel.COMMON },

  // More crystal elements for Stress/Anger
  { type: ElementType.CRYSTAL, rarity: RarityLevel.UNCOMMON },

  // Tree elements for Calm
  { type: ElementType.TREE, rarity: RarityLevel.COMMON },
  { type: ElementType.TREE, rarity: RarityLevel.COMMON },

  // Rare elements (15% chance)
  { type: ElementType.FLOWER, rarity: RarityLevel.RARE },
  { type: ElementType.TREE, rarity: RarityLevel.RARE },
  { type: ElementType.WATER, rarity: RarityLevel.RARE },

  // Epic elements (4% chance)
  { type: ElementType.FLOWER, rarity: RarityLevel.EPIC },
  { type: ElementType.CRYSTAL, rarity: RarityLevel.EPIC },
  { type: ElementType.CRYSTAL, rarity: RarityLevel.EPIC },
  { type: ElementType.MUSHROOM, rarity: RarityLevel.EPIC },

  // Legendary elements (1% chance)
  { type: ElementType.TREE, rarity: RarityLevel.LEGENDARY },
  { type: ElementType.DECORATION, rarity: RarityLevel.LEGENDARY },

  // ПРЕМИУМ ЭЛЕМЕНТЫ (доступны только с премиум подпиской)
  { type: ElementType.RAINBOW_FLOWER, rarity: RarityLevel.LEGENDARY },
  { type: ElementType.GLOWING_CRYSTAL, rarity: RarityLevel.LEGENDARY },
  { type: ElementType.MYSTIC_MUSHROOM, rarity: RarityLevel.LEGENDARY },
  { type: ElementType.AURORA_TREE, rarity: RarityLevel.LEGENDARY },
  { type: ElementType.STARLIGHT_DECORATION, rarity: RarityLevel.LEGENDARY },
] as const

// Экспортируем все элементы для showcase
export { ELEMENT_TEMPLATES }

// Премиум типы элементов
export const PREMIUM_ELEMENT_TYPES = new Set([
  ElementType.RAINBOW_FLOWER,
  ElementType.GLOWING_CRYSTAL,
  ElementType.MYSTIC_MUSHROOM,
  ElementType.AURORA_TREE,
  ElementType.STARLIGHT_DECORATION,
])

// Rarity weights for random generation
const RARITY_WEIGHTS: Record<RarityLevel, number> = {
  [RarityLevel.COMMON]: 50,
  [RarityLevel.UNCOMMON]: 30,
  [RarityLevel.RARE]: 15,
  [RarityLevel.EPIC]: 4,
  [RarityLevel.LEGENDARY]: 1,
}

/**
 * Generates a deterministic seed based on user registration date and day offset
 */
function generateSeed(registrationDate: Date, dayOffset: number): number {
  const baseDate = new Date(registrationDate)
  baseDate.setHours(0, 0, 0, 0)
  const targetDate = addDays(baseDate, dayOffset)
  return targetDate.getTime()
}

/**
 * Deterministic pseudo-random number generator using Linear Congruential Generator
 */
class SeededRandom {
  private seed: number

  constructor(seed: number) {
    this.seed = seed % 2147483647
    if (this.seed <= 0) this.seed += 2147483646
  }

  next(): number {
    this.seed = (this.seed * 16807) % 2147483647
    return (this.seed - 1) / 2147483646
  }

  nextInt(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min
  }

  nextFloat(min: number, max: number): number {
    return this.next() * (max - min) + min
  }
}

/**
 * Determines the current season based on date
 */
function getCurrentSeason(date: Date): SeasonalVariant {
  const month = date.getMonth() + 1 // 1-12

  if (month >= 3 && month <= 5) return SeasonalVariant.SPRING
  if (month >= 6 && month <= 8) return SeasonalVariant.SUMMER
  if (month >= 9 && month <= 11) return SeasonalVariant.AUTUMN
  return SeasonalVariant.WINTER
}

/**
 * Selects a random element template based on rarity weights and mood influence
 */
function selectElementTemplate(
  random: SeededRandom,
  mood: MoodType,
  rarityBonus: number = 0
): ElementTemplate {
  // Apply mood influence to filter preferred element types
  const moodConfig = MOOD_CONFIG[mood] || MOOD_CONFIG.joy // Fallback to joy if invalid mood
  const preferredTypes = new Set(moodConfig.elementTypes)

  // Filter out premium elements if user doesn't have premium access
  const hasPremiumAccess = premiumUtils.hasRareElements()

  // Always use preferred element types for mood consistency (100%)
  let filteredTemplates = ELEMENT_TEMPLATES.filter(t => {
    // Check if element type is preferred for this mood
    const isPreferred = preferredTypes.has(t.type)

    // Check if element is premium and user has access
    const isPremiumElement = PREMIUM_ELEMENT_TYPES.has(t.type)
    const canUsePremium = !isPremiumElement || hasPremiumAccess

    return isPreferred && canUsePremium
  })

  // If no preferred templates found, fallback to available templates (excluding premium if no access)
  if (filteredTemplates.length === 0) {
    console.warn(
      `No preferred templates found for mood: ${mood}, using fallback templates`
    )
    filteredTemplates = ELEMENT_TEMPLATES.filter(t => {
      const isPremiumElement = PREMIUM_ELEMENT_TYPES.has(t.type)
      return !isPremiumElement || hasPremiumAccess
    })
  }

  const usePreferred = true // Always true now

  // Apply rarity bonus
  const adjustedWeights = Object.entries(RARITY_WEIGHTS).reduce(
    (acc, [rarity, weight]) => {
      const rarityKey = rarity as RarityLevel
      acc[rarityKey] = weight + rarityBonus * weight
      return acc
    },
    {} as Record<RarityLevel, number>
  )

  // Calculate total weight
  const totalWeight = Object.values(adjustedWeights).reduce(
    (sum, weight) => sum + weight,
    0
  )

  // Select rarity based on weights
  let randomWeight = random.next() * totalWeight
  let selectedRarity: RarityLevel = RarityLevel.COMMON

  for (const [rarity, weight] of Object.entries(adjustedWeights)) {
    randomWeight -= weight
    if (randomWeight <= 0) {
      selectedRarity = rarity as RarityLevel
      break
    }
  }

  // Get templates of selected rarity from filtered templates
  let rarityTemplates = filteredTemplates.filter(
    t => t.rarity === selectedRarity
  )

  // If no templates of selected rarity found, try lower rarities first
  if (rarityTemplates.length === 0) {
    const fallbackRarities = [
      RarityLevel.COMMON,
      RarityLevel.UNCOMMON,
      RarityLevel.RARE,
      RarityLevel.EPIC,
      RarityLevel.LEGENDARY,
    ]

    for (const rarity of fallbackRarities) {
      rarityTemplates = filteredTemplates.filter(t => t.rarity === rarity)
      if (rarityTemplates.length > 0) break
    }
  }

  // Final fallback to all filtered templates
  const availableTemplates =
    rarityTemplates.length > 0 ? rarityTemplates : filteredTemplates

  // Select random template
  const templateIndex = random.nextInt(0, availableTemplates.length - 1)
  const selectedTemplate = availableTemplates[templateIndex]!

  // Debug logging (remove in production)
  console.log(
    `Mood: ${mood}, UsePreferred: ${usePreferred}, FilteredCount: ${filteredTemplates.length}, SelectedRarity: ${selectedRarity}, AvailableCount: ${availableTemplates.length}, Selected: ${selectedTemplate.type} (${selectedTemplate.rarity})`
  )

  return selectedTemplate
}

/**
 * Generates a valid position within the garden grid
 * УЛУЧШЕНО: Множественные комнаты с правильным количеством слотов
 *
 * Логика распределения:
 * - Каждая комната содержит 4 полки
 * - Комната 0: полки 0-3, Комната 1: полки 4-7, и т.д.
 * - До 5 позиций на каждой полке (x: 0-4) - соответствует ShelfView
 * - 20 элементов на комнату (4 полки × 5 позиций)
 * - Автоматически заполняет комнаты последовательно
 */
function generatePosition(
  random: SeededRandom,
  existingPositions: readonly Position2D[]
): Position2D {
  const maxAttempts = 100
  let attempts = 0

  const SHELVES_PER_ROOM = 4
  const MAX_POSITIONS_PER_SHELF = 4 // ИСПРАВЛЕНО: 5 позиций (соответствует ShelfView)

  console.log('🎯 Generating position for new element (Multi-room system):', {
    existingPositionsCount: existingPositions.length,
    existingPositions: existingPositions.map(p => `(${p.x},${p.y})`).join(', '),
  })

  // Определяем текущую комнату на основе количества элементов
  const ELEMENTS_PER_ROOM = SHELVES_PER_ROOM * MAX_POSITIONS_PER_SHELF // 20 элементов
  const currentRoomIndex = Math.floor(
    existingPositions.length / ELEMENTS_PER_ROOM
  )
  const startShelf = currentRoomIndex * SHELVES_PER_ROOM
  const endShelf = startShelf + SHELVES_PER_ROOM

  console.log('🏠 Current room calculation:', {
    elementsCount: existingPositions.length,
    elementsPerRoom: ELEMENTS_PER_ROOM,
    currentRoomIndex,
    shelfRange: `${startShelf}-${endShelf - 1}`,
    maxPositionsPerShelf: MAX_POSITIONS_PER_SHELF,
  })

  // Пытаемся найти случайную позицию в текущей комнате
  while (attempts < maxAttempts) {
    const position: Position2D = {
      x: random.nextInt(0, MAX_POSITIONS_PER_SHELF - 1), // Position on shelf (0-4)
      y: random.nextInt(startShelf, endShelf - 1), // Shelf in current room
    }

    // Check if position is already occupied
    const isOccupied = existingPositions.some(
      pos => pos.x === position.x && pos.y === position.y
    )

    console.log(
      `🎲 Attempt ${attempts + 1}: position (${position.x}, ${position.y}) - ${isOccupied ? 'OCCUPIED' : 'FREE'}`
    )

    if (!isOccupied) {
      const localShelf = position.y - startShelf
      console.log('✅ Generated random position for new element:', {
        position,
        roomIndex: currentRoomIndex,
        globalShelfNumber: position.y,
        localShelfNumber: localShelf,
        positionOnShelf: position.x,
        attempt: attempts + 1,
      })
      return position
    }

    attempts++
  }

  console.warn('⚠️ Max attempts reached, falling back to sequential search')

  // Fallback: find first available position (room by room, shelf by shelf)
  // Ищем во всех комнатах, начиная с текущей
  const MAX_ROOMS = 200 // Поддержка до 200 комнат (4000 элементов = 200 × 20)

  for (let roomIndex = currentRoomIndex; roomIndex < MAX_ROOMS; roomIndex++) {
    const roomStartShelf = roomIndex * SHELVES_PER_ROOM
    const roomEndShelf = roomStartShelf + SHELVES_PER_ROOM

    for (let y = roomStartShelf; y < roomEndShelf; y++) {
      for (let x = 0; x < MAX_POSITIONS_PER_SHELF; x++) {
        const position: Position2D = { x, y }
        const isOccupied = existingPositions.some(
          pos => pos.x === position.x && pos.y === position.y
        )
        if (!isOccupied) {
          const localShelf = y - roomStartShelf
          console.log('🔄 Fallback position found for new element:', {
            position,
            roomIndex,
            globalShelfNumber: y,
            localShelfNumber: localShelf,
            positionOnShelf: x,
            fallback: true,
          })
          return position
        }
      }
    }
  }

  // Ultimate fallback: first position in next room (shouldn't happen)
  const nextRoomStart = (currentRoomIndex + 1) * SHELVES_PER_ROOM
  console.error(
    '❌ Could not find position in current room, moving to next room'
  )
  return { x: 0, y: nextRoomStart }
}

/**
 * Generates a daily garden element based on user data and mood
 * ОБНОВЛЕНО: использует element.id как seed для детерминированной генерации всех характеристик
 */
export function generateDailyElement(
  userId: string,
  registrationDate: Date,
  currentDate: Date,
  mood: MoodType,
  existingPositions: readonly Position2D[] = []
): GardenElement {
  // Calculate day offset from registration
  const dayOffset = differenceInDays(currentDate, registrationDate)

  // Generate deterministic seed for template selection
  const templateSeed = generateSeed(registrationDate, dayOffset)
  const random = new SeededRandom(templateSeed)

  // Get mood configuration and bonuses
  const moodConfig = MOOD_CONFIG[mood] || MOOD_CONFIG.joy // Fallback to joy if invalid mood
  const rarityBonus = moodConfig.rarityBonus

  // Select element template (только тип и редкость)
  const template = selectElementTemplate(random, mood, rarityBonus)

  // Generate position
  const position = generatePosition(random, existingPositions)

  // Determine season
  const season = getCurrentSeason(currentDate)

  // 🔑 КЛЮЧЕВОЕ ИЗМЕНЕНИЕ: Создаем element.id как единый seed для всех характеристик
  const elementId = `${userId}-${format(currentDate, 'yyyy-MM-dd')}`
  const characteristicsSeed = elementId // Используем ID как seed

  // 🎨 Генерируем все характеристики детерминированно на основе element.id
  const name = getElementName(
    template.type,
    template.rarity,
    characteristicsSeed
  )
  const description = getElementDescription(
    template.type,
    template.rarity,
    name
  )
  const emoji = getElementEmoji(template.type)
  const color = getElementColor(template.type, mood, characteristicsSeed)
  const scale = getElementScale(characteristicsSeed)

  // Create element
  const element: GardenElement = {
    id: elementId,
    type: template.type,
    position,
    unlockDate: currentDate,
    moodInfluence: mood,
    rarity: template.rarity,
    seasonalVariant: season,
    name,
    description,
    emoji,
    color,
    scale,
  }

  console.log('🌱 Generated element with deterministic seed:', {
    id: elementId,
    seed: characteristicsSeed,
    type: template.type,
    rarity: template.rarity,
    name,
    color,
    scale,
  })

  return element
}

/**
 * Validates if a user can unlock a new element today
 */
export function canUnlockTodaysElement(
  lastUnlockDate: Date | null,
  currentDate: Date = new Date()
): boolean {
  if (lastUnlockDate === null) return true

  const today = new Date(currentDate)
  today.setHours(0, 0, 0, 0)

  const lastUnlock = new Date(lastUnlockDate)
  lastUnlock.setHours(0, 0, 0, 0)

  return today.getTime() > lastUnlock.getTime()
}

/**
 * Calculates streak information
 */
export function calculateStreak(unlockDates: readonly Date[]): {
  current: number
  longest: number
  lastUnlock: Date | null
} {
  if (unlockDates.length === 0) {
    return { current: 0, longest: 0, lastUnlock: null }
  }

  // Sort dates in descending order
  const sortedDates = [...unlockDates].sort((a, b) => b.getTime() - a.getTime())

  let currentStreak = 0
  let longestStreak = 0
  let tempStreak = 1

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const lastUnlock = new Date(sortedDates[0]!)
  lastUnlock.setHours(0, 0, 0, 0)

  // Check if last unlock was today or yesterday for current streak
  const daysSinceLastUnlock = differenceInDays(today, lastUnlock)

  if (daysSinceLastUnlock <= 1) {
    currentStreak = 1

    // Count consecutive days
    for (let i = 1; i < sortedDates.length; i++) {
      const currentDate = new Date(sortedDates[i - 1]!)
      const prevDate = new Date(sortedDates[i]!)

      currentDate.setHours(0, 0, 0, 0)
      prevDate.setHours(0, 0, 0, 0)

      const dayDiff = differenceInDays(currentDate, prevDate)

      if (dayDiff === 1) {
        currentStreak++
      } else {
        break
      }
    }
  }

  // Calculate longest streak
  tempStreak = 1
  for (let i = 1; i < sortedDates.length; i++) {
    const currentDate = new Date(sortedDates[i - 1]!)
    const prevDate = new Date(sortedDates[i]!)

    currentDate.setHours(0, 0, 0, 0)
    prevDate.setHours(0, 0, 0, 0)

    const dayDiff = differenceInDays(currentDate, prevDate)

    if (dayDiff === 1) {
      tempStreak++
      longestStreak = Math.max(longestStreak, tempStreak)
    } else {
      tempStreak = 1
    }
  }

  longestStreak = Math.max(longestStreak, tempStreak)

  return {
    current: currentStreak,
    longest: longestStreak,
    lastUnlock: sortedDates[0] ?? null,
  }
}
