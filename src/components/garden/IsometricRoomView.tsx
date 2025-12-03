import { useMemo, useRef } from 'react'
import { useGardenTheme } from '@/hooks/useGardenTheme'
import { useGardenRooms } from '@/hooks'
import { ParticleCanvas } from './ParticleCanvas'
import { PlantRenderer } from './plants/PlantRenderer'
import { RoomNavigator } from './RoomNavigator'
import type { GardenElement, ViewMode } from '@/types'
import type { GardenTheme } from '@/hooks/useGardenTheme'

// --- КОНСТАНТЫ ГЕОМЕТРИИ ---
const TILE_SIZE = 24
const ISO_ANGLE = 30 * (Math.PI / 180)
const ORIGIN_X = 225
const ORIGIN_Y = 300

// Координаты мебели (фиксированные)
const POSITIONS = {
  shelfTop: { z: 6.5, y: 2 },
  shelfBottom: { z: 3.5, y: 2 },
  windowSill: { z: 3.2, x: 2.2 },
  table: { z: 3.5, x: 5.5, y: 5.5 },
}

// --- ЦВЕТОВАЯ ПАЛИТРА ---
const COLORS = {
  wallLeft: ['#D6C4F5', '#B8A6E0'],
  wallRight: ['#FAD0C4', '#F6D365'],
  floor: ['#F3E7E9', '#E3EEFF'],
  woodLight: '#FFE0B2',
  woodDark: '#E6CEA5',
  decorBase: '#FFFFFF',
  shadow: 'rgba(84, 58, 183, 0.15)',
  highlight: 'rgba(255, 255, 255, 0.4)',
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
  if (!points.length) return ''
  return `M ${points
    .map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`)
    .join(' L ')} Z`
}

// Генерация пути со скругленными углами
const toRoundedPathString = (
  points: { x: number; y: number }[],
  radius: number
) => {
  if (!points.length || points.length < 3) return toPathString(points)
  if (radius <= 0) return toPathString(points)

  let path = ''
  const numPoints = points.length

  for (let i = 0; i < numPoints; i++) {
    const prevIdx = (i - 1 + numPoints) % numPoints
    const currentIdx = i
    const nextIdx = (i + 1) % numPoints

    const prev = points[prevIdx]
    const current = points[currentIdx]
    const next = points[nextIdx]

    if (!prev || !current || !next) continue

    // Векторы к текущей точке
    const dx1 = current.x - prev.x
    const dy1 = current.y - prev.y
    const len1 = Math.sqrt(dx1 * dx1 + dy1 * dy1)
    const unit1 = len1 > 0 ? { x: dx1 / len1, y: dy1 / len1 } : { x: 0, y: 0 }

    const dx2 = next.x - current.x
    const dy2 = next.y - current.y
    const len2 = Math.sqrt(dx2 * dx2 + dy2 * dy2)
    const unit2 = len2 > 0 ? { x: dx2 / len2, y: dy2 / len2 } : { x: 0, y: 0 }

    // Ограничиваем радиус скругления (не более 40% от длины сегмента)
    const r = Math.min(radius, len1 * 0.4, len2 * 0.4, 8)

    // Точки начала и конца скругления
    const startX = current.x - unit1.x * r
    const startY = current.y - unit1.y * r
    const endX = current.x + unit2.x * r
    const endY = current.y + unit2.y * r

    if (i === 0) {
      path = `M ${startX.toFixed(1)},${startY.toFixed(1)}`
    } else {
      path += ` L ${startX.toFixed(1)},${startY.toFixed(1)}`
    }

    // Квадратичная кривая для скругления угла
    path += ` Q ${current.x.toFixed(1)},${current.y.toFixed(1)} ${endX.toFixed(1)},${endY.toFixed(1)}`
  }

  return path + ' Z'
}

// Генерация куба
const createCubePath = (
  x: number,
  y: number,
  z: number,
  w: number,
  d: number,
  h: number,
  roundness: number = 0
) => {
  const p1 = toIso(x, y, z + h) // Top-Back
  const p2 = toIso(x + w, y, z + h) // Top-Right
  const p3 = toIso(x + w, y + d, z + h) // Top-Front
  const p4 = toIso(x, y + d, z + h) // Top-Left
  const p6 = toIso(x + w, y, z) // Bottom-Right
  const p7 = toIso(x + w, y + d, z) // Bottom-Front
  const p8 = toIso(x, y + d, z) // Bottom-Left

  const useRounded = roundness > 0
  const pathFn = useRounded
    ? (pts: { x: number; y: number }[]) => toRoundedPathString(pts, roundness)
    : toPathString

  return {
    top: pathFn([p1, p2, p3, p4]),
    right: pathFn([p2, p3, p7, p6]),
    left: pathFn([p4, p3, p7, p8]),
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

  // --- ЛОГИКА КООРДИНАТ ---
  function getSlotCoords(index: number) {
    // 0-3: Полки слева
    if (index < 4) {
      const shelfRow = Math.floor(index / 2) // 0 - верхняя, 1 - нижняя
      const pos = index % 2
      const z = shelfRow === 0 ? POSITIONS.shelfTop.z : POSITIONS.shelfBottom.z
      const yBase =
        shelfRow === 0 ? POSITIONS.shelfTop.y : POSITIONS.shelfBottom.y

      return {
        x: 0.8,
        y: yBase + 0.5 + pos * 1.8, // Распределяем вдоль полки
        z: z + 0.2, // Чуть выше полки
      }
    }
    // 4-7: Подоконник справа
    if (index < 8) {
      const local = index - 4
      return {
        x: POSITIONS.windowSill.x + 0.5 + local * 1.4,
        y: 0.8,
        z: POSITIONS.windowSill.z + 0.2,
      }
    }
    // 8-11: Стол
    if (index < 12) {
      const local = index - 8
      const row = Math.floor(local / 2)
      const col = local % 2
      return {
        x: POSITIONS.table.x + 0.2 + col * 1.5,
        y: POSITIONS.table.y + 0.2 + row * 1.5,
        z: POSITIONS.table.z + 0.2,
      }
    }
    // 12-15: Пол (с подставками)
    const local = index - 12
    return {
      x: 3 + local * 1.5,
      y: 8,
      z: 0.1, // Чуть выше пола
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
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50" />
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
              filter: 'drop-shadow(0 30px 60px rgba(100,80,180,0.2))',
            }}
          >
            <defs>
              <linearGradient
                id="wallLeftGrad"
                x1="0%"
                y1="0%"
                x2="0%"
                y2="100%"
              >
                <stop offset="0%" stopColor={COLORS.wallLeft[0]} />
                <stop offset="100%" stopColor={COLORS.wallLeft[1]} />
              </linearGradient>
              <linearGradient
                id="wallRightGrad"
                x1="0%"
                y1="0%"
                x2="0%"
                y2="100%"
              >
                <stop offset="0%" stopColor={COLORS.wallRight[0]} />
                <stop offset="100%" stopColor={COLORS.wallRight[1]} />
              </linearGradient>
              <filter
                id="softShadow"
                x="-50%"
                y="-50%"
                width="200%"
                height="200%"
              >
                <feGaussianBlur stdDeviation="4" />
              </filter>
              <filter
                id="strongShadow"
                x="-50%"
                y="-50%"
                width="200%"
                height="200%"
              >
                <feGaussianBlur stdDeviation="6" />
                <feOffset dx="2" dy="2" />
              </filter>
            </defs>

            {/* --- СТРУКТУРА (МАССИВНЫЕ СТЕНЫ) --- */}

            {/* 1. Пол (Массивный блок) */}
            <IsoCube
              x={0}
              y={0}
              z={-1}
              w={10}
              d={10}
              h={1}
              topFill="#FDFBFD"
              sideFill="#EBE0F5"
              roundness={1}
            />

            {/* 2. Левая стена (Толстая) */}
            <IsoCube
              x={-1}
              y={0}
              z={0}
              w={1}
              d={10}
              h={9}
              rightFill="url(#wallLeftGrad)"
              topFill="#fff"
              leftFill="#fff"
              roundness={4}
            />

            {/* 3. Правая стена (Толстая) */}
            <IsoCube
              x={0}
              y={-1}
              z={0}
              w={10}
              d={1}
              h={9}
              leftFill="url(#wallRightGrad)"
              topFill="#fff"
              rightFill="#fff"
              roundness={4}
            />

            {/* Угловой элемент для закрытия пустоты между стенами */}
            <IsoCube
              x={-1}
              y={-1}
              z={0}
              w={1}
              d={1}
              h={9}
              rightFill="url(#wallLeftGrad)"
              leftFill="url(#wallRightGrad)"
              topFill="#fff"
              roundness={4}
            />

            {/* Плинтус */}
            <IsoCube
              x={0}
              y={0}
              z={0}
              w={0.3}
              d={10}
              h={0.4}
              topFill="#fff"
              rightFill="#fff"
              roundness={4}
            />
            <IsoCube
              x={0}
              y={0}
              z={0}
              w={10}
              d={0.3}
              h={0.4}
              topFill="#fff"
              leftFill="#fff"
              roundness={4}
            />

            {/* --- МЕБЕЛЬ --- */}

            {/* Полки слева */}
            <IsoCube
              x={0}
              y={POSITIONS.shelfTop.y}
              z={POSITIONS.shelfTop.z}
              w={2}
              d={4}
              h={0.3}
              topFill="#fff"
              sideFill="#E8DAEF"
              roundness={4}
              shadow
            />
            <IsoCube
              x={0}
              y={POSITIONS.shelfBottom.y}
              z={POSITIONS.shelfBottom.z}
              w={2}
              d={4}
              h={0.3}
              topFill="#fff"
              sideFill="#E8DAEF"
              roundness={4}
              shadow
            />

            {/* Окно и подоконник */}
            {/* Рама окна (объемная) */}
            <IsoCube
              x={POSITIONS.windowSill.x - 0.15}
              y={-0.25}
              z={3.3}
              w={6.3}
              d={0.3}
              h={4.4}
              topFill="#fff"
              leftFill="#fff"
              rightFill="#fff"
              roundness={2}
            />
            {/* Углубление окна */}
            <IsoCube
              x={POSITIONS.windowSill.x + 0.1}
              y={-0.1}
              z={3.6}
              w={5.8}
              d={0.2}
              h={4}
              topFill="#E8E8E8"
              leftFill="#D0D0D0"
              rightFill="#D0D0D0"
              roundness={1}
            />
            <IsoWindow
              x={POSITIONS.windowSill.x}
              y={-0.1}
              z={3.5}
              width={6}
              height={4}
            />
            <IsoCube
              x={POSITIONS.windowSill.x - 0.2}
              y={0}
              z={POSITIONS.windowSill.z}
              w={6.4}
              d={1.5}
              h={0.3}
              topFill={COLORS.woodLight}
              sideFill={COLORS.woodDark}
              roundness={6}
              shadow
            />

            {/* Стол */}
            <g>
              {/* Ножки */}
              <IsoCylinder
                x={5.5}
                y={5.5}
                z={1.5}
                r={0.25}
                h={2}
                fill="#8B6F47"
              />
              <IsoCylinder
                x={8.0}
                y={5.5}
                z={1.5}
                r={0.25}
                h={2}
                fill="#8B6F47"
              />
              <IsoCylinder
                x={5.5}
                y={7.0}
                z={1.5}
                r={0.25}
                h={2}
                fill="#8B6F47"
              />
              <IsoCylinder
                x={8.0}
                y={7.0}
                z={1.5}
                r={0.25}
                h={2}
                fill="#8B6F47"
              />
              {/* Столешница */}
              <IsoCube
                x={POSITIONS.table.x - 0.3}
                y={POSITIONS.table.y - 0.3}
                z={POSITIONS.table.z}
                w={3.6}
                d={2.6}
                h={0.3}
                topFill="#FFF8E1"
                sideFill="#FFE0B2"
                roundness={6}
                shadow
              />
            </g>

            {/* Декор на полу (подставки под предметы) */}
            {placedElements
              .filter(el => el.slotIndex >= 12)
              .map(el => (
                <IsoCylinder
                  key={`base-${el.id}`}
                  x={el.renderCoords.x}
                  y={el.renderCoords.y}
                  z={0}
                  r={0.4}
                  h={0.1}
                  fill={COLORS.decorBase}
                />
              ))}

            {/* Коврик */}
            {/* Тень коврика */}
            <path
              d={createCirclePath(6.6, 6.6, 0, 3.9)}
              fill="rgba(100, 80, 120, 0.08)"
              filter="url(#softShadow)"
            />
            <path
              d={createCirclePath(6.5, 6.5, 0.02, 3.8)}
              fill="rgba(255,255,255,0.35)"
              stroke="rgba(255,255,255,0.5)"
              strokeWidth="1"
            />

            {/* --- РАСТЕНИЯ / ПРЕДМЕТЫ --- */}
            {placedElements.map(element => {
              const { x, y, z } = element.renderCoords
              const screenPos = toIso(x, y, z)
              const isSelected = selectedElement?.id === element.id

              return (
                <foreignObject
                  key={element.id}
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
                        size={44}
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
  roundness?: number
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
  roundness = 0,
  shadow,
  opacity = 1,
}: IsoCubeProps) {
  if (isNaN(x) || isNaN(y) || isNaN(z)) return null

  // Конвертируем roundness в пиксели для скругления (примерно 1-8 пикселей)
  const roundedRadius = roundness > 0 ? roundness * 2 : 0
  const paths = createCubePath(x, y, z, w, d, h, roundedRadius)
  const fillTop = topFill || '#fff'
  const fillRight = rightFill || sideFill || '#ddd'
  const fillLeft = leftFill || sideFill || '#ccc'

  return (
    <g opacity={opacity}>
      {shadow && (
        <path
          d={createRectPath(x + 0.15, y + 0.15, z - 0.1, w, d)}
          fill="rgba(80, 60, 100, 0.15)"
          filter="url(#softShadow)"
        />
      )}

      <path
        d={paths.right}
        fill={fillRight}
        stroke={fillRight}
        strokeWidth={roundness > 0 ? 0.5 : 0}
        strokeLinejoin="round"
      />
      <path
        d={paths.left}
        fill={fillLeft}
        stroke={fillLeft}
        strokeWidth={roundness > 0 ? 0.5 : 0}
        strokeLinejoin="round"
      />
      <path
        d={paths.top}
        fill={fillTop}
        stroke={fillTop}
        strokeWidth={roundness > 0 ? 0.5 : 0}
        strokeLinejoin="round"
      />

      {/* Легкая обводка для объема */}
      <path
        d={paths.top}
        fill="none"
        stroke="rgba(255,255,255,0.6)"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      {/* Легкая тень на боковых гранях для объема */}
      <path
        d={paths.right}
        fill="none"
        stroke="rgba(0,0,0,0.1)"
        strokeWidth="0.5"
        strokeLinejoin="round"
      />
    </g>
  )
}

// Цилиндр (для ножек стола и подставок)
function IsoCylinder({ x, y, z, r, h, fill }: any) {
  // Рисуем эллипс через path
  const circlePath = createCirclePath(x, y, z + h, r)
  const shadowPath = createCirclePath(x, y, z, r)
  const bodyPath = createCylinderBody(x, y, z, r, h)

  return (
    <g>
      {/* Тень */}
      <path d={shadowPath} fill="rgba(0,0,0,0.1)" />
      {/* Тело цилиндра */}
      <path
        d={bodyPath}
        fill={fill}
        stroke={fill}
        strokeWidth="0.5"
        strokeLinejoin="round"
      />
      {/* Верхний круг */}
      <path
        d={circlePath}
        fill={fill}
        stroke="rgba(255,255,255,0.4)"
        strokeWidth="1"
      />
      {/* Нижний круг для видимости */}
      <path
        d={shadowPath}
        fill={fill}
        stroke="rgba(0,0,0,0.2)"
        strokeWidth="0.5"
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

  // Координаты для разделения на 4 панели
  const midX = (p1.x + p2.x) / 2
  const midY = (p1.y + p2.y) / 2
  const midXBottom = (p3.x + p4.x) / 2
  const midYBottom = (p3.y + p4.y) / 2
  const midYLeft = (p1.y + p4.y) / 2
  const midXLeft = (p1.x + p4.x) / 2
  const midYRight = (p2.y + p3.y) / 2
  const midXRight = (p2.x + p3.x) / 2

  return (
    <g>
      {/* Стекло с легким градиентом */}
      <path d={glassPath} fill="#E1BEE7" opacity="0.5" />
      <path
        d={glassPath}
        fill="none"
        stroke="#fff"
        strokeWidth="8"
        strokeLinejoin="round"
      />
      {/* Вертикальная перегородка */}
      <path
        d={`M ${midX},${midY} L ${midXBottom},${midYBottom}`}
        stroke="#fff"
        strokeWidth="5"
        strokeLinecap="round"
      />
      {/* Горизонтальная перегородка */}
      <path
        d={`M ${midXLeft},${midYLeft} L ${midXRight},${midYRight}`}
        stroke="#fff"
        strokeWidth="5"
        strokeLinecap="round"
      />
      {/* Легкое свечение/отражение */}
      <path
        d={glassPath}
        fill="none"
        stroke="rgba(255,255,255,0.6)"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </g>
  )
}

function createRectPath(x: number, y: number, z: number, w: number, d: number) {
  const p1 = toIso(x, y, z)
  const p2 = toIso(x + w, y, z)
  const p3 = toIso(x + w, y + d, z)
  const p4 = toIso(x, y + d, z)
  return toPathString([p1, p2, p3, p4])
}

function createCirclePath(x: number, y: number, z: number, radius: number) {
  const steps = 16
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

function createCylinderBody(
  x: number,
  y: number,
  z: number,
  r: number,
  h: number
) {
  const steps = 12
  const topPoints: { x: number; y: number }[] = []
  const bottomPoints: { x: number; y: number }[] = []

  // Рисуем примерно 3/4 окружности для изометрической проекции (от -45° до 225°)
  const startAngle = -Math.PI / 4
  const endAngle = (5 * Math.PI) / 4

  for (let i = 0; i <= steps; i++) {
    const theta = startAngle + (i / steps) * (endAngle - startAngle)
    const cx = x + Math.cos(theta) * r
    const cy = y + Math.sin(theta) * r
    topPoints.push(toIso(cx, cy, z + h))
    bottomPoints.push(toIso(cx, cy, z))
  }

  // Явное извлечение точек в переменные для проверки
  const pStart = topPoints[0]
  const pEnd = bottomPoints[bottomPoints.length - 1]

  // Если точки не определены, возвращаем пустой путь, чтобы TS не ругался
  if (!pStart || !pEnd) return ''

  let d = `M ${pStart.x},${pStart.y} `
  topPoints.forEach(p => (d += `L ${p.x},${p.y} `))
  d += `L ${pEnd.x},${pEnd.y} `
  // Используем spread для reverse чтобы не мутировать исходный массив
  ;[...bottomPoints].reverse().forEach(p => (d += `L ${p.x},${p.y} `))
  d += 'Z'
  return d
}
