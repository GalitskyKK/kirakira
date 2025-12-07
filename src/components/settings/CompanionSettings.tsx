import { Eye, EyeOff } from 'lucide-react'
import type { User } from '@/types'
import { useCompanionVisibility } from '@/stores/companionStore'

interface CompanionSettingsProps {
  readonly user: User
}

function getLevelRequirementText(level: number): string {
  if (level >= 3) {
    return 'Лумина сопровождает ваш сад'
  }

  return 'Лумина пока спит и скоро проснется'
}

export function CompanionSettings({ user }: CompanionSettingsProps) {
  const { isVisible, setVisible } = useCompanionVisibility()
  const level = user.level ?? 1
  const isUnlocked = level >= 3
  const statusText = getLevelRequirementText(level)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => {
            if (!isUnlocked) return
            setVisible(!isVisible)
          }}
          disabled={!isUnlocked}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition ${
            isUnlocked
              ? isVisible
                ? 'bg-violet-100 text-violet-700 hover:bg-violet-200 dark:bg-violet-900/40 dark:text-violet-200'
                : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-200'
              : 'cursor-not-allowed bg-neutral-100 text-neutral-400 dark:bg-neutral-800/70 dark:text-neutral-500'
          }`}
        >
          {isVisible ? (
            <Eye className="h-4 w-4" />
          ) : (
            <EyeOff className="h-4 w-4" />
          )}
          {isVisible ? 'Показывать' : 'Скрывать'}
        </button>
      </div>

      <div className="rounded-xl border border-dashed border-neutral-300/60 bg-neutral-50/70 px-4 py-3 text-sm text-neutral-700 dark:border-neutral-600/60 dark:bg-neutral-900/60 dark:text-neutral-300">
        {statusText}
      </div>

      <div className="rounded-lg bg-violet-50 px-3 py-2 text-xs text-violet-700 dark:bg-violet-900/20 dark:text-violet-300">
        💡 После пробуждения вы сможете менять облик Лумины и открывать других
        духов
      </div>
    </div>
  )
}
