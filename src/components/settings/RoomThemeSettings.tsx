import { useMemo } from 'react'
import { Button, Card } from '@/components/ui'
import { useRoomTheme } from '@/hooks/useRoomTheme'

interface RoomThemeSettingsProps {
  readonly className?: string
}

export function RoomThemeSettings({ className }: RoomThemeSettingsProps) {
  const {
    roomThemeId,
    roomThemes,
    ownedRoomThemeIds,
    canUseRoomTheme,
    setRoomTheme,
    isLoadingRoomThemes,
  } = useRoomTheme()

  const selectableThemes = useMemo(
    () => roomThemes.filter(t => canUseRoomTheme(t.id)),
    [roomThemes, canUseRoomTheme]
  )

  if (isLoadingRoomThemes) {
    return (
      <div className={className}>
        <div className="flex items-center justify-center py-6">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600" />
        </div>
      </div>
    )
  }

  return (
    <div className={className}>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {roomThemes.map(theme => {
          const isOwned =
            theme.isDefault || ownedRoomThemeIds.includes(theme.id)
          const isActive = roomThemeId === theme.id
          const isSelectable = selectableThemes.some(t => t.id === theme.id)

          return (
            <Card
              key={theme.id}
              className={`overflow-hidden transition-all ${
                isActive ? 'ring-2 ring-kira-500' : ''
              } ${!isOwned ? 'opacity-70' : ''}`}
            >
              <div className="h-32 w-full bg-gray-100 dark:bg-gray-900">
                <img
                  src={theme.previewUrl}
                  alt={theme.name}
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {theme.name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {isOwned
                        ? 'Доступно'
                        : `${theme.priceSprouts} ростков / ${theme.priceGems} гемов`}
                    </p>
                  </div>
                  {isActive && (
                    <span className="text-xs font-semibold text-kira-500">
                      Активна
                    </span>
                  )}
                </div>

                <div className="mt-3">
                  <Button
                    size="sm"
                    className="w-full"
                    variant={isActive ? 'outline' : 'primary'}
                    disabled={!isSelectable || isActive}
                    onClick={() => setRoomTheme(theme.id)}
                  >
                    {isActive ? 'Выбрано' : isOwned ? 'Выбрать' : 'Недоступно'}
                  </Button>
                </div>
              </div>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
