/**
 * 🎨 КОМПОНЕНТ: Настройки тем сада
 * Позволяет выбирать и покупать темы
 */

import { motion } from 'framer-motion'
import { useRef } from 'react'
import { Check, Lock, Leaf } from 'lucide-react'
import { useGardenTheme } from '@/hooks/useGardenTheme'
import { useCurrencyClientStore } from '@/stores/currencyStore.v2'
import { useSpendCurrency } from '@/hooks/queries'
import { useUserSync } from '@/hooks/queries/useUserQueries'
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

    // Блокируем повторные вызовы
    isProcessingRef.current = true

    try {

      const theme = themes.find(t => t.id === themeId)
      if (!theme) {
        console.error('❌ Theme not found')
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
        // Обновляем список купленных тем
        await refetchOwnedThemes()

        // Принудительно обновляем кеш React Query
        await queryClient.invalidateQueries({
          queryKey: ['themes', 'catalog'],
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
              data?: { themes: Array<{ id: string; name: string; priceSprouts: number; isDefault: boolean }>; ownedThemeIds: string[] }
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
        console.log('🎨 Updated owned themes:', updatedOwned)
      }
    } catch (error) {
      console.error('Failed to buy theme:', error)
    } finally {
      // Разблокируем через небольшую задержку для предотвращения двойных кликов
      setTimeout(() => {
        isProcessingRef.current = false
      }, 500)
    }
  }

  const handleSelectTheme = async (themeId: string) => {
    console.log('🎨 ThemeSettings - handleSelectTheme:', {
      themeId,
      ownedThemeIds,
      canUseTheme: canUseTheme(themeId),
      currentUser: currentUser?.telegramId,
    })

    if (canUseTheme(themeId)) {
      await setGardenTheme(themeId)
    }
  }

  return (
    <div className={className}>
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          🎨 Темы сада
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Персонализируйте внешний вид вашего сада
        </p>
      </div>

      {isLoadingThemes ? (
        <div className="flex items-center justify-center py-8">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600" />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {themes.map(theme => {
            const isOwned = ownedThemeIds.includes(theme.id)
            const canBuy = canUseTheme(theme.id)
            const isSelected = currentTheme.id === theme.id

            console.log('🎨 ThemeSettings - rendering theme:', {
              themeId: theme.id,
              themeName: theme.name,
              isOwned,
              canBuy,
              isSelected,
              ownedThemeIds,
              isDefault: theme.isDefault,
            })

            return (
              <motion.div
                key={theme.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Card
                  className={`cursor-pointer overflow-hidden transition-all ${
                    isSelected
                      ? 'bg-blue-50 ring-2 ring-blue-500 dark:bg-blue-900/20'
                      : 'hover:shadow-md'
                  } ${!canBuy ? 'opacity-60' : ''}`}
                  onClick={() => handleSelectTheme(theme.id)}
                >
                  {/* Theme Preview */}
                  <div
                    className="h-20 w-full"
                    style={{ background: theme.containerBackground }}
                  >
                    {/* Shelf Preview */}
                    <div className="flex h-full items-end justify-center pb-2">
                      <div
                        className="h-4 w-16 rounded shadow-md"
                        style={{
                          background: theme.shelfSurface,
                          borderRadius: theme.shelfRadius,
                          boxShadow: theme.shelfShadow,
                        }}
                      />
                    </div>

                    {/* Particles */}
                    {Array.from({ length: 2 }, (_, i) => (
                      <div
                        key={i}
                        className="absolute h-0.5 w-0.5 rounded-full opacity-60"
                        style={{
                          left: `${30 + i * 40}%`,
                          top: `${30 + i * 20}%`,
                          background: `linear-gradient(90deg, ${theme.particleFrom}, ${theme.particleTo})`,
                        }}
                      />
                    ))}
                  </div>

                  {/* Theme Info */}
                  <div className="p-3">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium text-gray-900 dark:text-white">
                        {theme.name}
                      </h3>
                      <div className="flex items-center gap-1">
                        {isSelected && (
                          <Check className="h-4 w-4 text-blue-500" />
                        )}
                        {isOwned && !isSelected && (
                          <Check className="h-4 w-4 text-green-500" />
                        )}
                        {!canBuy && !isOwned && (
                          <Lock className="h-4 w-4 text-gray-400" />
                        )}
                      </div>
                    </div>

                    <div className="mt-1 flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <Leaf className="h-3 w-3 text-green-500" />
                        <span className="text-xs text-gray-600 dark:text-gray-400">
                          {theme.priceSprouts === 0
                            ? 'Бесплатно'
                            : theme.priceSprouts}
                        </span>
                      </div>

                      {!isOwned && canBuy && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-6 px-2 text-xs"
                          onClick={e => {
                            e.stopPropagation()
                            handleBuyTheme(theme.id)
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
        </div>
      )}

      {/* Balance Info */}
      <div className="mt-4 flex items-center justify-between rounded-lg bg-gray-50 p-3 dark:bg-gray-800">
        <div className="flex items-center gap-2">
          <Leaf className="h-4 w-4 text-green-500" />
          <span className="text-sm text-gray-600 dark:text-gray-400">
            Ваш баланс: {userCurrency?.sprouts || 0} ростков
          </span>
        </div>
        <div className="text-xs text-gray-500 dark:text-gray-500">
          Нажмите на валюту в шапке для открытия магазина
        </div>
      </div>
    </div>
  )
}
