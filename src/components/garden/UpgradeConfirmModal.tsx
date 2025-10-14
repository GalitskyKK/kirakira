/**
 * ✅ КОМПОНЕНТ: UpgradeConfirmModal
 * Модальное окно подтверждения улучшения элемента
 */

import { motion, AnimatePresence } from 'framer-motion'
import {
  type GardenElement,
  RarityLevel,
  getNextRarity,
  UPGRADE_COSTS,
  UPGRADE_SUCCESS_RATES,
} from '@/types/garden'
import { X, TrendingUp, Sparkles, AlertCircle } from 'lucide-react'

interface UpgradeConfirmModalProps {
  readonly isOpen: boolean
  readonly onClose: () => void
  readonly onConfirm: (useFree: boolean) => void
  readonly element: GardenElement
  readonly progressBonus?: number
  readonly failedAttempts?: number
  readonly hasFreeUpgrades: boolean
  readonly currentSprouts: number
}

export function UpgradeConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  element,
  progressBonus = 0,
  failedAttempts = 0,
  hasFreeUpgrades,
  currentSprouts,
}: UpgradeConfirmModalProps) {
  if (!isOpen) return null

  const nextRarity = getNextRarity(element.rarity)
  if (nextRarity === null) {
    return null
  }

  const cost = UPGRADE_COSTS[element.rarity]
  const baseSuccessRate = UPGRADE_SUCCESS_RATES[element.rarity]
  const totalSuccessRate = Math.min(baseSuccessRate + progressBonus, 100)
  const canAffordSprouts = currentSprouts >= cost
  const canUpgrade = hasFreeUpgrades || canAffordSprouts

  // Определяем цвет по редкости
  const getRarityColor = (rarity: RarityLevel): string => {
    switch (rarity) {
      case 'common':
        return 'text-gray-600'
      case 'uncommon':
        return 'text-green-600'
      case 'rare':
        return 'text-blue-600'
      case 'epic':
        return 'text-purple-600'
      case 'legendary':
        return 'text-yellow-600'
      default:
        return 'text-gray-600'
    }
  }

  const getRarityBgColor = (rarity: RarityLevel): string => {
    switch (rarity) {
      case 'common':
        return 'bg-gray-100 dark:bg-gray-800'
      case 'uncommon':
        return 'bg-green-100 dark:bg-green-900/30'
      case 'rare':
        return 'bg-blue-100 dark:bg-blue-900/30'
      case 'epic':
        return 'bg-purple-100 dark:bg-purple-900/30'
      case 'legendary':
        return 'bg-gradient-to-r from-yellow-100 to-orange-100 dark:from-yellow-900/30 dark:to-orange-900/30'
      default:
        return 'bg-gray-100 dark:bg-gray-800'
    }
  }

  const getRarityLabel = (rarity: RarityLevel): string => {
    switch (rarity) {
      case 'common':
        return 'Обычный'
      case 'uncommon':
        return 'Необычный'
      case 'rare':
        return 'Редкий'
      case 'epic':
        return 'Эпический'
      case 'legendary':
        return 'Легендарный'
      default:
        return 'Обычный'
    }
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        />

        {/* Modal */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative z-10 w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-gray-800"
        >
          {/* Header */}
          <div className="relative bg-gradient-to-r from-purple-500 to-indigo-600 p-6 text-white">
            <button
              onClick={onClose}
              className="absolute right-4 top-4 rounded-full p-1 transition-colors hover:bg-white/20"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-3">
              <TrendingUp className="h-8 w-8" />
              <div>
                <h2 className="text-2xl font-bold">Улучшить элемент</h2>
                <p className="text-sm opacity-90">{element.name}</p>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="space-y-6 p-6">
            {/* Элемент */}
            <div className="text-center">
              <div className="mb-4 flex items-center justify-center gap-4">
                {/* Текущая редкость */}
                <div
                  className={`rounded-xl p-4 ${getRarityBgColor(element.rarity)}`}
                >
                  <div className="mb-2 text-4xl">{element.emoji}</div>
                  <div
                    className={`text-sm font-bold ${getRarityColor(element.rarity)}`}
                  >
                    {getRarityLabel(element.rarity)}
                  </div>
                </div>

                {/* Стрелка */}
                <TrendingUp className="h-8 w-8 text-gray-400" />

                {/* Целевая редкость */}
                <div
                  className={`rounded-xl p-4 ${getRarityBgColor(nextRarity)}`}
                >
                  <div className="mb-2 text-4xl">{element.emoji}</div>
                  <div
                    className={`text-sm font-bold ${getRarityColor(nextRarity)}`}
                  >
                    {getRarityLabel(nextRarity)}
                  </div>
                </div>
              </div>
            </div>

            {/* Шанс успеха */}
            <div className="rounded-lg bg-gray-100 p-4 dark:bg-gray-700">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                  Шанс успеха
                </span>
                <span className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  {totalSuccessRate}%
                </span>
              </div>

              {/* Прогресс бар */}
              <div className="relative h-3 overflow-hidden rounded-full bg-gray-300 dark:bg-gray-600">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${totalSuccessRate}%` }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                  className={`h-full ${totalSuccessRate >= 100 ? 'bg-gradient-to-r from-green-500 to-emerald-500' : 'bg-gradient-to-r from-purple-500 to-indigo-500'}`}
                />
              </div>

              {/* Детали */}
              <div className="mt-2 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                <span>Базовый шанс: {baseSuccessRate}%</span>
                {progressBonus > 0 && (
                  <span className="font-bold text-green-600 dark:text-green-400">
                    Бонус: +{progressBonus}%
                  </span>
                )}
              </div>
            </div>

            {/* Неудачные попытки (если есть) */}
            {failedAttempts > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-lg bg-orange-100 p-3 dark:bg-orange-900/30"
              >
                <div className="flex items-center gap-2 text-sm text-orange-700 dark:text-orange-300">
                  <AlertCircle className="h-4 w-4" />
                  <span>
                    Неудачных попыток: {failedAttempts}
                    {failedAttempts >= 3 && ' (скоро гарантия!)'}
                  </span>
                </div>
              </motion.div>
            )}

            {/* Стоимость */}
            <div className="rounded-lg border-2 border-dashed border-gray-300 p-4 dark:border-gray-600">
              <div className="mb-2 text-center text-sm font-medium text-gray-600 dark:text-gray-300">
                Стоимость улучшения
              </div>

              {hasFreeUpgrades ? (
                <div className="flex items-center justify-center gap-2 text-2xl font-bold text-purple-600 dark:text-purple-400">
                  <Sparkles className="h-6 w-6" />
                  <span>Бесплатно</span>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2 text-2xl font-bold">
                  <span className="text-green-600 dark:text-green-400">
                    {cost}🌿
                  </span>
                </div>
              )}

              {!hasFreeUpgrades && !canAffordSprouts && (
                <div className="mt-2 text-center text-xs text-red-600 dark:text-red-400">
                  Недостаточно ростков (у вас: {currentSprouts}🌿)
                </div>
              )}
            </div>

            {/* Кнопки действий */}
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 rounded-lg border-2 border-gray-300 px-4 py-3 font-medium text-gray-700 transition-colors hover:bg-gray-100 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                Отмена
              </button>

              <motion.button
                whileHover={{ scale: canUpgrade ? 1.02 : 1 }}
                whileTap={{ scale: canUpgrade ? 0.98 : 1 }}
                onClick={() => onConfirm(hasFreeUpgrades)}
                disabled={!canUpgrade}
                className={`
                  flex-1 rounded-lg px-4 py-3 font-bold text-white shadow-lg transition-all
                  ${
                    canUpgrade
                      ? `bg-gradient-to-r ${getRarityColor(nextRarity)} hover:shadow-xl`
                      : 'cursor-not-allowed bg-gray-400 opacity-50'
                  }
                `}
              >
                {hasFreeUpgrades ? (
                  <span className="flex items-center justify-center gap-2">
                    <Sparkles className="h-5 w-5" />
                    Улучшить бесплатно
                  </span>
                ) : (
                  'Улучшить'
                )}
              </motion.button>
            </div>

            {/* Предупреждение о legendary */}
            {nextRarity === RarityLevel.LEGENDARY && hasFreeUpgrades && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="rounded-lg bg-yellow-100 p-3 text-xs text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300"
              >
                <div className="flex items-start gap-2">
                  <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                  <p>
                    <strong>Внимание:</strong> Улучшение до Легендарного всегда
                    с шансом, даже при использовании бесплатного улучшения.
                  </p>
                </div>
              </motion.div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
