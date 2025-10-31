/**
 * 🧊 КОМПОНЕНТ: Раздел магазина с заморозками
 * Покупка ручных и авто-заморозок стрика
 */

import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { Snowflake, Check, Leaf, Zap } from 'lucide-react'
import { useCurrencyClientStore } from '@/stores/currencyStore.v2'
import { useTelegramId } from '@/hooks/useTelegramId'
import { buyStreakFreeze } from '@/api/streakFreezeService'
import { useQueryClient } from '@tanstack/react-query'
import { useUserSync } from '@/hooks/index.v2'
import {
  FREEZE_SHOP_CONFIG,
  FREEZE_DESCRIPTIONS,
  type FreezeType,
  type StreakFreezeData,
} from '@/types/streakFreeze'
import { Button, Card } from '@/components/ui'

export function FreezeShopSection() {
  const { userCurrency } = useCurrencyClientStore()
  const telegramId = useTelegramId()
  const { data: userData } = useUserSync(telegramId, !!telegramId)
  const queryClient = useQueryClient()

  // Получаем данные о заморозках из userData
  const [freezeData, setFreezeData] = useState<StreakFreezeData | null>(null)

  useEffect(() => {
    if (userData?.user) {
      setFreezeData({
        manual: userData.user.stats.streakFreezes || 0,
        auto: userData.user.stats.autoFreezes || 0,
        max: 5, // TODO: получать из уровня пользователя
        canAccumulate: true,
      })
    }
  }, [userData])

  const [purchasing, setPurchasing] = useState<FreezeType | null>(null)
  const isProcessingRef = useRef(false) // Защита от двойных кликов

  // Определяем, какую валюту используем
  const manualCost = FREEZE_SHOP_CONFIG.manual
  const autoCost = FREEZE_SHOP_CONFIG.auto

  const manualCurrency = manualCost.gems ? 'gems' : 'sprouts'
  const autoCurrency = autoCost.gems ? 'gems' : 'sprouts'

  const manualPrice = (manualCost.gems || manualCost.sprouts) ?? 0
  const autoPrice = (autoCost.gems || autoCost.sprouts) ?? 0

  // Проверяем доступность покупки
  const canBuyManual =
    manualCurrency === 'gems'
      ? (userCurrency?.gems || 0) >= manualPrice
      : (userCurrency?.sprouts || 0) >= manualPrice

  const canBuyAuto =
    autoCurrency === 'gems'
      ? (userCurrency?.gems || 0) >= autoPrice
      : (userCurrency?.sprouts || 0) >= autoPrice

  // Проверяем лимит для ручных заморозок
  const isManualAtLimit =
    freezeData !== null &&
    freezeData.manual >= freezeData.max &&
    !freezeData.canAccumulate

  const handleBuyFreeze = async (
    freezeType: FreezeType,
    quantity: number = 1
  ) => {
    // Защита от двойных кликов
    if (isProcessingRef.current || purchasing !== null) {
      console.warn('⚠️ Purchase already in progress, ignoring duplicate click')
      return
    }

    if (!telegramId) {
      console.error('❌ No telegramId available')
      return
    }

    // Блокируем повторные вызовы
    isProcessingRef.current = true
    setPurchasing(freezeType)

    try {
      // API buyStreakFreeze уже списывает валюту на сервере
      // НЕ нужно списывать валюту вручную!
      const result = await buyStreakFreeze({
        telegramId,
        freezeType,
        quantity,
      })

      if (result.success && telegramId) {
        console.log('✅ Freeze purchased successfully:', result.data)

        // Инвалидируем кеш (это обновит данные о заморозках и валюте через React Query)
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ['user', telegramId] }),
          queryClient.invalidateQueries({
            queryKey: ['currency', telegramId],
          }),
          queryClient.invalidateQueries({
            queryKey: ['streak-freezes', telegramId],
          }),
        ])
      } else {
        console.error('❌ Failed to buy freeze:', result.error)
        // TODO: Показать toast с ошибкой
      }
    } catch (error) {
      console.error('💥 Error buying freeze:', error)
      // TODO: Показать toast с ошибкой
    } finally {
      setPurchasing(null)
      // Разблокируем через небольшую задержку для предотвращения двойных кликов
      setTimeout(() => {
        isProcessingRef.current = false
      }, 500)
    }
  }

  return (
    <div className="p-4 sm:p-6">
      {/* Current Freezes Status - Компактная версия */}
      {freezeData && (
        <div className="mb-4 rounded-lg border border-blue-200 bg-blue-50 p-3 dark:border-blue-800 dark:bg-blue-900/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Snowflake className="h-4 w-4 text-blue-500" />
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                Ваши заморозки
              </span>
            </div>
            <div className="flex gap-4 text-sm">
              <div>
                <span className="text-gray-600 dark:text-gray-400">
                  Ручные:{' '}
                </span>
                <span className="font-bold text-gray-900 dark:text-white">
                  {freezeData.manual}/{freezeData.max}
                </span>
              </div>
              <div>
                <span className="text-gray-600 dark:text-gray-400">Авто: </span>
                <span className="font-bold text-gray-900 dark:text-white">
                  {freezeData.auto}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Info Alert - Компактная версия */}
      {/* <div className="mb-4 flex gap-2 rounded-lg border border-yellow-200 bg-yellow-50 p-3 text-xs text-gray-700 dark:border-yellow-800 dark:bg-yellow-900/20 dark:text-gray-300">
        <Info className="h-4 w-4 flex-shrink-0 text-yellow-600 dark:text-yellow-500" />
        <p>
          Заморозки защищают стрик. Ручные - вручную, авто - автоматически при
          пропуске.
        </p>
      </div> */}

      {/* Freeze Products Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {/* Manual Freeze */}
        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Card className="overflow-hidden">
            <div className="bg-gradient-to-br from-blue-500 to-cyan-500 p-6 text-white">
              <div className="flex items-center justify-between">
                <Snowflake className="h-12 w-12" />
                <span className="text-3xl font-bold">
                  {FREEZE_DESCRIPTIONS.manual.emoji}
                </span>
              </div>
            </div>

            <div className="p-4">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                {FREEZE_DESCRIPTIONS.manual.name}
              </h3>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                {FREEZE_DESCRIPTIONS.manual.description}
              </p>

              {/* Features */}
              <ul className="mt-4 space-y-2">
                <li className="flex items-start gap-2 text-sm">
                  <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-500" />
                  <span className="text-gray-700 dark:text-gray-300">
                    Защищает стрик на 1 день
                  </span>
                </li>
                <li className="flex items-start gap-2 text-sm">
                  <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-500" />
                  <span className="text-gray-700 dark:text-gray-300">
                    Используется вручную
                  </span>
                </li>
                <li className="flex items-start gap-2 text-sm">
                  <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-500" />
                  <span className="text-gray-700 dark:text-gray-300">
                    Макс. накопление: {freezeData?.max || 3} шт
                  </span>
                </li>
              </ul>

              {/* Price & Buy Button */}
              <div className="mt-4">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Цена:
                  </span>
                  <div className="flex items-center gap-1">
                    {manualCurrency === 'gems' ? (
                      <Zap className="h-4 w-4 text-blue-500" />
                    ) : (
                      <Leaf className="h-4 w-4 text-green-500" />
                    )}
                    <span className="text-lg font-bold text-gray-900 dark:text-white">
                      {manualPrice}
                    </span>
                  </div>
                </div>

                {isManualAtLimit ? (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    disabled
                  >
                    Достигнут лимит
                  </Button>
                ) : !canBuyManual ? (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    disabled
                  >
                    Недостаточно средств
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    className="w-full"
                    disabled={purchasing === 'manual'}
                    onClick={() => handleBuyFreeze('manual', 1)}
                  >
                    {purchasing === 'manual' ? (
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    ) : (
                      `Купить за ${manualPrice}`
                    )}
                  </Button>
                )}
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Auto Freeze */}
        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Card className="overflow-hidden border-2 border-purple-200 dark:border-purple-800">
            <div className="bg-gradient-to-br from-purple-500 to-pink-500 p-6 text-white">
              <div className="flex items-center justify-between">
                <Zap className="h-12 w-12" />
                <span className="text-3xl font-bold">
                  {FREEZE_DESCRIPTIONS.auto.emoji}
                </span>
              </div>
              <div className="mt-2">
                <span className="rounded-full bg-white/20 px-2 py-1 text-xs font-semibold">
                  ПРЕМИУМ
                </span>
              </div>
            </div>

            <div className="p-4">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                {FREEZE_DESCRIPTIONS.auto.name}
              </h3>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                {FREEZE_DESCRIPTIONS.auto.description}
              </p>

              {/* Features */}
              <ul className="mt-4 space-y-2">
                <li className="flex items-start gap-2 text-sm">
                  <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-500" />
                  <span className="text-gray-700 dark:text-gray-300">
                    Автоматическая защита
                  </span>
                </li>
                <li className="flex items-start gap-2 text-sm">
                  <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-500" />
                  <span className="text-gray-700 dark:text-gray-300">
                    Срабатывает при пропуске
                  </span>
                </li>
                <li className="flex items-start gap-2 text-sm">
                  <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-500" />
                  <span className="text-gray-700 dark:text-gray-300">
                    Без лимита накопления
                  </span>
                </li>
              </ul>

              {/* Price & Buy Button */}
              <div className="mt-4">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Цена:
                  </span>
                  <div className="flex items-center gap-1">
                    {autoCurrency === 'gems' ? (
                      <Zap className="h-4 w-4 text-blue-500" />
                    ) : (
                      <Leaf className="h-4 w-4 text-green-500" />
                    )}
                    <span className="text-lg font-bold text-gray-900 dark:text-white">
                      {autoPrice}
                    </span>
                  </div>
                </div>

                {!canBuyAuto ? (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    disabled
                  >
                    Недостаточно средств
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                    disabled={purchasing === 'auto'}
                    onClick={() => handleBuyFreeze('auto', 1)}
                  >
                    {purchasing === 'auto' ? (
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    ) : (
                      `Купить за ${autoPrice}`
                    )}
                  </Button>
                )}
              </div>
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Additional Info */}
      <div className="mt-4 rounded-lg bg-gray-50 p-4 dark:bg-gray-800">
        <h4 className="mb-1 font-medium text-gray-900 dark:text-white">
          💡 Полезная информация
        </h4>
        <ul className="space-y-1 text-xs text-gray-600 dark:text-gray-400">
          <li>
            • Ручные заморозки можно накапливать до {freezeData?.max || 3} штук
            (зависит от уровня)
          </li>
          <li>• Авто-заморозки используются автоматически при пропуске дня</li>
          <li>• Заморозки защищают ваш стрик от сброса</li>
          <li>
            • Вы можете зарабатывать заморозки бесплатно за повышение уровня
          </li>
        </ul>
      </div>
    </div>
  )
}
