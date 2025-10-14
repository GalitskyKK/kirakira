/**
 * 🎉 КОМПОНЕНТ: UpgradeResultModal
 * Модальное окно отображения результата улучшения элемента
 */

import { motion, AnimatePresence } from 'framer-motion'
import { type GardenElement, type RarityLevel } from '@/types/garden'
import { CheckCircle, XCircle, Sparkles } from 'lucide-react'
import { useState, useEffect } from 'react'
import { UpgradeAnimation } from './UpgradeAnimation'

interface UpgradeResultModalProps {
  readonly isOpen: boolean
  readonly onClose: () => void
  readonly success: boolean
  readonly element: GardenElement
  readonly oldRarity: RarityLevel
  readonly newRarity?: RarityLevel
  readonly xpReward?: number
  readonly progressBonus?: number
  readonly failedAttempts?: number
}

export function UpgradeResultModal({
  isOpen,
  onClose,
  success,
  element,
  newRarity,
  xpReward = 0,
  progressBonus = 0,
  failedAttempts = 0,
}: UpgradeResultModalProps) {
  const [showConfetti, setShowConfetti] = useState(false)
  const [showAnimation, setShowAnimation] = useState(false)

  // Показываем анимацию при успехе
  useEffect(() => {
    if (success && newRarity) {
      setShowAnimation(true)
      const timer = setTimeout(() => setShowAnimation(false), 3500)
      return () => clearTimeout(timer)
    }
    return undefined
  }, [success, newRarity])

  // Показываем конфетти для legendary улучшения
  useEffect(() => {
    if (success && newRarity === 'legendary') {
      setShowConfetti(true)
      const timer = setTimeout(() => setShowConfetti(false), 3000)
      return () => clearTimeout(timer)
    }
    return undefined
  }, [success, newRarity])

  if (!isOpen) return null

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
        return 'text-gray-600 dark:text-gray-400'
      case 'uncommon':
        return 'text-green-600 dark:text-green-400'
      case 'rare':
        return 'text-blue-600 dark:text-blue-400'
      case 'epic':
        return 'text-purple-600 dark:text-purple-400'
      case 'legendary':
        return 'text-yellow-600 dark:text-yellow-400'
      default:
        return 'text-gray-600 dark:text-gray-400'
    }
  }

  return (
    <AnimatePresence>
      {/* Анимация улучшения (поверх модалки) */}
      {showAnimation && newRarity && (
        <UpgradeAnimation
          rarity={newRarity}
          emoji={element.emoji}
          onComplete={() => setShowAnimation(false)}
        />
      )}

      <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        />

        {/* Modal */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.8, opacity: 0, y: 20 }}
          transition={{ type: 'spring', damping: 20, stiffness: 300 }}
          className="relative z-10 w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-gray-800"
        >
          {/* Конфетти для legendary */}
          {showConfetti && (
            <div className="pointer-events-none absolute inset-0 z-20">
              {[...Array(30)].map((_, i) => (
                <motion.div
                  key={i}
                  initial={{
                    x: '50%',
                    y: '50%',
                    scale: 0,
                    rotate: 0,
                  }}
                  animate={{
                    x: `${50 + (Math.random() - 0.5) * 200}%`,
                    y: `${50 + (Math.random() - 0.5) * 200}%`,
                    scale: [0, 1, 1, 0],
                    rotate: Math.random() * 360,
                  }}
                  transition={{
                    duration: 2,
                    delay: Math.random() * 0.3,
                    ease: 'easeOut',
                  }}
                  className="absolute h-3 w-3 rounded-full"
                  style={{
                    backgroundColor: [
                      '#FFD700',
                      '#FFA500',
                      '#FF69B4',
                      '#00CED1',
                    ][Math.floor(Math.random() * 4)],
                  }}
                />
              ))}
            </div>
          )}

          {/* Результат */}
          <div className="p-8 text-center">
            {success && newRarity ? (
              <>
                {/* Успех */}
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{
                    type: 'spring',
                    damping: 15,
                    stiffness: 300,
                    delay: 0.2,
                  }}
                >
                  <CheckCircle className="mx-auto h-20 w-20 text-green-500" />
                </motion.div>

                <motion.h3
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="mt-4 text-2xl font-bold text-gray-800 dark:text-white"
                >
                  Улучшение успешно!
                </motion.h3>

                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="mt-6"
                >
                  {/* Иконка элемента с эффектом */}
                  <motion.div
                    animate={{
                      scale: [1, 1.2, 1],
                      rotate: [0, 10, -10, 0],
                    }}
                    transition={{
                      duration: 0.8,
                      repeat: Infinity,
                      repeatDelay: 2,
                    }}
                    className="mb-4 text-6xl"
                  >
                    {element.emoji}
                  </motion.div>

                  <div
                    className={`text-lg font-bold ${getRarityColor(newRarity)}`}
                  >
                    {getRarityLabel(newRarity)}
                  </div>
                </motion.div>

                {/* Награды */}
                {xpReward > 0 && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.5 }}
                    className="mt-6 flex items-center justify-center gap-2 rounded-full bg-yellow-100 px-6 py-3 dark:bg-yellow-900/30"
                  >
                    <Sparkles className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                    <span className="font-bold text-yellow-700 dark:text-yellow-300">
                      +{xpReward} XP
                    </span>
                  </motion.div>
                )}
              </>
            ) : (
              <>
                {/* Неудача */}
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{
                    type: 'spring',
                    damping: 15,
                    stiffness: 300,
                    delay: 0.2,
                  }}
                >
                  <XCircle className="mx-auto h-20 w-20 text-orange-500" />
                </motion.div>

                <motion.h3
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="mt-4 text-2xl font-bold text-gray-800 dark:text-white"
                >
                  Не получилось...
                </motion.h3>

                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="mt-2 text-sm text-gray-600 dark:text-gray-400"
                >
                  Не расстраивайтесь! Прогресс сохранен.
                </motion.p>

                {/* Прогресс */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="mt-6 rounded-lg bg-purple-100 p-4 dark:bg-purple-900/30"
                >
                  <div className="mb-2 text-sm font-medium text-purple-700 dark:text-purple-300">
                    Прогресс увеличен
                  </div>
                  <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                    +25%
                  </div>
                  <div className="mt-2 text-xs text-purple-600 dark:text-purple-400">
                    Следующая попытка: {progressBonus}% шанс
                  </div>
                </motion.div>

                {/* Мотивация */}
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 }}
                  className="mt-4 text-sm text-gray-500 dark:text-gray-400"
                >
                  {failedAttempts >= 3
                    ? '🔥 Еще одна попытка и успех гарантирован!'
                    : '💪 Попробуйте еще раз!'}
                </motion.p>
              </>
            )}

            {/* Кнопка закрытия */}
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
              onClick={onClose}
              className="mt-6 w-full rounded-lg bg-gray-200 px-6 py-3 font-medium text-gray-700 transition-colors hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
            >
              Закрыть
            </motion.button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
