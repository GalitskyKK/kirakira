/**
 * ❌ ERROR MESSAGE COMPONENT
 * Компонент для отображения ошибок
 */

import { motion } from 'framer-motion'
import { AlertCircle, RefreshCw } from 'lucide-react'
import { Button } from './Button'
import { clsx } from 'clsx'
import { useTranslation } from '@/hooks/useTranslation'

interface ErrorMessageProps {
  readonly message: string
  readonly title?: string
  readonly onRetry?: () => void
  readonly showRetry?: boolean
  readonly className?: string
  readonly variant?: 'error' | 'warning' | 'info'
  readonly size?: 'sm' | 'md' | 'lg'
}

export function ErrorMessage({
  message,
  title,
  onRetry,
  showRetry = true,
  className = '',
  variant = 'error',
  size = 'md',
}: ErrorMessageProps) {
  const t = useTranslation()
  const defaultTitle = title ?? t.errors.generic
  const variantClasses = {
    error:
      'border-red-200 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-900/30 dark:text-red-200',
    warning:
      'border-yellow-200 bg-yellow-50 text-yellow-800 dark:border-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200',
    info: 'border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-800 dark:bg-blue-900/30 dark:text-blue-200',
  }

  const sizeClasses = {
    sm: 'p-3 text-sm',
    md: 'p-4 text-base',
    lg: 'p-6 text-lg',
  }

  const iconSize = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6',
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={clsx(
        'rounded-lg border',
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
    >
      <div className="flex items-start space-x-3">
        <AlertCircle className={clsx('mt-0.5 flex-shrink-0', iconSize[size])} />

        <div className="min-w-0 flex-1">
          <h3 className="mb-1 font-semibold">{defaultTitle}</h3>
          <p className="text-sm opacity-90">{message}</p>

          {showRetry && onRetry && (
            <div className="mt-3">
              <Button
                onClick={onRetry}
                size="sm"
                variant="outline"
                className="text-xs"
              >
                <RefreshCw className="mr-1 h-3 w-3" />
                {t.common.confirm}
              </Button>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}
