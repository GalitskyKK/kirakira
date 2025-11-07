import { motion } from 'framer-motion'
import { Eye, EyeOff, Sparkles } from 'lucide-react'
import type { User } from '@/types'
import { useCompanionVisibility } from '@/stores/companionStore'

interface CompanionSettingsProps {
  readonly user: User
}

function getLevelRequirementText(level: number): string {
  if (level >= 3) {
    return 'Лумина сопровождает ваш сад'
  }

  const remaining = Math.max(3 - level, 0)
  if (remaining === 1) {
    return 'До пробуждения духа — 1 уровень'
  }
  if (remaining >= 2 && remaining <= 4) {
    return `До пробуждения духа — ${remaining} уровня`
  }
  return `До пробуждения духа — ${remaining} уровней`
}

export function CompanionSettings({ user }: CompanionSettingsProps) {
  const { isVisible, setVisible } = useCompanionVisibility()
  const level = user.level ?? 1
  const isUnlocked = level >= 3
  const statusText = getLevelRequirementText(level)

  return (
    <motion.div
      className="glass-card rounded-3xl border border-white/20 p-5 shadow-sm backdrop-blur-lg dark:border-white/10"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
    >
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <div className="mb-1 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-violet-500 dark:text-violet-300" />
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              Лумина — дух сада
            </h2>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Живой спутник реагирует на настроение и события вашего сада.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            if (!isUnlocked) return
            setVisible(!isVisible)
          }}
          disabled={!isUnlocked}
          className={`flex items-center gap-1 rounded-full px-3 py-1 text-sm font-medium transition ${
            isUnlocked
              ? isVisible
                ? 'bg-violet-100 text-violet-700 hover:bg-violet-200 dark:bg-violet-900/40 dark:text-violet-200'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200'
              : 'bg-slate-100 text-slate-400 dark:bg-slate-800/70 dark:text-slate-500'
          }`}
        >
          {isVisible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
          {isVisible ? 'Показывать' : 'Скрывать'}
        </button>
      </div>

      <div className="rounded-2xl border border-dashed border-slate-300/60 bg-white/70 px-4 py-3 text-sm text-slate-600 shadow-inner dark:border-slate-600/60 dark:bg-slate-900/60 dark:text-slate-300">
        {statusText}
      </div>

      <div className="mt-3 text-xs text-slate-500 dark:text-slate-400">
        Подсказка: после пробуждения вы сможете менять облик Лумины и открывать других духов.
      </div>
    </motion.div>
  )
}

