import React, { useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Star, Gift, Crown, Sparkles, Check } from 'lucide-react'
import { useTelegram, useTelegramButtons } from '@/hooks'
import { usePremiumStore } from '@/stores'
import { Card } from '@/components/ui'

interface PremiumFeature {
  id: string
  name: string
  description: string
  price: number // В Telegram Stars
  icon: React.ReactNode
  benefits: string[]
}

const PREMIUM_FEATURES: PremiumFeature[] = [
  {
    id: 'rare_elements',
    name: 'Редкие элементы сада',
    description: 'Получите доступ к эксклюзивным растениям и кристаллам',
    price: 100,
    icon: <Sparkles className="h-6 w-6" />,
    benefits: [
      'Радужные цветы',
      'Светящиеся кристаллы',
      'Мистические грибы',
      'Эксклюзивные анимации',
    ],
  },
  {
    id: 'seasonal_themes',
    name: 'Сезонные темы',
    description: 'Коллекция тем для разных времен года',
    price: 50,
    icon: <Crown className="h-6 w-6" />,
    benefits: [
      'Весенняя палитра',
      'Летний солнечный сад',
      'Осенние краски',
      'Зимняя сказка',
    ],
  },
]

interface TelegramPremiumProps {
  onPurchaseSuccess?: (featureId: string) => void
  onPurchaseError?: (error: string) => void
}

