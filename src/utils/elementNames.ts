import { ElementType, RarityLevel, MoodType } from '@/types'

/**
 * Справочник названий элементов на русском языке
 * Используется для получения корректных названий элементов, полученных с сервера
 */

// Базовые названия по типам элементов
const BASE_ELEMENT_NAMES: Record<ElementType, string[]> = {
  [ElementType.FLOWER]: [
    'Ромашка',
    'Тюльпан',
    'Незабудка',
    'Роза',
    'Лилия',
    'Пион',
    'Фиалка',
    'Георгин',
    'Хризантема',
    'Орхидея',
  ],
  [ElementType.TREE]: [
    'Саженец',
    'Березка',
    'Дубок',
    'Елочка',
    'Ивушка',
    'Кедр',
    'Клен',
    'Сосна',
    'Рябина',
    'Липа',
  ],
  [ElementType.STONE]: [
    'Камень',
    'Галька',
    'Булыжник',
    'Валун',
    'Кремень',
    'Гранит',
    'Мрамор',
    'Агат',
    'Оникс',
    'Яшма',
  ],
  [ElementType.WATER]: [
    'Капля',
    'Лужа',
    'Источник',
    'Ручеек',
    'Пруд',
    'Водопад',
    'Родник',
    'Озеро',
    'Река',
    'Гейзер',
  ],
  [ElementType.GRASS]: [
    'Трава',
    'Мох',
    'Папоротник',
    'Клевер',
    'Лютик',
    'Одуванчик',
    'Подорожник',
    'Крапива',
    'Мята',
    'Базилик',
  ],
  [ElementType.MUSHROOM]: [
    'Грибок',
    'Поганка',
    'Боровик',
    'Лисичка',
    'Опята',
    'Шампиньон',
    'Подберезовик',
    'Волнушка',
    'Рыжик',
    'Груздь',
  ],
  [ElementType.CRYSTAL]: [
    'Кристалл',
    'Аметист',
    'Кварц',
    'Изумруд',
    'Сапфир',
    'Рубин',
    'Топаз',
    'Алмаз',
    'Турмалин',
    'Берилл',
  ],
  [ElementType.DECORATION]: [
    'Бабочка',
    'Светлячок',
    'Божья коровка',
    'Стрекоза',
    'Пчелка',
    'Муравей',
    'Улитка',
    'Червяк',
    'Паук',
    'Жук',
  ],
  // Премиум элементы
  [ElementType.RAINBOW_FLOWER]: ['Радужный цветок'],
  [ElementType.GLOWING_CRYSTAL]: ['Светящийся кристалл'],
  [ElementType.MYSTIC_MUSHROOM]: ['Мистический гриб'],
  [ElementType.AURORA_TREE]: ['Дерево авроры'],
  [ElementType.STARLIGHT_DECORATION]: ['Звездное украшение'],
}

// Префиксы для редкости
const RARITY_PREFIXES: Record<RarityLevel, string[]> = {
  [RarityLevel.COMMON]: [''],
  [RarityLevel.UNCOMMON]: [
    'Утренней Росы',
    'Тёплого Света',
    'Ласкового Ветра',
    'Тихого Шёпота',
    'Нежных Лепестков',
    'Спокойного Дня',
    'Мягкой Тени',
    'Первого Цветения',
  ],
  [RarityLevel.RARE]: [
    'Забытых Древ',
    'Тайных Ручьёв',
    'Изысканной Красоты',
    'Редкого Сияния',
    'Старинных Легенд',
    'Скрытых Полян',
    'Лунного Отблеска',
    'Тонкого Аромата',
    'Изумрудной Тени',
  ],
  [RarityLevel.EPIC]: [
    'Величественных Вершин',
    'Царственного Сияния',
    'Эпического Роста',
    'Небесного Пламени',
    'Громовых Вершин',
    'Звёздной Пыли',
    'Бессмертной Жизни',
    'Сердца Леса',
    'Древней Магии',
    'Песни Ветров',
  ],
  [RarityLevel.LEGENDARY]: [
    'Легенд Древнего Мира',
    'Божественного Происхождения',
    'Мифов Первоистоков',
    'Слёз Богини Весны',
    'Огня Первого Солнца',
    'Памяти Погибших Богов',
    'Врат Вечности',
    'Дыхания Мирового Древа',
    'Сердца Самой Природы',
    'Звёздного Рассвета',
    'Тысячи Перерождений',
    'Тишины До Начала Времён',
  ],
}

