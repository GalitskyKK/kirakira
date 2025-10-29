/**
 * 🛒 КОМПОНЕНТ: Полноценный магазин
 * Магазин с разными разделами: темы, заморозки, улучшения и т.д.
 */

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Palette, Snowflake, Sparkles, Leaf, Zap } from 'lucide-react'

import { ThemeShopSection } from './ThemeShopSection'
import { FreezeShopSection } from './FreezeShopSection'
import { useCurrencyStore } from '@/stores/currencyStore'
import { useTelegramId } from '@/hooks/useTelegramId'

export interface ShopProps {
  readonly isOpen: boolean
  readonly onClose: () => void
  readonly initialTab?: ShopTab
}

export type ShopTab = 'themes' | 'freezes' | 'upgrades'

interface TabConfig {
  readonly id: ShopTab
  readonly label: string
  readonly icon: React.FC<{ className?: string | undefined }>
  readonly badge?: number
}

const SHOP_TABS: readonly TabConfig[] = [
  { id: 'themes', label: 'Темы', icon: Palette },
  { id: 'freezes', label: 'Заморозки', icon: Snowflake },
  // { id: 'upgrades', label: 'Улучшения', icon: Sparkles }, // TODO: В будущем
] as const

export function Shop({ isOpen, onClose, initialTab = 'themes' }: ShopProps) {
  const [activeTab, setActiveTab] = useState<ShopTab>(initialTab)
  const { userCurrency, loadCurrency } = useCurrencyStore()
  const telegramId = useTelegramId()

  // Загружаем валюту при открытии
  useEffect(() => {
    if (isOpen && telegramId) {
      void loadCurrency(telegramId)
    }
  }, [isOpen, telegramId, loadCurrency])

  // Блокируем скролл при открытии модалки
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
      document.body.style.paddingRight = '0px'

      const preventBodyScroll = (e: Event) => {
        const target = e.target as Element
        const modal = document.querySelector('[data-modal="shop"]')
        if (modal && modal.contains(target)) {
          return
        }
        e.preventDefault()
      }

      document.addEventListener('wheel', preventBodyScroll, { passive: false })
      document.addEventListener('touchmove', preventBodyScroll, {
        passive: false,
      })

      return () => {
        document.body.style.overflow = 'unset'
        document.body.style.paddingRight = '0px'
        document.removeEventListener('wheel', preventBodyScroll)
        document.removeEventListener('touchmove', preventBodyScroll)
      }
    } else {
      document.body.style.overflow = 'unset'
      document.body.style.paddingRight = '0px'
      return undefined
    }
  }, [isOpen])

  // Обновляем activeTab при изменении initialTab
  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab)
    }
  }, [isOpen, initialTab])

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        data-modal="shop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        {/* Overlay */}
        <div className="absolute inset-0 mb-14 bg-black/50 backdrop-blur-sm" />

        {/* Modal */}
        <motion.div
          className="relative flex max-h-[80vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-gray-900"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex-shrink-0 border-b border-gray-200 p-4 dark:border-gray-700 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white sm:text-2xl">
                  🛒 Магазин
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Персонализация и улучшения для вашего сада
                </p>
              </div>
              <button
                onClick={onClose}
                className="flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
                aria-label="Закрыть магазин"
              >
                <X className="h-5 w-5 text-gray-500 dark:text-gray-400" />
              </button>
            </div>

            {/* Balance Display */}
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-lg bg-gradient-to-r from-green-50 to-emerald-50 p-3 dark:from-green-900/20 dark:to-emerald-900/20">
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Ростки
                </p>
                <div className="mt-1 flex items-center gap-2">
                  <Leaf className="h-4 w-4 text-green-500" />
                  <span className="text-xl font-bold text-gray-900 dark:text-white">
                    {userCurrency?.sprouts || 0}
                  </span>
                </div>
              </div>

              <div className="rounded-lg bg-gradient-to-r from-blue-50 to-cyan-50 p-3 dark:from-blue-900/20 dark:to-cyan-900/20">
                <p className="text-xs text-gray-600 dark:text-gray-400">Гемы</p>
                <div className="mt-1 flex items-center gap-2">
                  <Zap className="h-4 w-4 text-blue-500" />
                  <span className="text-xl font-bold text-gray-900 dark:text-white">
                    {userCurrency?.gems || 0}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex-shrink-0 border-b border-gray-200 dark:border-gray-700">
            <div className="flex gap-2 overflow-x-auto px-4 sm:px-6">
              {SHOP_TABS.map(tab => {
                const Icon = tab.icon
                const isActive = activeTab === tab.id

                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`relative flex items-center gap-2 whitespace-nowrap px-4 py-3 text-sm font-medium transition-colors ${
                      isActive
                        ? 'text-blue-600 dark:text-blue-400'
                        : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {tab.label}
                    {tab.badge !== undefined && tab.badge > 0 && (
                      <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1.5 text-xs font-bold text-white">
                        {tab.badge}
                      </span>
                    )}
                    {isActive && (
                      <motion.div
                        layoutId="activeTab"
                        className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400"
                        transition={{
                          type: 'spring',
                          stiffness: 500,
                          damping: 30,
                        }}
                      />
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            <AnimatePresence mode="wait">
              {activeTab === 'themes' && (
                <motion.div
                  key="themes"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.2 }}
                >
                  <ThemeShopSection />
                </motion.div>
              )}

              {activeTab === 'freezes' && (
                <motion.div
                  key="freezes"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.2 }}
                >
                  <FreezeShopSection />
                </motion.div>
              )}

              {activeTab === 'upgrades' && (
                <motion.div
                  key="upgrades"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.2 }}
                  className="flex items-center justify-center p-12"
                >
                  <div className="text-center">
                    <Sparkles className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-600" />
                    <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">
                      Скоро появится
                    </h3>
                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                      Улучшения для элементов сада в разработке
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
