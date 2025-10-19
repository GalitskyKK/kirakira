import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Users, Calendar, Flame, MapPin, Info } from 'lucide-react'
import { Button, Card, UserAvatar } from '@/components/ui'
import { ShelfView, GardenStats } from '@/components/garden'
import { useTelegram } from '@/hooks'
import { useUpdateQuestProgress } from '@/hooks/queries/useDailyQuestQueries'
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
import { authenticatedFetch } from '@/utils/apiClient'
import {
  getElementName,
  getElementDescription,
  getElementEmoji as getElementEmojiFromUtils,
  getElementColor,
  getElementScale,
} from '@/utils/elementNames'

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
  const updateQuestProgress = useUpdateQuestProgress()

  // 🔑 Отслеживаем, был ли уже обновлён квест для избежания повторных вызовов
  const questUpdatedRef = useRef(false)
  // 🔑 Стабильная ссылка на updateQuestProgress для избежания пересоздания callback
  const updateQuestProgressRef = useRef(updateQuestProgress)
  updateQuestProgressRef.current = updateQuestProgress

  // Состояние для данных сада друга (изолировано от основного garden store)
  const [friendGarden, setFriendGarden] = useState<FriendGardenData | null>(
    null
  )
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedElement, setSelectedElement] = useState<GardenElement | null>(
    null
  )

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

      const response = await authenticatedFetch(
        `/api/garden?action=view-friend-garden&viewerTelegramId=${currentUser.telegramId}&friendTelegramId=${friendTelegramId}`
      )

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to load friend garden')
      }

      console.log(`✅ Friend garden loaded:`, result.data)
      setFriendGarden(result.data)
      hapticFeedback('success')

      // 🎯 Обновляем прогресс daily quest для посещения сада друга (только один раз)
      if (currentUser?.telegramId && !questUpdatedRef.current) {
        questUpdatedRef.current = true
        // Выполняем обновление квеста в фоне, не блокируя основной UI
        updateQuestProgressRef.current
          .mutateAsync({
            telegramId: currentUser.telegramId,
            questType: 'visit_friend_garden',
            increment: 1,
          })
          .then(() => {
            console.log('✅ Visit friend garden quest updated')
          })
          .catch(error => {
            console.warn(
              '⚠️ Failed to update visit_friend_garden quest:',
              error
            )
            // Сбрасываем флаг при ошибке, чтобы можно было повторить
            questUpdatedRef.current = false
          })
      }
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

  // Загружаем данные при монтировании или изменении друга
  useEffect(() => {
    // Сбрасываем флаг квеста при изменении друга
    questUpdatedRef.current = false
    void loadFriendGarden()
  }, [loadFriendGarden])

  // 🎨 Конвертируем элементы друга в формат для рендерера
  // 🔑 ВАЖНО: Используем те же функции генерации, что и для собственного сада
  const convertedElements: GardenElement[] =
    friendGarden?.gardenElements.map(element => {
      // Используем element.id как seed для детерминированной генерации
      const characteristicsSeed = element.id

      // Генерируем характеристики на основе element.id (как в gardenStore)
      const name = getElementName(
        element.type,
        element.rarity,
        characteristicsSeed
      )
      const description = getElementDescription(
        element.type,
        element.rarity,
        name
      )
      const emoji = getElementEmojiFromUtils(element.type)
      const color = getElementColor(
        element.type,
        element.moodInfluence,
        characteristicsSeed
      )
      const scale = getElementScale(characteristicsSeed)

      return {
        id: element.id,
        type: element.type,
        position: element.position,
        unlockDate: new Date(element.unlockDate),
        moodInfluence: element.moodInfluence,
        rarity: element.rarity,
        name,
        description,
        emoji,
        color,
        scale,
      }
    }) || []

  // Обработчик выбора элемента (только для просмотра информации)
  const handleElementSelect = useCallback(
    (element: GardenElement | null) => {
      setSelectedElement(element)
      hapticFeedback('light')
    },
    [hapticFeedback]
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
                  <div className="text-2xl">{selectedElement.emoji}</div>
                  <div>
                    <h4 className="font-semibold">{selectedElement.name}</h4>
                    <p className="text-sm text-gray-600">
                      {selectedElement.description}
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
                    {selectedElement.unlockDate.toLocaleDateString('ru')}
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
