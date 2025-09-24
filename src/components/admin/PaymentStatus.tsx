/**
 * Компонент для отображения статуса платежной системы
 * Полезно для админки или диагностики
 */

import React from 'react'
import { motion } from 'framer-motion'
import { Check, X, Clock, AlertTriangle } from 'lucide-react'
import { Card } from '@/components/ui'
import {
  PAYMENT_CONFIG,
  getAvailablePaymentMethods,
  isPaymentSystemReady,
} from '@/config/payment'

export function PaymentStatus() {
  const availableMethods = getAvailablePaymentMethods()
  const isReady = isPaymentSystemReady()

  return (
    <Card className="p-6">
      <div className="mb-4">
        <h3 className="flex items-center space-x-2 text-lg font-semibold">
          <span>💳 Статус платежной системы</span>
          {isReady ? (
            <Check className="h-5 w-5 text-green-500" />
          ) : (
            <Clock className="h-5 w-5 text-yellow-500" />
          )}
        </h3>
      </div>

      <div className="space-y-4">
        {/* Текущий режим */}
        <div className="flex items-center justify-between rounded-lg bg-gray-50 p-3 dark:bg-gray-800">
          <span className="font-medium">Режим работы:</span>
          <div className="flex items-center space-x-2">
            {PAYMENT_CONFIG.DEMO_MODE ? (
              <>
                <span className="rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-800 dark:bg-green-900/30 dark:text-green-400">
                  🎁 ДЕМО
                </span>
                <span className="text-sm text-gray-600">
                  Бесплатно для пользователей
                </span>
              </>
            ) : (
              <>
                <span className="rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                  💰 ПРОДАКШН
                </span>
                <span className="text-sm text-gray-600">Реальные платежи</span>
              </>
            )}
          </div>
        </div>

        {/* Доступные методы оплаты */}
        <div>
          <h4 className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
            Доступные методы оплаты:
          </h4>
          <div className="space-y-2">
            {availableMethods.map(method => (
              <motion.div
                key={method}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center space-x-3"
              >
                <Check className="h-4 w-4 text-green-500" />
                <span className="text-sm">
                  {method === 'demo' && '🎁 Демо-режим (бесплатно)'}
                  {method === 'telegram_stars' && '⭐ Telegram Stars'}
                  {method === 'yukassa' && '💳 ЮKassa'}
                </span>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Статус интеграций */}
        <div>
          <h4 className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
            Статус интеграций:
          </h4>
          <div className="space-y-2">
            {/* Telegram Stars */}
            <div className="flex items-center justify-between">
              <span className="text-sm">Telegram Stars</span>
              <div className="flex items-center space-x-2">
                {PAYMENT_CONFIG.ENABLE_TELEGRAM_STARS ? (
                  <Check className="h-4 w-4 text-green-500" />
                ) : (
                  <X className="h-4 w-4 text-red-500" />
                )}
                <span className="text-xs text-gray-500">
                  {PAYMENT_CONFIG.ENABLE_TELEGRAM_STARS
                    ? 'Включено'
                    : 'Отключено'}
                </span>
              </div>
            </div>

            {/* ЮKassa */}
            <div className="flex items-center justify-between">
              <span className="text-sm">ЮKassa</span>
              <div className="flex items-center space-x-2">
                {PAYMENT_CONFIG.ENABLE_YUKASSA ? (
                  <Check className="h-4 w-4 text-green-500" />
                ) : (
                  <X className="h-4 w-4 text-red-500" />
                )}
                <span className="text-xs text-gray-500">
                  {PAYMENT_CONFIG.ENABLE_YUKASSA ? 'Включено' : 'Отключено'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Цены */}
        <div>
          <h4 className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
            Текущие цены:
          </h4>
          <div className="grid grid-cols-3 gap-2 text-sm">
            <div className="text-center">
              <div className="font-medium">Редкие элементы</div>
              <div
                className={
                  PAYMENT_CONFIG.DEMO_MODE ? 'text-green-600 line-through' : ''
                }
              >
                {PAYMENT_CONFIG.PRICES.rare_elements}₽
              </div>
              {PAYMENT_CONFIG.DEMO_MODE && (
                <div className="font-bold text-green-600">БЕСПЛАТНО</div>
              )}
            </div>
            <div className="text-center">
              <div className="font-medium">Сезонные темы</div>
              <div
                className={
                  PAYMENT_CONFIG.DEMO_MODE ? 'text-green-600 line-through' : ''
                }
              >
                {PAYMENT_CONFIG.PRICES.seasonal_themes}₽
              </div>
              {PAYMENT_CONFIG.DEMO_MODE && (
                <div className="font-bold text-green-600">БЕСПЛАТНО</div>
              )}
            </div>
            <div className="text-center">
              <div className="font-medium">Премиум комплект</div>
              <div
                className={
                  PAYMENT_CONFIG.DEMO_MODE ? 'text-green-600 line-through' : ''
                }
              >
                {PAYMENT_CONFIG.PRICES.premium_bundle}₽
              </div>
              {PAYMENT_CONFIG.DEMO_MODE && (
                <div className="font-bold text-green-600">БЕСПЛАТНО</div>
              )}
            </div>
          </div>
        </div>

        {/* Предупреждения */}
        {PAYMENT_CONFIG.DEMO_MODE && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-start space-x-3 rounded-lg bg-yellow-50 p-3 dark:bg-yellow-900/20"
          >
            <AlertTriangle className="mt-0.5 h-4 w-4 text-yellow-600" />
            <div className="text-sm">
              <div className="font-medium text-yellow-800 dark:text-yellow-400">
                Демо-режим активен
              </div>
              <div className="text-yellow-700 dark:text-yellow-500">
                Пользователи получают премиум функции бесплатно. Для включения
                реальных платежей нужно оформить ИП/самозанятость.
              </div>
            </div>
          </motion.div>
        )}

        {/* Инструкции */}
        <div className="rounded-lg bg-blue-50 p-3 dark:bg-blue-900/20">
          <div className="text-sm">
            <div className="mb-1 font-medium text-blue-800 dark:text-blue-400">
              💡 Как включить реальные платежи:
            </div>
            <ol className="list-inside list-decimal space-y-1 text-xs text-blue-700 dark:text-blue-500">
              <li>Оформить ИП или самозанятость</li>
              <li>Зарегистрироваться в ЮKassa</li>
              <li>Получить Provider Token</li>
              <li>Изменить DEMO_MODE: false в src/config/payment.ts</li>
              <li>Добавить токены в environment variables</li>
            </ol>
          </div>
        </div>
      </div>
    </Card>
  )
}
