/**
 * ИЗОМЕТРИЧЕСКИЙ ВИД КОМНАТЫ
 *
 * КАК ИЗМЕНИТЬ ПОЗИЦИИ РАСТЕНИЙ:
 * 1. СЛОТЫ ДЛЯ РАСТЕНИЙ: Измените SLOT_POSITIONS
 * 2. ФОНОВЫЕ ИЗОБРАЖЕНИЯ: Измените ROOM_ASSETS
 */

import { useMemo, useRef } from 'react'
import { useGardenTheme } from '@/hooks/useGardenTheme'
import { useRoomTheme } from '@/hooks/useRoomTheme'
import { useGardenRooms } from '@/hooks'
import { ParticleCanvas } from './ParticleCanvas'
import { PlantRenderer } from './plants/PlantRenderer'
import { RoomNavigator } from './RoomNavigator'
import { useTranslation } from '@/hooks/useTranslation'
import type { GardenElement, ViewMode } from '@/types'
import type { GardenTheme } from '@/hooks/useGardenTheme'

// --- КОНСТАНТЫ ГЕОМЕТРИИ ---
const TILE_SIZE = 24
const ISO_ANGLE = 30 * (Math.PI / 180)
const ORIGIN_X = 225
const ORIGIN_Y = 300

// ============================================
// КОНФИГУРАЦИЯ КОМНАТЫ
// ============================================

// Фоновые изображения комнат
const ROOM_ASSETS: Record<string, string> = {
  isoRoom: '/isoRoom/isoRoom.webp',
  autumn_room: '/isoRoom/autumn_room.webp',
  brick_room: '/isoRoom/brick_room.webp',
  cyberpunk_room: '/isoRoom/cyberpunk_room.webp',
  zodiac_room: '/isoRoom/zodiac_room.webp',
  dark_neon_room: '/isoRoom/dark-neon_room.webp',
  high_tec_room: '/isoRoom/high-tec_room.webp',
  new_year_room: '/isoRoom/new-year_room.webp',
  paint_room: '/isoRoom/paint_room.webp',
  prison_room: '/isoRoom/prison_room.webp',
}

// Позиции слотов для размещения элементов
// Каждый слот - это место, куда можно поставить растение/предмет
// Измените координаты здесь, чтобы переместить слоты
const SLOT_POSITIONS = {
  // Полки слева (4 слота: 0-3)
  shelfTopLeft: { x: 0, y: 2, z: 9 }, // Верхняя полка, левая позиция
  shelfTopRight: { x: 0, y: 3.5, z: 9 }, // Верхняя полка, правая позиция
  shelfBottomLeft: { x: 0, y: 2, z: 6 }, // Нижняя полка, левая позиция
  shelfBottomRight: { x: 0, y: 3.5, z: 6.25 }, // Нижняя полка, правая позиция

  // Подоконник справа (4 слота: 4-7)
  windowSill1: { x: 2, y: 0, z: 6 }, // Подоконник, позиция 1
  windowSill2: { x: 3.25, y: 0, z: 6 }, // Подоконник, позиция 2
  windowSill3: { x: 4.75, y: 0, z: 6 }, // Подоконник, позиция 3
  windowSill4: { x: 6, y: 0, z: 6 }, // Подоконник, позиция 4

  // Стол (4 слота: 8-11)
  tableTopLeft: { x: 4.5, y: 5, z: 7.5 }, // Стол, верхний левый
  tableTopRight: { x: 6.5, y: 5, z: 7.5 }, // Стол, верхний правый
  tableBottomLeft: { x: 4.5, y: 6.25, z: 7.5 }, // Стол, нижний левый
  tableBottomRight: { x: 6.5, y: 6.25, z: 7.5 }, // Стол, нижний правый

  // Пол (4 слота: 12-15)
  floor1: { x: 3.0, y: 7, z: 4 }, // Пол, позиция 1
  floor2: { x: 5, y: 7.0, z: 4 }, // Пол, позиция 2
  floor3: { x: 7.5, y: 4.0, z: 4 }, // Пол, позиция 3
  floor4: { x: 7.5, y: 2.0, z: 4 }, // Пол, позиция 4
} as const

// Маппинг индексов слотов на позиции (для обратной совместимости)
const SLOT_INDEX_MAP: readonly (keyof typeof SLOT_POSITIONS)[] = [
  'shelfTopLeft',
  'shelfTopRight',
  'shelfBottomLeft',
  'shelfBottomRight',
  'windowSill1',
  'windowSill2',
  'windowSill3',
  'windowSill4',
  'tableTopLeft',
  'tableTopRight',
  'tableBottomLeft',
  'tableBottomRight',
  'floor1',
  'floor2',
  'floor3',
  'floor4',
] as const

// --- МАТЕМАТИКА ---
const toIso = (x: number, y: number, z: number) => {
  const safeX = Number(x) || 0
  const safeY = Number(y) || 0
  const safeZ = Number(z) || 0
  const isoX = (safeX - safeY) * Math.cos(ISO_ANGLE) * TILE_SIZE + ORIGIN_X
  const isoY =
    (safeX + safeY) * Math.sin(ISO_ANGLE) * TILE_SIZE -
    safeZ * TILE_SIZE +
    ORIGIN_Y
  return { x: isoX, y: isoY }
}

