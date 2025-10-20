/**
 * 🎨 КОМПОНЕНТ: Магазин тем сада
 * Показывает доступные темы и позволяет их покупать
 */

import { useState, useEffect } from 'react'
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
    refetchOwnedThemes,
  } = useGardenTheme()
  const { userCurrency, spendCurrency } = useCurrencyStore()
  const currentUser = useUserStore(s => s.currentUser)

  const [purchasingTheme, setPurchasingTheme] = useState<string | null>(null)

  // Блокируем скролл при открытии модалки
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
      document.body.style.paddingRight = '0px'

      // Блокируем скролл только для body, не для модалки
      const preventBodyScroll = (e: Event) => {
        // Проверяем, что событие не из модалки
        const target = e.target as Element
        const modal = document.querySelector('[data-modal="theme-shop"]')
        if (modal && modal.contains(target)) {
          return // Позволяем скролл внутри модалки
        }
        e.preventDefault()
      }

      document.addEventListener('wheel', preventBodyScroll, { passive: false })
      document.addEventListener('touchmove', preventBodyScroll, {
        passive: false,
      })

      return () => {
        document.body.style.overflow = 'unset'
        document.body.style.paddingRight = '0px'
        document.removeEventListener('wheel', preventBodyScroll)
        document.removeEventListener('touchmove', preventBodyScroll)
      }
    } else {
      document.body.style.overflow = 'unset'
      document.body.style.paddingRight = '0px'
      return undefined
    }
  }, [isOpen])

  const handleBuyTheme = async (themeId: string) => {
    console.log('🛒 handleBuyTheme called with themeId:', themeId)
    console.log('👤 currentUser:', currentUser)
    console.log('💰 userCurrency:', userCurrency)

    if (!currentUser?.telegramId) {
      console.error('❌ No currentUser.telegramId')
      return
    }

    setPurchasingTheme(themeId)
    console.log('⏳ Set purchasing theme:', themeId)

    try {
      const theme = themes.find(t => t.id === themeId)
      console.log('🎨 Found theme:', theme)
      if (!theme) {
        console.error('❌ Theme not found')
        return
      }

      console.log('💸 Calling spendCurrency with:', {
        telegramId: currentUser.telegramId,
        currency: 'sprouts',
        amount: theme.priceSprouts,
        reason: 'buy_theme',
        description: `Покупка темы "${theme.name}"`,
        metadata: { themeId, themeName: theme.name },
      })

      const result = await spendCurrency(
        currentUser.telegramId,
        'sprouts',
        theme.priceSprouts,
        'buy_theme',
        `Покупка темы "${theme.name}"`,
        { themeId, themeName: theme.name }
      )

      console.log('📊 spendCurrency result:', result)

      if (result.success) {
        // Обновляем список купленных тем
        console.log('🔄 Refetching owned themes...')
        await refetchOwnedThemes()
        console.log('✅ Theme purchased successfully!')
        // Можно добавить toast уведомление
      } else {
        console.error('❌ Failed to buy theme:', result.error)
        // Можно добавить toast с ошибкой
      }
    } catch (error) {
      console.error('💥 Error in handleBuyTheme:', error)
    } finally {
      console.log('🏁 Clearing purchasing theme')
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
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
        data-modal="theme-shop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="flex max-h-[80vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-gray-900"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex flex-shrink-0 items-center justify-between border-b border-gray-200 p-4 dark:border-gray-700 sm:p-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white sm:text-2xl">
                🎨 Магазин тем
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Персонализируйте свой сад
              </p>
            </div>
            <button
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <X className="h-5 w-5 text-gray-500 dark:text-gray-400" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6">
            {isLoadingThemes ? (
              <div className="flex items-center justify-center py-12">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600" />
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {themes.map(theme => {
                  const isOwned =
                    ownedThemeIds.includes(theme.id) || theme.isDefault
                  const canBuy =
                    isOwned ||
                    (userCurrency?.sprouts || 0) >= theme.priceSprouts
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
                            ) : (userCurrency?.sprouts || 0) >=
                              theme.priceSprouts ? (
                              <Button
                                size="sm"
                                className="w-full"
                                disabled={isPurchasing}
                                onClick={e => {
                                  console.log(
                                    '🖱️ Buy button clicked for theme:',
                                    theme.id
                                  )
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
                                Недостаточно средств
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
          <div className="flex-shrink-0 border-t border-gray-200 p-4 dark:border-gray-700 sm:p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Leaf className="h-4 w-4 text-green-500" />
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Ваш баланс: {userCurrency?.sprouts || 0} ростков
                </span>
              </div>
              <Button variant="outline" onClick={onClose} size="sm">
                Закрыть
              </Button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
