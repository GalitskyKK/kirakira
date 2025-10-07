import { useMemo, useCallback } from 'react'
import type { GardenElement, GardenRoom, RoomNavigationState } from '@/types'
import { SHELVES_PER_ROOM, ELEMENTS_PER_ROOM } from '@/types'

interface UseGardenRoomsParams {
  readonly elements: readonly GardenElement[]
  readonly currentRoomIndex: number
}

interface UseGardenRoomsResult {
  readonly rooms: readonly GardenRoom[]
  readonly currentRoom: GardenRoom | null
  readonly navigation: RoomNavigationState
  readonly getRoomForElement: (element: GardenElement) => number
  readonly getElementsInRoom: (roomIndex: number) => readonly GardenElement[]
  readonly isRoomFull: (roomIndex: number) => boolean
}

/**
 * FAANG-уровень хук для управления комнатами сада
 *
 * Логика распределения элементов:
 * - Каждая комната содержит 4 полки (y: 0-3 для комнаты 0, y: 4-7 для комнаты 1, и т.д.)
 * - Каждая полка содержит до 10 позиций (x: 0-9)
 * - Элементы автоматически распределяются по комнатам на основе position.y
 *
 * @param elements - все элементы сада
 * @param currentRoomIndex - индекс текущей комнаты
 */
export function useGardenRooms({
  elements,
  currentRoomIndex,
}: UseGardenRoomsParams): UseGardenRoomsResult {
  /**
   * Вычисляет номер комнаты для элемента на основе его позиции
   */
  const getRoomForElement = useCallback((element: GardenElement): number => {
    // Номер комнаты = floor(shelfIndex / SHELVES_PER_ROOM)
    // Например: полка 0-3 -> комната 0, полка 4-7 -> комната 1
    return Math.floor(element.position.y / SHELVES_PER_ROOM)
  }, [])

  /**
   * Получает все элементы для конкретной комнаты
   */
  const getElementsInRoom = useCallback(
    (roomIndex: number): readonly GardenElement[] => {
      const startShelf = roomIndex * SHELVES_PER_ROOM
      const endShelf = startShelf + SHELVES_PER_ROOM

      return elements.filter(element => {
        const shelfY = element.position.y
        return shelfY >= startShelf && shelfY < endShelf
      })
    },
    [elements]
  )

  /**
   * Проверяет, заполнена ли комната
   */
  const isRoomFull = useCallback(
    (roomIndex: number): boolean => {
      const elementsInRoom = getElementsInRoom(roomIndex)
      return elementsInRoom.length >= ELEMENTS_PER_ROOM
    },
    [getElementsInRoom]
  )

  /**
   * Вычисляет все комнаты на основе элементов
   * Мемоизировано для производительности
   */
  const rooms = useMemo<readonly GardenRoom[]>(() => {
    if (elements.length === 0) {
      // Даже если нет элементов, создаём первую комнату
      return [
        {
          id: 'room-0',
          index: 0,
          name: 'Первая комната',
          elements: [],
          capacity: ELEMENTS_PER_ROOM,
          isFull: false,
        },
      ]
    }

    // Находим максимальный индекс комнаты среди элементов
    const maxRoomIndex = elements.reduce((max, element) => {
      const roomIndex = getRoomForElement(element)
      return Math.max(max, roomIndex)
    }, 0)

    // Создаём массив комнат (от 0 до maxRoomIndex + 1)
    // +1 чтобы всегда была пустая комната для новых элементов
    const totalRooms = maxRoomIndex + 2

    return Array.from({ length: totalRooms }, (_, roomIndex) => {
      const roomElements = getElementsInRoom(roomIndex)
      const isFull = roomElements.length >= ELEMENTS_PER_ROOM

      return {
        id: `room-${roomIndex}`,
        index: roomIndex,
        name: getRoomName(roomIndex),
        elements: roomElements,
        capacity: ELEMENTS_PER_ROOM,
        isFull,
      }
    })
  }, [elements, getRoomForElement, getElementsInRoom])

  /**
   * Получает текущую комнату
   */
  const currentRoom = useMemo<GardenRoom | null>(() => {
    return rooms[currentRoomIndex] ?? null
  }, [rooms, currentRoomIndex])

  /**
   * Состояние навигации
   */
  const navigation = useMemo<RoomNavigationState>(() => {
    return {
      currentRoomIndex,
      totalRooms: rooms.length,
      canNavigatePrev: currentRoomIndex > 0,
      canNavigateNext: currentRoomIndex < rooms.length - 1,
    }
  }, [currentRoomIndex, rooms.length])

  return {
    rooms,
    currentRoom,
    navigation,
    getRoomForElement,
    getElementsInRoom,
    isRoomFull,
  }
}

/**
 * Генерирует красивое имя для комнаты
 */
function getRoomName(index: number): string {
  const roomNames = [
    'Первая комната',
    'Вторая комната',
    'Третья комната',
    'Четвёртая комната',
    'Пятая комната',
    'Шестая комната',
    'Седьмая комната',
    'Восьмая комната',
    'Девятая комната',
    'Десятая комната',
  ]

  return roomNames[index] ?? `Комната ${index + 1}`
}
