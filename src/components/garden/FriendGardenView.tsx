import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Users, Calendar, Flame, MapPin, Info } from 'lucide-react'
import { Button, Card, UserAvatar } from '@/components/ui'
import { ShelfView, GardenStats } from '@/components/garden'
import { useTelegram } from '@/hooks'
import type {
  User,
  GardenElement,
  Position2D,
  ElementType,
  RarityLevel,
  MoodType,
  Garden,
} from '@/types'
import { ViewMode, SeasonalVariant } from '@/types'

// Типы для данных друга и его сада
interface FriendInfo {
  readonly telegramId: number
  readonly firstName: string
  readonly lastName?: string
  readonly username?: string
  readonly photoUrl?: string | null
  readonly currentStreak: number
  readonly totalElements: number
  readonly gardenCreated?: string | null
}

interface FriendGardenElement {
  readonly id: string
  readonly type: ElementType
  readonly rarity: RarityLevel
  readonly position: Position2D
  readonly unlockDate: string
  readonly moodInfluence: MoodType
  readonly createdAt: string
}

interface FriendGardenData {
  readonly friendInfo: FriendInfo
  readonly gardenElements: readonly FriendGardenElement[]
  readonly total: number
  readonly canEdit: false
  readonly viewMode: 'friend'
}

interface FriendGardenViewProps {
  friendTelegramId: number
  currentUser: User | null
  onBack: () => void
}

