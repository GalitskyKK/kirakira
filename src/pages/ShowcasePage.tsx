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

  // Моковые растения для тестирования комнаты
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
      position: { x: 0, y: 1 }, // Слот 4 - подоконник 1
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
      position: { x: 0, y: 2 }, // Слот 8 - стол верхний левый
      unlockDate: new Date(),
      moodInfluence: 'joy',
      rarity: RarityLevel.COMMON,
      name: 'Тестовый гриб',
      description: 'Для тестирования',
      emoji: '🍄',
      color: '#FF6347',
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
