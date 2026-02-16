/**
 * 🎨 КОМПОНЕНТ: Раздел магазина с темами
 * Выделенная секция для покупки тем сада
 */

import { useState, useRef, useEffect, useMemo } from 'react'
import { motion, PanInfo } from 'framer-motion'
import { Check, Lock, Leaf, Gem, ChevronLeft, ChevronRight } from 'lucide-react'
import { useGardenTheme } from '@/hooks/useGardenTheme'
import { useCurrencyClientStore } from '@/stores/currencyStore'
import { useSpendCurrency, currencyKeys } from '@/hooks/queries'
import { useTelegramId } from '@/hooks/useTelegramId'
import { useQueryClient } from '@tanstack/react-query'
import { Button, Card } from '@/components/ui'
import { useTranslation } from '@/hooks/useTranslation'
import { useHorizontalSwipeCapture } from '@/hooks/useHorizontalSwipeCapture'
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

export function ThemeShopSection() {
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
  const telegramId = useTelegramId()
  const queryClient = useQueryClient()
  const t = useTranslation()

  const [purchasingTheme, setPurchasingTheme] = useState<string | null>(null)
  const isProcessingRef = useRef(false) // Защита от двойных кликов

  // Состояние для слайдера
  const [currentIndex, setCurrentIndex] = useState(0)
  const sliderRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const { ref: swipeCaptureRef } = useHorizontalSwipeCapture(containerRef)

  const handleBuyTheme = async (
    themeId: string,
    currencyType: 'sprouts' | 'gems' = 'sprouts'
  ) => {
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

      if (!telegramId) {
        console.error('❌ No telegramId available')
        return
      }

      // Определяем цену в зависимости от валюты
      const amount =
        currencyType === 'gems' && theme.priceGems
          ? theme.priceGems
          : theme.priceSprouts

      console.log(
        `💰 ${t.themes.buy} "${getLocalizedThemeName(theme.id, t)}" for ${amount} ${currencyType}`
      )

      const result = await spendCurrencyMutation.mutateAsync({
        telegramId,
        currencyType,
        amount,
        reason: 'buy_theme',
        description: `${t.themes.buy} "${getLocalizedThemeName(theme.id, t)}"`,
        metadata: {
          themeId,
          themeName: getLocalizedThemeName(theme.id, t),
          currencyType,
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
              [currencyType]: result.balance_after,
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
      } else {
        console.error('❌ Failed to buy theme:', result.error)
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

  // Вычисляем offset для центрирования активной карточки
  // Используем начальную ширину из window, чтобы offset вычислялся сразу
  const [containerWidth, setContainerWidth] = useState(() => {
    if (typeof window !== 'undefined') {
      return Math.max(window.innerWidth - 64, 320) // Минимум 320px с учетом padding
    }
    return 320
  })

  // Обновляем ширину контейнера при монтировании и изменении размера
  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.offsetWidth)
      }
    }

    // Небольшая задержка для того, чтобы контейнер успел отрендериться
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
  }, [])

  // Вычисляем offset с центрированием активной карточки и учетом границ
  const offset = useMemo(() => {
    if (themes.length === 0) return 0

    // Используем containerWidth или fallback на начальную ширину
    const width =
      containerWidth > 0
        ? containerWidth
        : typeof window !== 'undefined'
          ? Math.max(window.innerWidth - 64, 320)
          : 320

    // Центрируем активную карточку
    const centerOffset = width / 2 - cardWidth / 2
    // Смещаем на нужное количество карточек (просто умножаем на ширину карточки)
    const idealOffset = -(currentIndex * cardWidth) + centerOffset

    // Минимальный offset (когда первая карточка полностью видна слева)
    const minOffset = 0

    // Максимальный offset (когда последняя карточка полностью видна справа)
    const totalCardsWidth = themes.length * cardWidth
    const maxOffset = -(totalCardsWidth - cardWidth) + (width - cardWidth)

    // Ограничиваем offset границами
    return Math.max(maxOffset, Math.min(minOffset, idealOffset))
  }, [currentIndex, containerWidth, cardWidth, themes.length])

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

  return (
    <div className="p-4 sm:p-6">
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
                aria-label={t.themes.previousTheme}
              >
                <ChevronLeft className="h-5 w-5 text-gray-700 dark:text-gray-300" />
              </button>
              <button
                onClick={goToNext}
                className="absolute right-2 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/90 p-2 shadow-lg backdrop-blur-sm transition-all hover:bg-white dark:bg-gray-800/90 dark:hover:bg-gray-800"
                aria-label={t.themes.nextTheme}
              >
                <ChevronRight className="h-5 w-5 text-gray-700 dark:text-gray-300" />
              </button>
            </>
          )}

          {/* Контейнер слайдера — swipeCaptureRef блокирует vertical scroll на iOS/Telegram */}
          <div
            ref={swipeCaptureRef}
            className="relative overflow-hidden"
            style={{ touchAction: 'pan-x', overscrollBehavior: 'contain' }}
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
                  isOwned || (userCurrency?.sprouts || 0) >= theme.priceSprouts
                const isPurchasing = purchasingTheme === theme.id
                const isActive = index === currentIndex

                return (
                  <motion.div
                    key={theme.id}
                    className="flex-shrink-0 p-4"
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
                      className={`cursor-pointer overflow-hidden transition-all hover:shadow-lg ${!canBuy ? 'opacity-60' : ''}`}
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

                        {/* Price Display */}
                        <div className="mt-2 space-y-1.5">
                          {theme.priceSprouts === 0 ? (
                            <div className="flex items-center gap-1.5">
                              <Leaf className="h-4 w-4 text-green-500" />
                              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                {t.themes.free}
                              </span>
                            </div>
                          ) : theme.isPremium && theme.priceGems ? (
                            // Премиум тема - показываем обе цены
                            <>
                              <div className="flex items-center gap-1.5">
                                <Leaf className="h-4 w-4 text-green-500" />
                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                  {theme.priceSprouts}{' '}
                                  {t.currency.sproutsPlural}
                                </span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <Gem className="h-4 w-4 text-purple-500" />
                                <span className="text-sm font-medium text-purple-600 dark:text-purple-400">
                                  {theme.priceGems} {t.currency.gemsPlural}
                                </span>
                              </div>
                            </>
                          ) : (
                            // Обычная тема - только ростки
                            <div className="flex items-center gap-1.5">
                              <Leaf className="h-4 w-4 text-green-500" />
                              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                {theme.priceSprouts} {t.currency.sproutsPlural}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Action Buttons */}
                        <div className="mt-3 space-y-2">
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
                              {t.themes.select}
                            </Button>
                          ) : theme.isPremium && theme.priceGems ? (
                            // Премиум тема - две кнопки выбора валюты
                            <div className="space-y-2">
                              <Button
                                size="sm"
                                className="w-full bg-gradient-to-r from-green-500 to-emerald-600"
                                disabled={
                                  isPurchasing ||
                                  (userCurrency?.sprouts || 0) <
                                    theme.priceSprouts
                                }
                                onClick={e => {
                                  e.stopPropagation()
                                  handleBuyTheme(theme.id, 'sprouts')
                                }}
                              >
                                {isPurchasing ? (
                                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                ) : (
                                  <>
                                    <Leaf className="mr-1.5 h-4 w-4" />
                                    {theme.priceSprouts}
                                  </>
                                )}
                              </Button>
                              <Button
                                size="sm"
                                className="w-full bg-gradient-to-r from-purple-500 to-pink-600 text-white"
                                disabled={
                                  isPurchasing ||
                                  (userCurrency?.gems || 0) < theme.priceGems
                                }
                                onClick={e => {
                                  e.stopPropagation()
                                  handleBuyTheme(theme.id, 'gems')
                                }}
                              >
                                {isPurchasing ? (
                                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                ) : (
                                  <>
                                    <Gem className="mr-1.5 h-4 w-4 text-white" />
                                    <span className="text-white">
                                      {theme.priceGems}
                                    </span>
                                  </>
                                )}
                              </Button>
                            </div>
                          ) : (userCurrency?.sprouts || 0) >=
                            theme.priceSprouts ? (
                            // Обычная тема - одна кнопка
                            <Button
                              size="sm"
                              className="w-full"
                              disabled={isPurchasing}
                              onClick={e => {
                                e.stopPropagation()
                                handleBuyTheme(theme.id, 'sprouts')
                              }}
                            >
                              {isPurchasing ? (
                                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                              ) : (
                                <>
                                  <Leaf className="mr-1.5 h-4 w-4" />
                                  {theme.priceSprouts}
                                </>
                              )}
                            </Button>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              className="w-full"
                              disabled
                            >
                              {t.freezes.insufficientFunds}
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
                      ? 'w-8 bg-kira-500'
                      : 'w-2 bg-neutral-300 dark:bg-neutral-600'
                  }`}
                  aria-label={`${t.themes.goToTheme} ${index + 1}`}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
