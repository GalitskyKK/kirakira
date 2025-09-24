import React, { useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Star, Gift, Crown, Sparkles, Check } from 'lucide-react'
import { useTelegram, useTelegramButtons } from '@/hooks'
import { usePremiumStore } from '@/stores'
import { Card } from '@/components/ui'
import {
  PAYMENT_CONFIG,
  getPurchaseButtonText,
  getPurchaseButtonColor,
} from '@/config/payment'

interface PremiumFeature {
  id: string
  name: string
  description: string
  price: number // В рублях (или Stars если доступны)
  icon: React.ReactNode
  benefits: string[]
}

// Определяем цены в зависимости от доступности Telegram Stars
const PREMIUM_FEATURES: PremiumFeature[] = [
  {
    id: 'rare_elements',
    name: 'Редкие элементы сада',
    description: 'Получите доступ к эксклюзивным растениям и кристаллам',
    price: 199, // 199 рублей (было 100 Stars)
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
    price: 99, // 99 рублей (было 50 Stars)
    icon: <Crown className="h-6 w-6" />,
    benefits: [
      'Весенняя палитра',
      'Летний солнечный сад',
      'Осенние краски',
      'Зимняя сказка',
    ],
  },
  {
    id: 'premium_bundle',
    name: 'Премиум комплект',
    description: 'Все премиум функции в одном пакете со скидкой',
    price: 249, // 249 рублей (было 120 Stars)
    icon: <Gift className="h-6 w-6" />,
    benefits: [
      'Все редкие элементы',
      'Все сезонные темы',
      'Эксклюзивная аналитика',
      'Приоритетная поддержка',
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

  // Демо состояние пользователя (в реальном приложении из localStorage/Supabase)
  const [userPremiumState] = useState<UserPremiumState>({
    registrationDate: new Date(
      Date.now() - 10 * 24 * 60 * 60 * 1000
    ).toISOString(), // 10 дней назад для демо
    activations: {},
    tasksCompleted: {
      moodStreakDays: 1,
      gardenVisits: 3,
      sharingCount: 0,
    },
  })

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
        const buttonConfig = getPurchaseButtonColor()
        let buttonText = getPurchaseButtonText(feature.price)

        if (PAYMENT_CONFIG.DEMO_MODE) {
          const accessCheck = canAccessPremiumForFree(
            userPremiumState,
            feature.id
          )
          if (accessCheck.canAccess) {
            buttonText = `🎁 Получить бесплатно`
          } else {
            buttonText = `🔒 Премиум недоступен`
          }
        }

        setMainButton({
          text: buttonText,
          onClick: () => handlePurchase(feature),
          color: buttonConfig.color,
          textColor: buttonConfig.textColor,
          isActive: true,
        })
      }
    },
    [hapticFeedback, isTelegramEnv, setMainButton, hasFeature, showAlert]
  )

  const handlePurchase = useCallback(
    async (feature: PremiumFeature) => {
      if (!webApp || isPurchasing) return

      if (PAYMENT_CONFIG.DEMO_MODE) {
        // Проверяем ограничения демо-режима
        const accessCheck = canAccessPremiumForFree(
          userPremiumState,
          feature.id
        )

        if (!accessCheck.canAccess) {
          // Нет доступа - показываем варианты
          const nextOpportunity = getNextFreeOpportunity(userPremiumState)
          const tasks = getAvailableTasks(userPremiumState)
          const incompleteTasks = tasks.filter(task => !task.completed)

          let message = `🔒 Премиум функция недоступна\n\n`

          if (incompleteTasks.length > 0) {
            message += `💡 Как получить бесплатно:\n`
            incompleteTasks.slice(0, 2).forEach(task => {
              message += `• ${task.title}: ${task.progress}/${task.total}\n`
            })
            message += `\n🎁 Или дождитесь счастливых часов: 20:00-21:00 МСК`
          } else {
            message += `🎁 ${nextOpportunity}\n\n💰 Или купите полный доступ за ${feature.price} ₽`
          }

          await showAlert(message)
          return
        }

        // Есть доступ - показываем причину
        const confirmed = await showConfirm(
          `🎁 ${accessCheck.details}\n\nПолучить "${feature.name}" бесплатно?`
        )

        if (!confirmed) return

        setIsPurchasing(true)
        hapticFeedback('medium')

        // Активируем с задержкой для эффекта
        setTimeout(() => {
          setIsPurchasing(false)
          hideMainButton()

          unlockFeature(feature.id)
          hapticFeedback('success')

          // Обновляем состояние пользователя
          if (accessCheck.reason === 'free_activation') {
            userPremiumState.activations[feature.id] =
              (userPremiumState.activations[feature.id] || 0) + 1
          } else if (accessCheck.reason === 'happy_hour') {
            userPremiumState.lastHappyHourUsed = new Date().toISOString()
          }

          showAlert(
            `🎉 "${feature.name}" активирован!\n\n${accessCheck.details}`
          )

          onPurchaseSuccess?.(feature.id)
          setSelectedFeature(null)
        }, 1000)
      } else {
        // Реальные платежи
        const confirmed = await showConfirm(
          `Вы хотите купить "${feature.name}" за ${feature.price} ₽?`
        )

        if (!confirmed) return

        setIsPurchasing(true)
        hapticFeedback('medium')

        try {
          const invoiceResponse = await createPremiumInvoice(feature)

          if (!invoiceResponse.success) {
            throw new Error(invoiceResponse.error || 'Failed to create invoice')
          }

          webApp.openInvoice(invoiceResponse.invoiceLink, status => {
            setIsPurchasing(false)
            hideMainButton()

            if (status === 'paid') {
              unlockFeature(feature.id)
              hapticFeedback('success')
              showAlert(
                'Покупка успешно завершена! Премиум функции активированы! 🎉'
              )
              onPurchaseSuccess?.(feature.id)
            } else if (status === 'cancelled') {
              hapticFeedback('light')
              showAlert('Платёж отменён')
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
      }
    },
    [
      webApp,
      isPurchasing,
      showConfirm,
      hapticFeedback,
      showAlert,
      hideMainButton,
      unlockFeature,
      onPurchaseSuccess,
      onPurchaseError,
    ]
  )

  // Создание реального инвойса через API
  const createPremiumInvoice = async (feature: PremiumFeature) => {
    try {
      // Сначала пробуем Telegram Stars, затем ЮKassa
      let response = await fetch('/api/telegram/create-invoice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          featureId: feature.id,
          title: feature.name,
          description: feature.description,
          price: feature.price,
        }),
      })

      // Если Stars недоступны, используем ЮKassa
      if (!response.ok) {
        console.log('Telegram Stars недоступны, используем ЮKassa')
        response = await fetch('/api/telegram/create-yukassa-invoice', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            featureId: feature.id,
            title: feature.name,
            description: feature.description,
            price: feature.price,
          }),
        })
      }

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || `HTTP ${response.status}`)
      }

      return { success: true, invoiceLink: result.invoiceUrl }
    } catch (error) {
      console.error('Error creating premium invoice:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  const handleGiftFeature = useCallback(
    async (feature: PremiumFeature) => {
      if (!webApp) return

      const confirmed = await showConfirm(
        `Подарить "${feature.name}" другу за ${feature.price} ₽?`
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
          {PAYMENT_CONFIG.DEMO_MODE
            ? PAYMENT_CONFIG.DEMO_MESSAGE
            : PAYMENT_CONFIG.REAL_PAYMENT_MESSAGE}
        </p>
      </div>

      {/* Панель заданий в демо-режиме */}
      {PAYMENT_CONFIG.DEMO_MODE && (
        <TasksPanel
          userState={userPremiumState}
          onTaskComplete={taskId => {
            // Обновляем время получения награды
            userPremiumState.tasksCompleted.lastTaskRewardTime =
              new Date().toISOString()
            hapticFeedback('success')
            showAlert('🎉 Премиум доступ получен на 24 часа!')
          }}
        />
      )}

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
                        <div className="flex flex-col items-end space-y-1">
                          {PAYMENT_CONFIG.DEMO_MODE ? (
                            (() => {
                              const accessCheck = canAccessPremiumForFree(
                                userPremiumState,
                                feature.id
                              )
                              if (accessCheck.canAccess) {
                                return (
                                  <>
                                    <span className="text-sm text-gray-500 line-through">
                                      {feature.price} ₽
                                    </span>
                                    <span className="text-sm font-bold text-green-600">
                                      {accessCheck.reason === 'trial' &&
                                        '🎁 ПРОБНЫЙ ПЕРИОД'}
                                      {accessCheck.reason === 'happy_hour' &&
                                        '⏰ СЧАСТЛИВЫЙ ЧАС'}
                                      {accessCheck.reason === 'task_reward' &&
                                        '🏆 НАГРАДА'}
                                      {accessCheck.reason ===
                                        'free_activation' && '🆓 БЕСПЛАТНО'}
                                    </span>
                                  </>
                                )
                              } else {
                                const activationsUsed =
                                  userPremiumState.activations[feature.id] || 0
                                const activationsLeft =
                                  PAYMENT_CONFIG.DEMO_LIMITS
                                    .FREE_ACTIVATIONS_PER_FEATURE -
                                  activationsUsed
                                return (
                                  <>
                                    <span className="text-lg font-bold">
                                      {feature.price} ₽
                                    </span>
                                    {activationsLeft > 0 && (
                                      <span className="text-xs text-blue-600">
                                        {activationsLeft} бесплатно осталось
                                      </span>
                                    )}
                                  </>
                                )
                              }
                            })()
                          ) : (
                            <span className="text-lg font-bold">
                              {feature.price} ₽
                            </span>
                          )}
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
