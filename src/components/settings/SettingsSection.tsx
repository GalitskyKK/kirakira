/**
 * 🎨 Компонент секции настроек
 * Используется для группировки связанных настроек
 */

import { motion } from 'framer-motion'
import type { ReactNode } from 'react'

interface SettingsSectionProps {
  readonly title: string
  readonly description?: string
  readonly icon?: ReactNode
  readonly children: ReactNode
  readonly delay?: number
}

export function SettingsSection({
  title,
  description,
  icon,
  children,
  delay = 0,
}: SettingsSectionProps) {
  return (
    <motion.section
      className="space-y-3"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.25, ease: 'easeOut' }}
    >
      <div className="flex items-center gap-2 px-1">
        {icon && (
          <div className="flex-shrink-0 text-neutral-600 dark:text-neutral-400">
            {icon}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
            {title}
          </h2>
          {description && (
            <p className="mt-0.5 text-sm text-neutral-600 dark:text-neutral-400">
              {description}
            </p>
          )}
        </div>
      </div>

      <div className="glass-card rounded-3xl border border-neutral-200/60 bg-white/80 p-5 shadow-sm backdrop-blur-lg dark:border-neutral-700/60 dark:bg-neutral-900/70">
        {children}
      </div>
    </motion.section>
  )
}

