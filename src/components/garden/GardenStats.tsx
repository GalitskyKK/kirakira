import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { formatDistanceToNow } from 'date-fns'
import { ru } from 'date-fns/locale'
import { ChevronDown } from 'lucide-react'
import { Card } from '@/components/ui'
import type { Garden } from '@/types'

interface GardenStatsProps {
  readonly garden: Garden
}

const COLLAPSED_LIMIT = 3

export function GardenStats({ garden }: GardenStatsProps) {
  const [isTypeOpen, setIsTypeOpen] = useState(false)
  const [isRarityOpen, setIsRarityOpen] = useState(false)
  const [isMoodOpen, setIsMoodOpen] = useState(false)

  const typeLabels: Record<string, string> = {
    flower: 'Цветок',
    tree: 'Дерево',
    stone: 'Камень',
    water: 'Вода',
    grass: 'Трава',
    mushroom: 'Гриб',
    crystal: 'Кристалл',
    decoration: 'Декорация',
    rainbow_flower: 'Радужный цветок',
    glowing_crystal: 'Светящийся кристалл',
    mystic_mushroom: 'Мистический гриб',
    aurora_tree: 'Северное дерево',
    starlight_decoration: 'Звездное украшение',
  }

  const stats = useMemo(() => {
    const elements = garden.elements

    if (elements.length === 0) {
      return {
        total: 0,
        byType: [] as Array<[string, number]>,
        byRarity: [] as Array<[string, number]>,
        byMood: [] as Array<[string, number]>,
        oldestElement: null,
        newestElement: null,
        gardenAge: null,
      }
    }

    const byType = elements.reduce<Record<string, number>>((acc, element) => {
      acc[element.type] = (acc[element.type] ?? 0) + 1
      return acc
    }, {})

    const byRarity = elements.reduce<Record<string, number>>((acc, element) => {
      acc[element.rarity] = (acc[element.rarity] ?? 0) + 1
      return acc
    }, {})

    const byMood = elements.reduce<Record<string, number>>((acc, element) => {
      acc[element.moodInfluence] = (acc[element.moodInfluence] ?? 0) + 1
      return acc
    }, {})

    const oldestElement = elements.reduce(
      (oldest, current) =>
        oldest && current.unlockDate < oldest.unlockDate ? current : oldest,
      elements[0]
    )

    const newestElement = elements.reduce(
      (newest, current) =>
        newest && current.unlockDate > newest.unlockDate ? current : newest,
      elements[0]
    )

    const sortDesc = (pairs: [string, number][]) =>
      pairs.sort(([, a], [, b]) => b - a)

    return {
      total: elements.length,
      byType: sortDesc(Object.entries(byType)),
      byRarity: sortDesc(Object.entries(byRarity)),
      byMood: sortDesc(Object.entries(byMood)),
      oldestElement,
      newestElement,
      gardenAge: oldestElement
        ? formatDistanceToNow(
            oldestElement.unlockDate instanceof Date
              ? oldestElement.unlockDate
              : new Date(oldestElement.unlockDate),
            { locale: ru, addSuffix: true }
          )
        : null,
    }
  }, [garden.elements])

  const typeEmojis: Record<string, string> = {
    flower: '🌸',
    tree: '🌳',
    stone: '🪨',
    water: '💧',
    grass: '🌱',
    mushroom: '🍄',
    crystal: '💎',
    decoration: '✨',
  }

  const rarityColors: Record<string, string> = {
    common: 'text-neutral-600 dark:text-neutral-400',
    uncommon: 'text-emerald-600 dark:text-emerald-400',
    rare: 'text-blue-600 dark:text-blue-400',
    epic: 'text-kira-600 dark:text-kira-400',
    legendary: 'text-amber-600 dark:text-amber-400',
  }

  const rarityLabels: Record<string, string> = {
    common: 'Обычные',
    uncommon: 'Необычные',
    rare: 'Редкие',
    epic: 'Эпические',
    legendary: 'Легендарные',
  }

  const moodLabels: Record<string, string> = {
    joy: 'Радость',
    calm: 'Спокойствие',
    stress: 'Стресс',
    sadness: 'Грусть',
    anger: 'Гнев',
    anxiety: 'Тревога',
  }

  const renderSection = (
    title: string,
    items: Array<[string, number]>,
    isOpen: boolean,
    toggle: () => void,
    renderRow: (entry: [string, number], index: number) => JSX.Element
  ) => {
    if (items.length === 0) return null

    const visibleItems = isOpen ? items : items.slice(0, COLLAPSED_LIMIT)
    const hiddenCount = Math.max(0, items.length - COLLAPSED_LIMIT)

    return (
      <Card padding="sm">
        <button
          type="button"
          onClick={toggle}
          className="flex w-full items-center justify-between rounded-lg px-1 py-1 text-left transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-800/50"
          aria-expanded={isOpen}
        >
          <span className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
            {title}
          </span>
          <div className="flex items-center gap-2">
            {!isOpen && hiddenCount > 0 && (
              <span className="rounded-full bg-neutral-100 px-2 py-1 text-[11px] font-semibold text-neutral-700 dark:bg-neutral-800 dark:text-neutral-200">
                +{hiddenCount}
              </span>
            )}
            <ChevronDown
              className={`h-4 w-4 text-neutral-500 transition-transform ${isOpen ? 'rotate-180' : ''}`}
            />
          </div>
        </button>

        <AnimatePresence initial={false}>
          <motion.div
            key={isOpen ? 'open' : 'closed'}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="space-y-2 pt-2">{visibleItems.map(renderRow)}</div>
          </motion.div>
        </AnimatePresence>
      </Card>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between px-1">
        <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
          Статистика сада
        </h3>
        <span className="text-xs text-neutral-500 dark:text-neutral-400">
          {stats.total} элементов
        </span>
      </div>

      <Card padding="sm">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-neutral-600 dark:text-neutral-400">
              Всего растений
            </span>
            <span className="text-base font-semibold text-kira-600 dark:text-kira-300">
              {stats.total}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-neutral-600 dark:text-neutral-400">
              Возраст сада
            </span>
            <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
              {stats.gardenAge ?? 'Новый сад'}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-neutral-600 dark:text-neutral-400">
              Серия дней
            </span>
            <span className="text-base font-semibold text-kira-600 dark:text-kira-300">
              {garden.streak}
            </span>
          </div>
        </div>
      </Card>

      {renderSection(
        'По типам',
        stats.byType,
        isTypeOpen,
        () => setIsTypeOpen(open => !open),
        ([type, count], index) => (
          <motion.div
            key={type}
            className="flex items-center justify-between rounded-md px-2 py-1.5 transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-800/60"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.03 }}
          >
            <div className="flex items-center gap-2">
              <span className="text-lg">{typeEmojis[type] ?? '🌿'}</span>
              <span className="text-sm text-neutral-700 dark:text-neutral-200">
                {typeLabels[type] ?? type}
              </span>
            </div>
            <span className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
              {count}
            </span>
          </motion.div>
        )
      )}

      {renderSection(
        'По редкости',
        stats.byRarity,
        isRarityOpen,
        () => setIsRarityOpen(open => !open),
        ([rarity, count], index) => (
          <motion.div
            key={rarity}
            className="flex items-center justify-between rounded-md px-2 py-1.5 transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-800/60"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.03 }}
          >
            <span
              className={`text-sm font-semibold ${rarityColors[rarity] ?? 'text-neutral-700 dark:text-neutral-200'}`}
            >
              {rarityLabels[rarity] ?? rarity}
            </span>
            <span className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
              {count}
            </span>
          </motion.div>
        )
      )}

      {renderSection(
        'По настроению',
        stats.byMood,
        isMoodOpen,
        () => setIsMoodOpen(open => !open),
        ([mood, count], index) => (
          <motion.div
            key={mood}
            className="flex items-center justify-between rounded-md px-2 py-1.5 transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-800/60"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.03 }}
          >
            <span className="text-sm text-neutral-700 dark:text-neutral-200">
              {moodLabels[mood] ?? mood}
            </span>
            <span className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
              {count}
            </span>
          </motion.div>
        )
      )}

      {stats.newestElement && stats.newestElement.emoji && (
        <Card padding="sm">
          <h4 className="mb-2 text-sm font-semibold text-neutral-900 dark:text-neutral-100">
            Последнее растение
          </h4>
          <div className="flex items-center gap-3 rounded-lg bg-neutral-50 px-3 py-2 dark:bg-neutral-800/60">
            <div className="text-2xl">{stats.newestElement.emoji}</div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                {stats.newestElement.name}
              </p>
              <p className="text-xs text-neutral-600 dark:text-neutral-400">
                {formatDistanceToNow(
                  stats.newestElement.unlockDate instanceof Date
                    ? stats.newestElement.unlockDate
                    : new Date(stats.newestElement.unlockDate),
                  { locale: ru, addSuffix: true }
                )}
              </p>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}
