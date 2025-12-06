import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Sprout, Palette, Home } from 'lucide-react'
import { GardenDisplayMode, type User } from '@/types'
import { useUpdateFriendGardenDisplay } from '@/hooks/queries/useUserQueries'
import { useTelegram } from '@/hooks/useTelegram'

interface DisplayModeOption {
  readonly mode: GardenDisplayMode
  readonly label: string
  readonly description: string
  readonly icon: React.ReactNode
}

interface FriendGardenDisplaySettingsProps {
  readonly user: User
}

const OPTIONS: readonly DisplayModeOption[] = [
  {
    mode: GardenDisplayMode.GARDEN,
    label: 'Полки',
    description: 'Классический вид сада',
    icon: <Sprout className="h-5 w-5" />,
  },
  {
    mode: GardenDisplayMode.ISOMETRIC_ROOM,
    label: 'Комната',
    description: 'Изометрический вид комнаты',
    icon: <Home className="h-5 w-5" />,
  },
  {
    mode: GardenDisplayMode.PALETTE,
    label: 'Палитра',
    description: 'Визуализация настроений друга',
    icon: <Palette className="h-5 w-5" />,
  },
] as const

export function FriendGardenDisplaySettings({
  user,
}: FriendGardenDisplaySettingsProps) {
  const telegramId = user.telegramId
  const { showAlert } = useTelegram()
  const { mutateAsync, isPending } = useUpdateFriendGardenDisplay()

  const preferredMode = useMemo(
    () => user.preferences.garden.friendViewMode ?? GardenDisplayMode.GARDEN,
    [user.preferences.garden.friendViewMode]
  )
  const [selectedMode, setSelectedMode] =
    useState<GardenDisplayMode>(preferredMode)

  useEffect(() => {
    setSelectedMode(preferredMode)
  }, [preferredMode])

  const handleSelect = async (mode: GardenDisplayMode) => {
    if (!telegramId || mode === selectedMode) {
      return
    }

    setSelectedMode(mode)
    try {
      const result = await mutateAsync({ telegramId, displayMode: mode })
      if (!result.success) {
        throw new Error(result.error ?? 'Failed to update preference')
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Не удалось обновить настройку'
      showAlert?.(message)
      setSelectedMode(preferredMode)
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {OPTIONS.map(option => {
          const isSelected = selectedMode === option.mode

          return (
            <motion.button
              key={option.mode}
              type="button"
              onClick={() => void handleSelect(option.mode)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              disabled={isPending}
              className={`relative flex flex-col items-start gap-2 rounded-xl border-2 p-4 text-left transition-all ${
                isSelected
                  ? 'border-kira-500 bg-kira-50 dark:border-kira-400 dark:bg-kira-900/20'
                  : 'border-neutral-200 bg-white hover:border-kira-300 hover:bg-kira-50/50 dark:border-neutral-700 dark:bg-neutral-800 dark:hover:border-kira-600 dark:hover:bg-kira-900/10'
              } ${isPending ? 'opacity-80' : ''}`}
            >
              <div className="flex w-full items-center justify-between">
                <div className="flex items-center gap-2 text-neutral-700 dark:text-neutral-200">
                  {option.icon}
                  <h3 className="font-semibold">{option.label}</h3>
                </div>

                {isSelected && (
                  <motion.div
                    className="h-2 w-2 rounded-full bg-kira-500"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 500 }}
                  />
                )}
              </div>

              <p className="text-xs text-neutral-600 dark:text-neutral-400">
                {option.description}
              </p>
            </motion.button>
          )
        })}
      </div>

      <div className="rounded-xl border border-dashed border-neutral-300/60 bg-neutral-50/70 px-4 py-3 text-sm text-neutral-700 dark:border-neutral-600/60 dark:bg-neutral-900/60 dark:text-neutral-300">
        Этот выбор определяет, как другие увидят ваш сад. Если для выбранного
        вида нет данных (например, пустая палитра), покажем классические полки.
      </div>
    </div>
  )
}
