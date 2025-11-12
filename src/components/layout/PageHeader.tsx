/**
 * 🎨 Универсальный компонент хедера страницы
 * Используется для унифицированного отображения заголовков на всех страницах
 */

import { motion } from 'framer-motion'
import { ArrowLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import type { ReactNode } from 'react'

interface PageHeaderProps {
  readonly title: string
  readonly subtitle?: string
  readonly icon?: ReactNode
  readonly onBack?: () => void
  readonly showBackButton?: boolean
  readonly actions?: ReactNode
  readonly className?: string
  readonly sticky?: boolean
}

export function PageHeader({
  title,
  subtitle,
  icon,
  onBack,
  showBackButton = true,
  actions,
  className = '',
  sticky = true,
}: PageHeaderProps) {
  const navigate = useNavigate()

  const handleBack = () => {
    if (onBack) {
      onBack()
    } else {
      navigate(-1)
    }
  }

  return (
    <motion.div
      className={`glass-card border-b border-neutral-200/50 shadow-sm backdrop-blur-md dark:border-neutral-700/50 ${
        sticky ? 'sticky top-0 z-10' : ''
      } ${className}`}
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      <div className="flex items-center justify-between px-4 py-4">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          {showBackButton && (
            <button
              onClick={handleBack}
              className="flex-shrink-0 rounded-lg p-2 text-neutral-600 transition-colors hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-700"
              aria-label="Назад"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
          )}
          
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              {icon && (
                <div className="flex-shrink-0 text-neutral-600 dark:text-neutral-400">
                  {icon}
                </div>
              )}
              <h1 className="truncate text-xl font-bold text-neutral-900 dark:text-neutral-100">
                {title}
              </h1>
            </div>
            {subtitle && (
              <p className="mt-0.5 truncate text-sm text-neutral-600 dark:text-neutral-400">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        {actions && (
          <div className="ml-3 flex-shrink-0">
            {actions}
          </div>
        )}
      </div>
    </motion.div>
  )
}