// Эмодзи для типов элементов
const ELEMENT_EMOJIS: Record<ElementType, string> = {
  [ElementType.FLOWER]: '🌸',
  [ElementType.TREE]: '🌳',
  [ElementType.STONE]: '🪨',
  [ElementType.WATER]: '💧',
  [ElementType.GRASS]: '🌱',
  [ElementType.MUSHROOM]: '🍄',
  [ElementType.CRYSTAL]: '💎',
  [ElementType.DECORATION]: '✨',
  // Премиум элементы
  [ElementType.RAINBOW_FLOWER]: '🌈',
  [ElementType.GLOWING_CRYSTAL]: '✨',
  [ElementType.MYSTIC_MUSHROOM]: '🔮',
  [ElementType.AURORA_TREE]: '🌌',
  [ElementType.STARLIGHT_DECORATION]: '⭐',
}

// Цвета для типов элементов с учетом настроения
const ELEMENT_COLORS: Record<ElementType, Record<MoodType, string[]>> = {
  [ElementType.FLOWER]: {
    joy: ['#ff69b4', '#ffd700', '#ff6347', '#ff4500'],
    calm: ['#87ceeb', '#b0e0e6', '#add8e6', '#e0ffff'],
    stress: ['#ff0000', '#dc143c', '#b22222', '#8b0000'],
    sadness: ['#4682b4', '#6495ed', '#7b68ee', '#483d8b'],
    anger: ['#ff6347', '#ff4500', '#ff0000', '#dc143c'],
    anxiety: ['#9370db', '#8a2be2', '#9932cc', '#9400d3'],
  },
  [ElementType.TREE]: {
    joy: ['#32cd32', '#00ff00', '#7fff00', '#adff2f'],
    calm: ['#228b22', '#006400', '#2e8b57', '#3cb371'],
    stress: ['#8b4513', '#a0522d', '#d2691e', '#cd853f'],
    sadness: ['#2f4f4f', '#696969', '#778899', '#708090'],
    anger: ['#8b0000', '#b22222', '#dc143c', '#ff0000'],
    anxiety: ['#556b2f', '#6b8e23', '#808000', '#9acd32'],
  },
  [ElementType.STONE]: {
    joy: ['#ffd700', '#ffb347', '#daa520', '#b8860b'],
    calm: ['#708090', '#778899', '#b0c4de', '#87ceeb'],
    stress: ['#2f4f4f', '#555555', '#696969', '#808080'],
    sadness: ['#4682b4', '#5f9ea0', '#6495ed', '#7b68ee'],
    anger: ['#8b0000', '#a0522d', '#b22222', '#cd853f'],
    anxiety: ['#483d8b', '#6a5acd', '#7b68ee', '#9370db'],
  },
  [ElementType.WATER]: {
    joy: ['#00bfff', '#1e90ff', '#6495ed', '#87ceeb'],
    calm: ['#4682b4', '#5f9ea0', '#b0e0e6', '#add8e6'],
    stress: ['#000080', '#191970', '#483d8b', '#2f4f4f'],
    sadness: ['#4169e1', '#6495ed', '#7b68ee', '#9370db'],
    anger: ['#8b0000', '#b22222', '#dc143c', '#ff0000'],
    anxiety: ['#4b0082', '#483d8b', '#6a5acd', '#7b68ee'],
  },
  [ElementType.GRASS]: {
    joy: ['#00ff00', '#32cd32', '#7fff00', '#adff2f'],
    calm: ['#228b22', '#006400', '#2e8b57', '#3cb371'],
    stress: ['#6b8e23', '#808000', '#9acd32', '#556b2f'],
    sadness: ['#2e8b57', '#3cb371', '#20b2aa', '#48d1cc'],
    anger: ['#8b4513', '#a0522d', '#d2691e', '#cd853f'],
    anxiety: ['#9370db', '#8a2be2', '#9932cc', '#9400d3'],
  },
  [ElementType.MUSHROOM]: {
    joy: ['#daa520', '#cd853f', '#d2691e', '#f4a460'],
    calm: ['#8b4513', '#a0522d', '#cd853f', '#daa520'],
    stress: ['#2f4f4f', '#555555', '#696969', '#808080'],
    sadness: ['#4682b4', '#5f9ea0', '#6495ed', '#7b68ee'],
    anger: ['#8b0000', '#b22222', '#dc143c', '#ff0000'],
    anxiety: ['#4b0082', '#483d8b', '#6a5acd', '#7b68ee'],
  },
  [ElementType.CRYSTAL]: {
    joy: ['#ff69b4', '#ffd700', '#ff6347', '#ff4500'],
    calm: ['#87ceeb', '#b0e0e6', '#add8e6', '#e0ffff'],
    stress: ['#ff0000', '#dc143c', '#b22222', '#8b0000'],
    sadness: ['#4682b4', '#6495ed', '#7b68ee', '#483d8b'],
    anger: ['#ff6347', '#ff4500', '#ff0000', '#dc143c'],
    anxiety: ['#9370db', '#8a2be2', '#9932cc', '#9400d3'],
  },
  [ElementType.DECORATION]: {
    joy: ['#ffd700', '#ffb347', '#daa520', '#b8860b'],
    calm: ['#87ceeb', '#b0e0e6', '#add8e6', '#e0ffff'],
    stress: ['#ff6347', '#ff4500', '#ff0000', '#dc143c'],
    sadness: ['#4682b4', '#6495ed', '#7b68ee', '#483d8b'],
    anger: ['#8b0000', '#b22222', '#dc143c', '#ff0000'],
    anxiety: ['#9370db', '#8a2be2', '#9932cc', '#9400d3'],
  },
  // Премиум элементы - яркие специальные цвета
  [ElementType.RAINBOW_FLOWER]: {
    joy: ['#ff0080', '#ff8000', '#ffff00', '#80ff00'],
    calm: ['#0080ff', '#8000ff', '#ff0080', '#ff8000'],
    stress: ['#ff4000', '#ff0040', '#ff4080', '#ff8040'],
    sadness: ['#4080ff', '#8040ff', '#ff4080', '#80ff40'],
    anger: ['#ff0000', '#ff4000', '#ff8000', '#ffff00'],
    anxiety: ['#8000ff', '#ff0080', '#0080ff', '#80ff00'],
  },
  [ElementType.GLOWING_CRYSTAL]: {
    joy: ['#00ffff', '#ffff00', '#ff00ff', '#00ff00'],
    calm: ['#87ceeb', '#b0e0e6', '#add8e6', '#e0ffff'],
    stress: ['#ff4500', '#ff6347', '#ff0000', '#dc143c'],
    sadness: ['#4169e1', '#6495ed', '#7b68ee', '#9370db'],
    anger: ['#ff0000', '#ff4500', '#ff6347', '#ff8c00'],
    anxiety: ['#9400d3', '#9370db', '#8a2be2', '#9932cc'],
  },
  [ElementType.MYSTIC_MUSHROOM]: {
    joy: ['#ff69b4', '#dda0dd', '#da70d6', '#ee82ee'],
    calm: ['#9370db', '#8470ff', '#7b68ee', '#6a5acd'],
    stress: ['#8b008b', '#9400d3', '#9932cc', '#8a2be2'],
    sadness: ['#4b0082', '#483d8b', '#6a5acd', '#7b68ee'],
    anger: ['#dc143c', '#b22222', '#8b0000', '#a0522d'],
    anxiety: ['#4b0082', '#483d8b', '#6a5acd', '#7b68ee'],
  },
  [ElementType.AURORA_TREE]: {
    joy: ['#00ff7f', '#32cd32', '#00fa9a', '#90ee90'],
    calm: ['#20b2aa', '#48d1cc', '#40e0d0', '#00ced1'],
    stress: ['#228b22', '#2e8b57', '#3cb371', '#66cdaa'],
    sadness: ['#4682b4', '#5f9ea0', '#6495ed', '#87ceeb'],
    anger: ['#b22222', '#dc143c', '#ff6347', '#ff4500'],
    anxiety: ['#6a5acd', '#7b68ee', '#9370db', '#8a2be2'],
  },
  [ElementType.STARLIGHT_DECORATION]: {
    joy: ['#ffd700', '#ffef94', '#fff8dc', '#fffacd'],
    calm: ['#f0f8ff', '#e6e6fa', '#f8f8ff', '#f5f5f5'],
    stress: ['#ff6347', '#ff4500', '#ffa500', '#ff8c00'],
    sadness: ['#b0c4de', '#87ceeb', '#add8e6', '#b0e0e6'],
    anger: ['#ff0000', '#ff4500', '#ff6347', '#ff8c00'],
    anxiety: ['#dda0dd', '#da70d6', '#ee82ee', '#ff69b4'],
  },
}

