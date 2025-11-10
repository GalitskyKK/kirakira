import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { clsx } from 'clsx'
import {
  FlowerSVG,
  TreeSVG,
  CrystalSVG,
  MushroomSVG,
  StoneSVG,
  GrassSVG,
  WaterSVG,
  DecorationSVG,
  RainbowFlowerSVG,
  GlowingCrystalSVG,
  MysticMushroomSVG,
  StarlightDecorationSVG,
} from '../garden/plants'
import {
  ElementType,
  RarityLevel,
  SeasonalVariant,
  MOOD_CONFIG,
  type CompanionEmotion,
} from '@/types'
import { Card } from '@/components/ui/Card'
import {
  ELEMENT_TEMPLATES,
  PREMIUM_ELEMENT_TYPES,
} from '@/utils/elementGeneration'
import {
  getElementName,
  getElementDescription,
  getElementEmoji,
  getElementColor,
} from '@/utils/elementNames'
import type { MoodType } from '@/types'
import { GardenCompanion } from '@/components/garden/companion/GardenCompanion'
import { useCompanionStore } from '@/stores/companionStore'
import { getCompanionDefinition } from '@/data/companions'

// Проверка dev режима - показывать только в разработке
if (!import.meta.env.DEV) {
  throw new Error('ElementShowcase доступен только в режиме разработки')
}

const luminaDefinition = getCompanionDefinition('lumina')
const LUMINA_EMOTIONS = Object.values(luminaDefinition.emotions)

