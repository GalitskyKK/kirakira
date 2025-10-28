import { useCallback, useMemo } from 'react'
import { motion, AnimatePresence, PanInfo } from 'framer-motion'
import { useGardenRooms } from '@/hooks'
import { ShelfView } from './ShelfView'
import { RoomNavigator } from './RoomNavigator'
import type { GardenElement, ViewMode } from '@/types'
import { ROOM_TRANSITION_DURATION, SHELVES_PER_ROOM } from '@/types'
import type { GardenTheme } from '@/hooks/useGardenTheme'

interface GardenRoomManagerProps {
  readonly elements: readonly GardenElement[]
  readonly selectedElement?: GardenElement | null
  readonly draggedElement?: GardenElement | null
  readonly elementBeingMoved?: GardenElement | null
  readonly viewMode: ViewMode
  readonly currentRoomIndex: number
  readonly onRoomChange: (newIndex: number) => void
  readonly onElementClick?: (element: GardenElement) => void
  readonly onElementLongPress?: (element: GardenElement) => void
  readonly onSlotClick?: (shelfIndex: number, position: number) => void
  readonly friendTheme?: GardenTheme | null // Опциональная тема для сада друга
}

/**
 * FAANG-level Room Manager для масштабируемого сада
 *
 * Возможности:
 * - Автоматическое распределение элементов по комнатам
 * - Плавная навигация между комнатами с анимацией
 * - Поддержка жестов свайпа для мобильных устройств
 * - Pagination индикатор
 * - Предзагрузка соседних комнат для smooth transitions
 * - Автоматическое создание новых комнат при необходимости
 */
export function GardenRoomManager({
  elements,
  selectedElement,
  draggedElement,
  elementBeingMoved,
  viewMode,
  currentRoomIndex,
  onRoomChange,
  onElementClick,
  onElementLongPress,
  onSlotClick,
  friendTheme,
}: GardenRoomManagerProps) {
  // Используем хук для управления комнатами
  const { rooms, currentRoom, navigation } = useGardenRooms({
    elements,
    currentRoomIndex,
  })

  /**
   * Обработчик навигации между комнатами
   */
  const handleNavigate = useCallback(
    (direction: 'prev' | 'next') => {
      const newIndex =
        direction === 'prev' ? currentRoomIndex - 1 : currentRoomIndex + 1

      if (newIndex >= 0 && newIndex < rooms.length) {
        onRoomChange(newIndex)
      }
    },
    [currentRoomIndex, rooms.length, onRoomChange]
  )

  /**
   * Обработчик жестов drag (свайп)
   * Переключает комнаты при достаточном свайпе
   */
  const handleDragEnd = useCallback(
    (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      const swipeThreshold = 50 // Минимальное расстояние для свайпа (px)
      const swipeVelocity = 500 // Минимальная скорость для свайпа (px/s)

      const { offset, velocity } = info

      // Свайп влево (показать следующую комнату)
      if (
        (offset.x < -swipeThreshold || velocity.x < -swipeVelocity) &&
        navigation.canNavigateNext
      ) {
        handleNavigate('next')
      }
      // Свайп вправо (показать предыдущую комнату)
      else if (
        (offset.x > swipeThreshold || velocity.x > swipeVelocity) &&
        navigation.canNavigatePrev
      ) {
        handleNavigate('prev')
      }
    },
    [navigation, handleNavigate]
  )

  /**
   * Преобразует глобальную позицию элемента в локальную для текущей комнаты
   * Это нужно для правильного отображения элементов на полках
   */
  const getLocalElements = useMemo(() => {
    if (!currentRoom) return []

    return currentRoom.elements.map(element => ({
      ...element,
      position: {
        x: element.position.x,
        y: element.position.y - currentRoomIndex * SHELVES_PER_ROOM,
      },
    }))
  }, [currentRoom, currentRoomIndex])

  /**
   * Обработчик клика по слоту - преобразует локальные координаты в глобальные
   */
  const handleSlotClick = useCallback(
    (localShelfIndex: number, position: number) => {
      // Преобразуем локальный индекс полки в глобальный
      const globalShelfIndex =
        localShelfIndex + currentRoomIndex * SHELVES_PER_ROOM

      console.log('🎯 GardenRoomManager: Slot clicked', {
        localShelfIndex,
        globalShelfIndex,
        position,
        currentRoomIndex,
        SHELVES_PER_ROOM,
      })

      if (onSlotClick) {
        onSlotClick(globalShelfIndex, position)
      }
    },
    [currentRoomIndex, onSlotClick]
  )

  // Анимация перехода между комнатами
  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 1000 : -1000,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      x: direction > 0 ? -1000 : 1000,
      opacity: 0,
    }),
  }

  // Направление анимации
  const direction = 0 // Можно расширить для определения направления слайда

  return (
    <div className="relative w-full">
      {/* Навигатор комнат */}
      <div className="mb-4 px-4">
        <RoomNavigator
          navigation={navigation}
          roomName={currentRoom?.name ?? 'Загрузка...'}
          onNavigate={handleNavigate}
          isMovingElement={!!elementBeingMoved}
        />
      </div>

      {/* Контейнер для комнат с анимацией */}
      <div className="relative min-h-[650px] w-full overflow-hidden sm:min-h-[700px] lg:min-h-[750px]">
        <AnimatePresence initial={false} custom={direction} mode="wait">
          <motion.div
            key={currentRoomIndex}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              x: {
                type: 'spring',
                stiffness: 300,
                damping: 30,
                duration: ROOM_TRANSITION_DURATION,
              },
              opacity: { duration: ROOM_TRANSITION_DURATION * 0.5 },
            }}
            drag={false} // Свайп отключен чтобы не конфликтовал с навигацией
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.2}
            onDragEnd={handleDragEnd}
            className="w-full"
          >
            {/* Отображаем полки для текущей комнаты */}
            <ShelfView
              elements={getLocalElements}
              selectedElement={selectedElement ?? null}
              draggedElement={draggedElement ?? null}
              elementBeingMoved={elementBeingMoved ?? null}
              viewMode={viewMode}
              friendTheme={friendTheme ?? null}
              {...(onElementClick ? { onElementClick } : {})}
              {...(onElementLongPress ? { onElementLongPress } : {})}
              {...(onSlotClick ? { onSlotClick: handleSlotClick } : {})}
            />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Информация о загруженности комнаты */}
      {currentRoom && (
        <motion.div
          className="mt-4 px-4 text-center text-xs text-gray-500"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          {currentRoom.elements.length} из {currentRoom.capacity} элементов
          {currentRoom.isFull && (
            <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-amber-700">
              Комната заполнена
            </span>
          )}
        </motion.div>
      )}
    </div>
  )
}
