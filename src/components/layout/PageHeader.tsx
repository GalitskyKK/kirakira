/**
 * 🎨 Универсальный компонент хедера страницы
 * Используется для унифицированного отображения заголовков на всех страницах
 */

import { motion } from 'framer-motion'
import { ArrowLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import type { ReactNode } from 'react'
import { useTranslation } from '@/hooks/useTranslation'

interface PageHeaderProps {
  readonly title: string
  readonly icon?: ReactNode
  readonly onBack?: () => void
  readonly showBackButton?: boolean
  readonly actions?: ReactNode
  readonly className?: string
  readonly sticky?: boolean
}

export function PageHeader({
  title,
  icon,
  onBack,
  showBackButton = true,
  actions,
  className = '',
  sticky = true,
}: PageHeaderProps) {
  const navigate = useNavigate()
  const t = useTranslation()

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
      <div className="flex min-h-[56px] items-center justify-between px-4 py-3">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          {showBackButton && (
            <button
              onClick={handleBack}
              className="flex-shrink-0 rounded-lg p-1.5 text-neutral-600 transition-colors hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-700"
              aria-label={t.common.back}
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
          )}

          {icon && (
            <div className="flex-shrink-0 text-neutral-600 dark:text-neutral-400">
              {icon}
            </div>
          )}

          <h1 className="truncate text-lg font-bold text-neutral-900 dark:text-neutral-100">
            {title}
          </h1>
        </div>

        {actions && <div className="ml-2 flex-shrink-0">{actions}</div>}
      </div>
    </motion.div>
  )
}
