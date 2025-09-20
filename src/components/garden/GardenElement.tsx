import { memo, useRef } from 'react'
import { motion, useDragControls, type PanInfo } from 'framer-motion'
import { clsx } from 'clsx'
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
  
  // Calculate position in pixels
  const x = element.position.x * gridSize
  const y = element.position.y * gridSize

  const handleClick = () => {
    onClick?.(element)
  }

  const handleDragStart = () => {
    onDragStart?.(element)
  }

  const handleDragEnd = (_: unknown, info: PanInfo) => {
    if (!onDragEnd) return

    // Calculate new grid position based on drag offset
    const newX = Math.round((x + info.offset.x) / gridSize)
    const newY = Math.round((y + info.offset.y) / gridSize)
    
    // Clamp to grid bounds
    const clampedX = Math.max(0, Math.min(9, newX))
    const clampedY = Math.max(0, Math.min(9, newY))
    
    onDragEnd(element, clampedX, clampedY)
  }

  return (
    <motion.div
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
      dragMomentum={false}
      dragElastic={0.1}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      whileHover={
        isArrangementMode
          ? { scale: 1.1, zIndex: 10 }
          : { scale: 1.05, zIndex: 10 }
      }
      whileTap={{ scale: 0.95 }}
      whileDrag={{ scale: 1.2, zIndex: 30, rotate: 5 }}
      onClick={handleClick}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ 
        scale: 1, 
        opacity: 1,
        boxShadow: isSelected 
          ? `0 0 0 3px ${moodConfig.color}40` 
          : '0 0 0 0px transparent'
      }}
      transition={{
        type: 'spring',
        stiffness: 300,
        damping: 20,
        delay: Math.random() * 0.3, // Stagger animation
      }}
    >
      {/* Element background with mood color */}
      <motion.div
        className={clsx(
          'absolute inset-0 rounded-full',
          'opacity-20',
          isSelected && 'opacity-30'
        )}
        style={{ backgroundColor: element.color }}
        animate={{
          scale: isSelected ? 1.2 : 1,
        }}
        transition={{ duration: 0.2 }}
      />

      {/* Element emoji */}
      <motion.div
        className="relative text-2xl"
        animate={{
          y: isSelected ? -2 : 0,
        }}
        transition={{ duration: 0.2 }}
      >
        {element.emoji}
      </motion.div>

      {/* Rarity indicator */}
      {element.rarity === 'rare' && (
        <motion.div
          className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.5 }}
        />
      )}

      {element.rarity === 'epic' && (
        <motion.div
          className="absolute -top-1 -right-1 w-3 h-3 bg-purple-500 rounded-full"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.5 }}
        />
      )}

      {element.rarity === 'legendary' && (
        <motion.div
          className="absolute -top-1 -right-1 w-3 h-3 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full"
          initial={{ scale: 0 }}
          animate={{ scale: 1, rotate: 360 }}
          transition={{ delay: 0.5, rotate: { repeat: Infinity, duration: 3 } }}
        />
      )}

      {/* Seasonal effect */}
      {element.seasonalVariant === 'winter' && (
        <motion.div
          className="absolute inset-0 pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0.5, 0] }}
          transition={{ repeat: Infinity, duration: 2 }}
        >
          ❄️
        </motion.div>
      )}

      {element.seasonalVariant === 'autumn' && (
        <motion.div
          className="absolute inset-0 pointer-events-none"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 20, opacity: [0, 1, 0] }}
          transition={{ repeat: Infinity, duration: 3 }}
        >
          🍂
        </motion.div>
      )}

      {/* Hover tooltip */}
      <motion.div
        className={clsx(
          'absolute bottom-full left-1/2 transform -translate-x-1/2',
          'bg-black text-white text-xs px-2 py-1 rounded',
          'pointer-events-none whitespace-nowrap',
          'opacity-0'
        )}
        whileHover={{ opacity: 1, y: -4 }}
        transition={{ duration: 0.2 }}
      >
        {element.name}
      </motion.div>

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