function CompanionShowcase() {
  const [selectedEmotion, setSelectedEmotion] =
    useState<CompanionEmotion>('neutral')

  const {
    setActiveCompanion,
    setVisible,
    setInfoOpen,
    clearReaction,
    clearAmbientAnimation,
  } = useCompanionStore(state => ({
    setActiveCompanion: state.setActiveCompanion,
    setVisible: state.setVisible,
    setInfoOpen: state.setInfoOpen,
    clearReaction: state.clearReaction,
    clearAmbientAnimation: state.clearAmbientAnimation,
  }))

  useEffect(() => {
    setActiveCompanion('lumina')
    setVisible(true)
    setInfoOpen(false)
    clearReaction()
    clearAmbientAnimation()

    useCompanionStore.setState({
      baseEmotion: 'neutral',
      currentEmotion: 'neutral',
      isCelebrating: false,
      celebrationUntil: null,
      activeReaction: null,
      activeAmbientAnimation: null,
      lastMood: null,
    })

    return () => {
      useCompanionStore.setState({
        baseEmotion: 'neutral',
        currentEmotion: 'neutral',
        isCelebrating: false,
        celebrationUntil: null,
        activeReaction: null,
        activeAmbientAnimation: null,
        lastMood: null,
      })
    }
  }, [
    clearAmbientAnimation,
    clearReaction,
    setActiveCompanion,
    setInfoOpen,
    setVisible,
  ])

  useEffect(() => {
    if (selectedEmotion === 'celebration') {
      useCompanionStore.setState({
        baseEmotion: 'neutral',
        currentEmotion: 'celebration',
        isCelebrating: true,
        celebrationUntil: Date.now() + 60_000,
      })
      return
    }

    useCompanionStore.setState({
      baseEmotion: selectedEmotion,
      currentEmotion: selectedEmotion,
      isCelebrating: false,
      celebrationUntil: null,
    })
  }, [selectedEmotion])

  const currentVisual = useMemo(
    () =>
      LUMINA_EMOTIONS.find(
        emotionVisual => emotionVisual.emotion === selectedEmotion
      ),
    [selectedEmotion]
  )

  if (!currentVisual) {
    return null
  }

  return (
    <Card className="mb-8 overflow-hidden border-2 border-indigo-100 bg-white/90 p-6 shadow-lg backdrop-blur-sm dark:border-indigo-500/40 dark:bg-slate-900/60">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center">
        <div className="flex flex-1 flex-col items-center">
          <div className="pointer-events-none">
            <GardenCompanion className="pointer-events-none scale-125 sm:scale-150" />
          </div>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            {LUMINA_EMOTIONS.map(emotionVisual => {
              const isActive = emotionVisual.emotion === selectedEmotion
              return (
                <button
                  key={emotionVisual.emotion}
                  type="button"
                  onClick={() => setSelectedEmotion(emotionVisual.emotion)}
                  className={clsx(
                    'rounded-full px-4 py-2 text-sm font-medium transition-all',
                    isActive
                      ? 'bg-indigo-500 text-white shadow-lg'
                      : 'bg-indigo-100/70 text-indigo-700 hover:bg-indigo-200 dark:bg-indigo-500/20 dark:text-indigo-200 dark:hover:bg-indigo-500/30'
                  )}
                >
                  {emotionVisual.label}
                </button>
              )
            })}
          </div>
        </div>

        <div className="flex-1 space-y-4">
          <div>
            <h2 className="flex items-center gap-2 text-2xl font-semibold text-slate-800 dark:text-slate-100">
              💫 Лумина — эмоциональный спутник
            </h2>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
              Выбирай эмоцию, чтобы увидеть новую пузырьковую форму Лумины с
              обновлёнными градиентами, крылышками и анимациями. Компонент
              GardenCompanion рендерится напрямую, поэтому ты видишь ровно то,
              что окажется в саду.
            </p>
          </div>

          <div className="rounded-2xl border border-indigo-100/60 bg-indigo-50/40 p-4 shadow-inner dark:border-indigo-500/30 dark:bg-indigo-500/10">
            <div className="mb-2 text-xs uppercase tracking-wide text-indigo-500 dark:text-indigo-300">
              Текущая эмоция
            </div>
            <div className="text-xl font-semibold text-indigo-700 dark:text-indigo-200">
              {currentVisual.label}
            </div>
            <p className="mt-2 text-sm text-indigo-800/80 dark:text-indigo-200/80">
              {currentVisual.description}
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-indigo-600/80 dark:text-indigo-200/70">
              <span
                className="inline-flex items-center rounded-full px-3 py-1 font-medium"
                style={{
                  background: `linear-gradient(120deg, ${currentVisual.bodyGradient[0]}, ${currentVisual.bodyGradient[1]})`,
                  color: '#ffffff',
                }}
              >
                🌈 Градиент тела
              </span>
              <span className="inline-flex items-center rounded-full bg-white/80 px-3 py-1 font-medium text-indigo-500 shadow-sm dark:bg-slate-800/80 dark:text-indigo-200">
                ✨ Аура: {currentVisual.auraOpacity.toFixed(2)}
              </span>
              {currentVisual.particlePreset && (
                <span className="inline-flex items-center rounded-full bg-white/80 px-3 py-1 font-medium text-indigo-500 shadow-sm dark:bg-slate-800/80 dark:text-indigo-200">
                  🫧 Частицы: {currentVisual.particlePreset.variant}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </Card>
  )
}

// Маппинг элементов к компонентам - теперь все уникальные!
const getElementComponent = (elementType: ElementType) => {
  switch (elementType) {
    case ElementType.FLOWER:
      return FlowerSVG
    case ElementType.RAINBOW_FLOWER:
      return RainbowFlowerSVG
    case ElementType.TREE:
      return TreeSVG
    case ElementType.AURORA_TREE:
      return TreeSVG // Используем TreeSVG с особыми эффектами
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
      return GrassSVG
    case ElementType.WATER:
      return WaterSVG
    case ElementType.DECORATION:
      return DecorationSVG
    case ElementType.STARLIGHT_DECORATION:
      return StarlightDecorationSVG
    default:
      return FlowerSVG
  }
}

// Создание маппинга настроений к элементам из MOOD_CONFIG
const MOOD_MAPPING: Record<ElementType, string[]> = {} as Record<
  ElementType,
  string[]
>

// Инициализируем пустые массивы для всех типов элементов
Object.values(ElementType).forEach(elementType => {
  MOOD_MAPPING[elementType] = []
})

// Заполняем маппинг на основе MOOD_CONFIG
Object.entries(MOOD_CONFIG).forEach(([, moodConfig]) => {
  moodConfig.elementTypes.forEach(elementType => {
    if (!MOOD_MAPPING[elementType].includes(moodConfig.label)) {
      MOOD_MAPPING[elementType].push(moodConfig.label)
    }
  })
})

// Создаем расширенный список элементов с сезонными вариациями
const createAllElements = () => {
  const elements: Array<{
    type: ElementType
    name: string
    description: string
    emoji: string
    baseColor: string
    rarity: RarityLevel
    component: React.ComponentType<Record<string, unknown>>
    isPremium: boolean
    moods: string[]
    season?: SeasonalVariant
    fullName: string
  }> = []

  // Добавляем базовые элементы
  ELEMENT_TEMPLATES.forEach((template, index) => {
    // Генерируем детерминированный seed для showcase
    const showcaseSeed = `showcase-${template.type}-${template.rarity}-${index}`

    // Генерируем характеристики на основе seed
    const name = getElementName(template.type, template.rarity, showcaseSeed)
    const description = getElementDescription(
      template.type,
      template.rarity,
      name
    )
    const emoji = getElementEmoji(template.type)
    const baseColor = getElementColor(
      template.type,
      'joy' as MoodType,
      showcaseSeed
    )

    const baseElement = {
      type: template.type,
      name,
      description,
      emoji,
      baseColor,
      rarity: template.rarity,
      component: getElementComponent(template.type),
      isPremium: PREMIUM_ELEMENT_TYPES.has(template.type),
      moods: MOOD_MAPPING[template.type] ?? ['Универсальный'],
      fullName: name,
    }
    elements.push(baseElement)

    // Добавляем сезонные вариации для каждого элемента
    Object.values(SeasonalVariant).forEach(season => {
      const seasonalElement = {
        ...baseElement,
        season,
        fullName: `${name} (${getSeasonName(season)})`,
        description: `${description} - ${getSeasonName(season)} вариант`,
      }
      elements.push(seasonalElement)
    })
  })

  return elements
}

// Функция для получения названия сезона на русском
const getSeasonName = (season: SeasonalVariant): string => {
  switch (season) {
    case SeasonalVariant.SPRING:
      return 'Весна'
    case SeasonalVariant.SUMMER:
      return 'Лето'
    case SeasonalVariant.AUTUMN:
      return 'Осень'
    case SeasonalVariant.WINTER:
      return 'Зима'
    default:
      return 'Неизвестный сезон'
  }
}

const ALL_ELEMENTS = createAllElements()

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
        <CompanionShowcase />

        <div className="mb-8 text-center">
          <h1 className="mb-4 text-4xl font-bold text-gray-800">
            🌿 Все элементы сада KiraKira
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Полная коллекция из {ALL_ELEMENTS.length} элементов с системой
            редкости и сезонными вариациями
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            <span className="rounded-full bg-blue-100 px-3 py-1 text-sm text-blue-700">
              {ELEMENT_TEMPLATES.length} базовых шаблонов
            </span>
            <span className="rounded-full bg-green-100 px-3 py-1 text-sm text-green-700">
              {
                ALL_ELEMENTS.filter(
                  el => el.season !== undefined && el.season !== null
                ).length
              }{' '}
              сезонных вариаций
            </span>
            <span className="rounded-full bg-yellow-100 px-3 py-1 text-sm text-yellow-700">
              {ALL_ELEMENTS.filter(el => el.isPremium).length} премиум элементов
            </span>
            <span className="rounded-full bg-purple-100 px-3 py-1 text-sm text-purple-700">
              {Object.values(ElementType).length} типов элементов
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
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {info.chance}
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Элементы по редкости */}
        {Object.entries(RARITY_INFO).map(([rarity, rarityInfo]) => {
          const rarityKey = rarity as RarityLevel
          const elementsOfRarity = ALL_ELEMENTS.filter(
            el => el.rarity === rarityKey
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
                      key={`${element.type}-${element.name}-${
                        element.season ?? 'base'
                      }`}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className={`group relative rounded-lg border-2 p-4 text-center transition-all hover:shadow-lg ${
                        element.isPremium
                          ? 'border-yellow-300 bg-gradient-to-br from-yellow-50 to-orange-50 hover:border-yellow-400 dark:border-yellow-600 dark:from-yellow-900/20 dark:to-orange-900/20 dark:hover:border-yellow-500'
                          : 'border-gray-200 bg-white hover:border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:hover:border-gray-600'
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
                          rarity={element.rarity}
                          season={element.season}
                          name={element.name}
                        />
                      </div>
                      <h3 className="mb-1 font-medium text-gray-800 dark:text-gray-200">
                        {element.fullName}
                      </h3>
                      <p className="mb-2 text-xs text-gray-600 dark:text-gray-400">
                        {element.description}
                      </p>
                      {element.season !== undefined && (
                        <div className="mb-1 inline-flex items-center rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-700 dark:bg-green-900/30 dark:text-green-400">
                          🌿 {getSeasonName(element.season)}
                        </div>
                      )}
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

        {/* Информация о сезонах */}
        <Card className="mb-8 p-6">
          <h2 className="mb-4 text-2xl font-semibold">🌸 Сезонные вариации</h2>
          <div className="mb-4 text-gray-600">
            Каждый элемент имеет уникальные сезонные вариации с особыми
            визуальными эффектами:
          </div>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="rounded-lg bg-green-50 p-4">
              <h3 className="mb-2 font-semibold text-green-800">🌸 Весна</h3>
              <div className="text-sm text-green-700">
                Свежие зеленые оттенки, молодые побеги, пастельные цвета
              </div>
            </div>
            <div className="rounded-lg bg-yellow-50 p-4">
              <h3 className="mb-2 font-semibold text-yellow-800">☀️ Лето</h3>
              <div className="text-sm text-yellow-700">
                Яркие насыщенные цвета, полное цветение, солнечные оттенки
              </div>
            </div>
            <div className="rounded-lg bg-orange-50 p-4">
              <h3 className="mb-2 font-semibold text-orange-800">🍂 Осень</h3>
              <div className="text-sm text-orange-700">
                Золотые и красные тона, увядающие листья, теплые оттенки
              </div>
            </div>
            <div className="rounded-lg bg-blue-50 p-4">
              <h3 className="mb-2 font-semibold text-blue-800">❄️ Зима</h3>
              <div className="text-sm text-blue-700">
                Холодные оттенки, снежные эффекты, кристальная чистота
              </div>
            </div>
          </div>
        </Card>

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
                  😵‍💫 <strong>Стресс</strong> → Камни и кристаллы
                </li>
                <li>
                  😔 <strong>Грусть</strong> → Грибы и трава
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
                <li>😔 Грусть: +5% к редкости</li>
                <li>😵‍💫 Стресс: без бонуса</li>
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
                const rarityKey = rarity as RarityLevel
                const count = ALL_ELEMENTS.filter(
                  el => el.rarity === rarityKey
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

            {/* Дополнительная статистика */}
            <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-4">
              <div className="text-center">
                <div className="text-lg font-bold text-blue-600">
                  {ELEMENT_TEMPLATES.length}
                </div>
                <div className="text-xs text-gray-600">Базовых шаблонов</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-green-600">
                  {
                    ALL_ELEMENTS.filter(
                      el => el.season !== undefined && el.season !== null
                    ).length
                  }
                </div>
                <div className="text-xs text-gray-600">Сезонных вариаций</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-yellow-600">
                  {PREMIUM_ELEMENT_TYPES.size}
                </div>
                <div className="text-xs text-gray-600">Премиум типов</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-purple-600">
                  {Object.values(SeasonalVariant).length}
                </div>
                <div className="text-xs text-gray-600">Сезонов</div>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
