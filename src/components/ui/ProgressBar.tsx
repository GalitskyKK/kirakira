/**
 * 📊 PROGRESS BAR COMPONENT
 * Компонент для отображения прогресса
 */

import { motion } from 'framer-motion'
import { clsx } from 'clsx'

interface ProgressBarProps {
  readonly value: number
  readonly max?: number
  readonly className?: string
  readonly color?: string
  readonly showLabel?: boolean
  readonly label?: string
  readonly size?: 'sm' | 'md' | 'lg'
  readonly animated?: boolean
}

export function ProgressBar({
  value,
  max = 100,
  className = '',
  color = 'bg-blue-500',
  showLabel = false,
  label,
  size = 'md',
  animated = true,
}: ProgressBarProps) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100)

  const sizeClasses = {
    sm: 'h-1',
    md: 'h-2',
    lg: 'h-3',
  }

  const content = (
    <div
      className={clsx(
        'w-full overflow-hidden rounded-full bg-gray-200',
        sizeClasses[size],
        className
      )}
    >
      <motion.div
        className={clsx('h-full rounded-full transition-colors', color)}
        initial={{ width: 0 }}
        animate={{ width: `${percentage}%` }}
        transition={
          animated ? { duration: 0.5, ease: 'easeOut' } : { duration: 0 }
        }
      />
    </div>
  )

  if (showLabel || label) {
    return (
      <div className="space-y-1">
        {(showLabel || label) && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">{label || 'Прогресс'}</span>
            <span className="font-medium">{Math.round(percentage)}%</span>
          </div>
        )}
        {content}
      </div>
    )
  }

  return content
}
