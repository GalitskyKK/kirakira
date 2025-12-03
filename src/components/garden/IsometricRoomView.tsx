/**
 * ИЗОМЕТРИЧЕСКИЙ ВИД КОМНАТЫ
 *
 * КАК ИЗМЕНИТЬ ПОЗИЦИИ ЭЛЕМЕНТОВ:
 * 1. МЕБЕЛЬ: Измените ROOM_CONFIG (позиции, размеры, цвета)
 * 2. ПОРЯДОК СЛОЕВ: Измените RENDER_ORDER
 * 3. СЛОТЫ ДЛЯ РАСТЕНИЙ: Измените SLOT_POSITIONS
 */

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

// ============================================
// КОНФИГУРАЦИЯ КОМНАТЫ
// ============================================
// Все настройки комнаты в одном месте для удобного изменения
//
// КАК ИСПОЛЬЗОВАТЬ:
// 1. Измените значения в ROOM_CONFIG для изменения позиций, размеров и цветов
// 2. Порядок рендеринга задан в RENDER_ORDER - измените порядок элементов в массиве
// 3. Все координаты в изометрической системе (x, y, z)
//
// СТРУКТУРА КОНФИГА:
// - renderOrder: порядок рендеринга элементов (от заднего к переднему)
// - elements: все элементы комнаты с их параметрами
//
// КАК ДОБАВИТЬ НОВЫЙ ЭЛЕМЕНТ:
// 1. Добавьте конфигурацию в ROOM_CONFIG.elements
// 2. Добавьте ключ элемента в RENDER_ORDER в нужном месте

// Порядок рендеринга слоев (от заднего к переднему)
// Измените порядок элементов здесь, чтобы изменить порядок отрисовки
const RENDER_ORDER = [
  // Фон (самые задние слои)
  'wallBackdropLeft',
  'wallBackdropRight',
  'floorBackdrop',
  // Основные поверхности
  'floor',
  'rug',
  'wallLeft',
  'wallRight',
  'wallTopPanel',
  // Мебель
  'shelfTopShadow',
  'shelfTop',
  'shelfBottomShadow',
  'shelfBottom',
  'windowFrame',
  'windowRecess',
  'windowGlass',
  'windowFrameTop',
  'windowFrameRight',
  'windowSillShadow',
  'windowSill',
  'tableLegs',
  'tableTopShadow',
  'tableTop',
] as const

