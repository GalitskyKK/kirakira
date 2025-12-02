import { useMemo, useCallback, useRef } from 'react'
import { motion } from 'framer-motion'
import { useGardenTheme } from '@/hooks/useGardenTheme'
import { useGardenRooms } from '@/hooks'
import { ParticleCanvas } from './ParticleCanvas'
import { PlantRenderer } from './plants/PlantRenderer'
import { RoomNavigator } from './RoomNavigator'
import type { GardenElement, ViewMode } from '@/types'
import { SHELVES_PER_ROOM } from '@/types'
import type { GardenTheme } from '@/hooks/useGardenTheme'

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

// Константы для размещения элементов в комнате
const LEFT_WALL_SHELVES = 2 // 2 полки на левой стене
const BACK_WALL_SHELVES = 2 // 2 полки на задней стене
const WINDOW_SILL_SLOTS = 4 // 4 слота на подоконнике
const TABLE_SLOTS = 2 // 2 слота на столе
const FLOOR_SLOTS = 1 // 1 слот на полу

const TOTAL_SLOTS =
  LEFT_WALL_SHELVES * 2 +
  BACK_WALL_SHELVES * 2 +
  WINDOW_SILL_SLOTS +
  TABLE_SLOTS +
  FLOOR_SLOTS

interface ElementPlacement {
  readonly element: GardenElement
  readonly location: 'leftShelf' | 'backShelf' | 'windowSill' | 'table' | 'floor'
  readonly shelfIndex?: number
  readonly position: number
}

