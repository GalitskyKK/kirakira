import { useMemo, useRef } from 'react'
import { useGardenTheme } from '@/hooks/useGardenTheme'
import { useGardenRooms } from '@/hooks'
import { ParticleCanvas } from './ParticleCanvas'
import { PlantRenderer } from './plants/PlantRenderer'
import { RoomNavigator } from './RoomNavigator'
import type { GardenElement, ViewMode } from '@/types'
import type { GardenTheme } from '@/hooks/useGardenTheme'

// --- КОНСТАНТЫ ГЕОМЕТРИИ ---
const TILE_SIZE = 24 // Чуть крупнее масштаб
const ISO_ANGLE = 30 * (Math.PI / 180)
const ORIGIN_X = 225
const ORIGIN_Y = 300 // Подняли комнату повыше

// --- ЦВЕТОВАЯ ПАЛИТРА (как на референсе) ---
const COLORS = {
  wallLeft: ['#E0C3FC', '#8EC5FC'], // Градиент левой стены
  wallRight: ['#F7CAC9', '#D4FC79'], // Градиент правой стены (персиковый/зеленоватый)
  floor: ['#FFDEE9', '#B5FFFC'], // Пол
  woodLight: '#FFE0B2', // Столешница, подоконник
  woodDark: '#D7CCC8', // Ножки, тени
  white: '#FFFFFF',
  glass: 'rgba(255, 255, 255, 0.3)',
  shadow: 'rgba(84, 58, 183, 0.1)',
}

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

const toPathString = (points: { x: number; y: number }[]) => {
  if (points.length === 0) return ''
  return `M ${points.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' L ')} Z`
}

