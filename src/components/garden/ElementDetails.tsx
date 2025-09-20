import { motion } from 'framer-motion'
import { formatDistanceToNow, format } from 'date-fns'
import { ru } from 'date-fns/locale'
import { ArrowLeft, Calendar, Heart, Star } from 'lucide-react'
import { Button, Card } from '@/components/ui'
import { MOOD_CONFIG } from '@/types/mood'
import type { GardenElement } from '@/types'

interface ElementDetailsProps {
  element: GardenElement
  onBack: () => void
}

export function ElementDetails({ element, onBack }: ElementDetailsProps) {
  const moodConfig = MOOD_CONFIG[element.moodInfluence]
  
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
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
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
      <div className="flex-1 p-4 space-y-6 overflow-y-auto">
        {/* Element Display */}
        <Card padding="lg" className="text-center">
          <motion.div
            className="text-8xl mb-4"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{
              type: 'spring',
              stiffness: 300,
              damping: 20,
            }}
          >
            {element.emoji}
          </motion.div>
          
          <h3 className="text-2xl font-bold text-gray-900 mb-2">
            {element.name}
          </h3>
          
          <p className="text-gray-600 mb-4">
            {element.description}
          </p>

          <div className="flex justify-center space-x-2">
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRarityColor(element.rarity)}`}>
              {rarityLabels[element.rarity] ?? element.rarity}
            </span>
            <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
              {typeLabels[element.type] ?? element.type}
            </span>
          </div>
        </Card>

        {/* Element Info */}
        <div className="grid grid-cols-1 gap-4">
          {/* Unlock Date */}
          <Card padding="sm">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-lg bg-blue-100">
                <Calendar size={16} className="text-blue-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">
                  Дата появления
                </p>
                <p className="text-xs text-gray-600">
                  {format(element.unlockDate, 'dd MMMM yyyy', { locale: ru })}
                </p>
                <p className="text-xs text-gray-500">
                  {formatDistanceToNow(element.unlockDate, { 
                    locale: ru, 
                    addSuffix: true 
                  })}
                </p>
              </div>
            </div>
          </Card>

          {/* Mood Influence */}
          <Card padding="sm">
            <div className="flex items-center space-x-3">
              <div 
                className="p-2 rounded-lg"
                style={{ backgroundColor: `${moodConfig.color}20` }}
              >
                <Heart size={16} style={{ color: moodConfig.color }} />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">
                  Настроение
                </p>
                <p className="text-xs text-gray-600 flex items-center space-x-1">
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
          {element.seasonalVariant && (
            <Card padding="sm">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-lg bg-green-100">
                  <Star size={16} className="text-green-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">
                    Сезон
                  </p>
                  <p className="text-xs text-gray-600">
                    {seasonLabels[element.seasonalVariant] ?? element.seasonalVariant}
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
                ({element.position.x}, {element.position.y})
              </p>
            </div>
          </Card>
        </div>

        {/* Element Journey */}
        <Card padding="sm">
          <h4 className="text-sm font-semibold text-gray-900 mb-3">
            История элемента
          </h4>
          <div className="space-y-3 text-xs text-gray-600">
            <motion.div
              className="flex items-start space-x-2"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
            >
              <div className="w-2 h-2 rounded-full bg-green-400 mt-1.5 flex-shrink-0" />
              <div>
                <p className="font-medium">Растение выросло</p>
                <p className="text-gray-500">
                  {format(element.unlockDate, 'dd MMM yyyy, HH:mm', { locale: ru })}
                </p>
              </div>
            </motion.div>
            
            <motion.div
              className="flex items-start space-x-2"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div className="w-2 h-2 rounded-full bg-blue-400 mt-1.5 flex-shrink-0" />
              <div>
                <p className="font-medium">
                  Настроение: {moodConfig.label}
                </p>
                <p className="text-gray-500">
                  Влияние настроения на рост
                </p>
              </div>
            </motion.div>

            {element.seasonalVariant && (
              <motion.div
                className="flex items-start space-x-2"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
              >
                <div className="w-2 h-2 rounded-full bg-purple-400 mt-1.5 flex-shrink-0" />
                <div>
                  <p className="font-medium">
                    Сезонный вариант
                  </p>
                  <p className="text-gray-500">
                    {seasonLabels[element.seasonalVariant]}
                  </p>
                </div>
              </motion.div>
            )}
          </div>
        </Card>

        {/* Care Tips */}
        <Card padding="sm" variant="glass">
          <h4 className="text-sm font-semibold text-gray-900 mb-2">
            💡 Знаете ли вы?
          </h4>
          <p className="text-xs text-gray-600">
            Каждое растение в вашем саду уникально и создается на основе вашего 
            настроения в день его появления. Рост растений зависит от регулярности 
            ведения дневника настроения.
          </p>
        </Card>
      </div>
    </div>
  )
}
