/**
 * 🌱 Настройки режима отображения сада
 * Позволяет переключаться между разными визуализациями сада
 */

import { motion } from 'framer-motion'
import { Sprout, Palette, Lock } from 'lucide-react'
import { useGardenClientStore } from '@/stores/gardenStore'
import { GardenDisplayMode } from '@/types/garden'

interface DisplayModeOption {
  readonly mode: GardenDisplayMode
  readonly label: string
  readonly description: string
  readonly icon: React.ReactNode
  readonly available: boolean
  readonly comingSoon?: boolean
}

const DISPLAY_MODES: readonly DisplayModeOption[] = [
  {
    mode: GardenDisplayMode.GARDEN,
    label: 'Сад',
    description: 'Классический вид с полками и элементами',
    icon: <Sprout className="h-5 w-5" />,
    available: true,
  },
  {
    mode: GardenDisplayMode.PALETTE,
    label: 'Палитра',
    description: 'Визуализация настроений',
    icon: <Palette className="h-5 w-5" />,
    available: true,
  },
  // {
  //   mode: GardenDisplayMode.BONSAI,
  //   label: 'Бонсай',
  //   description: 'Дерево эмоций, растущее от ваших настроений',
  //   icon: <TreePine className="h-5 w-5" />,
  //   available: false,
  //   comingSoon: true,
  // },
  // {
  //   mode: GardenDisplayMode.BEDS,
  //   label: 'Грядки',
  //   description: 'Шесть грядок, каждая для своего настроения',
  //   icon: <Grid3x3 className="h-5 w-5" />,
  //   available: false,
  //   comingSoon: true,
  // },
] as const

export function GardenDisplaySettings() {
  const { displayMode, setDisplayMode } = useGardenClientStore()

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {DISPLAY_MODES.map(option => {
          const isSelected = displayMode === option.mode
          const isDisabled = !option.available

          return (
            <motion.button
              key={option.mode}
              type="button"
              onClick={() => {
                if (!isDisabled) {
                  setDisplayMode(option.mode)
                }
              }}
              disabled={isDisabled}
              whileHover={!isDisabled ? { scale: 1.02 } : {}}
              whileTap={!isDisabled ? { scale: 0.98 } : {}}
              className={`relative flex flex-col items-start gap-2 rounded-xl border-2 p-4 text-left transition-all ${
                isSelected
                  ? 'border-kira-500 bg-kira-50 dark:border-kira-400 dark:bg-kira-900/20'
                  : isDisabled
                    ? 'cursor-not-allowed border-neutral-200 bg-neutral-50 opacity-60 dark:border-neutral-700 dark:bg-neutral-800/50'
                    : 'border-neutral-200 bg-white hover:border-kira-300 hover:bg-kira-50/50 dark:border-neutral-700 dark:bg-neutral-800 dark:hover:border-kira-600 dark:hover:bg-kira-900/10'
              }`}
            >
              {/* Иконка и заголовок */}
              <div className="flex w-full items-center justify-between">
                <div
                  className={`flex items-center gap-2 ${
                    isDisabled
                      ? 'text-neutral-400 dark:text-neutral-500'
                      : 'text-neutral-700 dark:text-neutral-200'
                  }`}
                >
                  {option.icon}
                  <h3 className="font-semibold">{option.label}</h3>
                </div>

                {/* Индикатор выбора */}
                {isSelected && !isDisabled && (
                  <motion.div
                    className="h-2 w-2 rounded-full bg-kira-500"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 500 }}
                  />
                )}

                {/* Заблокировано */}
                {isDisabled && (
                  <Lock className="h-4 w-4 text-neutral-400 dark:text-neutral-500" />
                )}
              </div>

              {/* Описание */}
              <p
                className={`text-xs ${
                  isDisabled
                    ? 'text-neutral-400 dark:text-neutral-500'
                    : 'text-neutral-600 dark:text-neutral-400'
                }`}
              >
                {option.description}
              </p>

              {/* Coming Soon badge */}
              {option.comingSoon && (
                <motion.div
                  className="absolute right-2 top-2 rounded-full bg-neutral-200 px-2 py-0.5 text-xs text-neutral-600 dark:bg-neutral-700 dark:text-neutral-400"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.1 }}
                >
                  Скоро
                </motion.div>
              )}
            </motion.button>
          )
        })}
      </div>

      {/* Информационное сообщение */}
      <div className="rounded-xl border border-dashed border-neutral-300/60 bg-neutral-50/70 px-4 py-3 text-sm text-neutral-700 dark:border-neutral-600/60 dark:bg-neutral-900/60 dark:text-neutral-300">
        💡 Режим отображения влияет на то, как выглядит ваш сад на главной странице
      </div>
    </div>
  )
}