/**
 * Создает хеш-функцию для детерминированного выбора элементов
 */
function simpleHash(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash = hash & hash // Конвертируем в 32-битное целое
  }
  return Math.abs(hash)
}

/**
 * Генерирует оттенки базового цвета для разнообразия
 */
function generateColorVariants(baseColor: string): string[] {
  // Парсим hex цвет
  const hex = baseColor.replace('#', '')
  const r = parseInt(hex.substr(0, 2), 16)
  const g = parseInt(hex.substr(2, 2), 16)
  const b = parseInt(hex.substr(4, 2), 16)

  const variants: string[] = []

  // Создаем 5 вариантов: 2 светлее, оригинал, 2 темнее
  const adjustments = [-0.2, -0.1, 0, 0.1, 0.2]

  adjustments.forEach(adj => {
    const newR = Math.max(
      0,
      Math.min(255, Math.round(r + (255 - r) * adj * 0.3))
    )
    const newG = Math.max(
      0,
      Math.min(255, Math.round(g + (255 - g) * adj * 0.3))
    )
    const newB = Math.max(
      0,
      Math.min(255, Math.round(b + (255 - b) * adj * 0.3))
    )

    const newHex = `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`
    variants.push(newHex)
  })

  return variants
}

/**
 * Получает название элемента на основе его типа, редкости и дополнительного seed
 */
