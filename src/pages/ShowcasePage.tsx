import { ElementShowcase } from '@/components/dev/ElementShowcase'
import { IsometricRoomView } from '@/components/garden/IsometricRoomView'
import type { GardenElement } from '@/types'
import { ElementType, RarityLevel, ViewMode } from '@/types'

export function ShowcasePage() {
  // Дополнительная проверка на dev режим для безопасности
  if (!import.meta.env.DEV) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100">
        <div className="rounded-lg bg-white p-8 text-center shadow-lg">
          <h1 className="mb-4 text-2xl font-bold text-gray-800">
            🚫 Режим разработки
          </h1>
          <p className="text-gray-600">
            ElementShowcase доступен только в режиме разработки
          </p>
        </div>
      </div>
    )
  }

  // Моковые растения для тестирования комнаты (16 элементов - все слоты)
  const mockElements: readonly GardenElement[] = [
    {
      id: 'mock-1',
      type: ElementType.FLOWER,
      position: { x: 0, y: 0 }, // Слот 0 - верхняя полка слева
      unlockDate: new Date(),
      moodInfluence: 'joy',
      rarity: RarityLevel.COMMON,
      name: 'Тестовый цветок',
      description: 'Для тестирования',
      emoji: '🌸',
      color: '#FF69B4',
    },
    {
      id: 'mock-2',
      type: ElementType.TREE,
      position: { x: 1, y: 0 }, // Слот 1 - верхняя полка справа
      unlockDate: new Date(),
      moodInfluence: 'calm',
      rarity: RarityLevel.UNCOMMON,
      name: 'Тестовое дерево',
      description: 'Для тестирования',
      emoji: '🌳',
      color: '#228B22',
    },
    {
      id: 'mock-3',
      type: ElementType.CRYSTAL,
      position: { x: 2, y: 0 }, // Слот 2 - нижняя полка слева
      unlockDate: new Date(),
      moodInfluence: 'calm',
      rarity: RarityLevel.RARE,
      name: 'Тестовый кристалл',
      description: 'Для тестирования',
      emoji: '💎',
      color: '#9370DB',
    },
    {
      id: 'mock-4',
      type: ElementType.MUSHROOM,
      position: { x: 3, y: 0 }, // Слот 3 - нижняя полка справа
      unlockDate: new Date(),
      moodInfluence: 'joy',
      rarity: RarityLevel.COMMON,
      name: 'Тестовый гриб',
      description: 'Для тестирования',
      emoji: '🍄',
      color: '#FF6347',
    },
    {
      id: 'mock-5',
      type: ElementType.FLOWER,
      position: { x: 0, y: 1 }, // Слот 4 - подоконник 1
      unlockDate: new Date(),
      moodInfluence: 'joy',
      rarity: RarityLevel.COMMON,
      name: 'Цветок на окне',
      description: 'Для тестирования',
      emoji: '🌺',
      color: '#FFB6C1',
    },
    {
      id: 'mock-6',
      type: ElementType.STONE,
      position: { x: 1, y: 1 }, // Слот 5 - подоконник 2
      unlockDate: new Date(),
      moodInfluence: 'calm',
      rarity: RarityLevel.UNCOMMON,
      name: 'Камень',
      description: 'Для тестирования',
      emoji: '🪨',
      color: '#8B7355',
    },
    {
      id: 'mock-7',
      type: ElementType.GRASS,
      position: { x: 2, y: 1 }, // Слот 6 - подоконник 3
      unlockDate: new Date(),
      moodInfluence: 'calm',
      rarity: RarityLevel.COMMON,
      name: 'Трава',
      description: 'Для тестирования',
      emoji: '🌿',
      color: '#90EE90',
    },
    {
      id: 'mock-8',
      type: ElementType.WATER,
      position: { x: 3, y: 1 }, // Слот 7 - подоконник 4
      unlockDate: new Date(),
      moodInfluence: 'calm',
      rarity: RarityLevel.UNCOMMON,
      name: 'Вода',
      description: 'Для тестирования',
      emoji: '💧',
      color: '#87CEEB',
    },
    {
      id: 'mock-9',
      type: ElementType.DECORATION,
      position: { x: 0, y: 2 }, // Слот 8 - стол верхний левый
      unlockDate: new Date(),
      moodInfluence: 'joy',
      rarity: RarityLevel.COMMON,
      name: 'Декорация',
      description: 'Для тестирования',
      emoji: '✨',
      color: '#FFD700',
    },
    {
      id: 'mock-10',
      type: ElementType.FLOWER,
      position: { x: 1, y: 2 }, // Слот 9 - стол верхний правый
      unlockDate: new Date(),
      moodInfluence: 'joy',
      rarity: RarityLevel.UNCOMMON,
      name: 'Цветок на столе',
      description: 'Для тестирования',
      emoji: '🌻',
      color: '#FFA500',
    },
    {
      id: 'mock-11',
      type: ElementType.CRYSTAL,
      position: { x: 2, y: 2 }, // Слот 10 - стол нижний левый
      unlockDate: new Date(),
      moodInfluence: 'calm',
      rarity: RarityLevel.RARE,
      name: 'Кристалл на столе',
      description: 'Для тестирования',
      emoji: '💠',
      color: '#00CED1',
    },
    {
      id: 'mock-12',
      type: ElementType.MUSHROOM,
      position: { x: 3, y: 2 }, // Слот 11 - стол нижний правый
      unlockDate: new Date(),
      moodInfluence: 'joy',
      rarity: RarityLevel.COMMON,
      name: 'Гриб на столе',
      description: 'Для тестирования',
      emoji: '🍄',
      color: '#DC143C',
    },
    {
      id: 'mock-13',
      type: ElementType.TREE,
      position: { x: 0, y: 3 }, // Слот 12 - пол 1
      unlockDate: new Date(),
      moodInfluence: 'calm',
      rarity: RarityLevel.UNCOMMON,
      name: 'Дерево на полу',
      description: 'Для тестирования',
      emoji: '🌲',
      color: '#2E8B57',
    },
    {
      id: 'mock-14',
      type: ElementType.FLOWER,
      position: { x: 1, y: 3 }, // Слот 13 - пол 2
      unlockDate: new Date(),
      moodInfluence: 'joy',
      rarity: RarityLevel.COMMON,
      name: 'Цветок на полу',
      description: 'Для тестирования',
      emoji: '🌷',
      color: '#FF1493',
    },
    {
      id: 'mock-15',
      type: ElementType.DECORATION,
      position: { x: 2, y: 3 }, // Слот 14 - пол 3
      unlockDate: new Date(),
      moodInfluence: 'joy',
      rarity: RarityLevel.RARE,
      name: 'Декорация на полу',
      description: 'Для тестирования',
      emoji: '⭐',
      color: '#FFD700',
    },
    {
      id: 'mock-16',
      type: ElementType.CRYSTAL,
      position: { x: 3, y: 3 }, // Слот 15 - пол 4
      unlockDate: new Date(),
      moodInfluence: 'calm',
      rarity: RarityLevel.EPIC,
      name: 'Эпический кристалл',
      description: 'Для тестирования',
      emoji: '💎',
      color: '#8A2BE2',
    },
  ] as const

  return (
    <div className="space-y-8 p-8">
      <div>
        <h2 className="mb-4 text-2xl font-bold">Element Showcase</h2>
        <ElementShowcase />
      </div>

      <div className="mt-12">
        <h2 className="mb-4 text-2xl font-bold">Isometric Room View</h2>
        <div className="rounded-lg border-2 border-gray-200 bg-white p-4">
          <IsometricRoomView
            elements={mockElements}
            selectedElement={null}
            elementBeingMoved={null}
            viewMode={ViewMode.OVERVIEW}
            currentRoomIndex={0}
            onRoomChange={() => {}}
          />
        </div>
      </div>
    </div>
  )
}

export default ShowcasePage
