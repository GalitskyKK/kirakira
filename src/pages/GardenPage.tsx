import { Palette, Sprout, Home } from 'lucide-react'
import { GardenView, GardenStats } from '@/components/garden'
import { useGardenState } from '@/hooks/index.v2'
import { useGardenClientStore } from '@/stores/gardenStore'
import { GardenDisplayMode } from '@/types'
import { useTranslation } from '@/hooks/useTranslation'

export function GardenPage() {
  const { garden } = useGardenState()
  const displayMode = useGardenClientStore(state => state.displayMode)
  const t = useTranslation()

  const headerConfig =
    displayMode === GardenDisplayMode.ISOMETRIC_ROOM
      ? {
          title: t.pages.garden.myRoom,
          Icon: Home,
          badge: t.pages.garden.isometric,
        }
      : displayMode === GardenDisplayMode.PALETTE
        ? {
            title: t.pages.garden.myPalette,
            Icon: Palette,
            badge: t.pages.garden.palette,
          }
        : {
            title: t.pages.garden.myGarden,
            Icon: Sprout,
            badge: t.pages.garden.classic,
          }

  return (
    <div className="space-y-4">
      <div className="glass-card flex min-h-[56px] items-center justify-between rounded-2xl px-4 py-3">
        <div className="flex items-center gap-2 text-sm font-medium text-neutral-700 dark:text-neutral-200">
          <headerConfig.Icon className="h-4 w-4 text-kira-500" />
          <span>{headerConfig.title}</span>
        </div>
        <div className="flex items-center gap-1 text-xs text-neutral-500 dark:text-neutral-400">
          <span className="rounded-full bg-neutral-100 px-2 py-1 text-[11px] font-semibold text-neutral-700 dark:bg-neutral-800 dark:text-neutral-200">
            {headerConfig.badge}
          </span>
        </div>
      </div>

      <GardenView className="min-h-[480px]" />

      {garden && (
        <div className="space-y-3">
          <GardenStats garden={garden} displayMode={displayMode} />
        </div>
      )}
    </div>
  )
}
