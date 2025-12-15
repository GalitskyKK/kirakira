import { useMemo, useRef, useState, useEffect } from 'react'
import { motion, PanInfo } from 'framer-motion'
import { Check, Lock, Leaf, Gem, ChevronLeft, ChevronRight } from 'lucide-react'
import { Button, Card } from '@/components/ui'
import { useRoomTheme } from '@/hooks/useRoomTheme'
import { useCurrencyClientStore } from '@/stores/currencyStore'
import { useSpendCurrency, currencyKeys } from '@/hooks/queries'
import { useTelegramId } from '@/hooks/useTelegramId'
import { useQueryClient } from '@tanstack/react-query'

export function RoomThemeShopSection() {
  const {
    roomThemes,
    ownedRoomThemeIds,
    canUseRoomTheme,
    setRoomTheme,
    isLoadingRoomThemes,
    refetchRoomThemes,
  } = useRoomTheme()
  const { userCurrency } = useCurrencyClientStore()
  const spendCurrencyMutation = useSpendCurrency()
  const telegramId = useTelegramId()
  const queryClient = useQueryClient()

  const [purchasingTheme, setPurchasingTheme] = useState<string | null>(null)
  const isProcessingRef = useRef(false)

  const [currentIndex, setCurrentIndex] = useState(0)
  const sliderRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const cardWidth = 320
  const [containerWidth, setContainerWidth] = useState(() => {
    if (typeof window !== 'undefined') {
      return Math.max(window.innerWidth - 64, 320)
    }
    return 320
  })

  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.offsetWidth)
      }
    }
    updateWidth()
    window.addEventListener('resize', updateWidth)
    return () => window.removeEventListener('resize', updateWidth)
  }, [])

  const offset = useMemo(() => {
    if (roomThemes.length === 0) return 0
    const width =
      containerWidth > 0
        ? containerWidth
        : typeof window !== 'undefined'
          ? Math.max(window.innerWidth - 64, 320)
          : 320
    const centerOffset = width / 2 - cardWidth / 2
    const idealOffset = -(currentIndex * cardWidth) + centerOffset
    const minOffset = 0
    const totalCardsWidth = roomThemes.length * cardWidth
    const maxOffset = -(totalCardsWidth - cardWidth) + (width - cardWidth)
    return Math.max(maxOffset, Math.min(minOffset, idealOffset))
  }, [currentIndex, containerWidth, cardWidth, roomThemes.length])

  const handleDragEnd = (
    _event: MouseEvent | TouchEvent | PointerEvent,
    info: PanInfo
  ) => {
    const threshold = 50
    if (info.offset.x > threshold && currentIndex > 0) {
      setCurrentIndex(prev => prev - 1)
    } else if (
      info.offset.x < -threshold &&
      currentIndex < roomThemes.length - 1
    ) {
      setCurrentIndex(prev => prev + 1)
    }
  }

  const goToPrevious = () => {
    setCurrentIndex(prev => (prev > 0 ? prev - 1 : roomThemes.length - 1))
  }

  const goToNext = () => {
    setCurrentIndex(prev => (prev < roomThemes.length - 1 ? prev + 1 : 0))
  }

  const handleBuyTheme = async (
    themeId: string,
    currencyType: 'sprouts' | 'gems'
  ) => {
    if (isProcessingRef.current || purchasingTheme !== null) return
    if (!telegramId) return

    const theme = roomThemes.find(t => t.id === themeId)
    if (!theme) return

    const price = currencyType === 'gems' ? theme.priceGems : theme.priceSprouts
    if (!price || price <= 0) return

    isProcessingRef.current = true
    setPurchasingTheme(themeId)

    try {
      const result = await spendCurrencyMutation.mutateAsync({
        telegramId,
        currencyType,
        amount: price,
        reason: 'buy_room_theme',
        description: `Покупка темы комнаты "${theme.name}"`,
        metadata: {
          themeId,
          themeName: theme.name,
          currencyType,
          themeType: 'room',
        },
      })

      if (result.success) {
        await refetchRoomThemes()
        await queryClient.invalidateQueries({
          queryKey: currencyKeys.balance(telegramId),
        })
        await queryClient.invalidateQueries({
          queryKey: ['roomThemes', 'catalog', telegramId],
        })
      }
    } finally {
      setPurchasingTheme(null)
      setTimeout(() => {
        isProcessingRef.current = false
      }, 300)
    }
  }

  const handleSelectTheme = async (themeId: string) => {
    if (canUseRoomTheme(themeId)) {
      await setRoomTheme(themeId)
    }
  }

  return (
    <div className="p-4 sm:p-6">
      {isLoadingRoomThemes ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600" />
        </div>
      ) : (
        <div className="relative">
          {roomThemes.length > 1 && (
            <>
              <button
                onClick={goToPrevious}
                className="absolute left-2 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/90 p-2 shadow-lg backdrop-blur-sm transition-all hover:bg-white dark:bg-gray-800/90 dark:hover:bg-gray-800"
                aria-label="Предыдущая тема комнаты"
              >
                <ChevronLeft className="h-5 w-5 text-gray-700 dark:text-gray-300" />
              </button>
              <button
                onClick={goToNext}
                className="absolute right-2 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/90 p-2 shadow-lg backdrop-blur-sm transition-all hover:bg-white dark:bg-gray-800/90 dark:hover:bg-gray-800"
                aria-label="Следующая тема комнаты"
              >
                <ChevronRight className="h-5 w-5 text-gray-700 dark:text-gray-300" />
              </button>
            </>
          )}

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
              animate={{ x: offset }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            >
              {roomThemes.map((theme, index) => {
                const isOwned =
                  ownedRoomThemeIds.includes(theme.id) || theme.isDefault
                const isActive = index === currentIndex
                const isPurchasing = purchasingTheme === theme.id
                const canBuySprouts =
                  (userCurrency?.sprouts || 0) >= theme.priceSprouts
                const canBuyGems = (userCurrency?.gems || 0) >= theme.priceGems

                return (
                  <motion.div
                    key={theme.id}
                    className="flex-shrink-0 p-4"
                    style={{ width: cardWidth }}
                    animate={{
                      scale: isActive ? 1 : 0.95,
                      opacity: isActive ? 1 : 0.75,
                    }}
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  >
                    <Card
                      className={`cursor-pointer overflow-hidden transition-all hover:shadow-lg ${
                        !isOwned && !canBuySprouts && !canBuyGems
                          ? 'opacity-60'
                          : ''
                      }`}
                      onClick={() => handleSelectTheme(theme.id)}
                    >
                      <div className="relative h-40 w-full bg-gray-100 dark:bg-gray-900">
                        <img
                          src={theme.previewUrl}
                          alt={theme.name}
                          className="h-full w-full object-cover"
                        />
                        {isOwned && (
                          <div className="absolute right-2 top-2 rounded-full bg-green-500/80 p-1.5">
                            <Check className="h-4 w-4 text-white" />
                          </div>
                        )}
                      </div>

                      <div className="p-4">
                        <div className="flex items-center justify-between">
                          <h3 className="font-semibold text-gray-900 dark:text-white">
                            {theme.name}
                          </h3>
                          {!isOwned && (
                            <Lock className="h-5 w-5 text-gray-400" />
                          )}
                        </div>

                        <div className="mt-2 space-y-1.5 text-sm text-gray-700 dark:text-gray-300">
                          {theme.priceSprouts === 0 ? (
                            <div className="flex items-center gap-1.5">
                              <Leaf className="h-4 w-4 text-green-500" />
                              <span>Бесплатно</span>
                            </div>
                          ) : (
                            <>
                              <div className="flex items-center gap-1.5">
                                <Leaf className="h-4 w-4 text-green-500" />
                                <span>{theme.priceSprouts} ростков</span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <Gem className="h-4 w-4 text-purple-500" />
                                <span>{theme.priceGems} гемов</span>
                              </div>
                            </>
                          )}
                        </div>

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
                              Выбрать
                            </Button>
                          ) : (
                            <>
                              <Button
                                size="sm"
                                className="w-full bg-gradient-to-r from-green-500 to-emerald-600"
                                disabled={
                                  isPurchasing ||
                                  theme.priceSprouts <= 0 ||
                                  !canBuySprouts
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
                                className="w-full bg-gradient-to-r from-purple-500 to-pink-600"
                                disabled={
                                  isPurchasing ||
                                  theme.priceGems <= 0 ||
                                  !canBuyGems
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
                                    <Gem className="mr-1.5 h-4 w-4" />
                                    {theme.priceGems}
                                  </>
                                )}
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                )
              })}
            </motion.div>
          </div>

          {roomThemes.length > 1 && (
            <div className="mt-4 flex justify-center gap-2">
              {roomThemes.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentIndex(index)}
                  className={`h-2 rounded-full transition-all ${
                    index === currentIndex
                      ? 'w-8 bg-kira-500'
                      : 'w-2 bg-neutral-300 dark:bg-neutral-600'
                  }`}
                  aria-label={`Перейти к теме комнаты ${index + 1}`}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
