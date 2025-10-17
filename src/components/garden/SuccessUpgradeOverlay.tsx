/**
 * 🎉 КОМПОНЕНТ: SuccessUpgradeOverlay
 * Оверлей для показа успешного улучшения элемента
 */

import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle, Sparkles, ArrowLeft } from 'lucide-react'
import { type RarityLevel } from '@/types/garden'
import { useEffect, useState } from 'react'

interface SuccessUpgradeOverlayProps {
  readonly isVisible: boolean
  readonly newRarity: RarityLevel
  readonly xpReward: number
  readonly elementEmoji: string
  readonly onComplete: () => void
  readonly autoReturnDelay?: number
}

export function SuccessUpgradeOverlay({
  isVisible,
  newRarity,
  xpReward,
  elementEmoji,
  onComplete,
  autoReturnDelay = 3000,
}: SuccessUpgradeOverlayProps) {
  const [countdown, setCountdown] = useState(3)

  useEffect(() => {
    if (!isVisible) return

    // Обратный отсчет
    const countdownInterval = setInterval(() => {
      setCountdown(prev => Math.max(0, prev - 1))
    }, 1000)

    // Автоматический возврат
    const timer = setTimeout(() => {
      onComplete()
    }, autoReturnDelay)

    return () => {
      clearInterval(countdownInterval)
      clearTimeout(timer)
    }
  }, [isVisible, onComplete, autoReturnDelay])

  const getRarityLabel = (rarity: RarityLevel): string => {
    switch (rarity) {
      case 'common':
        return 'Обычный'
      case 'uncommon':
        return 'Необычный'
      case 'rare':
        return 'Редкий'
      case 'epic':
        return 'Эпический'
      case 'legendary':
        return 'Легендарный'
      default:
        return 'Обычный'
    }
  }

  const getRarityColor = (rarity: RarityLevel): string => {
    switch (rarity) {
      case 'common':
        return 'from-gray-400 to-gray-600'
      case 'uncommon':
        return 'from-green-400 to-green-600'
      case 'rare':
        return 'from-blue-400 to-blue-600'
      case 'epic':
        return 'from-purple-400 to-purple-600'
      case 'legendary':
        return 'from-yellow-400 via-orange-500 to-red-500'
      default:
        return 'from-gray-400 to-gray-600'
    }
  }

  const getParticleColor = (rarity: RarityLevel): string => {
    switch (rarity) {
      case 'legendary':
        return '#FFD700'
      case 'epic':
        return '#9333EA'
      case 'rare':
        return '#3B82F6'
      case 'uncommon':
        return '#10B981'
      default:
        return '#6B7280'
    }
  }

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-gradient-to-br from-white/95 via-white/90 to-white/95 backdrop-blur-md dark:from-gray-900/95 dark:via-gray-900/90 dark:to-gray-900/95"
        >
          {/* Частицы */}
          <div className="pointer-events-none absolute inset-0">
            {Array.from({ length: 20 }, (_, i) => (
              <motion.div
                key={i}
                initial={{
                  x: '50%',
                  y: '50%',
                  scale: 0,
                  opacity: 0,
                }}
                animate={{
                  x: `${50 + (Math.random() - 0.5) * 100}%`,
                  y: `${50 + (Math.random() - 0.5) * 100}%`,
                  scale: [0, 1, 1, 0],
                  opacity: [0, 1, 1, 0],
                  rotate: Math.random() * 360,
                }}
                transition={{
                  duration: 2 + Math.random(),
                  delay: Math.random() * 0.5,
                  ease: 'easeOut',
                }}
                className="absolute h-2 w-2 rounded-full"
                style={{
                  backgroundColor: getParticleColor(newRarity),
                  boxShadow: `0 0 10px ${getParticleColor(newRarity)}`,
                }}
              />
            ))}
          </div>

          {/* Контент - адаптивный для мобильных */}
          <div className="relative z-10 flex h-full w-full flex-col items-center justify-center px-4 py-4 text-center">
            {/* Скроллируемый контент */}
            <div className="flex max-h-full w-full max-w-sm flex-col items-center justify-center space-y-4 overflow-y-auto">
              {/* Иконка успеха - меньше на мобильных */}
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{
                  type: 'spring',
                  stiffness: 200,
                  damping: 15,
                  delay: 0.1,
                }}
                className="flex justify-center"
              >
                <div className="relative">
                  <CheckCircle className="h-16 w-16 text-green-500 drop-shadow-xl sm:h-20 sm:w-20" />
                  <motion.div
                    animate={{
                      scale: [1, 1.2, 1],
                      opacity: [0.5, 0, 0.5],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: 'easeInOut',
                    }}
                    className="absolute inset-0 rounded-full bg-green-400"
                  />
                </div>
              </motion.div>

              {/* Заголовок - адаптивный размер */}
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-2xl font-bold text-gray-900 dark:text-white sm:text-3xl"
              >
                Улучшение успешно!
              </motion.h2>

              {/* Эмодзи элемента - меньше на мобильных */}
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{
                  type: 'spring',
                  stiffness: 150,
                  damping: 10,
                  delay: 0.3,
                }}
                className="text-6xl sm:text-8xl"
              >
                {elementEmoji}
              </motion.div>

              {/* Новая редкость - адаптивный размер */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4 }}
              >
                <div
                  className={`inline-block rounded-full bg-gradient-to-r ${getRarityColor(newRarity)} px-4 py-2 text-lg font-bold text-white shadow-2xl sm:px-6 sm:py-3 sm:text-xl`}
                >
                  {getRarityLabel(newRarity)}
                </div>
              </motion.div>

              {/* XP награда - адаптивный размер */}
              {xpReward > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-yellow-100 to-orange-100 px-4 py-2 dark:from-yellow-900/30 dark:to-orange-900/30"
                >
                  <Sparkles className="h-4 w-4 text-yellow-600 dark:text-yellow-400 sm:h-5 sm:w-5" />
                  <span className="text-base font-bold text-yellow-700 dark:text-yellow-300 sm:text-lg">
                    +{xpReward} XP
                  </span>
                </motion.div>
              )}

              {/* Обратный отсчет - адаптивный размер */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="flex items-center justify-center gap-2 text-xs text-gray-600 dark:text-gray-400 sm:text-sm"
              >
                <ArrowLeft className="h-3 w-3 sm:h-4 sm:w-4" />
                <span>Возврат в сад через {countdown} сек</span>
              </motion.div>

              {/* Кнопка немедленного возврата - адаптивная */}
              <motion.button
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
                onClick={onComplete}
                className="w-full rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 px-4 py-3 text-sm font-bold text-white shadow-lg transition-transform hover:scale-105 active:scale-95 sm:w-auto sm:px-6"
              >
                Вернуться сейчас
              </motion.button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
