import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { clsx } from 'clsx'
import { GardenElement } from './GardenElement'
import type { GardenElement as GardenElementType, ViewMode } from '@/types'

interface GardenGridProps {
  elements: readonly GardenElementType[]
  selectedElement?: GardenElementType | null
  draggedElement?: GardenElementType | null
  viewMode: ViewMode
  onElementClick?: (element: GardenElementType) => void
  onElementDragStart?: (element: GardenElementType) => void
  onElementDragEnd?: (
    element: GardenElementType,
    newX: number,
    newY: number
  ) => void
}

const GRID_SIZE = 10 // 10x10 grid
const CELL_SIZE = 50 // 50px per cell

export function GardenGrid({
  elements,
  selectedElement,
  draggedElement,
  viewMode,
  onElementClick,
  onElementDragStart,
  onElementDragEnd,
}: GardenGridProps) {
  // Generate grid cells for visual reference
  const gridCells = useMemo(() => {
    const cells = []
    for (let y = 0; y < GRID_SIZE; y++) {
      for (let x = 0; x < GRID_SIZE; x++) {
        cells.push({ x, y, key: `${x}-${y}` })
      }
    }
    return cells
  }, [])

  // Create a set of occupied positions for quick lookup
  const occupiedPositions = useMemo(() => {
    const positions = new Set<string>()
    elements.forEach(element => {
      positions.add(`${element.position.x}-${element.position.y}`)
    })
    return positions
  }, [elements])

  const isArrangementMode = viewMode === 'arrangement'

  return (
    <div className="relative h-full min-h-[500px] w-full overflow-hidden">
      {/* Magical garden background */}
      <div className="absolute inset-0">
        {/* Subtle gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/30 via-transparent to-rose-50/20" />

        {/* Organic grid pattern */}
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `
              radial-gradient(circle at center, rgba(34, 197, 94, 0.3) 1px, transparent 1px)
            `,
            backgroundSize: `${CELL_SIZE}px ${CELL_SIZE}px`,
          }}
        />

        {/* Floating light orbs */}
        {Array.from({ length: 8 }, (_, i) => (
          <motion.div
            key={`orb-${i}`}
            className="absolute h-2 w-2 rounded-full bg-gradient-to-br from-yellow-200 to-pink-200 opacity-40"
            style={{
              left: `${15 + Math.random() * 70}%`,
              top: `${15 + Math.random() * 70}%`,
            }}
            animate={{
              y: [0, -20, 0],
              opacity: [0.4, 0.8, 0.4],
              scale: [1, 1.2, 1],
            }}
            transition={{
              duration: 4 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 3,
              ease: 'easeInOut',
            }}
          />
        ))}
      </div>

      {/* Garden container */}
      <motion.div
        className="relative h-full w-full"
        style={{
          width: GRID_SIZE * CELL_SIZE,
          height: GRID_SIZE * CELL_SIZE,
          maxWidth: '100%',
          margin: '0 auto',
        }}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      >
        {/* Grid cells (visible in arrangement mode) */}
        {isArrangementMode && (
          <div className="absolute inset-0">
            {gridCells.map(cell => {
              const isOccupied = occupiedPositions.has(cell.key)
              const isSelected =
                selectedElement?.position.x === cell.x &&
                selectedElement?.position.y === cell.y

              return (
                <motion.div
                  key={cell.key}
                  className={clsx(
                    'absolute rounded-lg transition-all duration-300',
                    viewMode === 'arrangement'
                      ? isSelected
                        ? 'border-2 border-garden-400 bg-gradient-to-br from-garden-100 to-emerald-100 shadow-lg'
                        : isOccupied
                          ? 'border border-garden-200 bg-gradient-to-br from-garden-50 to-green-50'
                          : 'border border-dashed border-gray-300 hover:border-garden-300'
                      : 'hover:from-garden-25 hover:to-green-25 hover:bg-gradient-to-br'
                  )}
                  style={{
                    left: cell.x * CELL_SIZE + 2,
                    top: cell.y * CELL_SIZE + 2,
                    width: CELL_SIZE - 4,
                    height: CELL_SIZE - 4,
                  }}
                  whileHover={{
                    scale: 1.02,
                    boxShadow: isOccupied
                      ? undefined
                      : '0 4px 12px rgba(34, 197, 94, 0.1)',
                  }}
                  transition={{ duration: 0.2 }}
                />
              )
            })}
          </div>
        )}

        {/* Garden elements */}
        {elements.map(element => (
          <GardenElement
            key={element.id}
            element={element}
            isSelected={selectedElement?.id === element.id}
            isDragged={draggedElement?.id === element.id}
            viewMode={viewMode}
            gridSize={CELL_SIZE}
            onClick={onElementClick || (() => {})}
            onDragStart={onElementDragStart || (() => {})}
            onDragEnd={onElementDragEnd || (() => {})}
          />
        ))}

        {/* Empty state when no elements */}
        {elements.length === 0 && (
          <motion.div
            className="absolute inset-0 flex items-center justify-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className="text-center">
              <motion.div
                className="mb-4 text-6xl"
                animate={{
                  y: [0, -10, 0],
                  opacity: [0.5, 1, 0.5],
                }}
                transition={{
                  repeat: Infinity,
                  duration: 2,
                  ease: 'easeInOut',
                }}
              >
                🌱
              </motion.div>
              <h3 className="mb-2 text-lg font-medium text-gray-600">
                Посадите первое растение
              </h3>
              <p className="text-sm text-gray-500">
                Отметьте свое настроение, чтобы вырастить сад
              </p>
            </div>
          </motion.div>
        )}

        {/* Enhanced Magical Effects */}
        <motion.div
          className="pointer-events-none absolute inset-0 overflow-hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.4 }}
          transition={{ delay: 1 }}
        >
          {/* Floating Sparkles */}
          {Array.from({ length: 12 }, (_, i) => (
            <motion.div
              key={`sparkle-${i}`}
              className="absolute"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                fontSize: `${12 + Math.random() * 8}px`,
              }}
              animate={{
                y: [0, -20, 0],
                opacity: [0, 1, 0.3, 1, 0],
                scale: [0.5, 1, 0.8, 1, 0.5],
                rotate: [0, 180, 360],
              }}
              transition={{
                duration: 3 + Math.random() * 3,
                repeat: Infinity,
                delay: Math.random() * 5,
                ease: 'easeInOut',
              }}
            >
              ✨
            </motion.div>
          ))}

          {/* Spring petals */}
          {Array.from({ length: 8 }, (_, i) => (
            <motion.div
              key={`petal-${i}`}
              className="absolute text-pink-300"
              style={{
                left: `${Math.random() * 100}%`,
                top: '-10px',
                fontSize: '16px',
              }}
              animate={{
                y: [0, 600],
                x: [0, (Math.random() - 0.5) * 150],
                rotate: [0, 360 * (Math.random() > 0.5 ? 1 : -1)],
                opacity: [0, 0.8, 0.6, 0],
              }}
              transition={{
                duration: 12 + Math.random() * 8,
                repeat: Infinity,
                delay: Math.random() * 15,
                ease: 'linear',
              }}
            >
              🌸
            </motion.div>
          ))}

          {/* Magical light orbs */}
          {Array.from({ length: 6 }, (_, i) => (
            <motion.div
              key={`orb-${i}`}
              className="absolute h-3 w-3 rounded-full bg-gradient-to-r from-yellow-200 to-pink-200 opacity-60"
              style={{
                left: `${20 + Math.random() * 60}%`,
                top: `${20 + Math.random() * 60}%`,
              }}
              animate={{
                x: [0, 50, -30, 0],
                y: [0, -40, 30, 0],
                scale: [0.5, 1.2, 0.8, 0.5],
                opacity: [0.3, 0.8, 0.5, 0.3],
              }}
              transition={{
                duration: 8 + Math.random() * 6,
                repeat: Infinity,
                delay: Math.random() * 10,
                ease: 'easeInOut',
              }}
            />
          ))}
        </motion.div>

        {/* Grid info overlay (arrangement mode) */}
        {isArrangementMode && (
          <motion.div
            className="absolute right-2 top-2 rounded-lg bg-white/90 px-3 py-2 text-xs text-gray-600 backdrop-blur-sm"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5 }}
          >
            Сетка {GRID_SIZE}×{GRID_SIZE}
          </motion.div>
        )}
      </motion.div>
    </div>
  )
}
