import { useMemo, useRef } from 'react'
import { useGardenTheme } from '@/hooks/useGardenTheme'
import { useGardenRooms } from '@/hooks'
import { ParticleCanvas } from './ParticleCanvas'
import { PlantRenderer } from './plants/PlantRenderer'
import { RoomNavigator } from './RoomNavigator'
import type { GardenElement, ViewMode } from '@/types'
import type { GardenTheme } from '@/hooks/useGardenTheme'

// --- НАСТРОЙКИ ГЕОМЕТРИИ ---
const ISO_ANGLE = 30 * (Math.PI / 180)
const TILE_SIZE = 32 // Немного увеличил масштаб
const ORIGIN_X = 225 // Центр по горизонтали
const ORIGIN_Y = 120 // Опустил точку отсчета ниже, чтобы комната не улетала вверх

// ЦВЕТОВАЯ ПАЛИТРА (Hardcoded для надежности)
const COLORS = {
  floor: '#F3E5F5', // Светло-сиреневый пол
  floorSide: '#E1BEE7', // Темный срез пола
  wallLeft: '#D1C4E9', // Левая стена
  wallRight: '#C5CAE9', // Правая стена
  tableTop: '#FFECB3', // Стол верх
  tableSide: '#FFE082', // Стол бок
  shelf: '#FFFFFF', // Полки
  outline: '#9FA8DA', // Цвет контуров (мягкий синий вместо черного)
  rug: 'rgba(255, 255, 255, 0.5)',
}

