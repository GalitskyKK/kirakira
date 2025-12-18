/**
 * 🎨 КОМПОНЕНТ: Магазин тем сада
 * Показывает доступные темы и позволяет их покупать
 */

import { useState, useEffect, useRef, useMemo } from 'react'
import { motion, AnimatePresence, PanInfo } from 'framer-motion'
import { X, Check, Lock, Leaf, ChevronLeft, ChevronRight } from 'lucide-react'
import { useGardenTheme } from '@/hooks/useGardenTheme'
import { useCurrencyClientStore } from '@/stores/currencyStore'
import { useSpendCurrency, currencyKeys } from '@/hooks/queries'
import { useTelegramId } from '@/hooks/useTelegramId'
import { useQueryClient } from '@tanstack/react-query'
import { Button, Card } from '@/components/ui'
import { useTranslation } from '@/hooks/useTranslation'
import { getLocalizedThemeName } from '@/utils/themeLocalization'

// Импортируем функции для работы с локальным хранилищем
const loadOwnedThemesFromStorage = (): string[] => {
  try {
    const stored = localStorage.getItem('garden_owned_themes')
    if (!stored) return []
    const parsed: unknown = JSON.parse(stored)
    return Array.isArray(parsed)
      ? parsed.filter((id): id is string => typeof id === 'string')
      : []
  } catch {
    return []
  }
}

const saveOwnedThemesToStorage = (themeIds: string[]): void => {
  try {
    localStorage.setItem('garden_owned_themes', JSON.stringify(themeIds))
  } catch {
    // Игнорируем ошибки localStorage
  }
}

interface ThemesCatalogResponse {
  readonly success: boolean
  readonly data?: {
    readonly themes: Array<{
      readonly id: string
      readonly name: string
      readonly priceSprouts: number
      readonly isDefault: boolean
    }>
    readonly ownedThemeIds: string[]
  }
  readonly error?: string
}

interface ThemeShopProps {
  readonly isOpen: boolean
  readonly onClose: () => void
}

