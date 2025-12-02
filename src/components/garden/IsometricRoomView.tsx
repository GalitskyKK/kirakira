import { useMemo, useRef } from 'react'
import { useGardenTheme } from '@/hooks/useGardenTheme'
import { useGardenRooms } from '@/hooks'
import { ParticleCanvas } from './ParticleCanvas'
import { PlantRenderer } from './plants/PlantRenderer'
import { RoomNavigator } from './RoomNavigator'
import type { GardenElement, ViewMode } from '@/types'
import type { GardenTheme } from '@/hooks/useGardenTheme'

// --- КОНСТАНТЫ ---
const TILE_SIZE = 22
const ISO_ANGLE = 30 * (Math.PI / 180)
const ORIGIN_X = 225 // Центр svg (450/2)
const ORIGIN_Y = 320 // Смещение по вертикали

// Математика: 3D -> 2D
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

// Генерация валидного SVG Path (M x y L x y Z)
const toPathString = (points: { x: number; y: number }[]) => {
  if (points.length === 0) return ''
  // M = Move to (первая точка), L = Line to (остальные), Z = Close path (замкнуть)
  return `M ${points.map(p => `${p.x},${p.y}`).join(' L ')} Z`
}

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
    left: toPathString([p4, p3, p7, p8]),
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

  const currentRoomElements = useMemo(() => {
    if (!currentRoom) return []
    return currentRoom.elements
  }, [currentRoom])

  const getSlotPosition = (index: number) => {
    if (index < 4) {
      // Полки слева
      const shelfIdx = Math.floor(index / 2)
      const posInShelf = index % 2
      return {
        x: 0.2,
        y: 2 + shelfIdx * 3 + posInShelf * 1.5,
        z: 4 + shelfIdx * 2.5,
      }
    }
    if (index < 8) {
      // Полки справа
      const local = index - 4
      const shelfIdx = Math.floor(local / 2)
      const posInShelf = local % 2
      return {
        x: 2 + shelfIdx * 3 + posInShelf * 1.5,
        y: 0.2,
        z: 5 - shelfIdx * 2,
      }
    }
    if (index < 12) {
      // Окно
      const local = index - 8
      return { x: 3 + local * 1.2, y: 0.1, z: 3.5 }
    }
    if (index < 14) {
      // Стол
      const local = index - 12
      return { x: 6 + local * 1.5, y: 6 + local * 0.5, z: 2.2 }
    }
    return { x: 5, y: 5, z: 0 } // Пол
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
        <div className="absolute inset-0 bg-gradient-to-b from-indigo-50 via-purple-50 to-pink-50" />

        <ParticleCanvas
          theme={theme}
          shouldUseAnimations={true}
          particleDensity={10}
          containerRef={containerRef}
        />

        <div className="relative z-10 flex h-full w-full items-center justify-center p-4">
          <svg
            viewBox="0 0 450 450"
            className="h-full w-full max-w-[600px]"
            preserveAspectRatio="xMidYMid meet"
            style={{
              overflow: 'visible',
              filter: 'drop-shadow(0 20px 30px rgba(0,0,0,0.15))',
            }}
          >
            {/* Пол */}
            <IsoCube
              x={0}
              y={0}
              z={-0.5}
              w={10}
              d={10}
              h={0.5}
              topFill="#F3E5F5"
              sideFill="#E1BEE7"
            />

            {/* Стены */}
            <IsoCube
              x={0}
              y={0}
              z={0}
              w={0.5}
              d={10}
              h={8}
              topFill="#fff"
              rightFill="#E0C3FC"
              leftFill="#fff"
            />
            <IsoCube
              x={0}
              y={0}
              z={0}
              w={10}
              d={0.5}
              h={8}
              topFill="#fff"
              leftFill="#C8E6C9"
              rightFill="#fff"
            />

            {/* Стол */}
            <g>
              <IsoCube
                x={6}
                y={6}
                z={0}
                w={0.5}
                d={0.5}
                h={2}
                sideFill="#D4A574"
                topFill="#D4A574"
              />
              <IsoCube
                x={8.5}
                y={6}
                z={0}
                w={0.5}
                d={0.5}
                h={2}
                sideFill="#D4A574"
                topFill="#D4A574"
              />
              <IsoCube
                x={6}
                y={7.5}
                z={0}
                w={0.5}
                d={0.5}
                h={2}
                sideFill="#D4A574"
                topFill="#D4A574"
              />
              <IsoCube
                x={8.5}
                y={7.5}
                z={0}
                w={0.5}
                d={0.5}
                h={2}
                sideFill="#D4A574"
                topFill="#D4A574"
              />
              <IsoCube
                x={5.8}
                y={5.8}
                z={2}
                w={3.4}
                d={2.4}
                h={0.2}
                topFill="#FFF3E0"
                sideFill="#FFE0B2"
              />
            </g>

            {/* Окно */}
            <IsoWindow x={2} y={-0.1} z={2.5} width={4} height={3} />

            {/* Полки */}
            <IsoCube
              x={0.5}
              y={2}
              z={4}
              w={1.5}
              d={4}
              h={0.2}
              topFill="#F5F5F5"
              sideFill="#E0E0E0"
            />
            <IsoCube
              x={0.5}
              y={2}
              z={6.5}
              w={1.5}
              d={3}
              h={0.2}
              topFill="#F5F5F5"
              sideFill="#E0E0E0"
            />

            {/* Ковер */}
            <path
              d={createCirclePath(5, 5, 0.05, 2.5)}
              fill="rgba(255,255,255,0.5)"
            />

            {/* Растения */}
            {currentRoomElements.map(element => {
              const localSlotIndex =
                (element.position.y * 4 + element.position.x) % 14
              const pos = getSlotPosition(localSlotIndex)
              const screenPos = toIso(pos.x, pos.y, pos.z)
              const isSelected = selectedElement?.id === element.id

              return (
                <foreignObject
                  key={element.id}
                  x={screenPos.x - 25}
                  y={screenPos.y - 40}
                  width={50}
                  height={50}
                  style={{ overflow: 'visible', zIndex: 20 }}
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
                        transition: 'transform 0.2s',
                        filter: isSelected
                          ? 'drop-shadow(0 0 10px white)'
                          : 'none',
                      }}
                    >
                      <PlantRenderer
                        element={element}
                        size={40}
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

// --- Компоненты ---

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
  opacity = 1,
}: IsoCubeProps) {
  if (isNaN(x) || isNaN(y) || isNaN(z)) return null

  const paths = createCubePath(x, y, z, w, d, h)
  const fillTop = topFill || '#eeeeee'
  const fillRight = rightFill || sideFill || '#cccccc'
  const fillLeft = leftFill || sideFill || '#bbbbbb'

  return (
    <g opacity={opacity}>
      <path d={paths.right} fill={fillRight} stroke="none" />
      <path d={paths.left} fill={fillLeft} stroke="none" />
      <path d={paths.top} fill={fillTop} stroke="none" />
      <path
        d={paths.top}
        fill="none"
        stroke="rgba(0,0,0,0.05)"
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

  // Используем ту же функцию toPathString для генерации путей
  const glassPath = toPathString([p1, p2, p3, p4])
  const cross1 = `M ${(p1.x + p2.x) / 2},${(p1.y + p2.y) / 2} L ${(p3.x + p4.x) / 2},${(p3.y + p4.y) / 2}`
  const cross2 = `M ${(p1.x + p4.x) / 2},${(p1.y + p4.y) / 2} L ${(p2.x + p3.x) / 2},${(p2.y + p3.y) / 2}`

  return (
    <g>
      <path d={glassPath} fill="#FFFDE7" opacity="0.8" />
      <path d={glassPath} fill="none" stroke="#D4A574" strokeWidth="3" />
      <path d={cross1} stroke="#D4A574" strokeWidth="2" />
      <path d={cross2} stroke="#D4A574" strokeWidth="2" />
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
    // Добавляем M для первой точки и L для остальных
    d += (i === 0 ? 'M ' : ' L ') + `${p.x},${p.y}`
  }
  return d + ' Z' // Замыкаем
}