interface IsometricRoomViewProps {
  readonly elements: readonly GardenElement[]
  readonly selectedElement?: GardenElement | null
  readonly elementBeingMoved?: GardenElement | null
  readonly viewMode: ViewMode
  readonly currentRoomIndex: number
  readonly onRoomChange: (newIndex: number) => void
  readonly onElementClick?: (element: GardenElement) => void
  readonly onElementLongPress?: (element: GardenElement) => void
  readonly onSlotClick?: (shelfIndex: number, position: number) => void
  readonly friendTheme?: GardenTheme | null
  readonly roomThemeIdOverride?: string
}

export function IsometricRoomView({
  elements,
  selectedElement,
  elementBeingMoved,
  currentRoomIndex,
  onRoomChange,
  onElementClick,
  onElementLongPress,
  friendTheme,
  roomThemeIdOverride,
}: IsometricRoomViewProps) {
  const { theme: defaultTheme } = useGardenTheme()
  const { roomTheme } = useRoomTheme()
  const theme = friendTheme ?? defaultTheme
  const containerRef = useRef<HTMLDivElement>(null)

  const { currentRoom, navigation } = useGardenRooms({
    elements,
    currentRoomIndex,
  })

  // Рассчитываем позиции
  const placedElements = useMemo(() => {
    if (!currentRoom) return []

    return currentRoom.elements
      .map(el => {
        const slotIndex = (el.position.y * 4 + el.position.x) % 16
        const coords = getSlotCoords(slotIndex)
        // Сортировка по глубине (painter's algorithm)
        const depth = coords.x + coords.y + coords.z * 0.1

        return { ...el, renderCoords: coords, depth, slotIndex }
      })
      .sort((a, b) => a.depth - b.depth)
  }, [currentRoom])

  function getSlotCoords(index: number): { x: number; y: number; z: number } {
    if (index >= 0 && index < SLOT_INDEX_MAP.length) {
      const slotKey = SLOT_INDEX_MAP[index]
      if (slotKey) {
        const pos = SLOT_POSITIONS[slotKey]
        return { x: pos.x, y: pos.y, z: pos.z }
      }
    }
    return { x: 0, y: 0, z: 0 }
  }

  // Получаем путь к фоновому изображению для текущей комнаты
  const activeRoomThemeId = roomThemeIdOverride ?? roomTheme?.id ?? 'isoRoom'
  const roomBackground =
    ROOM_ASSETS[activeRoomThemeId] ?? ROOM_ASSETS['isoRoom']
  const t = useTranslation()

  return (
    <div className="relative w-full">
      <div className="mb-4 px-4">
        <RoomNavigator
          navigation={navigation}
          roomName={currentRoom?.name ?? t.gardenActions.room}
          onNavigate={dir =>
            onRoomChange(
              dir === 'prev' ? currentRoomIndex - 1 : currentRoomIndex + 1
            )
          }
          isMovingElement={!!elementBeingMoved}
        />
      </div>

      <div
        ref={containerRef}
        className="relative h-full w-full overflow-hidden"
        style={{ minHeight: '500px' }}
      >
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 transition-colors dark:from-neutral-900 dark:via-neutral-900 dark:to-neutral-800" />
        <ParticleCanvas
          theme={theme}
          shouldUseAnimations={true}
          particleDensity={12}
          containerRef={containerRef}
        />

        {/* ОБЩИЙ КОНТЕЙНЕР ДЛЯ СИНХРОННОГО МАСШТАБИРОВАНИЯ */}
        <div className="pointer-events-none absolute inset-0 z-0 flex items-center justify-center">
          {/* СЛОЙ 1: ФОН (Красивый 3D рендер) */}
          <div className="relative h-full w-full max-w-[600px]">
            <img
              src={roomBackground}
              alt="Room Background"
              className="h-full w-full object-contain"
              style={{ objectPosition: 'center' }}
            />

            {/* СЛОЙ 2: ИНТЕРАКТИВ (SVG) */}
            {/* Этот слой лежит ПОВЕРХ картинки. Он прозрачный. */}
            {/* В нем рисуем ТОЛЬКО растения и невидимые зоны для клика */}
            <svg
              viewBox="0 0 450 450"
              className="pointer-events-auto absolute inset-0 h-full w-full"
              preserveAspectRatio="xMidYMid meet"
              style={{
                overflow: 'visible',
              }}
            >
              {/* --- РАСТЕНИЯ / ПРЕДМЕТЫ --- */}
              {placedElements.map(element => {
                const { x, y, z } = element.renderCoords
                const screenPos = toIso(x, y, z)
                const isSelected = selectedElement?.id === element.id

                return (
                  <foreignObject
                    key={element.id}
                    x={screenPos.x - 30}
                    y={screenPos.y - 54}
                    width={60}
                    height={60}
                    style={{ overflow: 'visible', zIndex: 100 }}
                    className="pointer-events-none"
                  >
                    <div
                      className="pointer-events-auto flex h-full w-full items-end justify-center"
                      onClick={() => onElementClick?.(element)}
                      onContextMenu={e => {
                        e.preventDefault()
                        onElementLongPress?.(element)
                      }}
                    >
                      <div
                        style={{
                          transform: isSelected
                            ? 'scale(1.15) translateY(-8px)'
                            : 'scale(1)',
                          transition:
                            'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.27)',
                          filter: isSelected
                            ? 'drop-shadow(0 0 15px rgba(255,255,255,0.8))'
                            : 'drop-shadow(0 5px 10px rgba(0,0,0,0.1))',
                        }}
                      >
                        <PlantRenderer
                          element={element}
                          size={52}
                          isSelected={isSelected}
                        />
                      </div>
                    </div>
                  </foreignObject>
                )
              })}
            </svg>
          </div>
        </div>
      </div>
    </div>
  )
}
