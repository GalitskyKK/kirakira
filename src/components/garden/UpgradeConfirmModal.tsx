/**
 * ✅ КОМПОНЕНТ: UpgradeConfirmModal
 * Модальное окно подтверждения улучшения элемента
 */

import { motion, AnimatePresence } from 'framer-motion'
import { createPortal } from 'react-dom'
import {
  type GardenElement,
  RarityLevel,
  getNextRarity,
  UPGRADE_COSTS,
  UPGRADE_SUCCESS_RATES,
} from '@/types/garden'
import { X, TrendingUp, Sparkles, AlertCircle } from 'lucide-react'
import { useTranslation } from '@/hooks/useTranslation'

interface UpgradeConfirmModalProps {
  readonly isOpen: boolean
  readonly onClose: () => void
  readonly onConfirm: (useFree: boolean) => void
  readonly element: GardenElement
  readonly progressBonus?: number
  readonly failedAttempts?: number
  readonly hasFreeUpgrades: boolean
  readonly currentSprouts: number
  readonly isLoading?: boolean
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
  isLoading = false,
}: UpgradeConfirmModalProps) {
  const t = useTranslation()
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
        return 'text-gray-600 dark:text-gray-400'
      case 'uncommon':
        return 'text-green-600'
      case 'rare':
        return 'text-blue-600'
      case 'epic':
        return 'text-purple-600'
      case 'legendary':
        return 'text-yellow-600'
      default:
        return 'text-gray-600 dark:text-gray-400'
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
    return t.rarityLabels[rarity] ?? t.rarityLabels.common
  }

  if (!isOpen) return null
  if (typeof window === 'undefined') return null

  return createPortal(
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
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative z-10 max-h-[85vh] w-full max-w-sm overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-gray-800"
        >
          {/* Header */}
          <div className="relative bg-gradient-to-r from-purple-500 to-indigo-600 p-4 text-white">
            <button
              onClick={onClose}
              className="absolute right-3 top-3 rounded-full p-1 transition-colors hover:bg-white/20"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="flex items-center gap-2">
              <TrendingUp className="h-6 w-6" />
              <div>
                <h2 className="text-lg font-bold">
                  {t.gardenActions.upgradeElement}
                </h2>
                <p className="text-xs opacity-90">{element.name}</p>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="max-h-[calc(85vh-80px)] space-y-4 overflow-y-auto p-4">
            {/* Элемент */}
            <div className="text-center">
              <div className="flex items-center justify-center gap-2">
                {/* Текущая редкость */}
                <div
                  className={`rounded-lg p-2 ${getRarityBgColor(element.rarity)}`}
                >
                  <div className="text-2xl">{element.emoji}</div>
                  <div
                    className={`text-xs font-bold ${getRarityColor(element.rarity)}`}
                  >
                    {getRarityLabel(element.rarity)}
                  </div>
                </div>

                {/* Стрелка */}
                <TrendingUp className="h-5 w-5 text-gray-400" />

                {/* Целевая редкость */}
                <div
                  className={`rounded-lg p-2 ${getRarityBgColor(nextRarity)}`}
                >
                  <div className="text-2xl">{element.emoji}</div>
                  <div
                    className={`text-xs font-bold ${getRarityColor(nextRarity)}`}
                  >
                    {getRarityLabel(nextRarity)}
                  </div>
                </div>
              </div>
            </div>

            {/* Шанс успеха */}
            <div className="rounded-lg bg-gray-100 p-3 dark:bg-gray-700">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-medium text-gray-600 dark:text-gray-300">
                  {t.gardenActions.successRate}
                </span>
                <span className="text-xl font-bold text-purple-600 dark:text-purple-400">
                  {totalSuccessRate}%
                </span>
              </div>

              {/* Прогресс бар */}
              <div className="relative h-2 overflow-hidden rounded-full bg-gray-300 dark:bg-gray-600">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${totalSuccessRate}%` }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                  className={`h-full ${totalSuccessRate >= 100 ? 'bg-gradient-to-r from-green-500 to-emerald-500' : 'bg-gradient-to-r from-purple-500 to-indigo-500'}`}
                />
              </div>

              {progressBonus > 0 && (
                <div className="mt-1 text-right text-xs font-bold text-green-600 dark:text-green-400">
                  {t.gardenActions.bonus} +{progressBonus}%
                </div>
              )}
            </div>

            {/* Неудачные попытки (если есть) */}
            {failedAttempts > 0 && (
              <div className="rounded-lg bg-orange-100 p-2 dark:bg-orange-900/30">
                <div className="flex items-center gap-2 text-xs text-orange-700 dark:text-orange-300">
                  <AlertCircle className="h-3 w-3" />
                  <span>
                    {t.gardenActions.attempts} {failedAttempts}
                    {failedAttempts >= 3 && ` ${t.gardenActions.soonSuccess}`}
                  </span>
                </div>
              </div>
            )}

            {/* Стоимость */}
            <div className="rounded-lg border-2 border-dashed border-gray-300 p-3 dark:border-gray-600">
              {hasFreeUpgrades && canAffordSprouts ? (
                <div className="text-center">
                  <div className="mb-2 text-sm text-gray-600 dark:text-gray-400">
                    {t.gardenActions.chooseUpgradeMethod}
                  </div>
                  <div className="flex justify-center gap-4">
                    <div className="flex items-center gap-1 text-lg font-bold text-purple-600 dark:text-purple-400">
                      <Sparkles className="h-5 w-5" />
                      <span>{t.themes.free}</span>
                    </div>
                    <div className="text-gray-400">{t.gardenActions.or}</div>
                    <div className="flex items-center gap-1 text-lg font-bold text-green-600 dark:text-green-400">
                      <span>{cost}🌿</span>
                    </div>
                  </div>
                </div>
              ) : hasFreeUpgrades ? (
                <div className="flex items-center justify-center gap-2 text-lg font-bold text-purple-600 dark:text-purple-400">
                  <Sparkles className="h-5 w-5" />
                  <span>{t.themes.free}</span>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2 text-lg font-bold">
                  <span className="text-green-600 dark:text-green-400">
                    {cost}🌿
                  </span>
                </div>
              )}

              {!hasFreeUpgrades && !canAffordSprouts && (
                <div className="mt-2 text-center text-xs text-red-600 dark:text-red-400">
                  {t.gardenActions.insufficientSprouts} {currentSprouts}🌿)
                </div>
              )}
            </div>

            {/* Предупреждение о legendary */}
            {nextRarity === RarityLevel.LEGENDARY && hasFreeUpgrades && (
              <div className="rounded-lg bg-yellow-100 p-2 text-xs text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300">
                <div className="flex items-start gap-2">
                  <AlertCircle className="mt-0.5 h-3 w-3 flex-shrink-0" />
                  <p>{t.gardenActions.legendaryWarning}</p>
                </div>
              </div>
            )}

            {/* Кнопки действий */}
            <div className="space-y-2">
              {/* Кнопки выбора способа улучшения */}
              {hasFreeUpgrades && canAffordSprouts && (
                <div className="flex gap-2">
                  <button
                    onClick={() => onConfirm(true)}
                    disabled={isLoading}
                    className="flex-1 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-600 px-3 py-2 text-sm font-bold text-white transition-all hover:from-purple-600 hover:to-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isLoading
                      ? t.gardenActions.upgrading
                      : `✨ ${t.themes.free}`}
                  </button>
                  <button
                    onClick={() => onConfirm(false)}
                    disabled={isLoading}
                    className="flex-1 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 px-3 py-2 text-sm font-bold text-white transition-all hover:from-green-600 hover:to-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isLoading ? t.gardenActions.upgrading : `🌿 ${cost}`}
                  </button>
                </div>
              )}

              {/* Обычная кнопка улучшения */}
              {(!hasFreeUpgrades || !canAffordSprouts) && (
                <button
                  onClick={() => onConfirm(hasFreeUpgrades)}
                  disabled={!canUpgrade || isLoading}
                  className={`
                    w-full rounded-xl px-3 py-2 text-sm font-bold text-white transition-all
                    ${
                      canUpgrade
                        ? 'bg-purple-600 hover:bg-purple-700 dark:bg-purple-500 dark:hover:bg-purple-600'
                        : 'cursor-not-allowed bg-gray-400 opacity-50'
                    }
                  `}
                >
                  {isLoading
                    ? t.gardenActions.upgrading
                    : hasFreeUpgrades
                      ? `✨ ${t.gardenActions.upgrade}`
                      : t.gardenActions.upgrade}
                </button>
              )}

              {/* Кнопка отмены */}
              <button
                onClick={onClose}
                className="w-full rounded-xl border-2 border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                {t.common.cancel}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  )
}
