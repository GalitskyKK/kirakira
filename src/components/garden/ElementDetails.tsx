import { motion } from 'framer-motion'
import { formatDistanceToNow, format } from 'date-fns'
import { ru, enUS } from 'date-fns/locale'
import { ArrowLeft, Calendar, Heart, Star } from 'lucide-react'
import { Button, Card } from '@/components/ui'
import { MOOD_CONFIG } from '@/types/mood'
import { PlantRenderer } from '@/components/garden/plants'
import type { GardenElement, RarityLevel } from '@/types'
import { ElementUpgradeManager } from './ElementUpgradeManager'
import { SuccessUpgradeOverlay } from './SuccessUpgradeOverlay'
import { useGardenSync, useTelegramId } from '@/hooks/index.v2'
import { useScrollToTop } from '@/hooks/useScrollToTop'
import { useTranslation } from '@/hooks/useTranslation'
import { useLocaleStore } from '@/stores/localeStore'
import { getLocalizedMoodConfig } from '@/utils/moodLocalization'
import { useEffect, useState } from 'react'

interface ElementDetailsProps {
  element: GardenElement
  onBack: () => void
}

export function ElementDetails({ element, onBack }: ElementDetailsProps) {
  const [currentElement, setCurrentElement] = useState(element)
  const [isUpgrading, setIsUpgrading] = useState(false)
  // ✅ Состояние для успешного улучшения
  const [showSuccessOverlay, setShowSuccessOverlay] = useState(false)
  const [successData, setSuccessData] = useState<{
    newRarity: RarityLevel
    xpReward: number
  } | null>(null)

  const t = useTranslation()
  const locale = useLocaleStore(state => state.locale)
  const dateLocale = locale === 'en' ? enUS : ru

  // 🔑 Получаем telegramId через хук
  const telegramId = useTelegramId()

  // 📜 Управление скроллом - автоматически скроллим наверх при открытии
  const { containerRef, scrollToTop } = useScrollToTop({
    enabled: true,
    behavior: 'smooth',
    delay: 100, // Небольшая задержка для плавности
  })

  // ✅ ИСПРАВЛЕНИЕ: Включаем автоматическую синхронизацию с сервером
  const { data: gardenData } = useGardenSync(
    telegramId,
    telegramId !== null && telegramId !== undefined
  )

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
          // Скролл будет вызван из callback onUpgradeComplete
        }, 500) // Небольшая задержка для анимации
      }
    }
  }, [gardenData?.elements, element.id, currentElement.rarity])

  const moodConfig = getLocalizedMoodConfig(
    currentElement.moodInfluence in MOOD_CONFIG
      ? currentElement.moodInfluence
      : 'joy',
    t
  )

  const rarityLabels: Record<string, string> = {
    common: t.elements.rarity.common,
    uncommon: t.elements.rarity.uncommon,
    rare: t.elements.rarity.rare,
    epic: t.elements.rarity.epic,
    legendary: t.elements.rarity.legendary,
  }

  const seasonLabels: Record<string, string> = {
    spring: t.seasons.spring,
    summer: t.seasons.summer,
    autumn: t.seasons.autumn,
    winter: t.seasons.winter,
  }

  const typeLabels: Record<string, string> = {
    flower: t.elementTypes.flower,
    tree: t.elementTypes.tree,
    stone: t.elementTypes.stone,
    water: t.elementTypes.water,
    grass: t.elementTypes.grass,
    mushroom: t.elementTypes.mushroom,
    crystal: t.elementTypes.crystal,
    decoration: t.elementTypes.decoration,
    rainbow_flower: t.elementTypes.rainbowFlower,
    glowing_crystal: t.elementTypes.glowingCrystal,
    mystic_mushroom: t.elementTypes.mysticMushroom,
    aurora_tree: t.elementTypes.auroraTree,
    starlight_decoration: t.elementTypes.starlightDecoration,
  }

  const getRarityColor = (rarity: string) => {
    const colors: Record<string, string> = {
      common: 'text-gray-600 bg-gray-100 dark:text-gray-300 dark:bg-gray-700',
      uncommon:
        'text-green-600 bg-green-100 dark:text-green-300 dark:bg-green-900/30',
      rare: 'text-blue-600 bg-blue-100 dark:text-blue-300 dark:bg-blue-900/30',
      epic: 'text-purple-600 bg-purple-100 dark:text-purple-300 dark:bg-purple-900/30',
      legendary:
        'text-yellow-600 bg-yellow-100 dark:text-yellow-300 dark:bg-yellow-900/30',
    }
    return (
      colors[rarity] ??
      'text-gray-600 bg-gray-100 dark:text-gray-300 dark:bg-gray-700'
    )
  }

  return (
    <div className="relative flex h-full flex-col">
      {/* Header */}
      <div className="border-b border-gray-200 p-4">
        <div className="flex items-center space-x-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            leftIcon={<ArrowLeft size={16} />}
          ></Button>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {t.gardenStats.details}
          </h2>
        </div>
      </div>

      {/* Content - с ref для скролла */}
      <div ref={containerRef} className="flex-1 space-y-6 overflow-y-auto p-4">
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

          <h3 className="mb-2 text-2xl font-bold text-gray-900 dark:text-gray-100">
            {currentElement.name}
          </h3>

          <p className="mb-4 text-gray-600 dark:text-gray-300">
            {currentElement.description}
          </p>

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
            <span className="rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600 dark:bg-gray-700 dark:text-gray-300">
              {typeLabels[currentElement.type] ?? currentElement.type}
            </span>
          </div>
        </Card>

        {/* Upgrade Button */}
        <div className="flex justify-center">
          <ElementUpgradeManager
            element={currentElement}
            onUpgradeSuccess={(newRarity: RarityLevel, xpReward: number) => {
              // 🎉 Показываем оверлей успешного улучшения
              setSuccessData({ newRarity, xpReward })
              setShowSuccessOverlay(true)
              // Скроллим наверх после успешного улучшения
              scrollToTop()
            }}
          />
        </div>

        {/* Element Info */}
        <div className="grid grid-cols-1 gap-4">
          {/* Unlock Date */}
          <Card padding="sm">
            <div className="flex items-center space-x-3">
              <div className="rounded-lg bg-blue-100 p-2">
                <Calendar size={16} className="text-blue-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {t.gardenStats.unlockDate}
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  {format(
                    currentElement.unlockDate instanceof Date
                      ? currentElement.unlockDate
                      : new Date(currentElement.unlockDate),
                    'dd MMMM yyyy',
                    { locale: dateLocale }
                  )}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {formatDistanceToNow(
                    currentElement.unlockDate instanceof Date
                      ? currentElement.unlockDate
                      : new Date(currentElement.unlockDate),
                    { locale: dateLocale, addSuffix: true }
                  )}
                </p>
              </div>
            </div>
          </Card>

          {/* Mood Influence b */}
          <Card padding="sm">
            <div className="flex items-center space-x-3">
              <div
                className="rounded-lg p-2"
                style={{ backgroundColor: `${moodConfig.color}20` }}
              >
                <Heart size={16} style={{ color: moodConfig.color }} />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {t.gardenStats.mood}
                </p>
                <p className="flex items-center space-x-1 text-xs text-gray-600 dark:text-gray-400">
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
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {t.gardenStats.season}
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
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
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                {t.gardenStats.position}
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                ({currentElement.position.x}, {currentElement.position.y})
              </p>
            </div>
          </Card>
        </div>

        {/* Element Journey */}
        <Card padding="sm">
          <h4 className="mb-3 text-sm font-semibold text-gray-900 dark:text-gray-100">
            {t.gardenStats.history}
          </h4>
          <div className="space-y-3 text-xs text-gray-600 dark:text-gray-400">
            <motion.div
              className="flex items-start space-x-2"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
            >
              <div className="mt-1.5 h-2 w-2 flex-shrink-0 rounded-full bg-green-400" />
              <div>
                <p className="font-medium">{t.gardenStats.plantGrew}</p>
                <p className="text-gray-500">
                  {format(
                    currentElement.unlockDate instanceof Date
                      ? currentElement.unlockDate
                      : new Date(currentElement.unlockDate),
                    'dd MMM yyyy, HH:mm',
                    { locale: dateLocale }
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
                <p className="font-medium">
                  {t.gardenStats.mood}: {moodConfig.label}
                </p>
                <p className="text-gray-500">{t.gardenStats.moodInfluence}</p>
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
                  <p className="font-medium">{t.gardenStats.seasonalVariant}</p>
                  <p className="text-gray-500">
                    {seasonLabels[currentElement.seasonalVariant]}
                  </p>
                </div>
              </motion.div>
            )}
          </div>
        </Card>

        {/* Care Tips */}
        <Card padding="sm" variant="glass">
          <h4 className="mb-2 text-sm font-semibold text-gray-900 dark:text-gray-100">
            {t.gardenStats.didYouKnow}
          </h4>
          <p className="text-xs text-gray-600 dark:text-gray-400">
            {t.gardenStats.careTip}
          </p>
        </Card>
      </div>

      {/* Оверлей успешного улучшения */}
      {showSuccessOverlay && successData && (
        <SuccessUpgradeOverlay
          isVisible={showSuccessOverlay}
          newRarity={successData.newRarity}
          xpReward={successData.xpReward}
          elementEmoji={currentElement.emoji}
          onComplete={() => {
            setShowSuccessOverlay(false)
            setSuccessData(null)
            // Скроллим наверх перед возвратом в сад
            scrollToTop()
            // Возвращаемся в сад
            onBack()
          }}
        />
      )}
    </div>
  )
}
