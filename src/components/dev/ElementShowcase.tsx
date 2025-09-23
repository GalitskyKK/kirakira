import { motion } from 'framer-motion'
import {
  FlowerSVG,
  TreeSVG,
  CrystalSVG,
  MushroomSVG,
  StoneSVG,
  RainbowFlowerSVG,
  GlowingCrystalSVG,
  MysticMushroomSVG,
} from '../garden/plants'
import { ElementType, RarityLevel } from '@/types'
import { Card } from '@/components/ui/Card'
import {
  ELEMENT_TEMPLATES,
  PREMIUM_ELEMENT_TYPES,
} from '@/utils/elementGeneration'

// Маппинг элементов к компонентам
const getElementComponent = (elementType: ElementType) => {
  switch (elementType) {
    case ElementType.FLOWER:
      return FlowerSVG
    case ElementType.RAINBOW_FLOWER:
      return RainbowFlowerSVG
    case ElementType.TREE:
      return TreeSVG
    case ElementType.AURORA_TREE:
      return TreeSVG // Используем обычное дерево с особыми эффектами
    case ElementType.CRYSTAL:
      return CrystalSVG
    case ElementType.GLOWING_CRYSTAL:
      return GlowingCrystalSVG
    case ElementType.MUSHROOM:
      return MushroomSVG
    case ElementType.MYSTIC_MUSHROOM:
      return MysticMushroomSVG
    case ElementType.STONE:
      return StoneSVG
    case ElementType.GRASS:
      return FlowerSVG // Заглушка
    case ElementType.WATER:
      return CrystalSVG // Заглушка (похож на каплю)
    case ElementType.DECORATION:
      return FlowerSVG // Заглушка
    case ElementType.STARLIGHT_DECORATION:
      return CrystalSVG // Заглушка (светящийся)
    default:
      return FlowerSVG
  }
}

// Маппинг настроений к элементам
const MOOD_MAPPING: Record<ElementType, string[]> = {
  [ElementType.FLOWER]: ['Радость'],
  [ElementType.TREE]: ['Спокойствие'],
  [ElementType.CRYSTAL]: ['Стресс', 'Гнев'],
  [ElementType.MUSHROOM]: ['Грусть', 'Тревога'],
  [ElementType.STONE]: ['Стресс', 'Гнев'],
  [ElementType.GRASS]: ['Грусть'],
  [ElementType.WATER]: ['Спокойствие'],
  [ElementType.DECORATION]: ['Радость', 'Тревога'],
  [ElementType.RAINBOW_FLOWER]: ['Радость'],
  [ElementType.GLOWING_CRYSTAL]: ['Стресс', 'Гнев'],
  [ElementType.MYSTIC_MUSHROOM]: ['Грусть', 'Тревога'],
  [ElementType.AURORA_TREE]: ['Спокойствие'],
  [ElementType.STARLIGHT_DECORATION]: ['Радость', 'Тревога'],
}

// Преобразуем ELEMENT_TEMPLATES в формат для showcase
const ALL_ELEMENTS = ELEMENT_TEMPLATES.map(template => ({
  ...template,
  component: getElementComponent(template.type),
  isPremium: PREMIUM_ELEMENT_TYPES.has(template.type),
  moods: MOOD_MAPPING[template.type] || ['Универсальный'],
}))

const RARITY_INFO = {
  [RarityLevel.COMMON]: { color: '#6b7280', label: 'Обычный', chance: '50%' },
  [RarityLevel.UNCOMMON]: {
    color: '#22c55e',
    label: 'Необычный',
    chance: '30%',
  },
  [RarityLevel.RARE]: { color: '#3b82f6', label: 'Редкий', chance: '15%' },
  [RarityLevel.EPIC]: { color: '#a855f7', label: 'Эпический', chance: '4%' },
  [RarityLevel.LEGENDARY]: {
    color: '#f59e0b',
    label: 'Легендарный',
    chance: '1%',
  },
}

