/**
 * ✨ КОМПОНЕНТ: UpgradeAnimation
 * Анимации улучшения элементов для разных уровней редкости
 */

import { motion } from 'framer-motion'
import { type RarityLevel } from '@/types/garden'

interface UpgradeAnimationProps {
  readonly rarity: RarityLevel
  readonly emoji: string
  readonly onComplete?: () => void
}

export function UpgradeAnimation({
  rarity,
  emoji,
  onComplete,
}: UpgradeAnimationProps) {
  const getAnimationVariants = (rarity: RarityLevel) => {
    switch (rarity) {
      case 'uncommon':
        return {
          // Зеленое свечение + fade-in
          initial: { opacity: 0, scale: 0.5 },
          animate: {
            opacity: [0, 1, 1, 0],
            scale: [0.5, 1.2, 1, 1],
            filter: [
              'brightness(1) drop-shadow(0 0 0px #22c55e)',
              'brightness(1.5) drop-shadow(0 0 20px #22c55e)',
              'brightness(1.2) drop-shadow(0 0 10px #22c55e)',
              'brightness(1) drop-shadow(0 0 0px #22c55e)',
            ],
          },
          transition: {
            duration: 1.5,
            times: [0, 0.3, 0.7, 1],
            ease: 'easeInOut',
          },
        }

      case 'rare':
        return {
          // Синее свечение + scale-up
          initial: { opacity: 0, scale: 0.3, rotate: -180 },
          animate: {
            opacity: [0, 1, 1, 0],
            scale: [0.3, 1.3, 1.1, 1],
            rotate: [180, 0, 10, 0],
            filter: [
              'brightness(1) drop-shadow(0 0 0px #3b82f6)',
              'brightness(1.8) drop-shadow(0 0 30px #3b82f6)',
              'brightness(1.4) drop-shadow(0 0 15px #3b82f6)',
              'brightness(1) drop-shadow(0 0 0px #3b82f6)',
            ],
          },
          transition: {
            duration: 2,
            times: [0, 0.4, 0.7, 1],
            ease: 'easeOut',
          },
        }

      case 'epic':
        return {
          // Фиолетовое свечение + rotation
          initial: { opacity: 0, scale: 0.2, rotate: 0 },
          animate: {
            opacity: [0, 1, 1, 1, 0],
            scale: [0.2, 1.4, 1.2, 1.1, 1],
            rotate: [0, 360, 720, 360, 0],
            filter: [
              'brightness(1) drop-shadow(0 0 0px #a855f7)',
              'brightness(2) drop-shadow(0 0 40px #a855f7)',
              'brightness(1.8) drop-shadow(0 0 30px #a855f7)',
              'brightness(1.5) drop-shadow(0 0 20px #a855f7)',
              'brightness(1) drop-shadow(0 0 0px #a855f7)',
            ],
          },
          transition: {
            duration: 2.5,
            times: [0, 0.3, 0.5, 0.7, 1],
            ease: 'easeInOut',
          },
        }

      case 'legendary':
        return {
          // Золотое свечение + particles
          initial: { opacity: 0, scale: 0.1, rotate: -360 },
          animate: {
            opacity: [0, 1, 1, 1, 1, 0],
            scale: [0.1, 1.5, 1.3, 1.2, 1.1, 1],
            rotate: [-360, 360, 180, 90, 0, 0],
            filter: [
              'brightness(1) drop-shadow(0 0 0px #fbbf24) hue-rotate(0deg)',
              'brightness(3) drop-shadow(0 0 60px #fbbf24) hue-rotate(30deg)',
              'brightness(2.5) drop-shadow(0 0 50px #f59e0b) hue-rotate(60deg)',
              'brightness(2) drop-shadow(0 0 40px #fbbf24) hue-rotate(30deg)',
              'brightness(1.5) drop-shadow(0 0 30px #fbbf24) hue-rotate(15deg)',
              'brightness(1) drop-shadow(0 0 0px #fbbf24) hue-rotate(0deg)',
            ],
          },
          transition: {
            duration: 3,
            times: [0, 0.2, 0.4, 0.6, 0.8, 1],
            ease: 'easeInOut',
          },
        }

      default:
        return {
          initial: { opacity: 0 },
          animate: { opacity: [0, 1, 0] },
          transition: { duration: 1 },
        }
    }
  }

  const variants = getAnimationVariants(rarity)

  return (
    <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center">
      {/* Главная анимация элемента */}
      <motion.div
        initial={variants.initial}
        animate={variants.animate}
        transition={variants.transition}
        {...(onComplete !== undefined && { onAnimationComplete: onComplete })}
        className="text-9xl"
      >
        {emoji}
      </motion.div>

      {/* Дополнительные particles для legendary */}
      {rarity === 'legendary' && (
        <div className="absolute inset-0">
          {Array.from({ length: 20 }).map((_, i) => (
            <motion.div
              key={i}
              initial={{
                x: '50%',
                y: '50%',
                scale: 0,
                opacity: 1,
              }}
              animate={{
                x: `${50 + (Math.random() - 0.5) * 150}%`,
                y: `${50 + (Math.random() - 0.5) * 150}%`,
                scale: [0, Math.random() * 2 + 1, 0],
                opacity: [0, 1, 0],
              }}
              transition={{
                duration: 2,
                delay: Math.random() * 0.5,
                ease: 'easeOut',
              }}
              className="absolute h-2 w-2 rounded-full"
              style={{
                backgroundColor: ['#FFD700', '#FFA500', '#FF8C00', '#FFFF00'][
                  Math.floor(Math.random() * 4)
                ],
              }}
            />
          ))}
        </div>
      )}

      {/* Круговые волны для epic и legendary */}
      {(rarity === 'epic' || rarity === 'legendary') && (
        <>
          {Array.from({ length: 3 }).map((_, i) => (
            <motion.div
              key={`wave-${i}`}
              initial={{ scale: 0, opacity: 0.8 }}
              animate={{
                scale: [0, 2, 3],
                opacity: [0.8, 0.4, 0],
              }}
              transition={{
                duration: 1.5,
                delay: i * 0.3,
                ease: 'easeOut',
              }}
              className="absolute rounded-full border-4"
              style={{
                width: '200px',
                height: '200px',
                borderColor:
                  rarity === 'legendary'
                    ? 'rgba(251, 191, 36, 0.5)'
                    : 'rgba(168, 85, 247, 0.5)',
              }}
            />
          ))}
        </>
      )}
    </div>
  )
}
