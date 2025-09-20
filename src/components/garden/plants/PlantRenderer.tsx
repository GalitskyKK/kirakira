import { motion } from 'framer-motion'
import { FlowerSVG } from './FlowerSVG'
import { TreeSVG } from './TreeSVG'
import { CrystalSVG } from './CrystalSVG'
import { MushroomSVG } from './MushroomSVG'
import { StoneSVG } from './StoneSVG'
import type { GardenElement } from '@/types'
import { ElementType, RarityLevel } from '@/types'

interface PlantRendererProps {
  element: GardenElement
  size?: number
  isSelected?: boolean
  isHovered?: boolean
  showTooltip?: boolean
  onClick?: () => void
}

export function PlantRenderer({
  element,
  size = 64,
  isSelected = false,
  isHovered = false,
  showTooltip = false,
  onClick,
}: PlantRendererProps) {
  const renderPlant = () => {
    const commonProps = {
      size,
      color: element.color,
      rarity: element.rarity,
      isSelected,
      isHovered,
      name: element.name,
    }

    switch (element.type) {
      case ElementType.FLOWER:
        return <FlowerSVG {...commonProps} />

      case ElementType.TREE:
        return <TreeSVG {...commonProps} />

      case ElementType.CRYSTAL:
        return <CrystalSVG {...commonProps} />

      case ElementType.MUSHROOM:
        return <MushroomSVG {...commonProps} />

      case ElementType.STONE:
        return <StoneSVG {...commonProps} />

      case ElementType.GRASS:
        // Simple grass animation as fallback
        return (
          <motion.div
            className="relative flex items-center justify-center"
            style={{ width: size, height: size }}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            whileHover={{ scale: 1.1 }}
          >
            <motion.svg
              width={size}
              height={size}
              viewBox="0 0 100 100"
              className="overflow-visible"
            >
              {Array.from({ length: 5 }, (_, i) => (
                <motion.path
                  key={i}
                  d={`M${45 + i * 2} 80 Q${46 + i * 2} 60 ${45 + i * 2 + (Math.random() - 0.5) * 4} 40`}
                  stroke={element.color || '#22c55e'}
                  strokeWidth="2"
                  fill="none"
                  initial={{ pathLength: 0 }}
                  animate={{
                    pathLength: 1,
                    d: [
                      `M${45 + i * 2} 80 Q${46 + i * 2} 60 ${45 + i * 2} 40`,
                      `M${45 + i * 2} 80 Q${46 + i * 2 + 2} 60 ${45 + i * 2 + 1} 40`,
                      `M${45 + i * 2} 80 Q${46 + i * 2 - 2} 60 ${45 + i * 2 - 1} 40`,
                      `M${45 + i * 2} 80 Q${46 + i * 2} 60 ${45 + i * 2} 40`,
                    ],
                  }}
                  transition={{
                    pathLength: { duration: 0.8, delay: i * 0.1 },
                    d: {
                      duration: 3,
                      repeat: Infinity,
                      ease: 'easeInOut',
                      delay: i * 0.2,
                    },
                  }}
                />
              ))}
            </motion.svg>
          </motion.div>
        )

      case ElementType.WATER:
        // Water waves animation
        return (
          <motion.div
            className="relative flex items-center justify-center"
            style={{ width: size, height: size }}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            whileHover={{ scale: 1.1 }}
          >
            <motion.svg
              width={size}
              height={size}
              viewBox="0 0 100 100"
              className="overflow-visible"
            >
              <defs>
                <radialGradient id="water-gradient" cx="50%" cy="50%" r="50%">
                  <stop
                    offset="0%"
                    style={{ stopColor: '#06b6d4', stopOpacity: 0.8 }}
                  />
                  <stop
                    offset="100%"
                    style={{ stopColor: '#0891b2', stopOpacity: 0.6 }}
                  />
                </radialGradient>
              </defs>

              {Array.from({ length: 3 }, (_, i) => (
                <motion.circle
                  key={i}
                  cx="50"
                  cy="60"
                  r={15 + i * 8}
                  fill="none"
                  stroke="url(#water-gradient)"
                  strokeWidth="2"
                  opacity={0.6 - i * 0.2}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{
                    scale: [0, 1.2, 0],
                    opacity: [0, 0.6 - i * 0.2, 0],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    delay: i * 0.4,
                    ease: 'easeOut',
                  }}
                />
              ))}
            </motion.svg>
          </motion.div>
        )

      case ElementType.DECORATION:
        // Magical decoration
        return (
          <motion.div
            className="relative flex items-center justify-center"
            style={{ width: size, height: size }}
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            whileHover={{ scale: 1.2, rotate: 5 }}
          >
            <motion.div
              className="text-4xl"
              animate={{
                rotate: [0, 360],
                scale: [1, 1.1, 1],
              }}
              transition={{
                rotate: { duration: 8, repeat: Infinity, ease: 'linear' },
                scale: { duration: 2, repeat: Infinity, ease: 'easeInOut' },
              }}
            >
              ✨
            </motion.div>
          </motion.div>
        )

      default:
        // Fallback with emoji
        return (
          <motion.div
            className="text-4xl"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            whileHover={{ scale: 1.1 }}
          >
            {element.emoji || '🌱'}
          </motion.div>
        )
    }
  }

  return (
    <motion.div
      className="relative cursor-pointer"
      onClick={onClick}
      whileTap={{ scale: 0.95 }}
    >
      {renderPlant()}

      {/* Tooltip */}
      {showTooltip && (
        <motion.div
          className="absolute bottom-full left-1/2 z-50 mb-2 -translate-x-1/2 transform whitespace-nowrap rounded-lg bg-black px-3 py-2 text-sm text-white"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          transition={{ duration: 0.2 }}
        >
          <div className="font-medium">{element.name}</div>
          <div className="text-xs opacity-75">{element.description}</div>
          {element.rarity !== RarityLevel.COMMON && (
            <div className="text-xs capitalize opacity-75">
              ⭐ {element.rarity}
            </div>
          )}

          {/* Tooltip arrow */}
          <div className="absolute left-1/2 top-full -translate-x-1/2 transform border-l-4 border-r-4 border-t-4 border-transparent border-t-black" />
        </motion.div>
      )}
    </motion.div>
  )
}

// Export individual plant components for direct use
export { FlowerSVG, TreeSVG, CrystalSVG, MushroomSVG, StoneSVG }
