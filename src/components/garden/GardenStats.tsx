import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { formatDistanceToNow } from 'date-fns'
import { ru } from 'date-fns/locale'
import { Card } from '@/components/ui'
import type { Garden } from '@/types'

interface GardenStatsProps {
  garden: Garden
}

export function GardenStats({ garden }: GardenStatsProps) {
  // Локализация типов элементов
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

    // Group by type
    const byType = elements.reduce(
      (acc, element) => {
        acc[element.type] = (acc[element.type] ?? 0) + 1
        return acc
      },
      {} as Record<string, number>
    )

    // Group by rarity
    const byRarity = elements.reduce(
      (acc, element) => {
        acc[element.rarity] = (acc[element.rarity] ?? 0) + 1
        return acc
      },
      {} as Record<string, number>
    )

    // Group by mood
    const byMood = elements.reduce(
      (acc, element) => {
        acc[element.moodInfluence] = (acc[element.moodInfluence] ?? 0) + 1
        return acc
      },
      {} as Record<string, number>
    )

    // Calculate garden age
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

    return {
      total: elements.length,
      byType,
      byRarity,
      byMood,
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
    common: 'text-gray-600',
    uncommon: 'text-green-600',
    rare: 'text-blue-600',
    epic: 'text-purple-600',
    legendary: 'text-yellow-600',
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

  return (
    <div className="space-y-4">
      <div>
        <h3 className="mb-3 text-lg font-semibold text-gray-900 dark:text-gray-100">
          Статистика сада
        </h3>
      </div>

      {/* Overview Stats */}
      <Card padding="sm">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Всего растений
            </span>
            <span className="font-semibold text-garden-600">{stats.total}</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Возраст сада
            </span>
            <span className="text-sm font-medium">
              {stats.gardenAge ?? 'Новый сад'}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Серия дней
            </span>
            <span className="font-semibold text-orange-600">
              {garden.streak}
            </span>
          </div>
        </div>
      </Card>

      {/* Types Distribution */}
      {Object.keys(stats.byType).length > 0 && (
        <Card padding="sm">
          <h4 className="mb-3 text-sm font-semibold text-gray-900 dark:text-gray-100">
            По типам
          </h4>
          <div className="space-y-2">
            {Object.entries(stats.byType).map(([type, count]) => (
              <motion.div
                key={type}
                className="flex items-center justify-between"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: Math.random() * 0.3 }}
              >
                <div className="flex items-center space-x-2">
                  <span className="text-lg">{typeEmojis[type] ?? '🌿'}</span>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {typeLabels[type] ?? type}
                  </span>
                </div>
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {count}
                </span>
              </motion.div>
            ))}
          </div>
        </Card>
      )}

      {/* Rarity Distribution */}
      {Object.keys(stats.byRarity).length > 0 && (
        <Card padding="sm">
          <h4 className="mb-3 text-sm font-semibold text-gray-900 dark:text-gray-100">
            По редкости
          </h4>
          <div className="space-y-2">
            {Object.entries(stats.byRarity).map(([rarity, count]) => (
              <motion.div
                key={rarity}
                className="flex items-center justify-between"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: Math.random() * 0.3 }}
              >
                <span
                  className={`text-sm font-medium ${rarityColors[rarity] ?? 'text-gray-600'}`}
                >
                  {rarityLabels[rarity] ?? rarity}
                </span>
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {count}
                </span>
              </motion.div>
            ))}
          </div>
        </Card>
      )}

      {/* Mood Distribution */}
      {Object.keys(stats.byMood).length > 0 && (
        <Card padding="sm">
          <h4 className="mb-3 text-sm font-semibold text-gray-900 dark:text-gray-100">
            По настроению
          </h4>
          <div className="space-y-2">
            {Object.entries(stats.byMood).map(([mood, count]) => (
              <motion.div
                key={mood}
                className="flex items-center justify-between"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: Math.random() * 0.3 }}
              >
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {moodLabels[mood] ?? mood}
                </span>
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {count}
                </span>
              </motion.div>
            ))}
          </div>
        </Card>
      )}

      {/* Recent Elements */}
      {stats.newestElement && (
        <Card padding="sm">
          <h4 className="mb-3 text-sm font-semibold text-gray-900 dark:text-gray-100">
            Последнее растение
          </h4>
          <div className="flex items-center space-x-3">
            <div className="text-2xl">{stats.newestElement.emoji}</div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                {stats.newestElement.name}
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400">
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
