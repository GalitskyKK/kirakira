/**
 * 🎉 КОМПОНЕНТ: SuccessUpgradeOverlay
 * Оверлей для показа успешного улучшения элемента
 */

import { motion } from 'framer-motion'
import { Sparkles } from 'lucide-react'
import { type RarityLevel } from '@/types/garden'
import { useEffect, useState } from 'react'
import { Modal, ModalBody } from '@/components/ui/Modal'

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
    if (!isVisible) {
      setCountdown(3)
      return
    }

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
    <Modal
      isOpen={isVisible}
      onClose={onComplete}
      size="sm"
      title="Улучшение успешно!"
      closeOnOverlayClick
    >
      <ModalBody className="relative overflow-hidden bg-white dark:bg-gray-800">
        {/* Фоновый градиент редкости */}
        <div
          className={`absolute inset-x-0 top-0 h-32 bg-gradient-to-b ${getRarityColor(newRarity)} opacity-20 blur-xl`}
        />

        {/* Частицы */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl">
          {Array.from({ length: 15 }, (_, i) => (
            <motion.div
              key={i}
              initial={{
                x: '50%',
                y: '50%',
                scale: 0,
                opacity: 0,
              }}
              animate={{
                x: `${Math.random() * 100}%`,
                y: `${Math.random() * 100}%`,
                scale: [0, 1, 0],
                opacity: [0, 0.8, 0],
              }}
              transition={{
                duration: 1.5 + Math.random(),
                delay: Math.random() * 0.3,
                ease: 'easeOut',
              }}
              className="absolute h-1.5 w-1.5 rounded-full"
              style={{
                backgroundColor: getParticleColor(newRarity),
                boxShadow: `0 0 8px ${getParticleColor(newRarity)}`,
              }}
            />
          ))}
        </div>

        <div className="relative z-10 flex flex-col items-center gap-4 px-6 py-8 text-center">
          {/* Иконка успеха */}
          {/* <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{
              type: 'spring',
              stiffness: 200,
              damping: 15,
              delay: 0.1,
            }}
          >
            <div className="relative">
              <CheckCircle className="h-14 w-14 text-green-500 drop-shadow-lg" />
              <motion.div
                animate={{
                  scale: [1, 1.3, 1],
                  opacity: [0.4, 0, 0.4],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
                className="absolute inset-0 -z-10 rounded-full bg-green-400 blur-md"
              />
            </div>
          </motion.div> */}

          {/* Эмодзи элемента */}
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{
              type: 'spring',
              stiffness: 150,
              damping: 10,
              delay: 0.3,
            }}
            className="text-6xl leading-none"
          >
            {elementEmoji}
          </motion.div>

          {/* Новая редкость */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4, type: 'spring' }}
          >
            <div
              className={`inline-flex items-center gap-2 rounded-full bg-gradient-to-r ${getRarityColor(newRarity)} px-5 py-2 text-base font-bold text-white shadow-lg`}
            >
              <Sparkles className="h-4 w-4" />
              {getRarityLabel(newRarity)}
            </div>
          </motion.div>

          {/* XP награда */}
          {xpReward > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-yellow-50 to-orange-50 px-4 py-2 dark:from-yellow-900/20 dark:to-orange-900/20"
            >
              <Sparkles className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
              <span className="text-sm font-bold text-yellow-700 dark:text-yellow-300">
                +{xpReward} опыта
              </span>
            </motion.div>
          )}

          {/* Разделитель */}
          <div className="h-px w-full bg-gradient-to-r from-transparent via-gray-300 to-transparent dark:via-gray-600" />

          {/* Обратный отсчет */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="text-xs text-gray-500 dark:text-gray-400"
          >
            Автозакрытие через {countdown} сек
          </motion.div>

          {/* Кнопка возврата */}
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            onClick={onComplete}
            className="w-full rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 px-6 py-3 text-sm font-bold text-white shadow-md transition-all hover:shadow-lg active:scale-95"
          >
            Вернуться в сад
          </motion.button>
        </div>
      </ModalBody>
    </Modal>
  )
}
