import { motion } from 'framer-motion'
import { formatDistanceToNow, format } from 'date-fns'
import { ru } from 'date-fns/locale'
import { ArrowLeft, Calendar, Heart, Star } from 'lucide-react'
import { Button, Card } from '@/components/ui'
import { MOOD_CONFIG } from '@/types/mood'
import { PlantRenderer } from '@/components/garden/plants'
import type { GardenElement } from '@/types'
import { ElementUpgradeManager } from './ElementUpgradeManager'
import { useGardenSync } from '@/hooks/index.v2'
import { useEffect, useState } from 'react'

interface ElementDetailsProps {
  element: GardenElement
  onBack: () => void
}

export function ElementDetails({ element, onBack }: ElementDetailsProps) {
  const [currentElement, setCurrentElement] = useState(element)
  const [isUpgrading, setIsUpgrading] = useState(false)

  // Получаем данные сада через React Query
  const { data: gardenData } = useGardenSync(undefined, false) // Не включаем автоматическую загрузку

  // 🔄 ОБНОВЛЯЕМ ЭЛЕМЕНТ ПРИ ИЗМЕНЕНИЯХ В САДЕ
  useEffect(() => {
    if (gardenData?.elements) {
      const updatedElement = gardenData.elements.find(
        el => el.id === element.id
      )
      if (updatedElement && updatedElement.rarity !== currentElement.rarity) {
        setIsUpgrading(true)
        setTimeout(() => {
          setCurrentElement(updatedElement)
          setIsUpgrading(false)
          console.log(
            '✅ Element details updated with new rarity:',
            updatedElement.rarity
          )
        }, 500) // Небольшая задержка для анимации
      }
    }
  }, [gardenData?.elements, element.id, currentElement.rarity])

  const moodConfig =
    currentElement.moodInfluence in MOOD_CONFIG
      ? MOOD_CONFIG[currentElement.moodInfluence]
      : MOOD_CONFIG.joy // Fallback to joy if invalid mood

  const rarityLabels: Record<string, string> = {
    common: 'Обычный',
    uncommon: 'Необычный',
    rare: 'Редкий',
    epic: 'Эпический',
    legendary: 'Легендарный',
  }

  const seasonLabels: Record<string, string> = {
    spring: 'Весна',
    summer: 'Лето',
    autumn: 'Осень',
    winter: 'Зима',
  }

  const typeLabels: Record<string, string> = {
    flower: 'Цветок',
    tree: 'Дерево',
    stone: 'Камень',
    water: 'Вода',
    grass: 'Трава',
    mushroom: 'Гриб',
    crystal: 'Кристалл',
    decoration: 'Декорация',
  }

  const getRarityColor = (rarity: string) => {
    const colors: Record<string, string> = {
      common: 'text-gray-600 bg-gray-100',
      uncommon: 'text-green-600 bg-green-100',
      rare: 'text-blue-600 bg-blue-100',
      epic: 'text-purple-600 bg-purple-100',
      legendary: 'text-yellow-600 bg-yellow-100',
    }
    return colors[rarity] ?? 'text-gray-600 bg-gray-100'
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="border-b border-gray-200 p-4">
        <div className="flex items-center space-x-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            leftIcon={<ArrowLeft size={16} />}
          >
            Назад
          </Button>
          <h2 className="text-lg font-semibold text-gray-900">
            Детали растения
          </h2>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 space-y-6 overflow-y-auto p-4">
        {/* Element Display */}
        <Card padding="lg" className="text-center">
          <motion.div
            className="mb-4 flex justify-center"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{
              type: 'spring',
              stiffness: 300,
              damping: 20,
            }}
          >
            <div className="relative drop-shadow-lg">
              <PlantRenderer element={currentElement} size={120} />
            </div>
          </motion.div>

          <h3 className="mb-2 text-2xl font-bold text-gray-900">
            {currentElement.name}
          </h3>

          <p className="mb-4 text-gray-600">{currentElement.description}</p>

          <div className="flex justify-center space-x-2">
            <motion.span
              key={currentElement.rarity} // Принудительное пересоздание компонента при изменении редкости
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              className={`rounded-full px-2 py-1 text-xs font-medium ${getRarityColor(currentElement.rarity)} ${isUpgrading ? 'animate-pulse' : ''}`}
            >
              {rarityLabels[currentElement.rarity] ?? currentElement.rarity}
            </motion.span>
            <span className="rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600">
              {typeLabels[currentElement.type] ?? currentElement.type}
            </span>
          </div>
        </Card>

        {/* Element Info */}
        <div className="grid grid-cols-1 gap-4">
          {/* Unlock Date */}
          <Card padding="sm">
            <div className="flex items-center space-x-3">
              <div className="rounded-lg bg-blue-100 p-2">
                <Calendar size={16} className="text-blue-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">
                  Дата появления
                </p>
                <p className="text-xs text-gray-600">
                  {format(
                    currentElement.unlockDate instanceof Date
                      ? currentElement.unlockDate
                      : new Date(currentElement.unlockDate),
                    'dd MMMM yyyy',
                    { locale: ru }
                  )}
                </p>
                <p className="text-xs text-gray-500">
                  {formatDistanceToNow(
                    currentElement.unlockDate instanceof Date
                      ? currentElement.unlockDate
                      : new Date(currentElement.unlockDate),
                    { locale: ru, addSuffix: true }
                  )}
                </p>
              </div>
            </div>
          </Card>

          {/* Mood Influence */}
          <Card padding="sm">
            <div className="flex items-center space-x-3">
              <div
                className="rounded-lg p-2"
                style={{ backgroundColor: `${moodConfig.color}20` }}
              >
                <Heart size={16} style={{ color: moodConfig.color }} />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">Настроение</p>
                <p className="flex items-center space-x-1 text-xs text-gray-600">
                  <span>{moodConfig.emoji}</span>
                  <span>{moodConfig.label}</span>
                </p>
                <p className="text-xs text-gray-500">
                  {moodConfig.description}
                </p>
              </div>
            </div>
          </Card>

          {/* Seasonal Variant */}
          {currentElement.seasonalVariant != null && (
            <Card padding="sm">
              <div className="flex items-center space-x-3">
                <div className="rounded-lg bg-green-100 p-2">
                  <Star size={16} className="text-green-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">Сезон</p>
                  <p className="text-xs text-gray-600">
                    {seasonLabels[currentElement.seasonalVariant] ??
                      currentElement.seasonalVariant}
                  </p>
                </div>
              </div>
            </Card>
          )}

          {/* Position */}
          <Card padding="sm">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-gray-900">
                Позиция в саду
              </p>
              <p className="text-xs text-gray-600">
                ({currentElement.position.x}, {currentElement.position.y})
              </p>
            </div>
          </Card>
        </div>

        {/* Element Journey */}
        <Card padding="sm">
          <h4 className="mb-3 text-sm font-semibold text-gray-900">
            История элемента
          </h4>
          <div className="space-y-3 text-xs text-gray-600">
            <motion.div
              className="flex items-start space-x-2"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
            >
              <div className="mt-1.5 h-2 w-2 flex-shrink-0 rounded-full bg-green-400" />
              <div>
                <p className="font-medium">Растение выросло</p>
                <p className="text-gray-500">
                  {format(
                    currentElement.unlockDate instanceof Date
                      ? currentElement.unlockDate
                      : new Date(currentElement.unlockDate),
                    'dd MMM yyyy, HH:mm',
                    { locale: ru }
                  )}
                </p>
              </div>
            </motion.div>

            <motion.div
              className="flex items-start space-x-2"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div className="mt-1.5 h-2 w-2 flex-shrink-0 rounded-full bg-blue-400" />
              <div>
                <p className="font-medium">Настроение: {moodConfig.label}</p>
                <p className="text-gray-500">Влияние настроения на рост</p>
              </div>
            </motion.div>

            {currentElement.seasonalVariant != null && (
              <motion.div
                className="flex items-start space-x-2"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
              >
                <div className="mt-1.5 h-2 w-2 flex-shrink-0 rounded-full bg-purple-400" />
                <div>
                  <p className="font-medium">Сезонный вариант</p>
                  <p className="text-gray-500">
                    {seasonLabels[currentElement.seasonalVariant]}
                  </p>
                </div>
              </motion.div>
            )}
          </div>
        </Card>

        {/* Upgrade Button */}
        <div className="flex justify-center">
          <ElementUpgradeManager element={currentElement} />
        </div>

        {/* Care Tips */}
        <Card padding="sm" variant="glass">
          <h4 className="mb-2 text-sm font-semibold text-gray-900">
            💡 Знаете ли вы?
          </h4>
          <p className="text-xs text-gray-600">
            Каждое растение в вашем саду уникально и создается на основе вашего
            настроения в день его появления. Рост растений зависит от
            регулярности ведения дневника настроения.
          </p>
        </Card>
      </div>
    </div>
  )
}
