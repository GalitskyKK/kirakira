/**
 * 🎉 КОМПОНЕНТ: LevelUpModal
 * Модальное окно для отображения повышения уровня с наградами
 */

import { motion, AnimatePresence } from 'framer-motion'
import type { GardenerLevel } from '@/types'

interface LevelUpModalProps {
  readonly isOpen: boolean
  readonly onClose: () => void
  readonly oldLevel: GardenerLevel
  readonly newLevel: GardenerLevel
  readonly sproutReward?: number
  readonly gemReward?: number
  readonly specialUnlock?: string
}

export function LevelUpModal({
  isOpen,
  onClose,
  oldLevel,
  newLevel,
  sproutReward = 0,
  gemReward = 0,
  specialUnlock,
}: LevelUpModalProps) {
  if (!isOpen) return null

  return (
    <AnimatePresence>
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
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative z-10 w-full max-w-md overflow-hidden rounded-2xl bg-gradient-to-br from-white to-purple-50 shadow-2xl dark:from-gray-800 dark:to-purple-900/20"
        >
          {/* Confetti Effect */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            {Array.from({ length: 50 }).map((_, i) => (
              <motion.div
                key={i}
                className="absolute h-2 w-2 rounded-full"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: '-10%',
                  backgroundColor: [
                    '#FFD700',
                    '#FF69B4',
                    '#00CED1',
                    '#FF6347',
                    '#9370DB',
                  ][Math.floor(Math.random() * 5)],
                }}
                animate={{
                  y: [0, 500],
                  x: [0, (Math.random() - 0.5) * 200],
                  rotate: [0, 360 * (Math.random() > 0.5 ? 1 : -1)],
                  opacity: [1, 0],
                }}
                transition={{
                  duration: 2 + Math.random() * 2,
                  delay: Math.random() * 0.5,
                  ease: 'easeOut',
                }}
              />
            ))}
          </div>

          {/* Content */}
          <div className="relative p-8 text-center">
            {/* Level Up Title */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring' }}
            >
              <h2 className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-3xl font-bold text-transparent">
                Повышение уровня! 🎉
              </h2>
            </motion.div>

            {/* Level Transition */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="my-8 flex items-center justify-center gap-4"
            >
              {/* Old Level */}
              <div className="flex flex-col items-center">
                <div className="mb-2 text-4xl">{oldLevel.emoji}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {oldLevel.name}
                </div>
                <div className="text-xs text-gray-500">
                  Ур. {oldLevel.level}
                </div>
              </div>

              {/* Arrow */}
              <motion.div
                animate={{ x: [0, 10, 0] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
                className="text-3xl text-purple-500"
              >
                →
              </motion.div>

              {/* New Level */}
              <div className="flex flex-col items-center">
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                  className="mb-2 text-5xl"
                >
                  {newLevel.emoji}
                </motion.div>
                <div className="text-base font-semibold text-purple-600 dark:text-purple-400">
                  {newLevel.name}
                </div>
                <div className="text-sm font-medium text-purple-500">
                  Ур. {newLevel.level}
                </div>
              </div>
            </motion.div>

            {/* Rewards */}
            {(sproutReward > 0 || gemReward > 0) && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="mb-6 space-y-3"
              >
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                  Награды
                </h3>
                <div className="flex items-center justify-center gap-4">
                  {sproutReward > 0 && (
                    <motion.div
                      whileHover={{ scale: 1.1 }}
                      className="flex items-center gap-2 rounded-full bg-green-100 px-4 py-2 dark:bg-green-900/30"
                    >
                      <span className="text-2xl">🌿</span>
                      <span className="font-bold text-green-700 dark:text-green-400">
                        +{sproutReward}
                      </span>
                    </motion.div>
                  )}
                  {gemReward > 0 && (
                    <motion.div
                      whileHover={{ scale: 1.1 }}
                      className="flex items-center gap-2 rounded-full bg-blue-100 px-4 py-2 dark:bg-blue-900/30"
                    >
                      <span className="text-2xl">💎</span>
                      <span className="font-bold text-blue-700 dark:text-blue-400">
                        +{gemReward}
                      </span>
                    </motion.div>
                  )}
                </div>
              </motion.div>
            )}

            {/* Special Unlock */}
            {specialUnlock && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.8 }}
                className="mb-6 rounded-xl bg-gradient-to-r from-yellow-100 to-orange-100 p-4 dark:from-yellow-900/30 dark:to-orange-900/30"
              >
                <div className="mb-2 flex items-center justify-center gap-2">
                  <span className="text-2xl">✨</span>
                  <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Особая разблокировка
                  </h4>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {specialUnlock}
                </p>
              </motion.div>
            )}

            {/* New Benefits */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1 }}
              className="mb-6"
            >
              <h3 className="mb-3 text-sm font-semibold text-gray-700 dark:text-gray-300">
                Новые возможности
              </h3>
              <div className="space-y-2 text-left">
                {newLevel.benefits.slice(0, 3).map((benefit, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 1 + index * 0.1 }}
                    className="flex items-start gap-2 rounded-lg bg-white/50 p-2 text-sm dark:bg-gray-800/50"
                  >
                    <span className="text-purple-500">✓</span>
                    <span className="text-gray-700 dark:text-gray-300">
                      {benefit}
                    </span>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Close Button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onClose}
              className="w-full rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 py-3 font-semibold text-white shadow-lg transition-shadow hover:shadow-xl"
            >
              Продолжить
            </motion.button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
