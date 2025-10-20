/**
 * 🎨 КОМПОНЕНТ: Магазин тем сада
 * Показывает доступные темы и позволяет их покупать
 */

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Check, Lock, Leaf } from 'lucide-react'
import { useGardenTheme } from '@/hooks/useGardenTheme'
import { useCurrencyStore } from '@/stores/currencyStore'
import { useUserStore } from '@/stores/userStore'
import { Button, Card } from '@/components/ui'

interface ThemeShopProps {
  readonly isOpen: boolean
  readonly onClose: () => void
}

export function ThemeShop({ isOpen, onClose }: ThemeShopProps) {
  const {
    themes,
    ownedThemeIds,
    canUseTheme,
    setGardenTheme,
    isLoadingThemes,
  } = useGardenTheme()
  const { userCurrency, spendCurrency } = useCurrencyStore()
  const currentUser = useUserStore(s => s.currentUser)

  const [purchasingTheme, setPurchasingTheme] = useState<string | null>(null)

  const handleBuyTheme = async (themeId: string) => {
    if (!currentUser?.telegramId) return

    setPurchasingTheme(themeId)

    try {
      const result = await spendCurrency(
        currentUser.telegramId,
        'sprouts',
        themes.find(t => t.id === themeId)?.priceSprouts || 0,
        'buy_theme',
        `Покупка темы "${themes.find(t => t.id === themeId)?.name}"`,
        { themeId, themeName: themes.find(t => t.id === themeId)?.name }
      )

      if (result.success) {
        // Обновляем список купленных тем
        window.location.reload() // Простое решение для обновления
      }
    } catch (error) {
      console.error('Failed to buy theme:', error)
    } finally {
      setPurchasingTheme(null)
    }
  }

  const handleSelectTheme = (themeId: string) => {
    if (canUseTheme(themeId)) {
      setGardenTheme(themeId)
    }
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="max-h-[90vh] w-full max-w-4xl overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-gray-900"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-200 p-6 dark:border-gray-700">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                🎨 Магазин тем
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Персонализируйте свой сад
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Content */}
          <div className="max-h-[calc(90vh-120px)] overflow-y-auto p-6">
            {isLoadingThemes ? (
              <div className="flex items-center justify-center py-12">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600" />
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {themes.map(theme => {
                  const isOwned = ownedThemeIds.includes(theme.id)
                  const canBuy = canUseTheme(theme.id)
                  const isPurchasing = purchasingTheme === theme.id
                  const isSelected = false // TODO: Add selected state

                  return (
                    <motion.div
                      key={theme.id}
                      className="relative"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Card
                        className={`cursor-pointer overflow-hidden transition-all ${
                          isSelected
                            ? 'ring-2 ring-blue-500'
                            : 'hover:shadow-lg'
                        } ${!canBuy ? 'opacity-60' : ''}`}
                        onClick={() => handleSelectTheme(theme.id)}
                      >
                        {/* Theme Preview */}
                        <div
                          className="h-32 w-full"
                          style={{ background: theme.containerBackground }}
                        >
                          {/* Shelf Preview */}
                          <div className="flex h-full items-end justify-center pb-4">
                            <div
                              className="h-8 w-24 rounded-lg shadow-lg"
                              style={{
                                background: theme.shelfSurface,
                                borderRadius: theme.shelfRadius,
                                boxShadow: theme.shelfShadow,
                              }}
                            />
                          </div>

                          {/* Particles */}
                          {Array.from({ length: 3 }, (_, i) => (
                            <div
                              key={i}
                              className="absolute h-1 w-1 rounded-full opacity-60"
                              style={{
                                left: `${20 + i * 30}%`,
                                top: `${20 + i * 10}%`,
                                background: `linear-gradient(90deg, ${theme.particleFrom}, ${theme.particleTo})`,
                              }}
                            />
                          ))}
                        </div>

                        {/* Theme Info */}
                        <div className="p-4">
                          <div className="flex items-center justify-between">
                            <h3 className="font-semibold text-gray-900 dark:text-white">
                              {theme.name}
                            </h3>
                            {isOwned && (
                              <Check className="h-5 w-5 text-green-500" />
                            )}
                          </div>

                          <div className="mt-2 flex items-center justify-between">
                            <div className="flex items-center gap-1">
                              <Leaf className="h-4 w-4 text-green-500" />
                              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                {theme.priceSprouts === 0
                                  ? 'Бесплатно'
                                  : theme.priceSprouts}
                              </span>
                            </div>

                            {!canBuy && !isOwned && (
                              <Lock className="h-4 w-4 text-gray-400" />
                            )}
                          </div>

                          {/* Action Button */}
                          <div className="mt-3">
                            {isOwned ? (
                              <Button
                                variant="outline"
                                size="sm"
                                className="w-full"
                                onClick={e => {
                                  e.stopPropagation()
                                  handleSelectTheme(theme.id)
                                }}
                              >
                                Выбрать
                              </Button>
                            ) : canBuy ? (
                              <Button
                                size="sm"
                                className="w-full"
                                disabled={isPurchasing}
                                onClick={e => {
                                  e.stopPropagation()
                                  handleBuyTheme(theme.id)
                                }}
                              >
                                {isPurchasing ? (
                                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                ) : (
                                  `Купить за ${theme.priceSprouts}`
                                )}
                              </Button>
                            ) : (
                              <Button
                                variant="outline"
                                size="sm"
                                className="w-full"
                                disabled
                              >
                                Недоступно
                              </Button>
                            )}
                          </div>
                        </div>
                      </Card>
                    </motion.div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-gray-200 p-6 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Leaf className="h-5 w-5 text-green-500" />
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Ваш баланс: {userCurrency?.sprouts || 0} ростков
                </span>
              </div>
              <Button variant="outline" onClick={onClose}>
                Закрыть
              </Button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
