/**
 * 💰 КОМПОНЕНТ: Отображение валюты
 * Показывает текущий баланс ростков и кристаллов
 */

import { motion } from 'framer-motion'
import { useCurrencyStore } from '@/stores/currencyStore'
import { Sparkles, Leaf } from 'lucide-react'

interface CurrencyDisplayProps {
  readonly telegramId?: number
  readonly showLabels?: boolean
  readonly showAnimation?: boolean
  readonly size?: 'sm' | 'md' | 'lg'
  readonly variant?: 'compact' | 'full'
  readonly onClick?: () => void
}

/**
 * Компонент для отображения валюты пользователя
 */
export function CurrencyDisplay({
  showLabels = false,
  showAnimation = true,
  size = 'md',
  variant = 'compact',
  onClick,
}: CurrencyDisplayProps): JSX.Element {
  const { userCurrency, isLoading } = useCurrencyStore()

  // Размеры в зависимости от size prop
  const sizeClasses = {
    sm: 'text-xs gap-2',
    md: 'text-sm gap-3',
    lg: 'text-base gap-4',
  }

  const iconSizes = {
    sm: 14,
    md: 16,
    lg: 20,
  }

  if (isLoading) {
    return (
      <div className={`flex items-center ${sizeClasses[size]}`}>
        <div className="h-6 w-16 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
        <div className="h-6 w-16 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
      </div>
    )
  }

  if (!userCurrency) {
    return (
      <div className={`flex items-center ${sizeClasses[size]}`}>
        <div className="flex items-center gap-1">
          <Leaf size={iconSizes[size]} className="text-green-500" />
          <span className="font-semibold">0</span>
        </div>
        <div className="flex items-center gap-1">
          <Sparkles size={iconSizes[size]} className="text-purple-500" />
          <span className="font-semibold">0</span>
        </div>
      </div>
    )
  }

  const Container = onClick ? 'button' : 'div'

  return (
    <Container
      onClick={onClick}
      className={`flex items-center ${sizeClasses[size]} ${
        onClick ? 'cursor-pointer transition-opacity hover:opacity-80' : ''
      }`}
    >
      {/* Ростки */}
      <motion.div
        className="flex items-center gap-1"
        {...(showAnimation && {
          initial: { scale: 0.9, opacity: 0 },
          animate: { scale: 1, opacity: 1 },
        })}
        transition={{ duration: 0.2 }}
      >
        <Leaf size={iconSizes[size]} className="text-green-500" />
        <span className="font-semibold text-gray-800 dark:text-gray-100">
          {userCurrency.sprouts.toLocaleString()}
        </span>
        {showLabels && variant === 'full' && (
          <span className="text-xs text-gray-500 dark:text-gray-400">
            ростков
          </span>
        )}
      </motion.div>

      {/* Кристаллы */}
      <motion.div
        className="flex items-center gap-1"
        {...(showAnimation && {
          initial: { scale: 0.9, opacity: 0 },
          animate: { scale: 1, opacity: 1 },
        })}
        transition={{ duration: 0.2, delay: 0.1 }}
      >
        <Sparkles size={iconSizes[size]} className="text-purple-500" />
        <span className="font-semibold text-gray-800 dark:text-gray-100">
          {userCurrency.gems.toLocaleString()}
        </span>
        {showLabels && variant === 'full' && (
          <span className="text-xs text-gray-500 dark:text-gray-400">
            кристаллов
          </span>
        )}
      </motion.div>
    </Container>
  )
}

/**
 * Компонент для отображения одной валюты
 */
interface SingleCurrencyDisplayProps {
  readonly amount: number
  readonly type: 'sprouts' | 'gems'
  readonly size?: 'sm' | 'md' | 'lg'
  readonly showLabel?: boolean
  readonly showAnimation?: boolean
}

export function SingleCurrencyDisplay({
  amount,
  type,
  size = 'md',
  showLabel = false,
  showAnimation = true,
}: SingleCurrencyDisplayProps): JSX.Element {
  const iconSizes = {
    sm: 14,
    md: 16,
    lg: 20,
  }

  const sizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  }

  const Icon = type === 'sprouts' ? Leaf : Sparkles
  const color = type === 'sprouts' ? 'text-green-500' : 'text-purple-500'
  const label = type === 'sprouts' ? 'ростков' : 'кристаллов'

  return (
    <motion.div
      className={`flex items-center gap-1 ${sizeClasses[size]}`}
      {...(showAnimation && {
        initial: { scale: 0.9, opacity: 0 },
        animate: { scale: 1, opacity: 1 },
      })}
      transition={{ duration: 0.2 }}
    >
      <Icon size={iconSizes[size]} className={color} />
      <span className="font-semibold text-gray-800 dark:text-gray-100">
        {amount.toLocaleString()}
      </span>
      {showLabel && (
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {label}
        </span>
      )}
    </motion.div>
  )
}