// Генерация куба с возможностью скругления (фейкового через stroke)
const createCubePath = (
  x: number,
  y: number,
  z: number,
  w: number,
  d: number,
  h: number
) => {
  const p1 = toIso(x, y, z + h) // Top-Back
  const p2 = toIso(x + w, y, z + h) // Top-Right
  const p3 = toIso(x + w, y + d, z + h) // Top-Front
  const p4 = toIso(x, y + d, z + h) // Top-Left

  const p6 = toIso(x + w, y, z) // Bottom-Right
  const p7 = toIso(x + w, y + d, z) // Bottom-Front
  const p8 = toIso(x, y + d, z) // Bottom-Left

  return {
    top: toPathString([p1, p2, p3, p4]),
    right: toPathString([p2, p3, p7, p6]),
    left: toPathString([p4, p3, p7, p8]), // Front-Left face
  }
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

  // Фильтруем элементы и добавляем им координаты
  const placedElements = useMemo(() => {
    if (!currentRoom) return []

    return currentRoom.elements
      .map(el => {
        // Получаем индекс слота (предполагаем сетку 4x4 = 16 элементов макс)
        // x и y в GardenElement обычно 0..3. Преобразуем в линейный индекс 0..15
        const slotIndex = (el.position.y * 4 + el.position.x) % 16
        const coords = getSlotCoords(slotIndex)
        // Z-index для сортировки отрисовки (чем "ближе" к зрителю (больше X+Y), тем позже рисуем)
        const depth = coords.x + coords.y + coords.z

        return { ...el, renderCoords: coords, depth }
      })
      .sort((a, b) => a.depth - b.depth) // Сортируем чтобы передние не перекрывались задними
  }, [currentRoom])

  // --- ЛОГИКА СЛОТОВ (16 мест) ---
  function getSlotCoords(index: number) {
    // 0-3: Полки слева (2 полки по 2 места)
    if (index < 4) {
      const shelfRow = Math.floor(index / 2) // 0 (верхняя) или 1 (нижняя)
      const pos = index % 2
      // x=0.5 (немного от стены), z=высоко
      return {
        x: 0.8,
        y: 2.5 + shelfRow * 3.5 + pos * 1.5, // Распределяем по Y
        z: 6 - shelfRow * 2.5, // Верхняя выше
      }
    }
    // 4-7: Подоконник справа
    if (index < 8) {
      const local = index - 4
      return {
        x: 2.5 + local * 1.5, // Вдоль правой стены
        y: 0.8, // На подоконнике (близко к Y=0)
        z: 3.8, // Высота подоконника + горшок
      }
    }
    // 8-11: Стол (Центр)
    if (index < 12) {
      const local = index - 8
      const row = Math.floor(local / 2)
      const col = local % 2
      return {
        x: 5.5 + col * 1.5,
        y: 5.5 + row * 1.5,
        z: 2.2, // Высота стола
      }
    }
    // 12-15: Пол (Передний план)
    const local = index - 12
    return {
      x: 3 + local * 1.5,
      y: 8, // Ближе к камере
      z: 0,
    }
  }

  return (
    <div className="relative w-full">
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
        style={{ minHeight: '500px' }}
      >
        {/* Анимированный фон (частицы) */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50" />
        <ParticleCanvas
          theme={theme}
          shouldUseAnimations={true}
          particleDensity={12}
          containerRef={containerRef}
        />

        <div className="relative z-10 flex h-full w-full items-center justify-center p-4">
          <svg
            viewBox="0 0 450 450"
            className="h-full w-full max-w-[600px]"
            preserveAspectRatio="xMidYMid meet"
            style={{
              overflow: 'visible',
              filter: 'drop-shadow(0 20px 40px rgba(100,100,200,0.15))',
            }}
          >
            <defs>
              <linearGradient id="gradLeft" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor={COLORS.wallLeft[0]} />
                <stop offset="100%" stopColor={COLORS.wallLeft[1]} />
              </linearGradient>
              <linearGradient id="gradRight" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor={COLORS.wallRight[0]} />
                <stop offset="100%" stopColor={COLORS.wallRight[1]} />
              </linearGradient>
              <linearGradient
                id="gradFloor"
                x1="0%"
                y1="0%"
                x2="100%"
                y2="100%"
              >
                <stop offset="0%" stopColor={COLORS.floor[0]} />
                <stop offset="100%" stopColor={COLORS.floor[1]} />
              </linearGradient>
              <filter id="softGlow">
                <feGaussianBlur stdDeviation="2" result="coloredBlur" />
                <feMerge>
                  <feMergeNode in="coloredBlur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* --- СТРУКТУРА КОМНАТЫ --- */}

            {/* 1. Пол */}
            <IsoCube
              x={0}
              y={0}
              z={-0.5}
              w={10}
              d={10}
              h={0.5}
              topFill="url(#gradFloor)"
              sideFill="#F0E6FA"
              stroke={COLORS.white}
            />

            {/* 2. Стены (Толстые) */}
            {/* Левая стена */}
            <IsoCube
              x={-0.5}
              y={0}
              z={0}
              w={0.5}
              d={10}
              h={8}
              rightFill="url(#gradLeft)"
              topFill="#fff"
              leftFill="#fff"
              stroke="rgba(255,255,255,0.5)"
            />
            {/* Правая стена */}
            <IsoCube
              x={0}
              y={-0.5}
              z={0}
              w={10}
              d={0.5}
              h={8}
              leftFill="url(#gradRight)"
              topFill="#fff"
              rightFill="#fff"
              stroke="rgba(255,255,255,0.5)"
            />
            {/* Плинтусы (для красоты) */}
            <IsoCube
              x={0}
              y={0}
              z={0}
              w={0.2}
              d={10}
              h={0.4}
              topFill="#fff"
              rightFill="#fff"
            />
            <IsoCube
              x={0}
              y={0}
              z={0}
              w={10}
              d={0.2}
              h={0.4}
              topFill="#fff"
              leftFill="#fff"
            />

            {/* --- МЕБЕЛЬ (Задний план) --- */}

            {/* Полки слева */}
            {/* Верхняя */}
            <IsoCube
              x={0}
              y={2}
              z={6}
              w={2}
              d={3.5}
              h={0.2}
              topFill={COLORS.white}
              sideFill="#E1BEE7"
              shadow={true}
            />
            {/* Нижняя */}
            <IsoCube
              x={0}
              y={2}
              z={3.5}
              w={2}
              d={3.5}
              h={0.2}
              topFill={COLORS.white}
              sideFill="#E1BEE7"
              shadow={true}
            />

            {/* Окно справа (углубление + подоконник) */}
            <IsoWindow x={2} y={-0.1} z={3} width={6} height={3.5} />
            {/* Подоконник (выступающий) */}
            <IsoCube
              x={1.8}
              y={0}
              z={2.8}
              w={6.4}
              d={1.5}
              h={0.2}
              topFill={COLORS.woodLight}
              sideFill={COLORS.woodDark}
              shadow={true}
            />

            {/* Стол (по центру) */}
            <g>
              {/* Ножки */}
              <IsoCube
                x={5.5}
                y={5.5}
                z={0}
                w={0.4}
                d={0.4}
                h={2}
                topFill={COLORS.woodLight}
                sideFill={COLORS.woodDark}
              />
              <IsoCube
                x={8.0}
                y={5.5}
                z={0}
                w={0.4}
                d={0.4}
                h={2}
                topFill={COLORS.woodLight}
                sideFill={COLORS.woodDark}
              />
              <IsoCube
                x={5.5}
                y={7.0}
                z={0}
                w={0.4}
                d={0.4}
                h={2}
                topFill={COLORS.woodLight}
                sideFill={COLORS.woodDark}
              />
              <IsoCube
                x={8.0}
                y={7.0}
                z={0}
                w={0.4}
                d={0.4}
                h={2}
                topFill={COLORS.woodLight}
                sideFill={COLORS.woodDark}
              />
              {/* Столешница */}
              <IsoCube
                x={5.2}
                y={5.2}
                z={2}
                w={3.5}
                d={2.5}
                h={0.2}
                topFill="#FFF8E1"
                sideFill="#FFE0B2"
                stroke="#fff"
                shadow={true}
              />
            </g>

            {/* Коврик */}
            <path
              d={createCirclePath(6.5, 6.5, 0.05, 3.5)}
              fill="rgba(255,255,255,0.4)"
            />

            {/* --- РАСТЕНИЯ (Отрисовываем поверх мебели) --- */}
            {placedElements.map(element => {
              const { x, y, z } = element.renderCoords
              // Переводим 3D координаты в 2D экранные
              const screenPos = toIso(x, y, z)
              const isSelected = selectedElement?.id === element.id

              return (
                <foreignObject
                  key={element.id}
                  // Центрируем: 50px ширина/высота контейнера.
                  // Смещаем y наверх сильнее (-45), чтобы "дно" горшка стояло на точке x,y,z
                  x={screenPos.x - 25}
                  y={screenPos.y - 45}
                  width={50}
                  height={50}
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
                          ? 'scale(1.2) translateY(-10px)'
                          : 'scale(1)',
                        transition:
                          'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
                        filter: isSelected
                          ? 'drop-shadow(0 0 15px rgba(255,255,255,0.9))'
                          : 'drop-shadow(0 4px 6px rgba(0,0,0,0.1))',
                      }}
                    >
                      <PlantRenderer
                        element={element}
                        size={42}
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
  )
}

// --- КОМПОНЕНТЫ ОТРИСОВКИ ---

interface IsoCubeProps {
  x?: number
  y?: number
  z?: number
  w?: number
  d?: number
  h?: number
  topFill?: string
  leftFill?: string
  rightFill?: string
  sideFill?: string
  stroke?: string
  shadow?: boolean
  opacity?: number
}

function IsoCube({
  x = 0,
  y = 0,
  z = 0,
  w = 1,
  d = 1,
  h = 1,
  topFill,
  leftFill,
  rightFill,
  sideFill,
  stroke,
  shadow,
  opacity = 1,
}: IsoCubeProps) {
  if (isNaN(x) || isNaN(y) || isNaN(z)) return null

  const paths = createCubePath(x, y, z, w, d, h)
  const fillTop = topFill || '#fff'
  const fillRight = rightFill || sideFill || '#ddd'
  const fillLeft = leftFill || sideFill || '#ccc'
  const strokeColor = stroke || 'none'

  return (
    <g opacity={opacity}>
      {/* Тень под объектом (простая) */}
      {shadow && (
        <path
          d={createRectPath(x, y, z - 0.05, w, d)}
          fill="rgba(0,0,0,0.1)"
          filter="url(#softGlow)"
        />
      )}
      <path
        d={paths.right}
        fill={fillRight}
        stroke={strokeColor}
        strokeWidth="0.5"
        strokeLinejoin="round"
      />
      <path
        d={paths.left}
        fill={fillLeft}
        stroke={strokeColor}
        strokeWidth="0.5"
        strokeLinejoin="round"
      />
      <path
        d={paths.top}
        fill={fillTop}
        stroke={strokeColor}
        strokeWidth="0.5"
        strokeLinejoin="round"
      />

      {/* Подсветка граней для объема */}
      <path
        d={paths.top}
        fill="none"
        stroke="rgba(255,255,255,0.4)"
        strokeWidth="1"
      />
    </g>
  )
}

function IsoWindow({ x = 0, y = 0, z = 0, width = 1, height = 1 }: any) {
  const p1 = toIso(x, y, z + height)
  const p2 = toIso(x + width, y, z + height)
  const p3 = toIso(x + width, y, z)
  const p4 = toIso(x, y, z)

  const glassPath = toPathString([p1, p2, p3, p4])
  // Рама внутри стены (немного темнее)
  return (
    <g>
      <path d={glassPath} fill="#D1C4E9" opacity="0.3" />
      {/* Рама */}
      <path d={glassPath} fill="none" stroke="#FFF" strokeWidth="4" />
      <path d={glassPath} fill="none" stroke="#E1BEE7" strokeWidth="1" />
      {/* Переплет */}
      <path
        d={`M ${(p1.x + p2.x) / 2},${(p1.y + p2.y) / 2} L ${(p3.x + p4.x) / 2},${(p3.y + p4.y) / 2}`}
        stroke="#FFF"
        strokeWidth="3"
      />
      <path
        d={`M ${(p1.x + p4.x) / 2},${(p1.y + p4.y) / 2} L ${(p2.x + p3.x) / 2},${(p2.y + p3.y) / 2}`}
        stroke="#FFF"
        strokeWidth="3"
      />
    </g>
  )
}

// Рисует плоский прямоугольник (для теней или ковров)
function createRectPath(x: number, y: number, z: number, w: number, d: number) {
  const p1 = toIso(x, y, z)
  const p2 = toIso(x + w, y, z)
  const p3 = toIso(x + w, y + d, z)
  const p4 = toIso(x, y + d, z)
  return toPathString([p1, p2, p3, p4])
}

function createCirclePath(x: number, y: number, z: number, radius: number) {
  const steps = 32
  let d = ''
  for (let i = 0; i <= steps; i++) {
    const theta = (i / steps) * Math.PI * 2
    const cx = x + Math.cos(theta) * radius
    const cy = y + Math.sin(theta) * radius
    const p = toIso(cx, cy, z)
    d += (i === 0 ? 'M ' : ' L ') + `${p.x.toFixed(1)},${p.y.toFixed(1)}`
  }
  return d + ' Z'
}
