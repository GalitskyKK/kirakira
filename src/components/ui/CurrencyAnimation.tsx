/**
 * 🎬 КОМПОНЕНТ: Анимация получения валюты
 * Красивая анимация при начислении ростков/кристаллов
 */

import { motion, AnimatePresence } from 'framer-motion'
import { useEffect, useState } from 'react'
import { Sparkles, Leaf } from 'lucide-react'
import confetti from 'canvas-confetti'

interface CurrencyAnimationProps {
  readonly amount: number
  readonly type: 'sprouts' | 'gems'
  readonly reason?: string
  readonly show: boolean
  readonly onComplete?: () => void
  readonly duration?: number
}

/**
 * Анимация получения валюты (всплывающее уведомление)
 */
export function CurrencyAnimation({
  amount,
  type,
  reason,
  show,
  onComplete,
  duration = 3000,
}: CurrencyAnimationProps): JSX.Element {
  const [isVisible, setIsVisible] = useState(show)

  useEffect(() => {
    if (show) {
      setIsVisible(true)

      // Запускаем конфетти для больших наград
      if (amount >= 100 || type === 'gems') {
        void confetti({
          particleCount: amount >= 500 ? 100 : 50,
          spread: 70,
          origin: { y: 0.6 },
          colors:
            type === 'gems' ? ['#a855f7', '#8b5cf6'] : ['#22c55e', '#16a34a'],
        })
      }

      const timer = setTimeout(() => {
        setIsVisible(false)
        onComplete?.()
      }, duration)

      return () => clearTimeout(timer)
    }

    setIsVisible(false)
    return undefined
  }, [show, amount, type, duration, onComplete])

  const Icon = type === 'sprouts' ? Leaf : Sparkles
  const bgColor =
    type === 'sprouts'
      ? 'from-green-500 to-emerald-600'
      : 'from-purple-500 to-violet-600'
  const iconColor = type === 'sprouts' ? 'text-green-100' : 'text-purple-100'

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.3 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.8 }}
          transition={{
            duration: 0.5,
            ease: 'easeOut',
          }}
          className="fixed inset-x-0 top-20 z-50 mx-auto w-fit"
        >
          <motion.div
            className={`relative rounded-2xl bg-gradient-to-r ${bgColor} px-6 py-4 shadow-2xl`}
            animate={{
              boxShadow: [
                '0 10px 50px rgba(0,0,0,0.3)',
                '0 15px 60px rgba(0,0,0,0.4)',
                '0 10px 50px rgba(0,0,0,0.3)',
              ],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          >
            {/* Блестки фон */}
            <motion.div
              className="absolute inset-0 rounded-2xl"
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 0.3, 0] }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
              style={{
                background:
                  'radial-gradient(circle, rgba(255,255,255,0.3) 0%, transparent 70%)',
              }}
            />

            <div className="relative flex items-center gap-3">
              <motion.div
                animate={{
                  rotate: [0, 10, -10, 0],
                  scale: [1, 1.2, 1],
                }}
                transition={{
                  duration: 0.5,
                  repeat: Infinity,
                  repeatDelay: 1,
                }}
              >
                <Icon size={32} className={iconColor} />
              </motion.div>

              <div className="flex flex-col">
                <motion.div
                  className="text-2xl font-bold text-white"
                  initial={{ scale: 0.5 }}
                  animate={{ scale: [0.5, 1.2, 1] }}
                  transition={{ duration: 0.4 }}
                >
                  +{amount.toLocaleString()}
                </motion.div>
                {reason && (
                  <motion.div
                    className="text-sm text-white/90"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                  >
                    {reason}
                  </motion.div>
                )}
              </div>
            </div>

            {/* Частицы вокруг */}
            <ParticleEffect type={type} />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

/**
 * Эффект частиц вокруг награды
 */
function ParticleEffect({ type }: { readonly type: 'sprouts' | 'gems' }) {
  const particles = Array.from({ length: 8 }, (_, i) => i)
  const Icon = type === 'sprouts' ? Leaf : Sparkles

  return (
    <div className="pointer-events-none absolute inset-0">
      {particles.map(i => (
        <motion.div
          key={i}
          className="absolute left-1/2 top-1/2"
          initial={{
            opacity: 1,
            x: 0,
            y: 0,
            scale: 0,
          }}
          animate={{
            opacity: [1, 1, 0],
            x: Math.cos((i * Math.PI) / 4) * 60,
            y: Math.sin((i * Math.PI) / 4) * 60,
            scale: [0, 1, 0.5],
          }}
          transition={{
            duration: 1.5,
            delay: i * 0.1,
            ease: 'easeOut',
          }}
        >
          <Icon
            size={16}
            className={
              type === 'sprouts' ? 'text-green-200' : 'text-purple-200'
            }
          />
        </motion.div>
      ))}
    </div>
  )
}

/**
 * Мини-анимация (для небольших наград)
 */
interface MiniCurrencyAnimationProps {
  readonly amount: number
  readonly type: 'sprouts' | 'gems'
  readonly position?: { x: number; y: number }
  readonly show: boolean
  readonly onComplete?: () => void
}

export function MiniCurrencyAnimation({
  amount,
  type,
  position,
  show,
  onComplete,
}: MiniCurrencyAnimationProps): JSX.Element {
  const [isVisible, setIsVisible] = useState(show)

  useEffect(() => {
    if (show) {
      setIsVisible(true)
      const timer = setTimeout(() => {
        setIsVisible(false)
        onComplete?.()
      }, 1500)
      return () => clearTimeout(timer)
    }

    setIsVisible(false)
    return undefined
  }, [show, onComplete])

  const Icon = type === 'sprouts' ? Leaf : Sparkles
  const color = type === 'sprouts' ? 'text-green-500' : 'text-purple-500'

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{
            opacity: 1,
            y: 0,
            scale: 1,
            x: position?.x || 0,
          }}
          animate={{
            opacity: 0,
            y: -50,
            scale: 1.5,
          }}
          exit={{ opacity: 0 }}
          transition={{
            duration: 1.5,
            ease: 'easeOut',
          }}
          className={`pointer-events-none fixed z-50 flex items-center gap-1 font-bold ${color}`}
          style={{
            top: position?.y || '50%',
            left: position?.x || '50%',
          }}
        >
          <Icon size={20} />
          <span>+{amount}</span>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

/**
 * Хук для управления анимацией награды
 */
export function useCurrencyAnimation() {
  const [animation, setAnimation] = useState<{
    show: boolean
    amount: number
    type: 'sprouts' | 'gems'
    reason?: string
  }>({
    show: false,
    amount: 0,
    type: 'sprouts',
  })

  const showAnimation = (
    amount: number,
    type: 'sprouts' | 'gems',
    reason?: string
  ) => {
    setAnimation({
      show: true,
      amount,
      type,
      ...(reason !== undefined && { reason }),
    })
  }

  const hideAnimation = () => {
    setAnimation(prev => ({ ...prev, show: false }))
  }

  return {
    animation,
    showAnimation,
    hideAnimation,
  }
}
