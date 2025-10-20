/**
 * 🎨 КОМПОНЕНТ: Настройки тем сада
 * Позволяет выбирать и покупать темы
 */

import { motion } from 'framer-motion'
import { Check, Lock, Leaf } from 'lucide-react'
import { useGardenTheme } from '@/hooks/useGardenTheme'
import { useCurrencyStore } from '@/stores/currencyStore'
import { useUserStore } from '@/stores/userStore'
import { Button, Card } from '@/components/ui'

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
  } = useGardenTheme()
  const { userCurrency, spendCurrency } = useCurrencyStore()
  const currentUser = useUserStore(s => s.currentUser)

  const handleBuyTheme = async (themeId: string) => {
    if (!currentUser?.telegramId) return

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
    }
  }

  const handleSelectTheme = (themeId: string) => {
    if (canUseTheme(themeId)) {
      setGardenTheme(themeId)
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
