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

// Все элементы для демонстрации
const ALL_ELEMENTS = [
  // Обычные элементы
  {
    type: ElementType.FLOWER,
    name: 'Цветок',
    rarity: RarityLevel.COMMON,
    component: FlowerSVG,
    isPremium: false,
  },
  {
    type: ElementType.TREE,
    name: 'Дерево',
    rarity: RarityLevel.RARE,
    component: TreeSVG,
    isPremium: false,
  },
  {
    type: ElementType.CRYSTAL,
    name: 'Кристалл',
    rarity: RarityLevel.EPIC,
    component: CrystalSVG,
    isPremium: false,
  },
  {
    type: ElementType.MUSHROOM,
    name: 'Гриб',
    rarity: RarityLevel.UNCOMMON,
    component: MushroomSVG,
    isPremium: false,
  },
  {
    type: ElementType.STONE,
    name: 'Камень',
    rarity: RarityLevel.COMMON,
    component: StoneSVG,
    isPremium: false,
  },

  // Премиум элементы
  {
    type: ElementType.RAINBOW_FLOWER,
    name: 'Радужный Цветок',
    rarity: RarityLevel.LEGENDARY,
    component: RainbowFlowerSVG,
    isPremium: true,
  },
  {
    type: ElementType.GLOWING_CRYSTAL,
    name: 'Светящийся Кристалл',
    rarity: RarityLevel.LEGENDARY,
    component: GlowingCrystalSVG,
    isPremium: true,
  },
  {
    type: ElementType.MYSTIC_MUSHROOM,
    name: 'Мистический Гриб',
    rarity: RarityLevel.LEGENDARY,
    component: MysticMushroomSVG,
    isPremium: true,
  },
]

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
            Полная коллекция элементов с системой редкости
          </p>
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

        {/* Обычные элементы */}
        <Card className="mb-8 p-6">
          <h2 className="mb-4 text-2xl font-semibold">🌱 Обычные элементы</h2>
          <div className="grid grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-5">
            {ALL_ELEMENTS.filter(el => !el.isPremium).map((element, index) => {
              const Component = element.component
              const rarityInfo = RARITY_INFO[element.rarity]

              return (
                <motion.div
                  key={element.type}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="group relative rounded-lg border-2 border-gray-200 bg-white p-4 text-center transition-all hover:border-gray-300 hover:shadow-lg"
                >
                  <div className="mb-3 flex justify-center">
                    <Component size={80} />
                  </div>
                  <h3 className="mb-1 font-medium text-gray-800">
                    {element.name}
                  </h3>
                  <div
                    className="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium text-white"
                    style={{ backgroundColor: rarityInfo.color }}
                  >
                    {rarityInfo.label}
                  </div>
                </motion.div>
              )
            })}
          </div>
        </Card>

        {/* Премиум элементы */}
        <Card className="mb-8 p-6">
          <h2 className="mb-4 text-2xl font-semibold">
            ✨ Премиум элементы
            <span className="ml-2 rounded-full bg-yellow-100 px-3 py-1 text-sm font-medium text-yellow-800">
              Premium Only
            </span>
          </h2>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {ALL_ELEMENTS.filter(el => el.isPremium).map((element, index) => {
              const Component = element.component
              const rarityInfo = RARITY_INFO[element.rarity]

              return (
                <motion.div
                  key={element.type}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.2 }}
                  className="group relative rounded-lg border-2 border-yellow-300 bg-gradient-to-br from-yellow-50 to-orange-50 p-6 text-center transition-all hover:border-yellow-400 hover:shadow-xl"
                >
                  <div className="absolute -right-2 -top-2 rounded-full bg-yellow-500 px-2 py-1 text-xs font-bold text-white">
                    PREMIUM
                  </div>
                  <div className="mb-4 flex justify-center">
                    <Component size={100} />
                  </div>
                  <h3 className="mb-2 text-lg font-semibold text-gray-800">
                    {element.name}
                  </h3>
                  <div
                    className="inline-flex items-center rounded-full px-3 py-1 text-sm font-medium text-white"
                    style={{ backgroundColor: rarityInfo.color }}
                  >
                    ⭐ {rarityInfo.label}
                  </div>
                  <div className="mt-2 text-xs text-gray-600">
                    Доступен только с премиум подпиской
                  </div>
                </motion.div>
              )
            })}
          </div>
        </Card>

        {/* Информация о получении */}
        <Card className="p-6">
          <h2 className="mb-4 text-2xl font-semibold">
            📋 Как получить элементы
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
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
          </div>
        </Card>
      </div>
    </div>
  )
}