/**
 * Изометрическая 3D комната для отображения сада
 * Элементы размещаются на полках, подоконнике, столе и полу
 */
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

  // Используем хук для управления комнатами
  const { rooms, currentRoom, navigation } = useGardenRooms({
    elements,
    currentRoomIndex,
  })

  const effectiveParticleDensity = Math.min(theme.particleDensity, 20)
  const shouldUseAnimations = Boolean(theme.hasAnimations)

  // Получаем элементы текущей комнаты
  const currentRoomElements = useMemo(() => {
    if (!currentRoom) return []
    return currentRoom.elements.map(element => ({
      ...element,
      position: {
        x: element.position.x,
        y: element.position.y - currentRoomIndex * SHELVES_PER_ROOM,
      },
    }))
  }, [currentRoom, currentRoomIndex])

  // Обработчик навигации
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

  // Распределение элементов по местам в комнате
  const elementPlacements = useMemo((): ElementPlacement[] => {
    const placements: ElementPlacement[] = []

    // Распределяем элементы текущей комнаты по слотам
    currentRoomElements.forEach(element => {
      const { x: gridX, y: gridY } = element.position
      const localSlotIndex = (gridY * 4 + gridX) % TOTAL_SLOTS

      let placement: ElementPlacement | null = null

      // Левая стена - полки (0-3)
      if (localSlotIndex < LEFT_WALL_SHELVES * 2) {
        const shelfIndex = Math.floor(localSlotIndex / 2)
        const position = localSlotIndex % 2
        placement = {
          element,
          location: 'leftShelf',
          shelfIndex,
          position,
        }
      }
      // Задняя стена - полки (4-7)
      else if (localSlotIndex < LEFT_WALL_SHELVES * 2 + BACK_WALL_SHELVES * 2) {
        const adjustedIndex = localSlotIndex - LEFT_WALL_SHELVES * 2
        const shelfIndex = Math.floor(adjustedIndex / 2)
        const position = adjustedIndex % 2
        placement = {
          element,
          location: 'backShelf',
          shelfIndex,
          position,
        }
      }
      // Подоконник (8-11)
      else if (
        localSlotIndex <
        LEFT_WALL_SHELVES * 2 + BACK_WALL_SHELVES * 2 + WINDOW_SILL_SLOTS
      ) {
        const position =
          localSlotIndex - LEFT_WALL_SHELVES * 2 - BACK_WALL_SHELVES * 2
        placement = {
          element,
          location: 'windowSill',
          position,
        }
      }
      // Стол (12-13)
      else if (
        localSlotIndex <
        LEFT_WALL_SHELVES * 2 +
          BACK_WALL_SHELVES * 2 +
          WINDOW_SILL_SLOTS +
          TABLE_SLOTS
      ) {
        const position =
          localSlotIndex -
          LEFT_WALL_SHELVES * 2 -
          BACK_WALL_SHELVES * 2 -
          WINDOW_SILL_SLOTS
        placement = {
          element,
          location: 'table',
          position,
        }
      }
      // Пол (14)
      else {
        placement = {
          element,
          location: 'floor',
          position: 0,
        }
      }

      if (placement) {
        placements.push(placement)
      }
    })

    return placements
  }, [currentRoomElements])

  const handleElementClick = useCallback(
    (element: GardenElement) => {
      onElementClick?.(element)
    },
    [onElementClick]
  )

  const handleElementLongPress = useCallback(
    (element: GardenElement) => {
      onElementLongPress?.(element)
    },
    [onElementLongPress]
  )

  const isElementMoving = elementBeingMoved !== null

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

      {/* Контейнер комнаты */}
      <div
        ref={containerRef}
        className="relative h-full w-full overflow-hidden"
        style={{
          contain: 'layout style paint',
          willChange: 'contents',
          minHeight: '600px',
        }}
      >
        {/* Фон с градиентом и звездочками */}
        <div className="absolute inset-0 z-0">
          <div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(to bottom, 
                rgba(175, 238, 238, 0.3) 0%,
                rgba(221, 160, 221, 0.4) 50%,
                rgba(255, 218, 185, 0.3) 100%
              )`,
            }}
          />

        {/* Звездочки на фоне */}
        {shouldUseAnimations && (
          <div className="absolute inset-0">
            {Array.from({ length: 30 }, (_, i) => (
              <motion.div
                key={`star-${i}`}
                className="absolute h-1 w-1 rounded-full bg-white"
                style={{
                  left: `${(i * 37) % 100}%`,
                  top: `${(i * 23) % 100}%`,
                }}
                animate={{
                  opacity: [0.3, 1, 0.3],
                  scale: [0.8, 1.2, 0.8],
                }}
                transition={{
                  duration: 2 + (i % 3),
                  repeat: Infinity,
                  delay: i * 0.1,
                }}
              />
            ))}
          </div>
        )}

          {/* Частицы */}
          <ParticleCanvas
            theme={theme}
            shouldUseAnimations={shouldUseAnimations}
            particleDensity={effectiveParticleDensity}
            containerRef={containerRef}
          />
        </div>

        {/* Изометрическая комната */}
        <div className="relative z-10 flex h-full w-full items-center justify-center p-4 sm:p-8">
          <div
            className="relative"
            style={{
              width: '100%',
              maxWidth: '600px',
              height: '100%',
              maxHeight: '600px',
              minHeight: '400px',
            }}
          >
            {/* SVG для изометрической комнаты */}
            <svg
              viewBox="0 0 450 450"
              className="h-full w-full"
              preserveAspectRatio="xMidYMid meet"
              style={{
                filter: 'drop-shadow(0 10px 30px rgba(0,0,0,0.2))',
                position: 'relative',
                zIndex: 10,
              }}
            >
            {/* Пол */}
            <IsometricFloor />

            {/* Задняя стена */}
            <IsometricBackWall />

            {/* Правая стена с окном */}
            <IsometricRightWall />

            {/* Левая стена */}
            <IsometricLeftWall />

            {/* Полки на левой стене */}
            {Array.from({ length: LEFT_WALL_SHELVES }, (_, shelfIndex) => {
              // Позиция полки на левой стене в изометрических координатах
              const shelfX = 120
              const shelfY = 180 + shelfIndex * 50
              return (
                <IsometricShelf
                  key={`left-shelf-${shelfIndex}`}
                  x={shelfX}
                  y={shelfY}
                  width={60}
                  depth={20}
                />
              )
            })}

            {/* Полки на задней стене */}
            {Array.from({ length: BACK_WALL_SHELVES }, (_, shelfIndex) => {
              // Позиция полки на задней стене
              const shelfX = 180 + shelfIndex * 40
              const shelfY = 180 - shelfIndex * 30
              return (
                <IsometricShelf
                  key={`back-shelf-${shelfIndex}`}
                  x={shelfX}
                  y={shelfY}
                  width={80}
                  depth={25}
                />
              )
            })}

            {/* Стол - у задней стены */}
            <IsometricTable x={220} y={240} />

            {/* Окно - встроено в правую стену */}
            <IsometricWindow x={320} y={180} />

            {/* Элементы на левой стене */}
            {elementPlacements
              .filter(p => p.location === 'leftShelf')
              .map(placement => {
                // Позиция полки на левой стене
                const shelfX = 120
                const shelfY = 180 + (placement.shelfIndex ?? 0) * 50
                // Элемент на полке
                const elementX = shelfX + 15 + (placement.position ?? 0) * 20
                const elementY = shelfY
                return (
                  <IsometricElement
                    key={placement.element.id}
                    element={placement.element}
                    x={elementX}
                    y={elementY}
                    isSelected={selectedElement?.id === placement.element.id}
                    isBeingMoved={
                      elementBeingMoved?.id === placement.element.id
                    }
                    onClick={() => handleElementClick(placement.element)}
                    onLongPress={() => handleElementLongPress(placement.element)}
                  />
                )
              })}

            {/* Элементы на задней стене */}
            {elementPlacements
              .filter(p => p.location === 'backShelf')
              .map(placement => {
                // Позиция полки на задней стене
                const shelfX = 180 + (placement.shelfIndex ?? 0) * 40
                const shelfY = 180 - (placement.shelfIndex ?? 0) * 30
                // Элемент на полке
                const elementX = shelfX + 20 + (placement.position ?? 0) * 25
                const elementY = shelfY
                return (
                  <IsometricElement
                    key={placement.element.id}
                    element={placement.element}
                    x={elementX}
                    y={elementY}
                    isSelected={selectedElement?.id === placement.element.id}
                    isBeingMoved={
                      elementBeingMoved?.id === placement.element.id
                    }
                    onClick={() => handleElementClick(placement.element)}
                    onLongPress={() => handleElementLongPress(placement.element)}
                  />
                )
              })}

            {/* Элементы на подоконнике */}
            {elementPlacements
              .filter(p => p.location === 'windowSill')
              .map(placement => {
                // Подоконник под окном на правой стене
                const windowSillX = 320
                const windowSillY = 200
                const elementX = windowSillX + 10 + placement.position * 20
                const elementY = windowSillY
                return (
                  <IsometricElement
                    key={placement.element.id}
                    element={placement.element}
                    x={elementX}
                    y={elementY}
                    isSelected={selectedElement?.id === placement.element.id}
                    isBeingMoved={
                      elementBeingMoved?.id === placement.element.id
                    }
                    onClick={() => handleElementClick(placement.element)}
                    onLongPress={() => handleElementLongPress(placement.element)}
                  />
                )
              })}

            {/* Элементы на столе */}
            {elementPlacements
              .filter(p => p.location === 'table')
              .map(placement => {
                // Стол у задней стены
                const tableX = 220
                const tableY = 240
                const elementX = tableX + 20 + placement.position * 25
                const elementY = tableY
                return (
                  <IsometricElement
                    key={placement.element.id}
                    element={placement.element}
                    x={elementX}
                    y={elementY}
                    isSelected={selectedElement?.id === placement.element.id}
                    isBeingMoved={
                      elementBeingMoved?.id === placement.element.id
                    }
                    onClick={() => handleElementClick(placement.element)}
                    onLongPress={() => handleElementLongPress(placement.element)}
                  />
                )
              })}

            {/* Элементы на полу */}
            {elementPlacements
              .filter(p => p.location === 'floor')
              .map(placement => (
                <IsometricElement
                  key={placement.element.id}
                  element={placement.element}
                  x={280}
                  y={280}
                  isSelected={selectedElement?.id === placement.element.id}
                  isBeingMoved={
                    elementBeingMoved?.id === placement.element.id
                  }
                  onClick={() => handleElementClick(placement.element)}
                  onLongPress={() => handleElementLongPress(placement.element)}
                />
              ))}
            </svg>
          </div>
        </div>

        {/* Пустое состояние */}
        {currentRoomElements.length === 0 && !isElementMoving && (
        <div className="absolute inset-0 z-20 flex items-center justify-center">
          <motion.div
            className="text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <motion.div
              className="mb-4 text-6xl"
              animate={{
                y: [0, -10, 0],
                opacity: [0.7, 1, 0.7],
              }}
              transition={{
                repeat: Infinity,
                duration: 2.5,
                ease: 'easeInOut',
              }}
            >
              🏠
            </motion.div>
            <h3 className="mb-2 text-lg font-semibold text-gray-700 dark:text-gray-300">
              Комната пуста
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Отметьте свое настроение, чтобы добавить первый элемент!
            </p>
          </motion.div>
        </div>
        )}
      </div>
    </div>
  )
}

// Компоненты для элементов комнаты

function IsometricFloor() {
  // Правильная изометрическая проекция: угол 30 градусов
  // Для изометрии: x' = x - y, y' = (x + y) / 2
  const floorPoints = "100,300 300,200 400,250 200,350"
  
  return (
    <g>
      {/* Пол (изометрический параллелограмм) */}
      <polygon
        points={floorPoints}
        fill="#d4a574"
        stroke="#b8956a"
        strokeWidth="2"
        opacity="0.9"
        style={{ pointerEvents: 'none' }}
      />
      {/* Текстура дерева */}
      <defs>
        <pattern
          id="woodGrain"
          patternUnits="userSpaceOnUse"
          width="20"
          height="20"
        >
          <line
            x1="0"
            y1="0"
            x2="20"
            y2="0"
            stroke="#b8956a"
            strokeWidth="0.5"
            opacity="0.3"
          />
        </pattern>
      </defs>
      <polygon
        points={floorPoints}
        fill="url(#woodGrain)"
      />
    </g>
  )
}

function IsometricBackWall() {
  // Задняя стена: от пола вверх
  const wallPoints = "100,300 300,200 300,50 100,150"
  
  return (
    <g>
      {/* Задняя стена (изометрический параллелограмм) */}
      <polygon
        points={wallPoints}
        fill="#e8d5ff"
        stroke="#d4a0ff"
        strokeWidth="2"
        opacity="0.95"
        style={{ pointerEvents: 'none' }}
      />
      {/* Текстура стены */}
      <defs>
        <pattern
          id="wallTexture"
          patternUnits="userSpaceOnUse"
          width="30"
          height="30"
        >
          <circle cx="15" cy="15" r="1" fill="#d4a0ff" opacity="0.2" />
        </pattern>
      </defs>
      <polygon
        points={wallPoints}
        fill="url(#wallTexture)"
      />
    </g>
  )
}

function IsometricRightWall() {
  // Правая стена: от пола вверх, с окном
  const wallPoints = "300,200 400,250 400,100 300,50"
  
  return (
    <g>
      {/* Правая стена */}
      <polygon
        points={wallPoints}
        fill="#e8d5ff"
        stroke="#d4a0ff"
        strokeWidth="2"
        opacity="0.95"
        style={{ pointerEvents: 'none' }}
      />
    </g>
  )
}

function IsometricLeftWall() {
  // Левая стена: от пола вверх
  const wallPoints = "100,300 100,150 50,100 50,250"
  
  return (
    <g>
      {/* Левая стена */}
      <polygon
        points={wallPoints}
        fill="#e8d5ff"
        stroke="#d4a0ff"
        strokeWidth="2"
        opacity="0.95"
        style={{ pointerEvents: 'none' }}
      />
    </g>
  )
}

interface IsometricShelfProps {
  readonly x: number
  readonly y: number
  readonly width: number
  readonly depth: number
}

function IsometricShelf({
  x,
  y,
  width,
  depth,
}: IsometricShelfProps) {
  // Правильная изометрическая проекция
  // Для изометрии: isoX = x - y, isoY = (x + y) / 2
  const isoX = x - y
  const isoY = (x + y) / 2
  
  // Ширина и глубина в изометрических координатах
  const isoWidth = width
  const isoDepth = depth / 2

  return (
    <g>
      {/* Верхняя поверхность полки (стеклянная) */}
      <polygon
        points={`${isoX},${isoY} ${isoX + isoWidth},${isoY - isoWidth/2} ${isoX + isoWidth + isoDepth},${isoY - isoWidth/2 + isoDepth} ${isoX + isoDepth},${isoY + isoDepth}`}
        fill="rgba(200, 220, 255, 0.6)"
        stroke="rgba(150, 180, 255, 0.8)"
        strokeWidth="1"
        style={{
          filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))',
        }}
      />
    </g>
  )
}

interface IsometricTableProps {
  readonly x: number
  readonly y: number
}

function IsometricTable({ x, y }: IsometricTableProps) {
  // Правильная изометрическая проекция для стола
  const isoX = x - y
  const isoY = (x + y) / 2
  const tableWidth = 80
  const tableDepth = 40

  return (
    <g>
      {/* Верхняя поверхность стола (стеклянная) */}
      <polygon
        points={`${isoX},${isoY} ${isoX + tableWidth},${isoY - tableWidth/2} ${isoX + tableWidth + tableDepth/2},${isoY - tableWidth/2 + tableDepth/2} ${isoX + tableDepth/2},${isoY + tableDepth/2}`}
        fill="rgba(200, 220, 255, 0.5)"
        stroke="rgba(150, 180, 255, 0.7)"
        strokeWidth="2"
        style={{
          filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.15))',
        }}
      />
    </g>
  )
}

interface IsometricWindowProps {
  readonly x: number
  readonly y: number
}

function IsometricWindow({ x, y }: IsometricWindowProps) {
  // Окно встроено в правую стену
  const isoX = x - y
  const isoY = (x + y) / 2
  const windowWidth = 60
  const windowHeight = 80

  return (
    <g>
      {/* Рама окна */}
      <rect
        x={isoX}
        y={isoY - windowHeight}
        width={windowWidth}
        height={windowHeight}
        fill="#d4a574"
        stroke="#b8956a"
        strokeWidth="3"
        opacity="0.9"
      />
      {/* Стекло */}
      <rect
        x={isoX + 5}
        y={isoY - windowHeight + 5}
        width={windowWidth - 10}
        height={windowHeight - 10}
        fill="rgba(255, 255, 200, 0.6)"
        stroke="rgba(255, 255, 150, 0.8)"
        strokeWidth="1"
      />
      {/* Переплет */}
      <line
        x1={isoX + windowWidth / 2}
        y1={isoY - windowHeight + 5}
        x2={isoX + windowWidth / 2}
        y2={isoY - 5}
        stroke="#b8956a"
        strokeWidth="2"
      />
      <line
        x1={isoX + 5}
        y1={isoY - windowHeight / 2}
        x2={isoX + windowWidth - 5}
        y2={isoY - windowHeight / 2}
        stroke="#b8956a"
        strokeWidth="2"
      />
      {/* Свет из окна */}
      <defs>
        <radialGradient id="windowLight">
          <stop offset="0%" stopColor="rgba(255, 255, 200, 0.8)" />
          <stop offset="100%" stopColor="rgba(255, 255, 200, 0)" />
        </radialGradient>
      </defs>
      <ellipse
        cx={isoX + windowWidth / 2}
        cy={isoY - windowHeight / 2}
        rx={windowWidth}
        ry={windowHeight}
        fill="url(#windowLight)"
        opacity="0.3"
      />
    </g>
  )
}

interface IsometricElementProps {
  readonly element: GardenElement
  readonly x: number
  readonly y: number
  readonly isSelected: boolean
  readonly isBeingMoved: boolean
  readonly onClick: () => void
  readonly onLongPress: () => void
}

function IsometricElement({
  element,
  x,
  y,
  isSelected,
  isBeingMoved,
  onClick,
  onLongPress,
}: IsometricElementProps) {
  // Правильная изометрическая проекция для элементов
  const isoX = x - y
  const isoY = (x + y) / 2 - 25 // Смещение вверх для размещения элемента на полке

  return (
    <foreignObject
      x={isoX - 24}
      y={isoY - 24}
      width="48"
      height="48"
      style={{
        cursor: 'pointer',
        filter: isSelected
          ? 'drop-shadow(0 0 15px rgba(139, 92, 246, 0.8))'
          : isBeingMoved
            ? 'drop-shadow(0 0 10px rgba(59, 130, 246, 0.6))'
            : 'drop-shadow(0 2px 8px rgba(0,0,0,0.2))',
        transform: isSelected ? 'scale(1.1)' : isBeingMoved ? 'scale(1.05)' : 'scale(1)',
        transition: 'transform 0.2s, filter 0.2s',
        zIndex: isSelected || isBeingMoved ? 10 : 1,
      }}
      onClick={onClick}
      onContextMenu={e => {
        e.preventDefault()
        onLongPress()
      }}
    >
      <div className="flex h-full w-full items-center justify-center">
        <PlantRenderer
          element={element}
          size={40}
          isSelected={isSelected}
          isHovered={isBeingMoved}
          onClick={onClick}
        />
      </div>
    </foreignObject>
  )
}

