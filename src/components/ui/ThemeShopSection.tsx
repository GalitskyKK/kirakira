/**
 * 🎨 КОМПОНЕНТ: Раздел магазина с темами
 * Выделенная секция для покупки тем сада
 */

import { useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { Check, Lock, Leaf } from 'lucide-react'
import { useGardenTheme } from '@/hooks/useGardenTheme'
import { useCurrencyClientStore } from '@/stores/currencyStore.v2'
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
            console.log('✅ Currency balance updated optimistically:', {
              newBalance: result.balance_after,
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

        console.log('✅ Theme purchased successfully!')
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

  return (
    <div className="p-4 sm:p-6">
      {/* Themes Grid */}
      {isLoadingThemes ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600" />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {themes.map(theme => {
            const isOwned = ownedThemeIds.includes(theme.id) || theme.isDefault
            const canBuy =
              isOwned || (userCurrency?.sprouts || 0) >= theme.priceSprouts
            const isPurchasing = purchasingTheme === theme.id

            return (
              <motion.div
                key={theme.id}
                className="relative"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
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
                      {isOwned && <Check className="h-5 w-5 text-green-500" />}
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
                      ) : (userCurrency?.sprouts || 0) >= theme.priceSprouts ? (
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
        </div>
      )}
    </div>
  )
}