export function FriendGardenView({
  friendTelegramId,
  currentUser,
  onBack,
}: FriendGardenViewProps) {
  const { hapticFeedback, showAlert } = useTelegram()

  // Состояние для данных сада друга (изолировано от основного garden store)
  const [friendGarden, setFriendGarden] = useState<FriendGardenData | null>(
    null
  )
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedElement, setSelectedElement] =
    useState<FriendGardenElement | null>(null)

  // 📡 Загрузка данных сада друга
  const loadFriendGarden = useCallback(async () => {
    if (!currentUser?.telegramId || !friendTelegramId) {
      setError('Missing user data')
      setIsLoading(false)
      return
    }

    try {
      setIsLoading(true)
      setError(null)

      console.log(
        `🌱 Loading friend garden: viewer=${currentUser.telegramId}, friend=${friendTelegramId}`
      )

      const response = await fetch(
        `/api/garden?action=view-friend-garden&viewerTelegramId=${currentUser.telegramId}&friendTelegramId=${friendTelegramId}`
      )

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to load friend garden')
      }

      console.log(`✅ Friend garden loaded:`, result.data)
      setFriendGarden(result.data)
      hapticFeedback('success')
    } catch (error) {
      console.error('Failed to load friend garden:', error)
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error'
      setError(errorMessage)
      showAlert?.(errorMessage)
      hapticFeedback('error')
    } finally {
      setIsLoading(false)
    }
  }, [currentUser?.telegramId, friendTelegramId, hapticFeedback, showAlert])

  // Загружаем данные при монтировании
  useEffect(() => {
    void loadFriendGarden()
  }, [loadFriendGarden])

  // 🎨 Конвертируем элементы друга в формат для рендерера
  const convertedElements: GardenElement[] =
    friendGarden?.gardenElements.map(element => ({
      id: element.id,
      type: element.type,
      position: element.position,
      unlockDate: new Date(element.unlockDate),
      moodInfluence: element.moodInfluence,
      rarity: element.rarity,
      // Добавляем недостающие поля для совместимости с GardenElement
      name: `${element.type}`,
      description: `Элемент сада (${element.rarity})`,
      emoji: getElementEmoji(element.type),
      color: getRarityColor(element.rarity),
    })) || []

  // Обработчик выбора элемента (только для просмотра информации)
  const handleElementSelect = useCallback(
    (element: GardenElement | null) => {
      const friendElement = element
        ? friendGarden?.gardenElements.find(fe => fe.id === element.id) || null
        : null

      setSelectedElement(friendElement)
      hapticFeedback('light')
    },
    [friendGarden?.gardenElements, hapticFeedback]
  )

  // 🔄 Состояние загрузки
  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-blue-600 border-t-transparent"></div>
          <p className="text-gray-600">Загружаем сад друга...</p>
        </motion.div>
      </div>
    )
  }

  // ❌ Состояние ошибки
  if (error || !friendGarden) {
    return (
      <div className="space-y-4">
        <Button onClick={onBack} variant="outline" size="sm" className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Назад
        </Button>

        <Card className="p-6 text-center">
          <div className="mb-4 text-gray-400">
            <Users className="mx-auto h-12 w-12" />
          </div>
          <h3 className="mb-2 text-lg font-semibold">
            Не удалось загрузить сад
          </h3>
          <p className="mb-4 text-gray-600">
            {error || 'Возможно, друг запретил просмотр своего сада'}
          </p>
          <Button
            onClick={() => void loadFriendGarden()}
            size="sm"
            className="mr-2"
          >
            Попробовать снова
          </Button>
          <Button onClick={onBack} variant="outline" size="sm">
            Назад
          </Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Заголовок с кнопкой назад */}
      <div className="flex items-center justify-between">
        <Button onClick={onBack} variant="outline" size="sm">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Назад
        </Button>
        <div className="text-center">
          <h2 className="text-lg font-semibold">Сад друга</h2>
          <p className="text-sm text-gray-600">Только для просмотра</p>
        </div>
        <div className="w-20"></div> {/* Spacer для центровки заголовка */}
      </div>

      {/* Информация о друге */}
      <Card className="p-4">
        <div className="flex items-center space-x-4">
          <UserAvatar
            photoUrl={friendGarden.friendInfo.photoUrl || undefined}
            name={`${friendGarden.friendInfo.firstName} ${friendGarden.friendInfo.lastName || ''}`.trim()}
            username={friendGarden.friendInfo.username}
            size="lg"
          />

          <div className="flex-1">
            <div className="flex items-center space-x-2">
              <h3 className="font-semibold">
                {friendGarden.friendInfo.username
                  ? `@${friendGarden.friendInfo.username}`
                  : `${friendGarden.friendInfo.firstName} ${friendGarden.friendInfo.lastName || ''}`.trim()}
              </h3>
            </div>

            <div className="mt-2 flex items-center space-x-4 text-sm text-gray-600">
              <span className="flex items-center space-x-1">
                <span>🌱</span>
                <span>{friendGarden.friendInfo.totalElements}</span>
              </span>
              <span className="flex items-center space-x-1">
                <Flame className="h-3 w-3" />
                <span>{friendGarden.friendInfo.currentStreak}</span>
              </span>
              {friendGarden.friendInfo.gardenCreated && (
                <span className="flex items-center space-x-1">
                  <Calendar className="h-3 w-3" />
                  <span>
                    {new Date(
                      friendGarden.friendInfo.gardenCreated
                    ).toLocaleDateString('ru')}
                  </span>
                </span>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Заголовок сада */}
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              Сад {friendGarden.friendInfo.firstName}
            </h2>
            <p className="text-sm text-gray-600">
              {friendGarden.total} растений • Полка друга
            </p>
          </div>
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Flame className="h-4 w-4" />
            <span>{friendGarden.friendInfo.currentStreak} дней</span>
          </div>
        </div>
      </Card>

      {/* Рендер сада (только для просмотра) */}
      <Card className="p-2 md:p-4">
        <ShelfView
          elements={convertedElements}
          selectedElement={
            convertedElements.find(e => e.id === selectedElement?.id) || null
          }
          onElementClick={handleElementSelect}
          onElementLongPress={() => {}} // Отключаем долгое нажатие для друзей
          onSlotClick={() => {}} // Отключаем клики по слотам для друзей
          elementBeingMoved={null} // Никогда не перемещаем элементы у друзей
          draggedElement={null}
          viewMode={ViewMode.OVERVIEW}
        />
      </Card>

      {/* Статистика сада друга */}
      <Card className="p-4">
        <GardenStats
          garden={
            {
              id: `friend_${friendGarden.friendInfo.telegramId}`,
              userId: friendGarden.friendInfo.telegramId.toString(),
              elements: convertedElements,
              createdAt: new Date(
                friendGarden.friendInfo.gardenCreated || Date.now()
              ),
              lastVisited: new Date(),
              streak: friendGarden.friendInfo.currentStreak,
              season: SeasonalVariant.SPRING,
            } as Garden
          }
        />
      </Card>

      {/* Информация о выбранном элементе */}
      <AnimatePresence>
        {selectedElement && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <Card className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <div className="text-2xl">
                    {getElementEmoji(selectedElement.type)}
                  </div>
                  <div>
                    <h4 className="font-semibold capitalize">
                      {selectedElement.type.replace('_', ' ')}
                    </h4>
                    <p className="text-sm capitalize text-gray-600">
                      Редкость: {selectedElement.rarity}
                    </p>
                  </div>
                </div>

                <div className="text-right text-sm text-gray-500">
                  <div className="flex items-center space-x-1">
                    <MapPin className="h-3 w-3" />
                    <span>
                      ({selectedElement.position.x},{' '}
                      {selectedElement.position.y})
                    </span>
                  </div>
                  <div className="mt-1">
                    {new Date(selectedElement.unlockDate).toLocaleDateString(
                      'ru'
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-3 flex items-center space-x-2 text-sm">
                <Info className="h-4 w-4 text-blue-500" />
                <span className="text-gray-600">
                  Настроение:{' '}
                  <span className="capitalize">
                    {selectedElement.moodInfluence}
                  </span>
                </span>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Пустое состояние если нет элементов */}
      {friendGarden.total === 0 && (
        <Card className="p-6 text-center">
          <div className="mb-4 text-gray-400">
            <span className="text-4xl">🌱</span>
          </div>
          <h4 className="mb-2 font-medium">Сад пуст</h4>
          <p className="text-sm text-gray-600">
            {friendGarden.friendInfo.firstName} ещё не добавил элементы в свой
            сад
          </p>
        </Card>
      )}
    </div>
  )
}

// 🎨 Вспомогательные функции для отображения
function getElementEmoji(type: ElementType): string {
  const emojiMap: Record<ElementType, string> = {
    flower: '🌸',
    tree: '🌳',
    stone: '🪨',
    water: '💧',
    grass: '🌿',
    mushroom: '🍄',
    crystal: '💎',
    decoration: '✨',
    rainbow_flower: '🌈',
    glowing_crystal: '🔮',
    mystic_mushroom: '🍄‍🟫',
    aurora_tree: '🌲',
    starlight_decoration: '⭐',
  }
  return emojiMap[type] || '🌱'
}

function getRarityColor(rarity: RarityLevel): string {
  const colorMap: Record<RarityLevel, string> = {
    common: '#9CA3AF',
    uncommon: '#10B981',
    rare: '#3B82F6',
    epic: '#8B5CF6',
    legendary: '#F59E0B',
  }
  return colorMap[rarity] || '#9CA3AF'
}