// Конфигурация элементов комнаты
// Измените значения здесь для изменения позиций, размеров и цветов
const ROOM_CONFIG = {
  // Стены
  wallBackdropLeft: {
    type: 'cube' as const,
    position: { x: -1.5, y: -0.25, z: -1.5 },
    size: { width: 1, depth: 11.25, height: 11.25 },
    colors: { rightFill: '#C4B0E0' },
    roundness: 4,
  },
  wallBackdropRight: {
    type: 'cube' as const,
    position: { x: -0.3, y: -1.5, z: -1.5 },
    size: { width: 11.25, depth: 1, height: 11.25 },
    colors: { leftFill: '#a193ba' },
    roundness: 4,
  },
  wallLeft: {
    type: 'cube' as const,
    position: { x: -1, y: 0, z: 0 },
    size: { width: 1, depth: 10, height: 9 },
    colors: { rightFill: 'url(#wallLeftGrad)' },
    roundness: 4,
  },
  wallRight: {
    type: 'cube' as const,
    position: { x: 0, y: -1, z: 0 },
    size: { width: 10, depth: 1, height: 9 },
    colors: { leftFill: 'url(#wallRightGrad)' },
    roundness: 4,
  },
  wallTopPanel: {
    type: 'cube' as const,
    position: { x: -1, y: -1, z: 8.5 },
    size: { width: 1, depth: 1, height: 0.5 },
    colors: { topFill: '#fff' },
    roundness: 2,
  },

  // Пол
  floorBackdrop: {
    type: 'cube' as const,
    position: { x: 1, y: 1, z: -1.1 },
    size: { width: 11.25, depth: 11.25, height: 1 },
    colors: { topFill: '#E8D8F0' },
    roundness: 4,
  },
  floor: {
    type: 'cube' as const,
    position: { x: 0, y: 0, z: -1 },
    size: { width: 10, depth: 10, height: 1 },
    colors: { topFill: '#FDFBFD', sideFill: '#EBE0F5' },
    roundness: 4,
  },
  rug: {
    type: 'cube' as const,
    position: { x: 0.6, y: 0.6, z: 0.02 },
    size: { width: 8, depth: 8, height: 0.05 },
    colors: { topFill: '#f0dcfc' },
    roundness: 4,
  },

  // Полки
  shelfTopShadow: {
    type: 'cube' as const,
    position: { x: 0.2, y: 2.2, z: 6.45 },
    size: { width: 2, depth: 4, height: 0.3 },
    colors: { topFill: '#D8CAEF' },
    roundness: 4,
  },
  shelfTop: {
    type: 'cube' as const,
    position: { x: 0, y: 2, z: 6.5 },
    size: { width: 2, depth: 4, height: 0.3 },
    colors: { topFill: '#fff' },
    roundness: 4,
  },
  shelfBottomShadow: {
    type: 'cube' as const,
    position: { x: 0.2, y: 2.2, z: 3.45 },
    size: { width: 2, depth: 4, height: 0.3 },
    colors: { topFill: '#D8CAEF' },
    roundness: 4,
  },
  shelfBottom: {
    type: 'cube' as const,
    position: { x: 0, y: 2, z: 3.5 },
    size: { width: 2, depth: 4, height: 0.3 },
    colors: { topFill: '#fff' },
    roundness: 4,
  },

  // Окно
  windowFrame: {
    type: 'cube' as const,
    position: { x: 1.95, y: -0.35, z: 3.1 },
    size: { width: 6.5, depth: 0.5, height: 4.8 },
    colors: { topFill: '#D4B88A', leftFill: '#FFE0B2', rightFill: '#C9A875' },
    roundness: 2,
    shadow: true,
  },
  windowRecess: {
    type: 'cube' as const,
    position: { x: 2.4, y: -0.15, z: 3.8 },
    size: { width: 5.6, depth: 0, height: 3.6 },
    colors: { topFill: '#D4B88A', leftFill: '#C9A875', rightFill: '#C9A875' },
    roundness: 1,
  },
  windowGlass: {
    type: 'window' as const,
    position: { x: 2.2, y: -0.65, z: 3.55 },
    size: { width: 5.5, height: 3.6 },
  },
  windowFrameTop: {
    type: 'cube' as const,
    position: { x: 1.95, y: -0.35, z: 7.6 },
    size: { width: 6.5, depth: 0.5, height: 0.3 },
    colors: { topFill: '#D4B88A', leftFill: '#C9A875', rightFill: '#C9A875' },
    roundness: 2,
  },
  windowFrameRight: {
    type: 'cube' as const,
    position: { x: 7.25, y: -0.35, z: 3.1 },
    size: { width: 0.3, depth: 0.5, height: 4.8 },
    colors: { topFill: '#D4B88A', leftFill: '#C9A875', rightFill: '#C9A875' },
    roundness: 2,
  },
  windowSillShadow: {
    type: 'cube' as const,
    position: { x: 2.26, y: 0.25, z: 3.15 },
    size: { width: 6.4, depth: 1.5, height: 0.3 },
    colors: { topFill: '#E6CEA5' },
    roundness: 4,
  },
  windowSill: {
    type: 'cube' as const,
    position: { x: 2.0, y: 0, z: 3.2 },
    size: { width: 6.4, depth: 1.5, height: 0.3 },
    colors: { topFill: '#FFE0B2' },
    roundness: 4,
  },

  // Стол
  tableLegs: {
    type: 'tableLegs' as const,
    position: { x: 5.5, y: 5.5, z: 1.5 },
    legs: [
      { offset: { x: -1.5, y: -1 } },
      { offset: { x: 1, y: -1 } },
      { offset: { x: -1.5, y: 1 } },
      { offset: { x: 1, y: 1 } },
    ],
    legSize: { width: 0.2, depth: 0.2, height: 2 },
    colors: { topFill: '#8B6F47', leftFill: '#826c4d', rightFill: '#A0825F' },
    roundness: 1,
  },
  tableTopShadow: {
    type: 'cube' as const,
    position: { x: 5.7, y: 5.7, z: 3.45 },
    size: { width: 3.6, depth: 2.6, height: 0.3 },
    colors: { topFill: '#E8D4B0' },
    roundness: 6,
  },
  tableTop: {
    type: 'cube' as const,
    position: { x: 5.5, y: 5.5, z: 3.5 },
    size: { width: 3.6, depth: 2.6, height: 0.3 },
    colors: { topFill: '#FFF8E1' },
    roundness: 6,
    centerBased: true,
  },
} as const

