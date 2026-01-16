import { useMemo, useCallback } from 'react'
import type { GardenElement, GardenRoom, RoomNavigationState } from '@/types'
import { SHELVES_PER_ROOM, ELEMENTS_PER_ROOM } from '@/types'
import { useTranslation } from '@/hooks/useTranslation'

interface UseGardenRoomsParams {
  readonly elements: readonly GardenElement[]
  readonly currentRoomIndex: number
  readonly includeEmptyRoom?: boolean
}

interface UseGardenRoomsResult {
  readonly rooms: readonly GardenRoom[]
  readonly currentRoom: GardenRoom | null
  readonly navigation: RoomNavigationState
  readonly effectiveRoomIndex: number
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
  includeEmptyRoom = false,
}: UseGardenRoomsParams): UseGardenRoomsResult {
  const t = useTranslation()

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
    const getRoomNameLocalized = (index: number): string => {
      const roomNames = t.gardenActions.roomNames
      const names = [
        roomNames.first,
        roomNames.second,
        roomNames.third,
        roomNames.fourth,
        roomNames.fifth,
        roomNames.sixth,
        roomNames.seventh,
        roomNames.eighth,
        roomNames.ninth,
        roomNames.tenth,
      ]
      return names[index] ?? `${t.gardenActions.roomNames.first} ${index + 1}`
    }

    if (elements.length === 0) {
      // Даже если нет элементов, создаём первую комнату
      return [
        {
          id: 'room-0',
          index: 0,
          name: getRoomNameLocalized(0),
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
    // +1 комната (maxRoomIndex + 1) всегда существует, а "пустая буферная" показывается
    // только когда это нужно (например, при перемещении элемента между комнатами).
    const totalRooms = includeEmptyRoom ? maxRoomIndex + 2 : maxRoomIndex + 1

    return Array.from({ length: totalRooms }, (_, roomIndex) => {
      const roomElements = getElementsInRoom(roomIndex)
      const isFull = roomElements.length >= ELEMENTS_PER_ROOM

      return {
        id: `room-${roomIndex}`,
        index: roomIndex,
        name: getRoomNameLocalized(roomIndex),
        elements: roomElements,
        capacity: ELEMENTS_PER_ROOM,
        isFull,
      }
    })
  }, [elements, getRoomForElement, getElementsInRoom, t])

  /**
   * Получает текущую комнату
   */
  const effectiveRoomIndex = useMemo(() => {
    if (rooms.length === 0) {
      return 0
    }
    if (currentRoomIndex < 0) {
      return 0
    }
    return Math.min(currentRoomIndex, rooms.length - 1)
  }, [currentRoomIndex, rooms.length])

  const currentRoom = useMemo<GardenRoom | null>(() => {
    return rooms[effectiveRoomIndex] ?? null
  }, [rooms, effectiveRoomIndex])

  /**
   * Состояние навигации
   */
  const navigation = useMemo<RoomNavigationState>(() => {
    return {
      currentRoomIndex: effectiveRoomIndex,
      totalRooms: rooms.length,
      canNavigatePrev: effectiveRoomIndex > 0,
      canNavigateNext: effectiveRoomIndex < rooms.length - 1,
    }
  }, [effectiveRoomIndex, rooms.length])

  return {
    rooms,
    currentRoom,
    navigation,
    effectiveRoomIndex,
    getRoomForElement,
    getElementsInRoom,
    isRoomFull,
  }
}