export function TelegramPremium({
  onPurchaseSuccess,
  onPurchaseError,
}: TelegramPremiumProps) {
  const { webApp, showAlert, showConfirm, hapticFeedback, isTelegramEnv } =
    useTelegram()
  const { setMainButton, hideMainButton } = useTelegramButtons()
  const { unlockFeature, hasFeature } = usePremiumStore()
  const [selectedFeature, setSelectedFeature] = useState<PremiumFeature | null>(
    null
  )
  const [isPurchasing, setIsPurchasing] = useState(false)

  const handleFeatureSelect = useCallback(
    (feature: PremiumFeature) => {
      // Не позволяем выбирать уже купленные функции
      if (hasFeature(feature.id)) {
        hapticFeedback('light')
        showAlert('Эта функция уже куплена!')
        return
      }

      setSelectedFeature(feature)
      hapticFeedback('light')

      if (isTelegramEnv) {
        setMainButton({
          text: `Купить за ${feature.price} ⭐`,
          onClick: () => handlePurchase(feature),
          color: '#FFD700',
          textColor: '#000000',
          isActive: true,
        })
      }
    },
    [hapticFeedback, isTelegramEnv, setMainButton, hasFeature, showAlert]
  )

  const handlePurchase = useCallback(
    async (feature: PremiumFeature) => {
      if (!webApp || isPurchasing) return

      const confirmed = await showConfirm(
        `Вы хотите купить "${feature.name}" за ${feature.price} Telegram Stars?`
      )

      if (!confirmed) return

      setIsPurchasing(true)
      hapticFeedback('medium')

      try {
        // Создаем ссылку на инвойс для Telegram Stars
        const invoiceLink = createStarsInvoiceLink({
          title: feature.name,
          description: feature.description,
          price: feature.price,
          featureId: feature.id,
        })

        // Открываем инвойс через Telegram WebApp API
        webApp.openInvoice(invoiceLink, status => {
          setIsPurchasing(false)
          hideMainButton()

          if (status === 'paid') {
            // Разблокируем премиум функцию
            unlockFeature(feature.id)
            hapticFeedback('success')
            showAlert(
              'Покупка успешно завершена! Премиум функции разблокированы! 🎉'
            )
            onPurchaseSuccess?.(feature.id)
          } else if (status === 'cancelled') {
            hapticFeedback('error')
          } else if (status === 'failed') {
            hapticFeedback('error')
            showAlert('Ошибка при обработке платежа. Попробуйте еще раз.')
            onPurchaseError?.('Payment failed')
          }

          setSelectedFeature(null)
        })
      } catch (error) {
        setIsPurchasing(false)
        hideMainButton()
        hapticFeedback('error')
        showAlert('Произошла ошибка при создании платежа')
        onPurchaseError?.(
          error instanceof Error ? error.message : 'Unknown error'
        )
      }
    },
    [
      webApp,
      isPurchasing,
      showConfirm,
      hapticFeedback,
      showAlert,
      hideMainButton,
      onPurchaseSuccess,
      onPurchaseError,
    ]
  )

  // Создание ссылки на инвойс для Telegram Stars
  const createStarsInvoiceLink = (params: {
    title: string
    description: string
    price: number
    featureId: string
  }) => {
    // В реальном приложении здесь должен быть запрос к вашему бэкенду
    // для создания инвойса через Bot API
    const botUsername = 'KiraKiraGardenBot'
    const startParam = `premium_${params.featureId}_${params.price}`

    return `https://t.me/${botUsername}?start=${startParam}`
  }

  const handleGiftFeature = useCallback(
    async (feature: PremiumFeature) => {
      if (!webApp) return

      const confirmed = await showConfirm(
        `Подарить "${feature.name}" другу за ${feature.price} Telegram Stars?`
      )

      if (confirmed) {
        hapticFeedback('light')
        // Логика для подарка через inline keyboard в боте
        webApp.switchInlineQuery(`gift_${feature.id}`, ['users'])
      }
    },
    [webApp, showConfirm, hapticFeedback]
  )

  if (!isTelegramEnv) {
    return (
      <Card className="p-6 text-center">
        <Star className="mx-auto mb-4 h-12 w-12 text-yellow-500" />
        <h3 className="mb-2 text-lg font-semibold">Премиум функции</h3>
        <p className="text-gray-600">
          Премиум функции доступны только в Telegram Mini App
        </p>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200 }}
          className="mb-4"
        >
          <Star className="mx-auto h-16 w-16 text-yellow-500" />
        </motion.div>
        <h2 className="mb-2 text-2xl font-bold">Премиум возможности</h2>
        <p className="text-gray-600">
          Разблокируйте дополнительные функции с помощью Telegram Stars
        </p>
      </div>

      <div className="grid gap-4">
        {PREMIUM_FEATURES.map((feature, index) => (
          <motion.div
            key={feature.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card
              className={`cursor-pointer transition-all duration-200 ${
                selectedFeature?.id === feature.id
                  ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20'
                  : 'hover:border-gray-300'
              }`}
              onClick={() => handleFeatureSelect(feature)}
            >
              <div className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0 rounded-lg bg-yellow-100 p-2 dark:bg-yellow-900/30">
                      {feature.icon}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold">{feature.name}</h3>
                      <p className="mt-1 text-sm text-gray-600">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end space-y-2">
                    {hasFeature(feature.id) ? (
                      <div className="flex items-center space-x-1 rounded-full bg-green-100 px-3 py-1 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                        <Check className="h-4 w-4" />
                        <span className="text-sm font-medium">Куплено</span>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center space-x-1">
                          <Star className="h-4 w-4 text-yellow-500" />
                          <span className="font-bold">{feature.price}</span>
                        </div>
                        <button
                          onClick={e => {
                            e.stopPropagation()
                            handleGiftFeature(feature)
                          }}
                          className="flex items-center space-x-1 rounded-full bg-blue-100 px-2 py-1 text-xs text-blue-600 hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-400"
                        >
                          <Gift className="h-3 w-3" />
                          <span>Подарить</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {selectedFeature?.id === feature.id && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="mt-4 border-t pt-4"
                  >
                    <h4 className="mb-2 font-medium">Что входит:</h4>
                    <ul className="space-y-1">
                      {feature.benefits.map((benefit, idx) => (
                        <li
                          key={idx}
                          className="flex items-center space-x-2 text-sm"
                        >
                          <Star className="h-3 w-3 text-yellow-500" />
                          <span>{benefit}</span>
                        </li>
                      ))}
                    </ul>
                  </motion.div>
                )}
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {isPurchasing && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
        >
          <Card className="p-6 text-center">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              className="mb-4"
            >
              <Star className="mx-auto h-8 w-8 text-yellow-500" />
            </motion.div>
            <p>Обработка платежа...</p>
          </Card>
        </motion.div>
      )}
    </div>
  )
}