// Позиции слотов для размещения элементов
// Каждый слот - это место, куда можно поставить растение/предмет
// Измените координаты здесь, чтобы переместить слоты
const SLOT_POSITIONS = {
  // Полки слева (4 слота: 0-3)
  shelfTopLeft: { x: 0.8, y: 2.5, z: 6.7 }, // Верхняя полка, левая позиция
  shelfTopRight: { x: 0.8, y: 4.3, z: 6.7 }, // Верхняя полка, правая позиция
  shelfBottomLeft: { x: 0.8, y: 2.5, z: 3.7 }, // Нижняя полка, левая позиция
  shelfBottomRight: { x: 0.8, y: 4.3, z: 3.7 }, // Нижняя полка, правая позиция

  // Подоконник справа (4 слота: 4-7)
  windowSill1: { x: 2.7, y: 0.8, z: 3.4 }, // Подоконник, позиция 1
  windowSill2: { x: 4.1, y: 0.8, z: 3.4 }, // Подоконник, позиция 2
  windowSill3: { x: 5.5, y: 0.8, z: 3.4 }, // Подоконник, позиция 3
  windowSill4: { x: 6.9, y: 0.8, z: 3.4 }, // Подоконник, позиция 4

  // Стол (4 слота: 8-11)
  tableTopLeft: { x: 5.7, y: 5.7, z: 3.7 }, // Стол, верхний левый
  tableTopRight: { x: 7.2, y: 5.7, z: 3.7 }, // Стол, верхний правый
  tableBottomLeft: { x: 5.7, y: 7.2, z: 3.7 }, // Стол, нижний левый
  tableBottomRight: { x: 7.2, y: 7.2, z: 3.7 }, // Стол, нижний правый

  // Пол (4 слота: 12-15)
  floor1: { x: 3.0, y: 8.0, z: 0.1 }, // Пол, позиция 1
  floor2: { x: 4.5, y: 8.0, z: 0.1 }, // Пол, позиция 2
  floor3: { x: 6.0, y: 8.0, z: 0.1 }, // Пол, позиция 3
  floor4: { x: 7.5, y: 8.0, z: 0.1 }, // Пол, позиция 4
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

// --- ЦВЕТОВАЯ ПАЛИТРА ---
const COLORS = {
  wallLeft: ['#D6C4F5', '#B8A6E0'],
  wallRight: ['#D6C4F5', '#af9fc9'],
  decorBase: '#FFFFFF',
} as const

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
    const nextIdx = (i + 1) % numPoints

    const prev = points[prevIdx]
    const current = points[i]
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

// Функция рендеринга элементов комнаты на основе конфига
function renderRoomElements() {
  return RENDER_ORDER.map((elementKey, index) => {
    const config = ROOM_CONFIG[elementKey]
    if (!config) return null

    const key = `room-element-${elementKey}-${index}`

    // Вычисление позиций для динамических элементов
    let position: { x: number; y: number; z: number } = { ...config.position }
    let size: { width: number; depth?: number; height?: number } =
      'size' in config ? { ...config.size } : { width: 0 }

    // Вычисление динамических позиций
    const frameConfig = ROOM_CONFIG.windowFrame
    const topConfig = ROOM_CONFIG.tableTop
    const sillConfig = ROOM_CONFIG.windowSill

    if (
      elementKey === 'windowFrameTop' &&
      frameConfig &&
      frameConfig.type === 'cube' &&
      'size' in frameConfig
    ) {
      position = {
        x: frameConfig.position.x,
        y: frameConfig.position.y,
        z: frameConfig.position.z + frameConfig.size.height - 0.3,
      }
      size = {
        width: frameConfig.size.width,
        depth: frameConfig.size.depth,
        height: 0.3,
      }
    } else if (
      elementKey === 'windowFrameRight' &&
      frameConfig &&
      frameConfig.type === 'cube' &&
      'size' in frameConfig
    ) {
      position = {
        x: frameConfig.position.x + frameConfig.size.width - 0.3,
        y: frameConfig.position.y,
        z: frameConfig.position.z,
      }
      size = {
        width: 0.3,
        depth: frameConfig.size.depth,
        height: frameConfig.size.height,
      }
    } else if (
      elementKey === 'tableTopShadow' &&
      topConfig &&
      topConfig.type === 'cube' &&
      'size' in topConfig
    ) {
      position = {
        x: topConfig.position.x - topConfig.size.width / 2 + 0.2,
        y: topConfig.position.y - topConfig.size.depth / 2 + 0.2,
        z: topConfig.position.z - 0.05,
      }
    } else if (
      elementKey === 'windowSillShadow' &&
      sillConfig &&
      sillConfig.type === 'cube' &&
      'size' in sillConfig
    ) {
      position = {
        x: sillConfig.position.x + 0.25,
        y: sillConfig.position.y + 0.25,
        z: sillConfig.position.z - 0.05,
      }
    }

    // Вычисление tableTop (centerBased)
    if (
      elementKey === 'tableTop' &&
      config.type === 'cube' &&
      'size' in config &&
      'centerBased' in config &&
      config.centerBased
    ) {
      position = {
        x: config.position.x - config.size.width / 2,
        y: config.position.y - config.size.depth / 2,
        z: config.position.z,
      }
    }

    // Рендеринг куба
    if (config.type === 'cube' && 'size' in config) {
      const colors = config.colors
      const cubeProps: IsoCubeProps = {
        x: position.x,
        y: position.y,
        z: position.z,
        w: size.width,
        d: size.depth ?? 0,
        h: size.height ?? 0,
        roundness: config.roundness ?? 0,
      }

      if ('topFill' in colors && colors.topFill)
        cubeProps.topFill = colors.topFill
      if ('leftFill' in colors && colors.leftFill)
        cubeProps.leftFill = colors.leftFill
      if ('rightFill' in colors && colors.rightFill)
        cubeProps.rightFill = colors.rightFill
      if ('sideFill' in colors && colors.sideFill)
        cubeProps.sideFill = colors.sideFill
      if ('shadow' in config && config.shadow) cubeProps.shadow = true

      return <IsoCube key={key} {...cubeProps} />
    }

    // Рендеринг окна
    if (config.type === 'window' && 'size' in config) {
      return (
        <IsoWindow
          key={key}
          x={position.x}
          y={position.y}
          z={position.z}
          width={size.width}
          height={size.height ?? 0}
        />
      )
    }

    // Рендеринг ножек стола
    if (config.type === 'tableLegs') {
      return (
        <g key={key}>
          {config.legs.map((leg, legIndex: number) => (
            <IsoCube
              key={`${key}-leg-${legIndex}`}
              x={config.position.x + leg.offset.x - 0.1}
              y={config.position.y + leg.offset.y - 0.3}
              z={config.position.z}
              w={config.legSize.width}
              d={config.legSize.depth}
              h={config.legSize.height}
              topFill={config.colors.topFill}
              leftFill={config.colors.leftFill}
              rightFill={config.colors.rightFill}
              roundness={config.roundness ?? 0}
            />
          ))}
        </g>
      )
    }

    return null
  })
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
              <radialGradient id="windowLight" cx="50%" cy="50%">
                <stop offset="0%" stopColor="#FFFEF5" stopOpacity="0.9" />
                <stop offset="30%" stopColor="#FFF8E1" stopOpacity="0.7" />
                <stop offset="60%" stopColor="#F5E6C8" stopOpacity="0.5" />
                <stop offset="100%" stopColor="#E8D4B0" stopOpacity="0.3" />
              </radialGradient>
              <filter
                id="windowGlow"
                x="-50%"
                y="-50%"
                width="200%"
                height="200%"
              >
                <feGaussianBlur stdDeviation="2" result="coloredBlur" />
                <feMerge>
                  <feMergeNode in="coloredBlur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* --- ЭЛЕМЕНТЫ КОМНАТЫ --- */}
            {/* Все элементы рендерятся на основе ROOM_CONFIG и RENDER_ORDER */}
            {/* Измените порядок в RENDER_ORDER для изменения порядка отрисовки */}
            {/* Измените значения в ROOM_CONFIG для изменения позиций, размеров и цветов */}
            {renderRoomElements()}

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

  // Рендерим грани только если указаны соответствующие fill
  const fillRight = rightFill || sideFill
  const fillLeft = leftFill || sideFill
  const hasRightFill = Boolean(fillRight)
  const hasLeftFill = Boolean(fillLeft)
  const hasTopFill = Boolean(topFill)

  return (
    <g opacity={opacity}>
      {shadow && (
        <path
          d={createRectPath(x + 0.15, y + 0.15, z - 0.1, w, d)}
          fill="rgba(000, 000, 000, 0.15)"
          filter="url(#softShadow)"
        />
      )}

      {hasRightFill && <path d={paths.right} fill={fillRight} />}
      {hasLeftFill && <path d={paths.left} fill={fillLeft} />}
      {hasTopFill && <path d={paths.top} fill={topFill} />}
    </g>
  )
}

// Цилиндр (для ножек стола и подставок)
function IsoCylinder({ x, y, z, r, h, fill }: any) {
  // Рисуем эллипс через path
  const circlePath = createCirclePath(x, y, z + h, r)
  const bodyPath = createCylinderBody(x, y, z, r, h)

  return (
    <g>
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
    </g>
  )
}

function IsoWindow({ x = 0, y = 0, z = 0, width = 1, height = 1 }: any) {
  const p1 = toIso(x, y, z + height)
  const p2 = toIso(x + width, y, z + height)
  const p3 = toIso(x + width, y, z)
  const p4 = toIso(x, y, z)

  const glassPath = toPathString([p1, p2, p3, p4])

  const midX = (p1.x + p2.x) / 2
  const midY = (p1.y + p2.y) / 2
  const midXBottom = (p3.x + p4.x) / 2
  const midYBottom = (p3.y + p4.y) / 2
  const midXLeft = (p1.x + p4.x) / 2
  const midYLeft = (p1.y + p4.y) / 2
  const midXRight = (p2.x + p3.x) / 2
  const midYRight = (p2.y + p3.y) / 2

  return (
    <g>
      {/* Свет за окном (градиент) */}
      <path d={glassPath} fill="url(#windowLight)" />
      {/* Стекло белое (как на референсе) */}
      <path d={glassPath} fill="#FFFFFF" opacity="1" />
      {/* Легкое свечение вокруг окна */}
      <path
        d={glassPath}
        fill="none"
        stroke="rgba(255,248,225,0.4)"
        strokeWidth="12"
        strokeLinejoin="round"
        filter="url(#windowGlow)"
        opacity="1"
      />
      <path
        d={glassPath}
        fill="none"
        stroke="#C9A875"
        strokeWidth="8"
        strokeLinejoin="round"
      />
      {/* Вертикальная перегородка */}
      <path
        d={`M ${midX},${midY} L ${midXBottom},${midYBottom}`}
        stroke="#C9A875"
        strokeWidth="5"
        strokeLinecap="round"
      />
      {/* Горизонтальная перегородка */}
      <path
        d={`M ${midXLeft},${midYLeft} L ${midXRight},${midYRight}`}
        stroke="#C9A875"
        strokeWidth="5"
        strokeLinecap="round"
      />
      {/* Легкое свечение/отражение */}
      <path
        d={glassPath}
        fill="none"
        stroke="rgba(255,255,255,0.9)"
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

  const pStart = topPoints[0]
  const pEnd = bottomPoints[bottomPoints.length - 1]
  if (!pStart || !pEnd) return ''

  let d = `M ${pStart.x},${pStart.y} `
  topPoints.forEach(p => (d += `L ${p.x},${p.y} `))
  d += `L ${pEnd.x},${pEnd.y} `
  ;[...bottomPoints].reverse().forEach(p => (d += `L ${p.x},${p.y} `))
  return d + 'Z'
}
