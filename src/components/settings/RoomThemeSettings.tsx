import { useEffect, useState } from 'react'
import { Button, Card } from '@/components/ui'
import { useRoomTheme } from '@/hooks/useRoomTheme'
import { ChevronLeft, ChevronRight } from 'lucide-react'

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

  const [currentIndex, setCurrentIndex] = useState(() =>
    Math.max(
      0,
      roomThemes.findIndex(theme => theme.id === roomThemeId) !== -1
        ? roomThemes.findIndex(theme => theme.id === roomThemeId)
        : 0
    )
  )

  useEffect(() => {
    const idx = roomThemes.findIndex(theme => theme.id === roomThemeId)
    if (idx >= 0) {
      setCurrentIndex(idx)
    }
  }, [roomThemeId, roomThemes])

  const currentTheme = roomThemes[currentIndex] ?? roomThemes[0]

  const goPrev = () => {
    setCurrentIndex(prev =>
      prev === 0 ? Math.max(roomThemes.length - 1, 0) : prev - 1
    )
  }

  const goNext = () => {
    setCurrentIndex(prev => (prev === roomThemes.length - 1 ? 0 : prev + 1))
  }

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
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={goPrev}
          disabled={roomThemes.length <= 1}
          aria-label="Предыдущая тема комнаты"
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>

        <Card className="flex-1 overflow-hidden transition-all">
          <div className="h-40 w-full bg-gray-100 dark:bg-gray-900">
            {currentTheme && (
              <img
                src={currentTheme.previewUrl}
                alt={currentTheme.name}
                className="h-full w-full object-cover"
              />
            )}
          </div>
          <div className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {currentTheme?.name ?? 'Тема'}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {currentTheme
                    ? currentTheme.isDefault ||
                      ownedRoomThemeIds.includes(currentTheme.id)
                      ? 'Доступно'
                      : `${currentTheme.priceSprouts} ростков / ${currentTheme.priceGems} гемов`
                    : ''}
                </p>
              </div>
              {currentTheme?.id === roomThemeId && (
                <span className="text-xs font-semibold text-kira-500">
                  Активна
                </span>
              )}
            </div>

            <div className="mt-3">
              <Button
                size="sm"
                className="w-full"
                variant={
                  currentTheme?.id === roomThemeId ? 'outline' : 'primary'
                }
                disabled={
                  !currentTheme ||
                  !canUseRoomTheme(currentTheme.id) ||
                  currentTheme.id === roomThemeId
                }
                onClick={() => currentTheme && setRoomTheme(currentTheme.id)}
              >
                {currentTheme?.id === roomThemeId
                  ? 'Выбрано'
                  : currentTheme &&
                      (currentTheme.isDefault ||
                        ownedRoomThemeIds.includes(currentTheme.id))
                    ? 'Выбрать'
                    : 'Недоступно'}
              </Button>
            </div>
          </div>
        </Card>

        <Button
          variant="ghost"
          size="sm"
          onClick={goNext}
          disabled={roomThemes.length <= 1}
          aria-label="Следующая тема комнаты"
        >
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>
    </div>
  )
}
