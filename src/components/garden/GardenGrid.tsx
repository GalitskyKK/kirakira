import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { clsx } from 'clsx'
import { GardenElement } from './GardenElement'
import type { 
  GardenElement as GardenElementType, 
  ViewMode 
} from '@/types'

interface GardenGridProps {
  elements: readonly GardenElementType[]
  selectedElement?: GardenElementType | null
  draggedElement?: GardenElementType | null
  viewMode: ViewMode
  onElementClick?: (element: GardenElementType) => void
  onElementDragStart?: (element: GardenElementType) => void
  onElementDragEnd?: (element: GardenElementType, newX: number, newY: number) => void
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
    <div className="relative w-full h-full min-h-[500px] overflow-hidden">
      {/* Background pattern */}
      <div 
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `
            linear-gradient(to right, #e5e7eb 1px, transparent 1px),
            linear-gradient(to bottom, #e5e7eb 1px, transparent 1px)
          `,
          backgroundSize: `${CELL_SIZE}px ${CELL_SIZE}px`,
        }}
      />

      {/* Garden container */}
      <motion.div
        className="relative w-full h-full"
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
              const isSelected = selectedElement?.position.x === cell.x && 
                               selectedElement?.position.y === cell.y

              return (
                <motion.div
                  key={cell.key}
                  className={clsx(
                    'absolute border border-dashed transition-colors duration-200',
                    isOccupied
                      ? isSelected
                        ? 'border-garden-400 bg-garden-50'
                        : 'border-gray-300 bg-gray-50'
                      : 'border-gray-200 hover:border-garden-300 hover:bg-garden-25'
                  )}
                  style={{
                    left: cell.x * CELL_SIZE,
                    top: cell.y * CELL_SIZE,
                    width: CELL_SIZE,
                    height: CELL_SIZE,
                  }}
                  whileHover={{
                    backgroundColor: isOccupied ? undefined : 'rgba(34, 197, 94, 0.05)',
                  }}
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
            onClick={onElementClick}
            onDragStart={onElementDragStart}
            onDragEnd={onElementDragEnd}
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
                className="text-6xl mb-4"
                animate={{ 
                  y: [0, -10, 0],
                  opacity: [0.5, 1, 0.5] 
                }}
                transition={{ 
                  repeat: Infinity, 
                  duration: 2,
                  ease: 'easeInOut' 
                }}
              >
                🌱
              </motion.div>
              <h3 className="text-lg font-medium text-gray-600 mb-2">
                Посадите первое растение
              </h3>
              <p className="text-sm text-gray-500">
                Отметьте свое настроение, чтобы вырастить сад
              </p>
            </div>
          </motion.div>
        )}

        {/* Seasonal background effects */}
        <motion.div
          className="absolute inset-0 pointer-events-none overflow-hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.3 }}
          transition={{ delay: 1 }}
        >
          {/* Spring petals */}
          {Array.from({ length: 5 }, (_, i) => (
            <motion.div
              key={`petal-${i}`}
              className="absolute text-pink-300"
              style={{
                left: `${Math.random() * 100}%`,
                top: '-10px',
                fontSize: '20px',
              }}
              animate={{
                y: [0, 600],
                x: [0, (Math.random() - 0.5) * 100],
                rotate: [0, 360],
                opacity: [0, 1, 0],
              }}
              transition={{
                duration: 8 + Math.random() * 4,
                repeat: Infinity,
                delay: Math.random() * 8,
                ease: 'linear',
              }}
            >
              🌸
            </motion.div>
          ))}
        </motion.div>

        {/* Grid info overlay (arrangement mode) */}
        {isArrangementMode && (
          <motion.div
            className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm rounded-lg px-3 py-2 text-xs text-gray-600"
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
