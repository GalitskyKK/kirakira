import { addDays, differenceInDays, format } from 'date-fns'
import type { GardenElement, MoodType, Position2D } from '@/types'
import { ElementType, RarityLevel, SeasonalVariant, MOOD_CONFIG } from '@/types'

interface ElementTemplate {
  readonly type: ElementType
  readonly name: string
  readonly description: string
  readonly emoji: string
  readonly baseColor: string
  readonly rarity: RarityLevel
}

// Element templates with rarity distribution
const ELEMENT_TEMPLATES: readonly ElementTemplate[] = [
  // Common flowers (for Joy)
  {
    type: ElementType.FLOWER,
    name: 'Ромашка',
    description: 'Простой белый цветок',
    emoji: '🌼',
    baseColor: '#ffffff',
    rarity: RarityLevel.COMMON,
  },
  {
    type: ElementType.FLOWER,
    name: 'Тюльпан',
    description: 'Яркий весенний цветок',
    emoji: '🌷',
    baseColor: '#ff69b4',
    rarity: RarityLevel.COMMON,
  },
  {
    type: ElementType.FLOWER,
    name: 'Незабудка',
    description: 'Нежный голубой цветок',
    emoji: '🌸',
    baseColor: '#93c5fd',
    rarity: RarityLevel.COMMON,
  },

  // Common elements for other moods
  {
    type: ElementType.GRASS,
    name: 'Трава',
    description: 'Свежая зеленая трава',
    emoji: '🌱',
    baseColor: '#22c55e',
    rarity: RarityLevel.COMMON,
  },
  {
    type: ElementType.GRASS,
    name: 'Мох',
    description: 'Мягкий зеленый мох',
    emoji: '🍀',
    baseColor: '#16a34a',
    rarity: RarityLevel.COMMON,
  },

  {
    type: ElementType.MUSHROOM,
    name: 'Грибок',
    description: 'Маленький лесной гриб',
    emoji: '🍄',
    baseColor: '#8b4513',
    rarity: RarityLevel.COMMON,
  },
  {
    type: ElementType.MUSHROOM,
    name: 'Поганка',
    description: 'Загадочный темный гриб',
    emoji: '🍄‍🟫',
    baseColor: '#6b7280',
    rarity: RarityLevel.COMMON,
  },

  // Decorative elements (for Joy/Anxiety)
  {
    type: ElementType.DECORATION,
    name: 'Бабочка',
    description: 'Красочная бабочка',
    emoji: '🦋',
    baseColor: '#f59e0b',
    rarity: RarityLevel.COMMON,
  },
  {
    type: ElementType.DECORATION,
    name: 'Светлячок',
    description: 'Мерцающий светлячок',
    emoji: '✨',
    baseColor: '#fbbf24',
    rarity: RarityLevel.COMMON,
  },

  // Uncommon elements (30% chance)
  {
    type: ElementType.FLOWER,
    name: 'Роза',
    description: 'Ароматная красная роза',
    emoji: '🌹',
    baseColor: '#dc2626',
    rarity: RarityLevel.UNCOMMON,
  },
  {
    type: ElementType.TREE,
    name: 'Саженец',
    description: 'Молодое деревце',
    emoji: '🌿',
    baseColor: '#16a34a',
    rarity: RarityLevel.UNCOMMON,
  },
  {
    type: ElementType.STONE,
    name: 'Камень',
    description: 'Гладкий речной камень',
    emoji: '🪨',
    baseColor: '#6b7280',
    rarity: RarityLevel.UNCOMMON,
  },
  {
    type: ElementType.STONE,
    name: 'Галька',
    description: 'Округлая морская галька',
    emoji: '🥌',
    baseColor: '#9ca3af',
    rarity: RarityLevel.UNCOMMON,
  },

  // Water elements (for Calm)
  {
    type: ElementType.WATER,
    name: 'Капля',
    description: 'Чистая дождевая капля',
    emoji: '💧',
    baseColor: '#3b82f6',
    rarity: RarityLevel.COMMON,
  },
  {
    type: ElementType.WATER,
    name: 'Лужа',
    description: 'Небольшая водная лужица',
    emoji: '🌊',
    baseColor: '#06b6d4',
    rarity: RarityLevel.COMMON,
  },
  {
    type: ElementType.WATER,
    name: 'Источник',
    description: 'Чистый горный источник',
    emoji: '⛲',
    baseColor: '#0ea5e9',
    rarity: RarityLevel.UNCOMMON,
  },

  // More stone elements for Stress/Anger
  {
    type: ElementType.STONE,
    name: 'Булыжник',
    description: 'Прочный серый камень',
    emoji: '⚫',
    baseColor: '#4b5563',
    rarity: RarityLevel.COMMON,
  },

  // More crystal elements for Stress/Anger
  {
    type: ElementType.CRYSTAL,
    name: 'Кварц',
    description: 'Прозрачный кристалл',
    emoji: '🔹',
    baseColor: '#e5e7eb',
    rarity: RarityLevel.UNCOMMON,
  },

  // Tree elements for Calm
  {
    type: ElementType.TREE,
    name: 'Росток',
    description: 'Маленький зеленый росток',
    emoji: '🌱',
    baseColor: '#22c55e',
    rarity: RarityLevel.COMMON,
  },
  {
    type: ElementType.TREE,
    name: 'Веточка',
    description: 'Тонкая зеленая веточка',
    emoji: '🌿',
    baseColor: '#16a34a',
    rarity: RarityLevel.COMMON,
  },

  // Rare elements (15% chance)
  {
    type: ElementType.FLOWER,
    name: 'Подсолнух',
    description: 'Солнечный подсолнух',
    emoji: '🌻',
    baseColor: '#fbbf24',
    rarity: RarityLevel.RARE,
  },
  {
    type: ElementType.TREE,
    name: 'Дерево',
    description: 'Взрослое дерево',
    emoji: '🌳',
    baseColor: '#15803d',
    rarity: RarityLevel.RARE,
  },
  {
    type: ElementType.WATER,
    name: 'Ручеек',
    description: 'Тихий водный поток',
    emoji: '💧',
    baseColor: '#06b6d4',
    rarity: RarityLevel.RARE,
  },

  // Epic elements (4% chance)
  {
    type: ElementType.FLOWER,
    name: 'Орхидея',
    description: 'Экзотическая орхидея',
    emoji: '🌺',
    baseColor: '#a855f7',
    rarity: RarityLevel.EPIC,
  },
  {
    type: ElementType.CRYSTAL,
    name: 'Кристалл',
    description: 'Магический кристалл',
    emoji: '💎',
    baseColor: '#3b82f6',
    rarity: RarityLevel.EPIC,
  },
  {
    type: ElementType.CRYSTAL,
    name: 'Аметист',
    description: 'Фиолетовый кристалл спокойствия',
    emoji: '🔮',
    baseColor: '#8b5cf6',
    rarity: RarityLevel.EPIC,
  },
  {
    type: ElementType.MUSHROOM,
    name: 'Мухомор',
    description: 'Ядовитый красный гриб',
    emoji: '🍄',
    baseColor: '#dc2626',
    rarity: RarityLevel.EPIC,
  },

  // Legendary elements (1% chance)
  {
    type: ElementType.TREE,
    name: 'Древо Жизни',
    description: 'Мистическое древо',
    emoji: '🌲',
    baseColor: '#059669',
    rarity: RarityLevel.LEGENDARY,
  },
  {
    type: ElementType.DECORATION,
    name: 'Звездная Пыль',
    description: 'Магическая звездная пыль',
    emoji: '✨',
    baseColor: '#fbbf24',
    rarity: RarityLevel.LEGENDARY,
  },
] as const

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
  const moodConfig = MOOD_CONFIG[mood]
  const preferredTypes = new Set(moodConfig.elementTypes)

  // Always use preferred element types for mood consistency (100%)
  let filteredTemplates = ELEMENT_TEMPLATES.filter(t =>
    preferredTypes.has(t.type)
  )

  // If no preferred templates found, fallback to all templates
  if (filteredTemplates.length === 0) {
    console.warn(
      `No preferred templates found for mood: ${mood}, using all templates`
    )
    filteredTemplates = [...ELEMENT_TEMPLATES]
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
    `Mood: ${mood}, UsePreferred: ${usePreferred}, FilteredCount: ${filteredTemplates.length}, SelectedRarity: ${selectedRarity}, AvailableCount: ${availableTemplates.length}, Selected: ${selectedTemplate.name} (${selectedTemplate.type})`
  )

  return selectedTemplate
}

