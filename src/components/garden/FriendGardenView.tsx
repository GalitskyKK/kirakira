import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Calendar, Flame, MapPin, Info } from 'lucide-react'
import { Button, Card, UserAvatar } from '@/components/ui'
import {
  GardenStats,
  GardenRoomManager,
  IsometricRoomView,
} from '@/components/garden'
import { useTelegram } from '@/hooks'
import { useQuestIntegration } from '@/hooks/useQuestIntegration'
import { useDailyQuests } from '@/hooks/queries/useDailyQuestQueries'
import { useFriendGardenTheme } from '@/hooks/useFriendGardenTheme'
import type {
  User,
  GardenElement,
  Position2D,
  ElementType,
  RarityLevel,
  MoodType,
  Garden,
  MoodEntry,
} from '@/types'
import {
  ViewMode,
  SeasonalVariant,
  GardenDisplayMode,
  MoodIntensity,
} from '@/types'
import { authenticatedFetch } from '@/utils/apiClient'
import {
  getElementName,
  getElementDescription,
  getElementEmoji as getElementEmojiFromUtils,
  getElementColor,
  getElementScale,
} from '@/utils/elementNames'
import { getCurrentSeason } from '@/utils/elementGeneration'
import { PaletteView } from './PaletteView'

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
  readonly gardenTheme: string
  readonly roomTheme?: string
  readonly friendGardenDisplay?: GardenDisplayMode
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
  readonly moodHistory?: readonly FriendMoodEntry[]
  readonly total: number
  readonly canEdit: false
  readonly viewMode: 'friend'
}

interface FriendMoodEntry {
  readonly id: string
  readonly mood: MoodType
  readonly intensity: number
  readonly moodDate: string
  readonly createdAt?: string
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
  const { updateQuestsWithValidation } = useQuestIntegration({
    onQuestUpdated: () => undefined,
  })

  // Получаем квесты для умной валидации
  const { data: questsData } = useDailyQuests(currentUser?.telegramId || 0)

  // 🔑 Отслеживаем, был ли уже обновлён квест для избежания повторных вызовов
  const questUpdatedRef = useRef(false)