// 3D -> 2D Проекция
const toIso = (x: number, y: number, z: number) => {
  const isoX = (x - y) * Math.cos(ISO_ANGLE) * TILE_SIZE + ORIGIN_X
  const isoY =
    (x + y) * Math.sin(ISO_ANGLE) * TILE_SIZE - z * TILE_SIZE + ORIGIN_Y
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
}: IsometricRoomViewProps) {
  const { theme: defaultTheme } = useGardenTheme()
  const theme = friendTheme ?? defaultTheme
  const containerRef = useRef<HTMLDivElement>(null)

  const { currentRoom, navigation } = useGardenRooms({
    elements,
    currentRoomIndex,
  })

  const currentRoomElements = useMemo(() => {
    if (!currentRoom) return []
    return currentRoom.elements
  }, [currentRoom])

  // Логика координат слотов (где стоят растения)
  const getSlotPosition = (index: number) => {
    // 0-3: Левая стена (полки)
    if (index < 4) {
      const shelfIdx = Math.floor(index / 2) // 0 или 1
      const posInShelf = index % 2
      return {
        x: 0.8, // Чуть отступаем от стены
        y: 2 + shelfIdx * 3 + posInShelf * 1.5,
        z: 4 + shelfIdx * 2.5,
      }
    }
    // 4-7: Правая стена (полки)
    if (index < 8) {
      const local = index - 4
      const shelfIdx = Math.floor(local / 2)
      const posInShelf = local % 2
      return {
        x: 2 + shelfIdx * 3 + posInShelf * 1.5,
        y: 0.8,
        z: 5 - shelfIdx * 2,
      }
    }
    // 8-11: Подоконник (справа)
    if (index < 12) {
      const local = index - 8
      return { x: 3 + local * 1.2, y: 0.2, z: 3.2 }
    }
    // 12-13: Стол (центр)
    if (index < 14) {
      const local = index - 12
      return { x: 5.5 + local * 1.5, y: 5.5 + local * 0.5, z: 2.2 } // z = высота стола
    }
    // Пол
    return { x: 4, y: 4, z: 0 }
  }

  return (
    <div className="relative w-full">
      {/* Навигация */}
      <div className="mb-4 px-4">
        <RoomNavigator
          navigation={navigation}
          roomName={currentRoom?.name ?? 'Комната'}
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
        style={{ minHeight: '600px' }}
      >
        {/* Градиентный фон CSS (надежнее SVG) */}
        <div className="absolute inset-0 bg-gradient-to-b from-indigo-50 via-purple-50 to-pink-50" />

        <ParticleCanvas
          theme={theme}
          shouldUseAnimations={true}
          particleDensity={10}
          containerRef={containerRef}
        />

        {/* Сцена */}
        <div className="relative z-10 flex h-full w-full items-center justify-center p-4">
          <svg
            viewBox="0 0 450 450"
            className="h-full w-full max-w-[600px]"
            preserveAspectRatio="xMidYMid meet"
            style={{
              filter: 'drop-shadow(0 20px 30px rgba(0,0,0,0.1))',
              overflow: 'visible',
            }}
          >
            {/* ГРУППА КОМНАТЫ */}
            <g>
              {/* 1. ПОЛ (Основание) */}
              <IsoCube
                x={0}
                y={0}
                z={-0.5}
                w={10}
                d={10}
                h={0.5}
                top={COLORS.floor}
                side={COLORS.floorSide}
              />

              {/* Коврик (рисуем поверх пола, но под мебелью) */}
              <path d={createCirclePath(5, 5, 0.05, 3)} fill={COLORS.rug} />

              {/* 2. СТЕНЫ */}
              {/* Левая стена (задняя) */}
              <IsoCube
                x={0}
                y={0}
                z={0}
                w={0.5}
                d={10}
                h={8}
                top="#fff"
                side={COLORS.wallLeft}
                right={COLORS.wallLeft}
              />
              {/* Правая стена (задняя) */}
              <IsoCube
                x={0}
                y={0}
                z={0}
                w={10}
                d={0.5}
                h={8}
                top="#fff"
                side={COLORS.wallRight}
                left={COLORS.wallRight}
              />

              {/* 3. ОКНО (Вырез в правой стене) */}
              <IsoWindow x={2} y={-0.1} z={2.5} width={4} height={3} />

              {/* 4. ПОЛКИ (Левая стена) */}
              <IsoCube
                x={0.5}
                y={2}
                z={4}
                w={1}
                d={3}
                h={0.2}
                top={COLORS.shelf}
                side="#DDD"
              />
              <IsoCube
                x={0.5}
                y={2}
                z={6.5}
                w={1}
                d={2.5}
                h={0.2}
                top={COLORS.shelf}
                side="#DDD"
              />

              {/* 5. ПОЛКИ (Правая стена) */}
              <IsoCube
                x={2}
                y={0.5}
                z={5}
                w={3}
                d={1}
                h={0.2}
                top={COLORS.shelf}
                side="#DDD"
              />

              {/* 6. СТОЛ */}
              <g>
                {/* Ножки */}
                <IsoCube
                  x={5.5}
                  y={5.5}
                  z={0}
                  w={0.3}
                  d={0.3}
                  h={2}
                  top={COLORS.tableSide}
                  side={COLORS.tableSide}
                />
                <IsoCube
                  x={7.5}
                  y={5.5}
                  z={0}
                  w={0.3}
                  d={0.3}
                  h={2}
                  top={COLORS.tableSide}
                  side={COLORS.tableSide}
                />
                <IsoCube
                  x={5.5}
                  y={7.0}
                  z={0}
                  w={0.3}
                  d={0.3}
                  h={2}
                  top={COLORS.tableSide}
                  side={COLORS.tableSide}
                />
                <IsoCube
                  x={7.5}
                  y={7.0}
                  z={0}
                  w={0.3}
                  d={0.3}
                  h={2}
                  top={COLORS.tableSide}
                  side={COLORS.tableSide}
                />
                {/* Столешница */}
                <IsoCube
                  x={5.2}
                  y={5.2}
                  z={2}
                  w={3}
                  d={2.5}
                  h={0.2}
                  top={COLORS.tableTop}
                  side={COLORS.tableSide}
                />
              </g>
            </g>

            {/* РАСТЕНИЯ (Слой поверх геометрии) */}
            {currentRoomElements.map(element => {
              // Находим 3D координаты слота
              const localSlotIndex =
                (element.position.y * 4 + element.position.x) % 14
              const pos = getSlotPosition(localSlotIndex)
              const screenPos = toIso(pos.x, pos.y, pos.z)

              const isSelected = selectedElement?.id === element.id
              const isMoving = elementBeingMoved?.id === element.id

              return (
                <foreignObject
                  key={element.id}
                  x={screenPos.x - 25}
                  y={screenPos.y - 45} // Смещение, чтобы точка привязки была у горшка
                  width={50}
                  height={50}
                  style={{ overflow: 'visible', zIndex: 50 }}
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
                          ? 'scale(1.2) translateY(-10px)'
                          : 'scale(1)',
                        transition: 'transform 0.2s ease-out',
                        filter: isSelected
                          ? 'drop-shadow(0 0 8px rgba(255,255,255,0.8))'
                          : 'none',
                      }}
                    >
                      <PlantRenderer
                        element={element}
                        size={42}
                        isSelected={isSelected}
                        isHovered={isMoving}
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
  )
}

// --- ВСПОМОГАТЕЛЬНЫЕ КОМПОНЕНТЫ ---

// Универсальный куб с обводкой и заливкой
function IsoCube({
  x,
  y,
  z,
  w,
  d,
  h,
  top,
  side,
  left,
  right,
  opacity = 1,
}: any) {
  // Вычисляем вершины
  const p1 = toIso(x, y, z + h) // Top-Back
  const p2 = toIso(x + w, y, z + h) // Top-Right
  const p3 = toIso(x + w, y + d, z + h) // Top-Front
  const p4 = toIso(x, y + d, z + h) // Top-Left

  const p6 = toIso(x + w, y, z) // Bottom-Right
  const p7 = toIso(x + w, y + d, z) // Bottom-Front
  const p8 = toIso(x, y + d, z) // Bottom-Left

  // Цвета граней
  const topColor = top || '#eee'
  const rightColor = right || side || '#ddd' // Правая видимая грань
  const leftColor = left || side || '#ccc' // Левая видимая грань
  const strokeColor = COLORS.outline

  return (
    <g opacity={opacity}>
      {/* Правая грань */}
      <path
        d={`${p2.x},${p2.y} ${p3.x},${p3.y} ${p7.x},${p7.y} ${p6.x},${p6.y}`}
        fill={rightColor}
        stroke={strokeColor}
        strokeWidth="1"
        strokeLinejoin="round"
      />
      {/* Левая грань (Передняя) */}
      <path
        d={`${p4.x},${p4.y} ${p3.x},${p3.y} ${p7.x},${p7.y} ${p8.x},${p8.y}`}
        fill={leftColor}
        stroke={strokeColor}
        strokeWidth="1"
        strokeLinejoin="round"
      />
      {/* Верхняя грань */}
      <path
        d={`${p1.x},${p1.y} ${p2.x},${p2.y} ${p3.x},${p3.y} ${p4.x},${p4.y}`}
        fill={topColor}
        stroke={strokeColor}
        strokeWidth="1"
        strokeLinejoin="round"
      />
    </g>
  )
}

function IsoWindow({ x, y, z, width, height }: any) {
  const p1 = toIso(x, y, z + height)
  const p2 = toIso(x + width, y, z + height)
  const p3 = toIso(x + width, y, z)
  const p4 = toIso(x, y, z)

  return (
    <g>
      {/* Стекло */}
      <path
        d={`${p1.x},${p1.y} ${p2.x},${p2.y} ${p3.x},${p3.y} ${p4.x},${p4.y}`}
        fill="#E3F2FD"
        opacity="0.7"
      />
      {/* Рама */}
      <path
        d={`${p1.x},${p1.y} ${p2.x},${p2.y} ${p3.x},${p3.y} ${p4.x},${p4.y}`}
        fill="none"
        stroke={COLORS.tableSide}
        strokeWidth="3"
      />
      {/* Перекладины */}
      <path
        d={`${(p1.x + p2.x) / 2},${(p1.y + p2.y) / 2} ${(p3.x + p4.x) / 2},${(p3.y + p4.y) / 2}`}
        stroke={COLORS.tableSide}
        strokeWidth="1.5"
      />
      <path
        d={`${(p1.x + p4.x) / 2},${(p1.y + p4.y) / 2} ${(p2.x + p3.x) / 2},${(p2.y + p3.y) / 2}`}
        stroke={COLORS.tableSide}
        strokeWidth="1.5"
      />
    </g>
  )
}

function createCirclePath(x: number, y: number, z: number, radius: number) {
  const steps = 32
  let d = ''
  for (let i = 0; i <= steps; i++) {
    const theta = (i / steps) * Math.PI * 2
    const cx = x + Math.cos(theta) * radius
    const cy = y + Math.sin(theta) * radius
    const p = toIso(cx, cy, z)
    d += (i === 0 ? 'M' : 'L') + `${p.x},${p.y}`
  }
  return d + 'Z'
}