/**
 * Generates a valid position within the garden grid
 */
function generatePosition(
  random: SeededRandom,
  existingPositions: readonly Position2D[]
): Position2D {
  const maxAttempts = 100
  let attempts = 0

  while (attempts < maxAttempts) {
    const position: Position2D = {
      x: random.nextInt(0, 9), // 10x10 grid (0-9)
      y: random.nextInt(0, 9),
    }

    // Check if position is already occupied
    const isOccupied = existingPositions.some(
      pos => pos.x === position.x && pos.y === position.y
    )

    if (!isOccupied) {
      return position
    }

    attempts++
  }

  // Fallback: find first available position
  for (let y = 0; y < 10; y++) {
    for (let x = 0; x < 10; x++) {
      const position: Position2D = { x, y }
      const isOccupied = existingPositions.some(
        pos => pos.x === position.x && pos.y === position.y
      )
      if (!isOccupied) {
        return position
      }
    }
  }

  // Ultimate fallback (should never happen)
  return { x: 0, y: 0 }
}

/**
 * Adjusts element color based on mood and season
 */
function adjustElementColor(
  baseColor: string,
  mood: MoodType,
  _season: SeasonalVariant,
  random: SeededRandom
): string {
  const moodConfig = MOOD_CONFIG[mood]
  const moodInfluence = 0.3

  // Simple color blending (in a real app, you'd use a proper color library)
  // For now, return the mood color with some randomness
  const colors = [baseColor, moodConfig.color]
  const colorIndex = random.next() < moodInfluence ? 1 : 0
  return colors[colorIndex]!
}

/**
 * Generates a daily garden element based on user data and mood
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

  // Generate deterministic seed
  const seed = generateSeed(registrationDate, dayOffset)
  const random = new SeededRandom(seed)

  // Get mood configuration and bonuses
  const moodConfig = MOOD_CONFIG[mood]
  const rarityBonus = moodConfig.rarityBonus

  // Select element template
  const template = selectElementTemplate(random, mood, rarityBonus)

  // Generate position
  const position = generatePosition(random, existingPositions)

  // Determine season
  const season = getCurrentSeason(currentDate)

  // Adjust color based on mood and season
  const color = adjustElementColor(template.baseColor, mood, season, random)

  // Create element
  const element: GardenElement = {
    id: `${userId}-${format(currentDate, 'yyyy-MM-dd')}`,
    type: template.type,
    position,
    unlockDate: currentDate,
    moodInfluence: mood,
    rarity: template.rarity,
    seasonalVariant: season,
    name: template.name,
    description: template.description,
    emoji: template.emoji,
    color,
  }

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
