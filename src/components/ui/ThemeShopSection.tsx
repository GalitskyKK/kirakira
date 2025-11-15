/**
 * 🎨 КОМПОНЕНТ: Раздел магазина с темами
 * Выделенная секция для покупки тем сада
 */

import { useState, useRef, useEffect, useMemo } from 'react'
import { motion, PanInfo } from 'framer-motion'
import { Check, Lock, Leaf, ChevronLeft, ChevronRight } from 'lucide-react'
import { useGardenTheme } from '@/hooks/useGardenTheme'
import { useCurrencyClientStore } from '@/stores/currencyStore'
import { useSpendCurrency, currencyKeys } from '@/hooks/queries'
import { useTelegramId } from '@/hooks/useTelegramId'
import { useQueryClient } from '@tanstack/react-query'
import { Button, Card } from '@/components/ui'

// Импортируем функции для работы с локальным хранилищем
const loadOwnedThemesFromStorage = (): string[] => {
  try {
    const stored = localStorage.getItem('garden_owned_themes')
    return stored ? JSON.parse(stored) : []
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

  const [purchasingTheme, setPurchasingTheme] = useState<string | null>(null)
  const isProcessingRef = useRef(false) // Защита от двойных кликов

  // Состояние для слайдера
  const [currentIndex, setCurrentIndex] = useState(0)
  const sliderRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

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

      if (!telegramId) {
        console.error('❌ No telegramId available')
        return
      }

      const result = await spendCurrencyMutation.mutateAsync({
        telegramId,
        currencyType: 'sprouts',
        amount: theme.priceSprouts,
        reason: 'buy_theme',
        description: `Покупка темы "${theme.name}"`,
        metadata: { themeId, themeName: theme.name },
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
        queryClient.setQueryData(
          ['themes', 'catalog'],
          (oldData: ReturnType<typeof Object> | undefined) => {
            type ThemesCatalogResponse = {
              success: boolean
              data?: {
                themes: Array<{
                  id: string
                  name: string
                  priceSprouts: number
                  isDefault: boolean
                }>
                ownedThemeIds: string[]
              }
              error?: string
            }
            const casted = oldData as ThemesCatalogResponse | undefined
            if (casted?.success && casted.data?.ownedThemeIds) {
              return {
                ...casted,
                data: {
                  ...casted.data,
                  ownedThemeIds: [...casted.data.ownedThemeIds, themeId],
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
  const cardPadding = 8 // padding слева и справа (px-2 = 0.5rem = 8px)
  const gap = 16 // Отступ между карточками
  // Реальное расстояние между центрами карточек: cardWidth + cardPadding * 2 + gap
  const cardSpacing = cardWidth + cardPadding * 2 + gap

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
    // Смещаем на нужное количество карточек (используем реальное расстояние между центрами)
    const idealOffset = -(currentIndex * cardSpacing) + centerOffset

    // Минимальный offset (когда первая карточка полностью видна слева)
    const minOffset = 0

    // Максимальный offset (когда последняя карточка полностью видна справа)
    const totalCardsWidth = themes.length * cardSpacing
    const maxOffset = -(totalCardsWidth - cardSpacing) + (width - cardWidth)

    // Ограничиваем offset границами
    return Math.max(maxOffset, Math.min(minOffset, idealOffset))
  }, [currentIndex, containerWidth, cardWidth, cardSpacing, themes.length])

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
                aria-label="Предыдущая тема"
              >
                <ChevronLeft className="h-5 w-5 text-gray-700 dark:text-gray-300" />
              </button>
              <button
                onClick={goToNext}
                className="absolute right-2 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/90 p-2 shadow-lg backdrop-blur-sm transition-all hover:bg-white dark:bg-gray-800/90 dark:hover:bg-gray-800"
                aria-label="Следующая тема"
              >
                <ChevronRight className="h-5 w-5 text-gray-700 dark:text-gray-300" />
              </button>
            </>
          )}

          {/* Контейнер слайдера */}
          <div
            ref={containerRef}
            className="relative overflow-hidden"
            style={{ touchAction: 'pan-x', minHeight: '300px' }}
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
                            {theme.name}
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
                                ? 'Бесплатно'
                                : `${theme.priceSprouts} ростков`}
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
                  aria-label={`Перейти к теме ${index + 1}`}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