export function getElementName(
  type: ElementType,
  rarity: RarityLevel,
  seed: string = ''
): string {
  const baseNames = BASE_ELEMENT_NAMES[type] || []
  if (baseNames.length === 0) return type

  // Используем seed для детерминированного выбора названия
  const nameIndex = simpleHash(seed + type) % baseNames.length
  const baseName = baseNames[nameIndex]

  if (!baseName) return type

  // Для премиум элементов не добавляем префиксы
  const isPremium = [
    ElementType.RAINBOW_FLOWER,
    ElementType.GLOWING_CRYSTAL,
    ElementType.MYSTIC_MUSHROOM,
    ElementType.AURORA_TREE,
    ElementType.STARLIGHT_DECORATION,
  ].includes(type)

  if (isPremium || rarity === RarityLevel.COMMON) {
    return baseName
  }

  // Добавляем префикс редкости
  const prefixes = RARITY_PREFIXES[rarity] || []
  if (prefixes.length === 0) return baseName

  const prefixIndex = simpleHash(seed + rarity) % prefixes.length
  const prefix = prefixes[prefixIndex]

  return prefix ? `${baseName} ${prefix}` : baseName
}

/**
 * Получает описание элемента на основе его типа и редкости
 */
export function getElementDescription(
  type: ElementType,
  rarity: RarityLevel,
  _name: string
): string {
  const rarityDescriptions: Record<RarityLevel, string> = {
    [RarityLevel.COMMON]: 'Обычный',
    [RarityLevel.UNCOMMON]: 'Необычный',
    [RarityLevel.RARE]: 'Редкий',
    [RarityLevel.EPIC]: 'Эпический',
    [RarityLevel.LEGENDARY]: 'Легендарный',
  }

  const typeDescriptions: Record<ElementType, string> = {
    [ElementType.FLOWER]: 'цветок',
    [ElementType.TREE]: 'дерево',
    [ElementType.STONE]: 'камень',
    [ElementType.WATER]: 'водный элемент',
    [ElementType.GRASS]: 'растение',
    [ElementType.MUSHROOM]: 'гриб',
    [ElementType.CRYSTAL]: 'кристалл',
    [ElementType.DECORATION]: 'украшение',
    [ElementType.RAINBOW_FLOWER]: 'радужный цветок',
    [ElementType.GLOWING_CRYSTAL]: 'светящийся кристалл',
    [ElementType.MYSTIC_MUSHROOM]: 'мистический гриб',
    [ElementType.AURORA_TREE]: 'дерево авроры',
    [ElementType.STARLIGHT_DECORATION]: 'звездное украшение',
  }

  const rarityDesc = rarityDescriptions[rarity] || 'Обычный'
  const typeDesc = typeDescriptions[type] || 'элемент'

  return `${rarityDesc} ${typeDesc}`
}

/**
 * Получает эмодзи для типа элемента
 */
export function getElementEmoji(type: ElementType): string {
  return ELEMENT_EMOJIS[type] || '🌿'
}

/**
 * Получает цвет элемента на основе типа, настроения и seed с вариациями
 */
export function getElementColor(
  type: ElementType,
  mood: MoodType,
  seed: string = ''
): string {
  const colors =
    ELEMENT_COLORS[type]?.[mood] || ELEMENT_COLORS[ElementType.FLOWER][mood]
  if (!colors || colors.length === 0) return '#22c55e'

  // Выбираем базовый цвет детерминированно
  const colorIndex = simpleHash(seed + type + mood) % colors.length
  const baseColor = colors[colorIndex]

  if (!baseColor) return '#22c55e'

  // Генерируем варианты этого цвета
  const colorVariants = generateColorVariants(baseColor)

  // Выбираем конкретный вариант детерминированно
  const variantIndex =
    simpleHash(seed + baseColor + 'variant') % colorVariants.length
  const selectedVariant = colorVariants[variantIndex]

  return selectedVariant ?? baseColor
}

/**
 * Получает масштаб элемента для размерного разнообразия (85%-115%)
 */
export function getElementScale(seed: string = ''): number {
  const scaleVariants = [0.85, 0.92, 1.0, 1.08, 1.15]
  const scaleIndex = simpleHash(seed + 'scale') % scaleVariants.length
  const selectedScale = scaleVariants[scaleIndex]
  return selectedScale ?? 1.0
}