export function ThemeShop({ isOpen, onClose }: ThemeShopProps) {
  const t = useTranslation()
  const {
    themes,
    ownedThemeIds,
    canUseTheme,
    setGardenTheme,
    isLoadingThemes,
    refetchOwnedThemes,
  } = useGardenTheme()
  const { userCurrency } = useCurrencyClientStore()
  const spendCurrencyMutation = useSpendCurrency()

  // Используем правильный подход - React Query вместо Zustand
  const telegramId = useTelegramId()
  const queryClient = useQueryClient()

  const [purchasingTheme, setPurchasingTheme] = useState<string | null>(null)
  const isProcessingRef = useRef(false) // Защита от двойных кликов

  // Состояние для слайдера
  const [currentIndex, setCurrentIndex] = useState(0)
  const sliderRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

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
    // Защита от двойных кликов
    if (isProcessingRef.current || purchasingTheme !== null) {
      console.warn('⚠️ Purchase already in progress, ignoring duplicate click')
      return
    }

    if (!telegramId) {
      console.error('❌ No telegramId available')
      return
    }

    // Блокируем повторные вызовы
    isProcessingRef.current = true
    setPurchasingTheme(themeId)

    try {
      const theme = themes.find(t => t.id === themeId)
      if (!theme) {
        console.error('❌ Theme not found')
        return
      }

      const result = await spendCurrencyMutation.mutateAsync({
        telegramId,
        currencyType: 'sprouts',
        amount: theme.priceSprouts,
        reason: 'buy_theme',
        description: `${t.themes.buy} "${getLocalizedThemeName(theme.id, t)}"`,
        metadata: {
          themeId,
          themeName: getLocalizedThemeName(theme.id, t),
        },
      })

      if (result.success) {
        // 🔄 Оптимистичное обновление баланса для мгновенного отображения
        if (result.balance_after !== undefined && telegramId) {
          const storeState = useCurrencyClientStore.getState()
          const currentCurrency = storeState.userCurrency
          if (currentCurrency && storeState.updateCurrencyFromQuery) {
            storeState.updateCurrencyFromQuery({
              ...currentCurrency,
              sprouts: result.balance_after,
              lastUpdated: new Date(),
            })
          }
        }

        // Обновляем список купленных тем
        await refetchOwnedThemes()

        // Принудительно обновляем кеш React Query
        await queryClient.invalidateQueries({
          queryKey: ['themes', 'catalog'],
        })

        // Инвалидируем валюту для полной синхронизации
        await queryClient.invalidateQueries({
          queryKey: currencyKeys.balance(telegramId),
        })

        // Принудительно обновляем локальное состояние
        const currentOwned = loadOwnedThemesFromStorage()
        const updatedOwned = [...currentOwned, themeId]
        saveOwnedThemesToStorage(updatedOwned)

        // Принудительно обновляем React Query кеш
        queryClient.setQueryData<ThemesCatalogResponse | undefined>(
          ['themes', 'catalog'],
          oldData => {
            if (oldData?.success && oldData.data?.ownedThemeIds) {
              return {
                ...oldData,
                data: {
                  ...oldData.data,
                  ownedThemeIds: [...oldData.data.ownedThemeIds, themeId],
                },
              }
            }
            return oldData
          }
        )

        // Принудительно обновляем localStorage версию для useGardenTheme
        window.dispatchEvent(new Event('storage'))

        // Можно добавить toast уведомление
      } else {
        console.error('❌ Failed to buy theme:', result.error)
        // Можно добавить toast с ошибкой
      }
    } catch (error) {
      console.error('💥 Error in handleBuyTheme:', error)
    } finally {
      setPurchasingTheme(null)
      // Разблокируем через небольшую задержку для предотвращения двойных кликов
      setTimeout(() => {
        isProcessingRef.current = false
      }, 500)
    }
  }

  const handleSelectTheme = async (themeId: string) => {
    if (canUseTheme(themeId)) {
      await setGardenTheme(themeId)
    }
  }

  // Константы для слайдера
  const cardWidth = 320 // Ширина карточки темы
  const gap = 16 // Отступ между карточками
  const cardWithGap = cardWidth + gap

  // Вычисляем offset для центрирования активной карточки
  const [containerWidth, setContainerWidth] = useState(0)

  // Обновляем ширину контейнера при монтировании и изменении размера
  useEffect(() => {
    if (!isOpen) return

    const updateWidth = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.offsetWidth)
      }
    }

    // Небольшая задержка для того, чтобы модалка успела отрендериться
    const timeoutId = setTimeout(updateWidth, 100)
    window.addEventListener('resize', updateWidth)

    // Используем ResizeObserver для более точного отслеживания изменений размера
    const resizeObserver = new ResizeObserver(() => {
      updateWidth()
    })

    if (containerRef.current) {
      resizeObserver.observe(containerRef.current)
    }

    return () => {
      clearTimeout(timeoutId)
      window.removeEventListener('resize', updateWidth)
      resizeObserver.disconnect()
    }
  }, [isOpen])

  // Вычисляем offset с центрированием активной карточки и учетом границ
  const offset = useMemo(() => {
    if (containerWidth === 0 || themes.length === 0) return 0

    const totalWidth = themes.length * cardWithGap
    const centerOffset = containerWidth / 2 - cardWidth / 2
    const idealOffset = -(currentIndex * cardWithGap) + centerOffset

    // Минимальный offset (когда первая карточка полностью видна слева)
    const minOffset = 0

    // Максимальный offset (когда последняя карточка полностью видна справа)
    const maxOffset = -(totalWidth - cardWithGap) + (containerWidth - cardWidth)

    // Ограничиваем offset границами
    return Math.max(maxOffset, Math.min(minOffset, idealOffset))
  }, [currentIndex, containerWidth, cardWidth, cardWithGap, themes.length])

  // Функции навигации
  const goToPrevious = () => {
    setCurrentIndex(prev => (prev > 0 ? prev - 1 : themes.length - 1))
  }

  const goToNext = () => {
    setCurrentIndex(prev => (prev < themes.length - 1 ? prev + 1 : 0))
  }

  const goToIndex = (index: number) => {
    setCurrentIndex(index)
  }

  // Обработка свайпа
  const handleDragEnd = (
    _event: MouseEvent | TouchEvent | PointerEvent,
    info: PanInfo
  ) => {
    const threshold = 50
    if (info.offset.x > threshold && currentIndex > 0) {
      goToPrevious()
    } else if (info.offset.x < -threshold && currentIndex < themes.length - 1) {
      goToNext()
    }
  }

  // Сбрасываем индекс при открытии модалки
  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(0)
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        data-modal="theme-shop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        {/* Overlay */}
        <div className="absolute inset-0 mb-14 bg-black/50 backdrop-blur-sm" />
        <motion.div
          className="relative flex max-h-[75vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-gray-900"
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
              <div className="relative">
                {/* Кнопки навигации */}
                {themes.length > 1 && (
                  <>
                    <button
                      onClick={goToPrevious}
                      className="absolute left-2 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/90 p-2 shadow-lg backdrop-blur-sm transition-all hover:bg-white dark:bg-gray-800/90 dark:hover:bg-gray-800"
                      aria-label={t.gardenActions.previousTheme}
                    >
                      <ChevronLeft className="h-5 w-5 text-gray-700 dark:text-gray-300" />
                    </button>
                    <button
                      onClick={goToNext}
                      className="absolute right-2 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/90 p-2 shadow-lg backdrop-blur-sm transition-all hover:bg-white dark:bg-gray-800/90 dark:hover:bg-gray-800"
                      aria-label={t.gardenActions.nextTheme}
                    >
                      <ChevronRight className="h-5 w-5 text-gray-700 dark:text-gray-300" />
                    </button>
                  </>
                )}

                {/* Контейнер слайдера */}
                <div
                  ref={containerRef}
                  className="relative overflow-hidden"
                  style={{ touchAction: 'pan-x' }}
                >
                  <motion.div
                    ref={sliderRef}
                    className="flex"
                    drag="x"
                    dragConstraints={{ left: 0, right: 0 }}
                    dragElastic={0.2}
                    onDragEnd={handleDragEnd}
                    animate={{
                      x: offset,
                    }}
                    transition={{
                      type: 'spring',
                      stiffness: 300,
                      damping: 30,
                    }}
                  >
                    {themes.map((theme, index) => {
                      const isOwned =
                        ownedThemeIds.includes(theme.id) || theme.isDefault
                      const canBuy =
                        isOwned ||
                        (userCurrency?.sprouts || 0) >= theme.priceSprouts
                      const isPurchasing = purchasingTheme === theme.id
                      const isActive = index === currentIndex

                      return (
                        <motion.div
                          key={theme.id}
                          className="flex-shrink-0 px-2"
                          style={{ width: cardWidth }}
                          animate={{
                            scale: isActive ? 1 : 0.95,
                            opacity: isActive ? 1 : 0.7,
                          }}
                          transition={{
                            type: 'spring',
                            stiffness: 300,
                            damping: 30,
                          }}
                        >
                          <Card
                            className={`cursor-pointer overflow-hidden transition-all ${'hover:shadow-lg'} ${!canBuy ? 'opacity-60' : ''}`}
                            onClick={() => handleSelectTheme(theme.id)}
                          >
                            {/* Theme Preview */}
                            <div
                              className="h-32 w-full"
                              style={{ background: theme.containerBackground }}
                            >
                              {/* Shelf Preview */}
                              <div className="flex h-full items-end justify-center pb-3">
                                <div
                                  className="h-6 w-24 rounded shadow-md"
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
                                    left: `${25 + i * 25}%`,
                                    top: `${25 + i * 20}%`,
                                    background: `linear-gradient(90deg, ${theme.particleFrom}, ${theme.particleTo})`,
                                  }}
                                />
                              ))}
                            </div>

                            {/* Theme Info */}
                            <div className="p-4">
                              <div className="flex items-center justify-between">
                                <h3 className="font-semibold text-gray-900 dark:text-white">
                                  {getLocalizedThemeName(theme.id, t)}
                                </h3>
                                {isOwned && (
                                  <Check className="h-5 w-5 text-green-500" />
                                )}
                                {!canBuy && !isOwned && (
                                  <Lock className="h-5 w-5 text-gray-400" />
                                )}
                              </div>

                              <div className="mt-2 flex items-center justify-between">
                                <div className="flex items-center gap-1.5">
                                  <Leaf className="h-4 w-4 text-green-500" />
                                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                    {theme.priceSprouts === 0
                                      ? t.themes.free
                                      : `${theme.priceSprouts} ${t.currency.sproutsPlural}`}
                                  </span>
                                </div>
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
                                      e.stopPropagation()
                                      handleBuyTheme(theme.id)
                                    }}
                                  >
                                    {isPurchasing ? (
                                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                    ) : (
                                      `${t.themes.buyFor} ${theme.priceSprouts}`
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
                  </motion.div>
                </div>

                {/* Индикаторы (точки) */}
                {themes.length > 1 && (
                  <div className="mt-4 flex justify-center gap-2">
                    {themes.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => goToIndex(index)}
                        className={`h-2 rounded-full transition-all ${
                          index === currentIndex
                            ? 'w-8 bg-blue-500'
                            : 'w-2 bg-gray-300 dark:bg-gray-600'
                        }`}
                        aria-label={`${t.gardenActions.goToTheme} ${index + 1}`}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex-shrink-0 border-t border-gray-200 p-4 dark:border-gray-700 sm:p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Leaf className="h-4 w-4 text-green-500" />
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {t.transactionHistory.balance}: {userCurrency?.sprouts || 0}{' '}
                  {t.currency.sproutsPlural}
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
