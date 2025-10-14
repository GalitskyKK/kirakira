/**
 * ⬆️ КОМПОНЕНТ: ElementUpgradeButton
 * Кнопка для улучшения элемента сада
 */

import { motion } from 'framer-motion'
import {
  type GardenElement,
  canUpgradeElement,
  getNextRarity,
  UPGRADE_COSTS,
  UPGRADE_SUCCESS_RATES,
  RarityLevel,
} from '@/types/garden'
import { useCurrencyStore } from '@/stores'
import { useUserStore } from '@/stores'
import { TrendingUp, Sparkles } from 'lucide-react'

interface ElementUpgradeButtonProps {
  readonly element: GardenElement
  readonly progressBonus?: number
  readonly onUpgrade: () => void
  readonly disabled?: boolean
}

export function ElementUpgradeButton({
  element,
  progressBonus = 0,
  onUpgrade,
  disabled = false,
}: ElementUpgradeButtonProps) {
  const { userCurrency } = useCurrencyStore()
  const { currentUser } = useUserStore()

  // Проверяем, можно ли улучшить элемент
  if (!canUpgradeElement(element)) {
    return null
  }

  const nextRarity = getNextRarity(element.rarity)
  if (nextRarity === null) {
    return null
  }

  const cost = UPGRADE_COSTS[element.rarity]
  const baseSuccessRate = UPGRADE_SUCCESS_RATES[element.rarity]
  const totalSuccessRate = Math.min(baseSuccessRate + progressBonus, 100)
  const hasFreeUpgrades = (currentUser?.stats?.freeUpgrades ?? 0) > 0
  const canAffordSprouts = (userCurrency?.sprouts ?? 0) >= cost

  // Проверяем возможность улучшения
  const canUpgrade = hasFreeUpgrades || canAffordSprouts
  const isDisabled = disabled || !canUpgrade

  // Определяем цвет кнопки по редкости
  const getRarityColor = (rarity: RarityLevel): string => {
    switch (rarity) {
      case RarityLevel.UNCOMMON:
        return 'from-green-500 to-green-600'
      case RarityLevel.RARE:
        return 'from-blue-500 to-blue-600'
      case RarityLevel.EPIC:
        return 'from-purple-500 to-purple-600'
      case RarityLevel.LEGENDARY:
        return 'from-yellow-500 to-orange-500'
      default:
        return 'from-gray-500 to-gray-600'
    }
  }

  return (
    <motion.button
      whileHover={{ scale: isDisabled ? 1 : 1.05 }}
      whileTap={{ scale: isDisabled ? 1 : 0.95 }}
      onClick={onUpgrade}
      disabled={isDisabled}
      className={`
        flex items-center gap-2 rounded-lg px-4 py-2 font-medium text-white shadow-lg
        transition-all duration-200
        ${isDisabled ? 'cursor-not-allowed bg-gray-400 opacity-50' : `bg-gradient-to-r ${getRarityColor(nextRarity)} hover:shadow-xl`}
      `}
    >
      {/* Иконка */}
      {hasFreeUpgrades ? (
        <Sparkles className="h-5 w-5" />
      ) : (
        <TrendingUp className="h-5 w-5" />
      )}

      {/* Текст */}
      <div className="flex flex-col items-start">
        <span className="text-sm font-bold">
          {hasFreeUpgrades ? 'Бесплатно' : `${cost}🌿`}
        </span>
        <span className="text-xs opacity-90">{totalSuccessRate}% успех</span>
      </div>

      {/* Прогресс бонус (если есть неудачные попытки) */}
      {progressBonus > 0 && (
        <div className="ml-1 rounded bg-white/20 px-2 py-0.5 text-xs font-bold">
          +{progressBonus}%
        </div>
      )}
    </motion.button>
  )
}
