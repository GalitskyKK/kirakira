/**
 * 🎯 QUEST REWARD MODAL COMPONENT
 * Модальное окно для отображения полученных наград
 */

import { useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import type { QuestRewards } from '@/types/dailyQuests'

interface QuestRewardModalProps {
  readonly rewards: QuestRewards
  readonly isOpen?: boolean
  readonly onClose: () => void
  readonly className?: string
}

export function QuestRewardModal({
  rewards,
  isOpen = true,
  onClose,
}: QuestRewardModalProps) {
  // 🔑 Стабильная ссылка на onClose для предотвращения пересоздания таймера
  const onCloseRef = useRef(onClose)
  useEffect(() => {
    onCloseRef.current = onClose
  }, [onClose])

  // Автоматически закрываем модалку через 3 секунды (запускается только один раз при открытии)
  useEffect(() => {
    if (!isOpen) return

    console.log('🎁 Quest reward modal opened, setting close timer...')
    const timer = setTimeout(() => {
      console.log('⏰ Auto-closing quest reward modal')
      onCloseRef.current()
    }, 3000)

    return () => {
      console.log('🧹 Clearing quest reward modal timer')
      clearTimeout(timer)
    }
  }, [isOpen]) // 🔑 Только isOpen в зависимостях - таймер запустится один раз при открытии

  if (!isOpen) return null

  return (
    <AnimatePresence>
      {isOpen && (
        <Modal isOpen={isOpen} onClose={onClose} className="z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="relative mx-4 max-w-md overflow-hidden rounded-2xl bg-white p-8 text-center dark:bg-gray-800"
          >
            {/* Confetti эффект */}
            <div className="pointer-events-none absolute inset-0">
              {[...Array(20)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute h-2 w-2 rounded-full bg-yellow-400"
                  initial={{
                    x: '50%',
                    y: '50%',
                    scale: 0,
                    rotate: 0,
                  }}
                  animate={{
                    x: `${Math.random() * 100}%`,
                    y: `${Math.random() * 100}%`,
                    scale: [0, 1, 0],
                    rotate: 360,
                  }}
                  transition={{
                    duration: 2,
                    delay: i * 0.1,
                    ease: 'easeOut',
                  }}
                />
              ))}
            </div>

            {/* Основной контент */}
            <div className="relative z-10">
              {/* Иконка награды */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{
                  duration: 0.5,
                  delay: 0.2,
                  type: 'spring',
                  stiffness: 200,
                }}
                className="mb-4 text-6xl"
              >
                🎁
              </motion.div>

              {/* Заголовок */}
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="mb-2 text-2xl font-bold text-gray-900 dark:text-gray-100"
              >
                Награда получена!
              </motion.h2>

              {/* Описание награды */}
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                className="mb-6 text-gray-600 dark:text-gray-400"
              >
                {rewards.description}
              </motion.p>

              {/* Детали наград */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.5 }}
                className="mb-6 space-y-3"
              >
                {/* Ростки */}
                <div className="flex items-center justify-center space-x-2">
                  <span className="text-2xl">🌿</span>
                  <span className="text-xl font-semibold text-green-600 dark:text-green-400">
                    +{rewards.sprouts}
                  </span>
                  <span className="text-gray-600 dark:text-gray-400">
                    ростков
                  </span>
                </div>

                {/* Кристаллы */}
                {rewards.gems && rewards.gems > 0 && (
                  <div className="flex items-center justify-center space-x-2">
                    <span className="text-2xl">💎</span>
                    <span className="text-xl font-semibold text-purple-600 dark:text-purple-400">
                      +{rewards.gems}
                    </span>
                    <span className="text-gray-600 dark:text-gray-400">
                      кристаллов
                    </span>
                  </div>
                )}

                {/* Опыт */}
                <div className="flex items-center justify-center space-x-2">
                  <span className="text-2xl">⭐</span>
                  <span className="text-xl font-semibold text-yellow-600 dark:text-yellow-400">
                    +{rewards.experience}
                  </span>
                  <span className="text-gray-600 dark:text-gray-400">
                    опыта
                  </span>
                </div>
              </motion.div>

              {/* Кнопка закрытия */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.6 }}
              >
                <Button
                  onClick={onClose}
                  className="rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 px-6 py-2 font-semibold text-white hover:from-purple-600 hover:to-pink-600"
                >
                  Отлично!
                </Button>
              </motion.div>

              {/* Таймер автозакрытия */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 1 }}
                className="mt-4 text-xs text-gray-500 dark:text-gray-400"
              >
                Закроется автоматически через 3 секунды
              </motion.div>
            </div>

            {/* Декоративные элементы */}
            <div className="absolute left-4 top-4 text-2xl opacity-20">✨</div>
            <div className="absolute right-4 top-4 text-2xl opacity-20">✨</div>
            <div className="absolute bottom-4 left-4 text-2xl opacity-20">
              ✨
            </div>
            <div className="absolute bottom-4 right-4 text-2xl opacity-20">
              ✨
            </div>
          </motion.div>
        </Modal>
      )}
    </AnimatePresence>
  )
}
