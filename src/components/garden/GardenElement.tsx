import { memo, useRef, useState } from 'react'
import { motion, useDragControls, type PanInfo } from 'framer-motion'
import { clsx } from 'clsx'
import { PlantRenderer } from './plants'
import type { GardenElement as GardenElementType, ViewMode } from '@/types'
import { MOOD_CONFIG } from '@/types/mood'

interface GardenElementProps {
  element: GardenElementType
  isSelected?: boolean
  isDragged?: boolean
  viewMode: ViewMode
  gridSize: number
  onClick?: (element: GardenElementType) => void
  onDragStart?: (element: GardenElementType) => void
  onDragEnd?: (element: GardenElementType, newX: number, newY: number) => void
}

export const GardenElement = memo(function GardenElement({
  element,
  isSelected = false,
  isDragged = false,
  viewMode,
  gridSize,
  onClick,
  onDragStart,
  onDragEnd,
}: GardenElementProps) {
  const dragControls = useDragControls()
  const constraintsRef = useRef<HTMLDivElement>(null)

  const moodConfig = MOOD_CONFIG[element.moodInfluence]
  const isArrangementMode = viewMode === 'arrangement'
  const [showTooltip, setShowTooltip] = useState(false)

  // Calculate position in pixels
  const x = element.position.x * gridSize
  const y = element.position.y * gridSize

  const handleClick = () => {
    onClick?.(element)
  }

  const handleMouseEnter = () => {
    setShowTooltip(true)
  }

  const handleMouseLeave = () => {
    setShowTooltip(false)
  }

  const handleDragStart = () => {
    onDragStart?.(element)
  }

  const handleDragEnd = (_: unknown, info: PanInfo) => {
    if (!onDragEnd) return

    // Calculate new grid position based on drag offset
    const newX = Math.round((x + info.offset.x) / gridSize)
    const newY = Math.round((y + info.offset.y) / gridSize)

    // Clamp to grid bounds (0-9 for 10x10 grid)
    const clampedX = Math.max(0, Math.min(9, newX))
    const clampedY = Math.max(0, Math.min(9, newY))

    onDragEnd(element, clampedX, clampedY)
  }

  return (
    <motion.div
      ref={constraintsRef}
      className={clsx(
        'absolute cursor-pointer select-none',
        'flex items-center justify-center',
        'transition-all duration-200',
        isSelected && 'z-20',
        isDragged && 'z-30'
      )}
      style={{
        width: gridSize,
        height: gridSize,
        left: x,
        top: y,
      }}
      drag={isArrangementMode}
      dragControls={dragControls}
      dragConstraints={{
        left: -x,
        right: (9 - element.position.x) * gridSize,
        top: -y,
        bottom: (9 - element.position.y) * gridSize,
      }}
      dragSnapToOrigin={true}
      dragMomentum={false}
      dragElastic={0.2}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      whileHover={
        isArrangementMode
          ? {
              scale: 1.1,
              zIndex: 10,
              filter:
                'brightness(1.1) drop-shadow(0 4px 12px rgba(0,0,0,0.15))',
            }
          : {
              scale: 1.05,
              zIndex: 10,
              filter: 'brightness(1.05) drop-shadow(0 2px 8px rgba(0,0,0,0.1))',
            }
      }
      whileTap={{ scale: 0.95 }}
      whileDrag={{
        scale: 1.3,
        zIndex: 30,
        rotate: [0, 5, -5, 0],
        filter: 'brightness(1.2) drop-shadow(0 8px 25px rgba(0,0,0,0.25))',
        transition: { rotate: { repeat: Infinity, duration: 0.5 } },
      }}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      initial={{ scale: 0, opacity: 0, y: -20 }}
      animate={{
        scale: 1,
        opacity: 1,
        y: 0,
        boxShadow: isSelected
          ? [
              `0 0 0 3px ${moodConfig.color}40`,
              `0 4px 20px ${moodConfig.color}20`,
            ].join(', ')
          : '0 0 0 0px transparent',
      }}
      transition={{
        type: 'spring',
        stiffness: 300,
        damping: 20,
        delay: Math.random() * 0.5, // Stagger animation
      }}
    >
      {/* Beautiful SVG Plant Renderer */}
      <PlantRenderer
        element={element}
        size={gridSize * 1.2} // Larger plants that can overflow cell
        isSelected={isSelected}
        isHovered={showTooltip}
        showTooltip={showTooltip && !isDragged}
      />

      {/* Rarity indicator */}
      {element.rarity === 'rare' && (
        <motion.div
          className="absolute -right-1 -top-1 h-3 w-3 rounded-full bg-yellow-400"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.5 }}
        />
      )}

      {element.rarity === 'epic' && (
        <motion.div
          className="absolute -right-1 -top-1 h-3 w-3 rounded-full bg-purple-500"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.5 }}
        />
      )}

      {element.rarity === 'legendary' && (
        <motion.div
          className="absolute -right-1 -top-1 h-3 w-3 rounded-full bg-gradient-to-r from-yellow-400 to-orange-500"
          initial={{ scale: 0 }}
          animate={{ scale: 1, rotate: 360 }}
          transition={{ delay: 0.5, rotate: { repeat: Infinity, duration: 3 } }}
        />
      )}

      {/* Seasonal effect */}
      {element.seasonalVariant === 'winter' && (
        <motion.div
          className="pointer-events-none absolute inset-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0.5, 0] }}
          transition={{ repeat: Infinity, duration: 2 }}
        >
          ❄️
        </motion.div>
      )}

      {element.seasonalVariant === 'autumn' && (
        <motion.div
          className="pointer-events-none absolute inset-0"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 20, opacity: [0, 1, 0] }}
          transition={{ repeat: Infinity, duration: 3 }}
        >
          🍂
        </motion.div>
      )}

      {/* Click ripple effect */}
      <motion.div
        className="absolute inset-0 rounded-full border-2 border-white"
        initial={{ scale: 0, opacity: 0 }}
        whileTap={{
          scale: 2,
          opacity: [0, 1, 0],
        }}
        transition={{ duration: 0.3 }}
      />
    </motion.div>
  )
})
