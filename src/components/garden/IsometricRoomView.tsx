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
  readonly location:
    | 'leftShelf'
    | 'backShelf'
    | 'windowSill'
    | 'table'
    | 'floor'
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

      if (placement !== null) {
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

              {/* Полки на левой стене (задней в изометрии) */}
              {Array.from({ length: LEFT_WALL_SHELVES }, (_, shelfIndex) => {
                // Позиция полки на левой стене (x близко к 0, y меняется)
                const shelfX = -40
                const shelfY = -30 + shelfIndex * 40
                return (
                  <IsometricShelf
                    key={`left-shelf-${shelfIndex}`}
                    x={shelfX}
                    y={shelfY}
                    width={50}
                    depth={15}
                  />
                )
              })}

              {/* Полки на задней стене (правой в изометрии) */}
              {Array.from({ length: BACK_WALL_SHELVES }, (_, shelfIndex) => {
                // Позиция полки на задней стене (y близко к 0, x меняется)
                const shelfX = 20 + shelfIndex * 35
                const shelfY = -30 - shelfIndex * 20
                return (
                  <IsometricShelf
                    key={`back-shelf-${shelfIndex}`}
                    x={shelfX}
                    y={shelfY}
                    width={60}
                    depth={20}
                  />
                )
              })}

              {/* Стол - у задней стены */}
              <IsometricTable x={10} y={-20} />

              {/* Окно - встроено в правую стену (заднюю в изометрии) */}
              <IsometricWindow x={30} y={-10} />

              {/* Элементы на левой стене (задней в изометрии) */}
              {elementPlacements
                .filter(p => p.location === 'leftShelf')
                .map(placement => {
                  // Позиция полки на левой стене
                  const shelfX = -40
                  const shelfY = -30 + (placement.shelfIndex ?? 0) * 40
                  // Элемент на полке
                  const elementX = shelfX + 10 + (placement.position ?? 0) * 15
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
                      onLongPress={() =>
                        handleElementLongPress(placement.element)
                      }
                    />
                  )
                })}

              {/* Элементы на задней стене (правой в изометрии) */}
              {elementPlacements
                .filter(p => p.location === 'backShelf')
                .map(placement => {
                  // Позиция полки на задней стене
                  const shelfX = 20 + (placement.shelfIndex ?? 0) * 35
                  const shelfY = -30 - (placement.shelfIndex ?? 0) * 20
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
                      onLongPress={() =>
                        handleElementLongPress(placement.element)
                      }
                    />
                  )
                })}

              {/* Элементы на подоконнике */}
              {elementPlacements
                .filter(p => p.location === 'windowSill')
                .map(placement => {
                  // Подоконник под окном на правой стене
                  const windowSillX = 30
                  const windowSillY = 10
                  const elementX = windowSillX + 8 + placement.position * 15
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
                      onLongPress={() =>
                        handleElementLongPress(placement.element)
                      }
                    />
                  )
                })}

              {/* Элементы на столе */}
              {elementPlacements
                .filter(p => p.location === 'table')
                .map(placement => {
                  // Стол у задней стены
                  const tableX = 10
                  const tableY = -20
                  const elementX = tableX + 15 + placement.position * 20
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
                      onLongPress={() =>
                        handleElementLongPress(placement.element)
                      }
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
                    x={15}
                    y={15}
                    isSelected={selectedElement?.id === placement.element.id}
                    isBeingMoved={
                      elementBeingMoved?.id === placement.element.id
                    }
                    onClick={() => handleElementClick(placement.element)}
                    onLongPress={() =>
                      handleElementLongPress(placement.element)
                    }
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
  // Правильная изометрическая проекция
  // Пол: ромб в изометрии
  // Левая нижняя, правая нижняя, правая верхняя, левая верхняя
  const floorPoints = '150,250 350,150 250,50 50,150'

  return (
    <g>
      {/* Пол (изометрический ромб) */}
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
      <polygon points={floorPoints} fill="url(#woodGrain)" />
    </g>
  )
}

function IsometricBackWall() {
  // Задняя стена: вертикальная стена в изометрии
  // От левой верхней точки пола вверх, до правой верхней точки пола вверх
  const wallPoints = '50,150 150,250 150,50 50,-50'

  return (
    <g>
      {/* Задняя стена (левая стена в изометрии) */}
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
      <polygon points={wallPoints} fill="url(#wallTexture)" />
    </g>
  )
}

function IsometricRightWall() {
  // Правая стена: от правой нижней точки пола вверх, до правой верхней точки пола вверх
  const wallPoints = '250,50 350,150 350,-50 250,-150'

  return (
    <g>
      {/* Правая стена (задняя стена в изометрии) */}
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
  // В изометрии обычно видно только две стены (заднюю и правую)
  // Левая стена не нужна, так как комната открыта спереди
  return <g />
}

interface IsometricShelfProps {
  readonly x: number
  readonly y: number
  readonly width: number
  readonly depth: number
}

function IsometricShelf({ x, y, width, depth }: IsometricShelfProps) {
  // Правильная изометрическая проекция для полки
  // x, y - координаты в изометрической системе (от центра комнаты)
  // Преобразуем в экранные координаты
  const screenX = 200 + (x - y) * 0.866
  const screenY = 150 + (x + y) * 0.5

  // Размеры полки в изометрии
  const shelfWidth = width * 0.866
  const shelfDepth = depth * 0.5

  return (
    <g>
      {/* Верхняя поверхность полки (стеклянная) */}
      <polygon
        points={`${screenX},${screenY} ${screenX + shelfWidth},${screenY - shelfWidth / 2} ${screenX + shelfWidth + shelfDepth},${screenY - shelfWidth / 2 + shelfDepth} ${screenX + shelfDepth},${screenY + shelfDepth}`}
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
  const screenX = 200 + (x - y) * 0.866
  const screenY = 150 + (x + y) * 0.5
  const tableWidth = 60 * 0.866
  const tableDepth = 30 * 0.5

  return (
    <g>
      {/* Верхняя поверхность стола (стеклянная) */}
      <polygon
        points={`${screenX},${screenY} ${screenX + tableWidth},${screenY - tableWidth / 2} ${screenX + tableWidth + tableDepth},${screenY - tableWidth / 2 + tableDepth} ${screenX + tableDepth},${screenY + tableDepth}`}
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
  // Окно встроено в правую стену (заднюю в изометрии)
  // x, y - координаты центра окна в изометрической системе
  const screenX = 200 + (x - y) * 0.866
  const screenY = 150 + (x + y) * 0.5
  const windowWidth = 50
  const windowHeight = 60

  return (
    <g>
      {/* Рама окна - встроена в стену */}
      <rect
        x={screenX - windowWidth / 2}
        y={screenY - windowHeight}
        width={windowWidth}
        height={windowHeight}
        fill="#d4a574"
        stroke="#b8956a"
        strokeWidth="3"
        opacity="0.9"
      />
      {/* Стекло */}
      <rect
        x={screenX - windowWidth / 2 + 5}
        y={screenY - windowHeight + 5}
        width={windowWidth - 10}
        height={windowHeight - 10}
        fill="rgba(255, 255, 200, 0.6)"
        stroke="rgba(255, 255, 150, 0.8)"
        strokeWidth="1"
      />
      {/* Переплет - крест */}
      <line
        x1={screenX}
        y1={screenY - windowHeight + 5}
        x2={screenX}
        y2={screenY - 5}
        stroke="#b8956a"
        strokeWidth="2"
      />
      <line
        x1={screenX - windowWidth / 2 + 5}
        y1={screenY - windowHeight / 2}
        x2={screenX + windowWidth / 2 - 5}
        y2={screenY - windowHeight / 2}
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
        cx={screenX}
        cy={screenY - windowHeight / 2}
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
  // x, y - координаты в изометрической системе
  const screenX = 200 + (x - y) * 0.866
  const screenY = 150 + (x + y) * 0.5 - 20 // Смещение вверх для размещения элемента на полке

  return (
    <foreignObject
      x={screenX - 20}
      y={screenY - 20}
      width="40"
      height="40"
      style={{
        cursor: 'pointer',
        filter: isSelected
          ? 'drop-shadow(0 0 15px rgba(139, 92, 246, 0.8))'
          : isBeingMoved
            ? 'drop-shadow(0 0 10px rgba(59, 130, 246, 0.6))'
            : 'drop-shadow(0 2px 8px rgba(0,0,0,0.2))',
        transform: isSelected
          ? 'scale(1.1)'
          : isBeingMoved
            ? 'scale(1.05)'
            : 'scale(1)',
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
          size={36}
          isSelected={isSelected}
          isHovered={isBeingMoved}
          onClick={onClick}
        />
      </div>
    </foreignObject>
  )
}