  // Состояние для данных сада друга (изолировано от основного garden store)
  const [friendGarden, setFriendGarden] = useState<FriendGardenData | null>(
    null
  )
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedElement, setSelectedElement] = useState<GardenElement | null>(
    null
  )
  // Состояние для управления комнатами сада друга
  const [currentRoomIndex, setCurrentRoomIndex] = useState(0)
  const [displayMode, setDisplayMode] = useState<GardenDisplayMode>(
    GardenDisplayMode.GARDEN
  )

  // Обработчик изменения комнаты
  const handleRoomChange = useCallback(
    (newRoomIndex: number) => {
      setCurrentRoomIndex(newRoomIndex)
      hapticFeedback('light')
    },
    [hapticFeedback]
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

      const response = await authenticatedFetch(
        `/api/garden?action=view-friend-garden&viewerTelegramId=${currentUser.telegramId}&friendTelegramId=${friendTelegramId}`
      )

      const result = await response.json()

      if (!response.ok || !result.success) {
        // Преобразуем английские ошибки в русские user-friendly сообщения
        const errorMessage = result.error || 'Failed to load friend garden'
        let russianError = 'Не удалось загрузить сад друга'

        if (
          errorMessage.includes('not your friend') ||
          errorMessage.includes('not friends')
        ) {
          russianError = 'Вы не являетесь друзьями с этим пользователем'
        } else if (
          errorMessage.includes('private') ||
          errorMessage.includes('hidden')
        ) {
          russianError = 'Этот пользователь скрыл свой сад'
        } else if (errorMessage.includes('not found')) {
          russianError = 'Пользователь не найден'
        } else if (errorMessage.includes('permission')) {
          russianError = 'Нет доступа к саду этого пользователя'
        }

        throw new Error(russianError)
      }
      setFriendGarden(result.data)
      // Сбрасываем индекс комнаты при загрузке нового сада
      setCurrentRoomIndex(0)
      hapticFeedback('success')

      // 🎯 Обновляем прогресс daily quest для посещения сада друга с умной валидацией
      if (currentUser?.telegramId && !questUpdatedRef.current) {
        questUpdatedRef.current = true

        // Выполняем обновление квеста в фоне, не блокируя основной UI
        if (questsData?.quests && questsData.quests.length > 0) {
          updateQuestsWithValidation(
            {
              friendTelegramId: friendTelegramId,
            },
            questsData.quests
          ).catch(() => {
            // Сбрасываем флаг при ошибке, чтобы можно было повторить
            questUpdatedRef.current = false
          })
        }
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Не удалось загрузить сад'
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

  useEffect(() => {
    if (friendGarden?.friendInfo.friendGardenDisplay) {
      setDisplayMode(friendGarden.friendInfo.friendGardenDisplay)
    }
  }, [friendGarden?.friendInfo.friendGardenDisplay])

  // 🎨 Получаем тему сада друга
  const { theme: friendTheme } = useFriendGardenTheme(
    friendGarden?.friendInfo.gardenTheme
  )

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

      // 🍂 Определяем сезон на основе даты разблокировки элемента
      const seasonalVariant = getCurrentSeason(new Date(element.unlockDate))

      return {
        id: element.id,
        type: element.type,
        position: element.position,
        unlockDate: new Date(element.unlockDate),
        moodInfluence: element.moodInfluence,
        rarity: element.rarity,
        seasonalVariant, // 🍂 Добавляем сезонную расцветку
        name,
        description,
        emoji,
        color,
        scale,
      }
    }) || []

  const friendMoodHistory: MoodEntry[] =
    friendGarden?.moodHistory?.map(entry => ({
      id: entry.id,
      userId: friendGarden.friendInfo.telegramId.toString(),
      date: new Date(entry.moodDate),
      mood: entry.mood,
      intensity: Number(entry.intensity) as MoodIntensity,
      createdAt: new Date(entry.createdAt ?? entry.moodDate),
    })) ?? []

  const canRenderPalette = friendMoodHistory.length > 0

  useEffect(() => {
    if (displayMode === GardenDisplayMode.PALETTE && !canRenderPalette) {
      setDisplayMode(GardenDisplayMode.GARDEN)
    }
  }, [displayMode, canRenderPalette])

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
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-blue-600 border-t-transparent dark:border-blue-400"></div>
          <p className="text-gray-600 dark:text-gray-400">
            Загружаем сад друга...
          </p>
        </motion.div>
      </div>
    )
  }

  // ❌ Состояние ошибки
  if (error || !friendGarden) {
    const isFriendshipError = error?.includes('не являетесь друзьями') || false
    const isPrivacyError = error?.includes('скрыл свой сад') || false

    return (
      <div className="space-y-4">
        <Button onClick={onBack} variant="outline" size="sm" className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Назад
        </Button>

        <Card className="p-6 text-center">
          <div className="mb-4 text-6xl">
            {isFriendshipError ? '👥' : isPrivacyError ? '🔒' : '😔'}
          </div>
          <h3 className="mb-2 text-xl font-bold text-gray-900 dark:text-gray-100">
            {isFriendshipError
              ? 'Сад доступен только друзьям'
              : isPrivacyError
                ? 'Сад скрыт'
                : 'Не удалось загрузить сад'}
          </h3>
          <p className="mb-6 text-sm text-gray-600 dark:text-gray-400">
            {error || 'Возможно, пользователь ограничил доступ к своему саду'}
          </p>

          <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
            {isFriendshipError && (
              <Button
                onClick={() => {
                  // Переходим на профиль пользователя для добавления в друзья
                  onBack()
                  window.location.href = `/friend/${friendTelegramId}`
                }}
                size="sm"
                variant="primary"
              >
                Добавить в друзья
              </Button>
            )}
            <Button
              onClick={() => void loadFriendGarden()}
              size="sm"
              variant={isFriendshipError ? 'outline' : 'primary'}
            >
              Попробовать снова
            </Button>
            <Button onClick={onBack} variant="outline" size="sm">
              Вернуться
            </Button>
          </div>
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
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Сад пользователя
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Только для просмотра
          </p>
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
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                {friendGarden.friendInfo.username
                  ? `@${friendGarden.friendInfo.username}`
                  : `${friendGarden.friendInfo.firstName} ${friendGarden.friendInfo.lastName || ''}`.trim()}
              </h3>
            </div>

            <div className="mt-2 flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
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
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Сад {friendGarden.friendInfo.firstName}
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {friendGarden.total} растений • Сад друга
            </p>
          </div>
          <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
            <Flame className="h-4 w-4" />
            <span>{friendGarden.friendInfo.currentStreak} дней</span>
          </div>
        </div>
      </Card>

      {/* Рендер сада с поддержкой разных режимов просмотра */}
      <Card className="p-2 md:p-4">
        <div className="mt-2">
          {displayMode === GardenDisplayMode.PALETTE ? (
            canRenderPalette ? (
              <div className="flex min-h-[360px] items-center justify-center p-2 sm:p-4 lg:p-6">
                <PaletteView
                  className="h-full w-full max-w-3xl"
                  moodHistoryOverride={friendMoodHistory}
                />
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-neutral-300/60 bg-neutral-50/70 px-4 py-6 text-center text-sm text-neutral-700 dark:border-neutral-600/60 dark:bg-neutral-900/60 dark:text-neutral-300">
                У друга пока нет отметок настроения для палитры. Показан будет
                классический сад.
              </div>
            )
          ) : displayMode === GardenDisplayMode.ISOMETRIC_ROOM ? (
            <IsometricRoomView
              elements={convertedElements}
              selectedElement={
                convertedElements.find(e => e.id === selectedElement?.id) ||
                null
              }
              elementBeingMoved={null}
              viewMode={ViewMode.OVERVIEW}
              currentRoomIndex={currentRoomIndex}
              onRoomChange={handleRoomChange}
              onElementClick={handleElementSelect}
              onElementLongPress={() => {}}
              onSlotClick={() => {}}
              friendTheme={friendTheme}
              roomThemeIdOverride={
                friendGarden.friendInfo.roomTheme ?? 'isoRoom'
              }
            />
          ) : (
            <GardenRoomManager
              elements={convertedElements}
              selectedElement={
                convertedElements.find(e => e.id === selectedElement?.id) ||
                null
              }
              onElementClick={handleElementSelect}
              onElementLongPress={() => {}} // Отключаем долгое нажатие для друзей
              onSlotClick={() => {}} // Отключаем клики по слотам для друзей
              elementBeingMoved={null} // Никогда не перемещаем элементы у друзей
              draggedElement={null}
              viewMode={ViewMode.OVERVIEW}
              currentRoomIndex={currentRoomIndex}
              onRoomChange={handleRoomChange}
              friendTheme={friendTheme} // Передаем тему сада друга
            />
          )}
        </div>
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
                    <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                      {selectedElement.name}
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {selectedElement.description}
                    </p>
                  </div>
                </div>

                <div className="text-right text-sm text-gray-500 dark:text-gray-400">
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
                <Info className="h-4 w-4 text-blue-500 dark:text-blue-400" />
                <span className="text-gray-600 dark:text-gray-400">
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
          <h4 className="mb-2 font-medium text-gray-900 dark:text-gray-100">
            Сад пуст
          </h4>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {friendGarden.friendInfo.firstName} ещё не добавил элементы в свой
            сад
          </p>
        </Card>
      )}
    </div>
  )
}
