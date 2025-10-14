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
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative z-10 max-h-[80vh] w-full max-w-sm overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-gray-800"
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
          <div className="max-h-[calc(80vh-40px)] overflow-y-auto p-6 text-center">
            {success && newRarity ? (
              <>
                {/* Успех */}
                <CheckCircle className="mx-auto h-16 w-16 text-green-500" />

                <h3 className="mt-3 text-xl font-bold text-gray-800 dark:text-white">
                  Успешно!
                </h3>

                <div className="mt-4">
                  <div className="mb-2 text-4xl">{element.emoji}</div>
                  <div
                    className={`text-base font-bold ${getRarityColor(newRarity)}`}
                  >
                    {getRarityLabel(newRarity)}
                  </div>
                </div>

                {/* Награды */}
                {xpReward > 0 && (
                  <div className="mt-4 flex items-center justify-center gap-2 rounded-full bg-yellow-100 px-4 py-2 dark:bg-yellow-900/30">
                    <Sparkles className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                    <span className="text-sm font-bold text-yellow-700 dark:text-yellow-300">
                      +{xpReward} XP
                    </span>
                  </div>
                )}
              </>
            ) : (
              <>
                {/* Неудача */}
                <XCircle className="mx-auto h-16 w-16 text-orange-500" />

                <h3 className="mt-3 text-xl font-bold text-gray-800 dark:text-white">
                  Не получилось
                </h3>

                <p className="mt-2 text-xs text-gray-600 dark:text-gray-400">
                  Прогресс сохранен!
                </p>

                {/* Прогресс */}
                <div className="mt-4 rounded-lg bg-purple-100 p-3 dark:bg-purple-900/30">
                  <div className="mb-1 text-xs font-medium text-purple-700 dark:text-purple-300">
                    Прогресс увеличен
                  </div>
                  <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                    +25%
                  </div>
                  <div className="mt-1 text-xs text-purple-600 dark:text-purple-400">
                    Следующий шанс: {progressBonus}%
                  </div>
                </div>

                {/* Мотивация */}
                <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">
                  {failedAttempts >= 3
                    ? '🔥 Еще попытка = успех!'
                    : '💪 Попробуй еще!'}
                </p>
              </>
            )}

            {/* Кнопка закрытия */}
            <button
              onClick={onClose}
              className="mt-4 w-full rounded-xl bg-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
            >
              Закрыть
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
