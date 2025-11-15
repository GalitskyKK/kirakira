/**
 * 🎨 КОМПОНЕНТ: Настройки тем сада
 * Позволяет выбирать и покупать темы
 */

import { motion, PanInfo } from 'framer-motion'
import { useRef, useState, useEffect, useMemo } from 'react'
import { Check, Lock, Leaf, ChevronLeft, ChevronRight } from 'lucide-react'
import { useGardenTheme } from '@/hooks/useGardenTheme'
import { useCurrencyClientStore } from '@/stores/currencyStore'
import { useSpendCurrency, currencyKeys } from '@/hooks/queries'
import { useUserSync } from '@/hooks/queries/useUserQueries'
import { useTelegramId } from '@/hooks/useTelegramId'
import { useQueryClient } from '@tanstack/react-query'
import { Button, Card } from '@/components/ui'

// Импортируем функции для работы с локальным хранилищем
const loadOwnedThemesFromStorage = (): string[] => {
  try {
    const stored = localStorage.getItem('garden_owned_themes')
    return stored ? (JSON.parse(stored) as string[]) : []
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

interface ThemeSettingsProps {
  readonly className?: string
}

export function ThemeSettings({ className }: ThemeSettingsProps) {
  const {
    theme: currentTheme,
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
  const { data: userData } = useUserSync(telegramId, !!telegramId)
  const currentUser = userData?.user
  const queryClient = useQueryClient()
  const isProcessingRef = useRef(false) // Защита от двойных кликов

  const handleBuyTheme = async (themeId: string) => {
    // Защита от двойных кликов
    if (isProcessingRef.current) {
      console.warn('⚠️ Purchase already in progress, ignoring duplicate click')
      return
    }

    if (!currentUser?.telegramId) return

    // Блокируем повторные вызовы 1
    isProcessingRef.current = true

    try {
      const theme = themes.find(t => t.id === themeId)
      if (!theme) {
        return
      }

      const result = await spendCurrencyMutation.mutateAsync({
        telegramId: currentUser.telegramId,
        currencyType: 'sprouts',
        amount: theme.priceSprouts,
        reason: 'buy_theme',
        description: `Покупка темы "${theme.name}"`,
        metadata: { themeId, themeName: theme.name },
      })

      if (result.success) {
        // 🔄 Оптимистичное обновление баланса для мгновенного отображени
        if (result.balance_after !== undefined && currentUser.telegramId) {
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
          queryKey: currencyKeys.balance(currentUser.telegramId),
        })

        // Принудительно обновляем локальное состояние
        const currentOwned = loadOwnedThemesFromStorage()
        const updatedOwned = [...currentOwned, themeId]
        saveOwnedThemesToStorage(updatedOwned)

        // Принудительно обновляем React Query кеш
        queryClient.setQueryData(['themes', 'catalog'], (oldData: unknown) => {
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
        })

        // Принудительно обновляем localStorage версию для useGardenTheme
        window.dispatchEvent(new Event('storage'))
      }
    } catch {
      // Ошибка логируется через React Query
    } finally {
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

  // Состояние для слайдера
  const [currentIndex, setCurrentIndex] = useState(0)
  const sliderRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Находим индекс текущей выбранной темы
  useEffect(() => {
    const selectedIndex = themes.findIndex(t => t.id === currentTheme.id)
    if (selectedIndex >= 0) {
      setCurrentIndex(selectedIndex)
    }
  }, [currentTheme.id, themes])

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
        const width = containerRef.current.offsetWidth
        // Если ширина еще не установлена, используем window.innerWidth как fallback
        if (width > 0) {
          setContainerWidth(width)
        } else {
          // Используем ширину родительского элемента или window
          const parentWidth =
            containerRef.current.parentElement?.offsetWidth ?? window.innerWidth
          setContainerWidth(Math.max(parentWidth - 32, 320)) // Минимум 320px с учетом padding
        }
      }
    }

    // Небольшая задержка для того, чтобы контейнер успел отрендериться
    const timeoutId = setTimeout(updateWidth, 50)
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

  return (
    <div className={`space-y-4 ${className || ''}`}>
      {isLoadingThemes ? (
        <div className="flex items-center justify-center py-8">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-neutral-300 border-t-kira-600 dark:border-neutral-700 dark:border-t-kira-400" />
        </div>
      ) : (
        <div className="relative">
          {/* Кнопки навигации */}
          {themes.length > 1 && (
            <>
              <button
                onClick={goToPrevious}
                className="absolute left-2 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/90 p-2 shadow-lg backdrop-blur-sm transition-all hover:bg-white dark:bg-neutral-800/90 dark:hover:bg-neutral-800"
                aria-label="Предыдущая тема"
              >
                <ChevronLeft className="h-5 w-5 text-neutral-700 dark:text-neutral-300" />
              </button>
              <button
                onClick={goToNext}
                className="absolute right-2 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/90 p-2 shadow-lg backdrop-blur-sm transition-all hover:bg-white dark:bg-neutral-800/90 dark:hover:bg-neutral-800"
                aria-label="Следующая тема"
              >
                <ChevronRight className="h-5 w-5 text-neutral-700 dark:text-neutral-300" />
              </button>
            </>
          )}

          {/* Контейнер слайдера */}
          <div
            ref={containerRef}
            className="relative overflow-hidden"
            style={{ touchAction: 'pan-x', minHeight: '400px' }}
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
                const isOwned = ownedThemeIds.includes(theme.id)
                const canBuy = canUseTheme(theme.id)
                const isSelected = currentTheme.id === theme.id
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
                      className={`cursor-pointer overflow-hidden transition-all ${
                        isSelected
                          ? 'bg-kira-50 ring-2 ring-kira-500 dark:bg-kira-900/20'
                          : 'hover:shadow-md'
                      } ${!canBuy ? 'opacity-60' : ''}`}
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
                          <h3 className="font-semibold text-neutral-900 dark:text-neutral-100">
                            {theme.name}
                          </h3>
                          <div className="flex items-center gap-1">
                            {isSelected && (
                              <Check className="h-5 w-5 text-kira-500" />
                            )}
                            {isOwned && !isSelected && (
                              <Check className="h-5 w-5 text-green-500" />
                            )}
                            {!canBuy && !isOwned && (
                              <Lock className="h-5 w-5 text-neutral-400" />
                            )}
                          </div>
                        </div>

                        <div className="mt-2 flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <Leaf className="h-4 w-4 text-green-500" />
                            <span className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
                              {theme.priceSprouts === 0
                                ? 'Бесплатно'
                                : `${theme.priceSprouts} ростков`}
                            </span>
                          </div>

                          {!isOwned && canBuy && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 px-3 text-xs"
                              onClick={e => {
                                e.stopPropagation()
                                void handleBuyTheme(theme.id)
                              }}
                            >
                              Купить
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
                  aria-label={`Перейти к теме ${index + 1}`}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Balance Info */}
      <div className="flex items-center justify-between rounded-xl bg-neutral-100/80 p-3 dark:bg-neutral-800/80">
        <div className="flex items-center gap-2">
          <Leaf className="h-4 w-4 text-green-500" />
          <span className="text-sm text-neutral-700 dark:text-neutral-300">
            Баланс:{' '}
            <span className="font-semibold">{userCurrency?.sprouts || 0}</span>{' '}
            ростков
          </span>
        </div>
        <div className="text-xs text-neutral-500 dark:text-neutral-500">
          💡 Магазин в шапке
        </div>
      </div>
    </div>
  )
}