export function ElementShowcase() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-4">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 text-center">
          <h1 className="mb-4 text-4xl font-bold text-gray-800">
            🌿 Все элементы сада KiraKira
          </h1>
          <p className="text-lg text-gray-600">
            Полная коллекция из {ALL_ELEMENTS.length} уникальных элементов с
            системой редкости
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            <span className="rounded-full bg-blue-100 px-3 py-1 text-sm text-blue-700">
              {ALL_ELEMENTS.filter(el => !el.isPremium).length} базовых
              элементов
            </span>
            <span className="rounded-full bg-yellow-100 px-3 py-1 text-sm text-yellow-700">
              {ALL_ELEMENTS.filter(el => el.isPremium).length} премиум элементов
            </span>
          </div>
        </div>

        {/* Система редкости */}
        <Card className="mb-8 p-6">
          <h2 className="mb-4 text-2xl font-semibold">🎲 Система редкости</h2>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
            {Object.entries(RARITY_INFO).map(([rarity, info]) => (
              <div
                key={rarity}
                className="rounded-lg border-2 p-3 text-center"
                style={{ borderColor: info.color }}
              >
                <div
                  className="mx-auto mb-2 h-4 w-4 rounded-full"
                  style={{ backgroundColor: info.color }}
                />
                <div className="font-medium" style={{ color: info.color }}>
                  {info.label}
                </div>
                <div className="text-sm text-gray-500">{info.chance}</div>
              </div>
            ))}
          </div>
        </Card>

        {/* Элементы по редкости */}
        {Object.entries(RARITY_INFO).map(([rarity, rarityInfo]) => {
          const elementsOfRarity = ALL_ELEMENTS.filter(
            el => el.rarity === rarity
          )
          if (elementsOfRarity.length === 0) return null

          return (
            <Card key={rarity} className="mb-8 p-6">
              <h2 className="mb-4 flex items-center gap-2 text-2xl font-semibold">
                <div
                  className="h-4 w-4 rounded-full"
                  style={{ backgroundColor: rarityInfo.color }}
                />
                {rarityInfo.label} элементы
                <span className="ml-auto text-sm text-gray-500">
                  {elementsOfRarity.length} элементов • {rarityInfo.chance} шанс
                </span>
              </h2>
              <div className="grid grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                {elementsOfRarity.map((element, index) => {
                  const Component = element.component

                  return (
                    <motion.div
                      key={`${element.type}-${element.name}`}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className={`group relative rounded-lg border-2 p-4 text-center transition-all hover:shadow-lg ${
                        element.isPremium
                          ? 'border-yellow-300 bg-gradient-to-br from-yellow-50 to-orange-50 hover:border-yellow-400'
                          : 'border-gray-200 bg-white hover:border-gray-300'
                      }`}
                    >
                      {element.isPremium && (
                        <div className="absolute -right-2 -top-2 rounded-full bg-yellow-500 px-2 py-1 text-xs font-bold text-white">
                          PREMIUM
                        </div>
                      )}
                      <div className="mb-3 flex justify-center">
                        <Component
                          size={element.isPremium ? 90 : 80}
                          color={element.baseColor}
                        />
                      </div>
                      <h3 className="mb-1 font-medium text-gray-800">
                        {element.name}
                      </h3>
                      <p className="mb-2 text-xs text-gray-600">
                        {element.description}
                      </p>
                      <div
                        className="mb-2 inline-flex items-center rounded-full px-2 py-1 text-xs font-medium text-white"
                        style={{ backgroundColor: rarityInfo.color }}
                      >
                        {element.isPremium ? '⭐ ' : ''}
                        {rarityInfo.label}
                      </div>
                      <div className="mb-1 text-xs text-gray-500">
                        🎭 {element.moods.join(', ')}
                      </div>
                      <div className="text-xs text-gray-400">
                        {element.emoji}
                      </div>
                      {element.isPremium && (
                        <div className="mt-2 text-xs text-yellow-600">
                          Только для Premium
                        </div>
                      )}
                    </motion.div>
                  )
                })}
              </div>
            </Card>
          )
        })}

        {/* Информация о получении */}
        <Card className="p-6">
          <h2 className="mb-4 text-2xl font-semibold">
            📋 Как получить элементы
          </h2>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-lg bg-blue-50 p-4">
              <h3 className="mb-2 font-semibold text-blue-800">
                🎯 Влияние настроения
              </h3>
              <ul className="space-y-1 text-sm text-blue-700">
                <li>
                  😊 <strong>Радость</strong> → Цветы и украшения
                </li>
                <li>
                  😌 <strong>Спокойствие</strong> → Деревья и вода
                </li>
                <li>
                  😰 <strong>Стресс</strong> → Камни и кристаллы
                </li>
                <li>
                  😢 <strong>Грусть</strong> → Грибы и трава
                </li>
                <li>
                  😠 <strong>Гнев</strong> → Камни и кристаллы
                </li>
                <li>
                  😰 <strong>Тревога</strong> → Грибы и украшения
                </li>
              </ul>
            </div>
            <div className="rounded-lg bg-green-50 p-4">
              <h3 className="mb-2 font-semibold text-green-800">
                ⚡ Бонусы редкости
              </h3>
              <ul className="space-y-1 text-sm text-green-700">
                <li>😊 Радость: +20% к редкости</li>
                <li>😌 Спокойствие: +10% к редкости</li>
                <li>😰 Тревога: +10% к редкости</li>
                <li>😢 Грусть: +5% к редкости</li>
                <li>😰 Стресс: без бонуса</li>
                <li>😠 Гнев: без бонуса</li>
              </ul>
            </div>
            <div className="rounded-lg bg-yellow-50 p-4">
              <h3 className="mb-2 font-semibold text-yellow-800">
                ⭐ Премиум элементы
              </h3>
              <ul className="space-y-1 text-sm text-yellow-700">
                <li>💳 Покупка через Telegram Stars</li>
                <li>🎁 Подарки от друзей</li>
                <li>🏆 Специальные достижения</li>
                <li>🌟 Эксклюзивные анимации</li>
                <li>💎 Уникальные свойства</li>
              </ul>
            </div>
          </div>

          <div className="mt-6 rounded-lg bg-gray-50 p-4">
            <h3 className="mb-2 font-semibold text-gray-800">
              📊 Статистика коллекции
            </h3>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
              {Object.entries(RARITY_INFO).map(([rarity, rarityInfo]) => {
                const count = ALL_ELEMENTS.filter(
                  el => el.rarity === rarity
                ).length
                return (
                  <div key={rarity} className="text-center">
                    <div
                      className="mx-auto mb-1 h-6 w-6 rounded-full"
                      style={{ backgroundColor: rarityInfo.color }}
                    />
                    <div className="text-lg font-bold">{count}</div>
                    <div className="text-xs text-gray-600">
                      {rarityInfo.label}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
