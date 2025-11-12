import { motion } from 'framer-motion'
import { useMemo } from 'react'
import { RarityLevel, SeasonalVariant } from '@/types'

interface WaterSVGProps {
  size?: number
  color?: string
  rarity?: RarityLevel
  season?: SeasonalVariant | undefined
  isSelected?: boolean
  isHovered?: boolean
  name?: string
  isVisible?: boolean
}

export function WaterSVG({
  size = 64,
  color = '#06b6d4',
  rarity = RarityLevel.COMMON,
  season,
  isSelected = false,
  isHovered: _isHovered = false,
  name = 'Water',
  isVisible = true,
}: WaterSVGProps) {
  const getRarityGlow = () => {
    switch (rarity) {
      case RarityLevel.UNCOMMON:
        return '#22c55e'
      case RarityLevel.RARE:
        return '#3b82f6'
      case RarityLevel.EPIC:
        return '#a855f7'
      case RarityLevel.LEGENDARY:
        return '#f59e0b'
      default:
        return color
    }
  }

  const getSeasonalColors = () => {
    switch (season) {
      case SeasonalVariant.SPRING:
        return {
          primary: '#0ea5e9',
          secondary: '#06b6d4',
          accent: '#67e8f9',
        }
      case SeasonalVariant.SUMMER:
        return {
          primary: '#0284c7',
          secondary: '#0ea5e9',
          accent: '#38bdf8',
        }
      case SeasonalVariant.AUTUMN:
        return {
          primary: '#0c4a6e',
          secondary: '#0369a1',
          accent: '#0ea5e9',
        }
      case SeasonalVariant.WINTER:
        return {
          primary: '#1e293b',
          secondary: '#334155',
          accent: '#64748b',
        }
      default:
        return {
          primary: color,
          secondary: '#0ea5e9',
          accent: '#67e8f9',
        }
    }
  }

  const seasonalColors = getSeasonalColors()
  const repeatInf = isVisible ? Infinity : 0
  // Предварительно мемоизированные позиции для повторяющихся элементов,
  // чтобы не пересоздавать массивы и объекты на каждом рендере
  const pondReflectionPositions = useMemo(
    () => [
      { x: 12, y: 20 },
      { x: 18, y: 18 },
      { x: 14, y: 22 },
      { x: 20, y: 20 },
      { x: 16, y: 24 },
      { x: 10, y: 18 },
      { x: 22, y: 24 },
      { x: 8, y: 26 },
    ],
    []
  )

  const legendaryPondSparkles = useMemo(
    () => [
      { x: 4, y: 20 },
      { x: 28, y: 24 },
      { x: 16, y: 10 },
      { x: 6, y: 28 },
      { x: 26, y: 16 },
      { x: 14, y: 30 },
    ],
    []
  )

  const springDropsIndices = useMemo(() => Array.from({ length: 6 }, (_, i) => i), [])

  // Определяем тип воды по названию
  const isPuddle = name === 'Лужа'
  const isStream = name === 'Ручей'
  const isDrop =
    name?.toLowerCase().includes('капля') ||
    name?.toLowerCase().includes('drop')
  const isSpring =
    name?.toLowerCase().includes('источник') ||
    name?.toLowerCase().includes('spring')

  if (isDrop) {
    // Капля - маленькая вода
    return (
      <motion.div
        className="pixel-container relative flex items-center justify-center"
        style={{ width: size, height: size }}
        initial={{ scale: 0, y: -20 }}
        animate={{
          scale: 1,
          y: 0,
          filter: isSelected
            ? `drop-shadow(0 0 20px ${getRarityGlow()})`
            : 'none',
        }}
        whileHover={{ scale: 1.1, y: -2 }}
        transition={{
          type: 'spring',
          stiffness: 400,
          damping: 25,
        }}
      >
        <motion.svg
          width={size}
          height={size}
          viewBox="0 0 32 32"
          className="pixel-svg overflow-visible"
          style={{
            imageRendering: 'pixelated',
            shapeRendering: 'crispEdges',
          }}
        >
          {/* Drop shadow */}
          <motion.ellipse
            cx="16"
            cy="29"
            rx="2"
            ry="1"
            fill="#000000"
            opacity="0.3"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          />

          {/* Water drop - tear shape */}
          <motion.g
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.8, delay: 0.3 }}
          >
            {/* Drop bottom */}
            <rect
              x="14"
              y="24"
              width="4"
              height="3"
              fill={seasonalColors.primary}
            />
            <rect
              x="13"
              y="23"
              width="6"
              height="1"
              fill={seasonalColors.primary}
            />
            <rect
              x="12"
              y="22"
              width="8"
              height="1"
              fill={seasonalColors.primary}
            />

            {/* Drop middle */}
            <rect
              x="11"
              y="18"
              width="10"
              height="4"
              fill={seasonalColors.primary}
            />
            <rect
              x="10"
              y="15"
              width="12"
              height="3"
              fill={seasonalColors.primary}
            />

            {/* Drop top (pointed) */}
            <rect
              x="12"
              y="12"
              width="8"
              height="3"
              fill={seasonalColors.primary}
            />
            <rect
              x="14"
              y="10"
              width="4"
              height="2"
              fill={seasonalColors.primary}
            />
            <rect
              x="15"
              y="8"
              width="2"
              height="2"
              fill={seasonalColors.primary}
            />

            {/* Drop highlight */}
            <rect
              x="11"
              y="18"
              width="4"
              height="4"
              fill={seasonalColors.accent}
              opacity="0.8"
            />
            <rect
              x="12"
              y="15"
              width="3"
              height="3"
              fill={seasonalColors.accent}
              opacity="0.7"
            />
            <rect
              x="14"
              y="12"
              width="2"
              height="3"
              fill="#ffffff"
              opacity="0.9"
            />

            {/* Drop shadow */}
            <rect
              x="18"
              y="20"
              width="4"
              height="4"
              fill={seasonalColors.secondary}
            />
            <rect
              x="18"
              y="15"
              width="4"
              height="5"
              fill={seasonalColors.secondary}
            />
          </motion.g>

          {/* Drop shimmer */}
          <motion.rect
            x="13"
            y="16"
            width="1"
            height="4"
            fill="#ffffff"
            opacity="0.9"
            animate={{
              opacity: [0.5, 1, 0.5],
              y: [16, 14, 16],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              delay: 1,
            }}
          />
        </motion.svg>
      </motion.div>
    )
  }

  if (isSpring) {
    // Источник - бьющая вода
    return (
      <motion.div
        className="pixel-container relative flex items-center justify-center"
        style={{ width: size, height: size }}
        initial={{ scale: 0 }}
        animate={{
          scale: 1,
          filter: isSelected
            ? `drop-shadow(0 0 20px ${getRarityGlow()})`
            : 'none',
        }}
        whileHover={{ scale: 1.1 }}
        transition={{
          type: 'spring',
          stiffness: 300,
          damping: 20,
        }}
      >
        <motion.svg
          width={size}
          height={size}
          viewBox="0 0 32 32"
          className="pixel-svg overflow-visible"
          style={{
            imageRendering: 'pixelated',
            shapeRendering: 'crispEdges',
          }}
        >
          {/* Spring base pool */}
          <motion.g
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <rect
              x="6"
              y="24"
              width="20"
              height="6"
              fill={seasonalColors.primary}
            />
            <rect
              x="8"
              y="22"
              width="16"
              height="2"
              fill={seasonalColors.primary}
            />
            <rect
              x="10"
              y="20"
              width="12"
              height="2"
              fill={seasonalColors.primary}
            />

            {/* Pool depth */}
            <rect
              x="6"
              y="26"
              width="20"
              height="4"
              fill={seasonalColors.secondary}
            />
            <rect
              x="8"
              y="24"
              width="16"
              height="2"
              fill={seasonalColors.secondary}
            />

            {/* Pool highlight */}
            <rect
              x="8"
              y="22"
              width="6"
              height="2"
              fill={seasonalColors.accent}
              opacity="0.8"
            />
            <rect
              x="10"
              y="20"
              width="4"
              height="2"
              fill="#ffffff"
              opacity="0.7"
            />
          </motion.g>

          {/* Water jet animation */}
          <motion.g
            animate={{
              scale: [1, 1.1, 1],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          >
            {/* Central water jet */}
            <motion.rect
              x="15"
              y="4"
              width="2"
              height="16"
              fill={seasonalColors.accent}
              animate={{
                scaleY: [1, 1.2, 1],
                opacity: [0.8, 1, 0.8],
              }}
              transition={{
                duration: 1,
                repeat: Infinity,
                delay: 0.5,
              }}
            />

            {/* Side water jets */}
            <motion.rect
              x="13"
              y="8"
              width="1"
              height="12"
              fill={seasonalColors.primary}
              animate={{
                scaleY: [0.8, 1.1, 0.8],
                opacity: [0.6, 0.9, 0.6],
              }}
              transition={{
                duration: 1.2,
                repeat: Infinity,
                delay: 0.7,
              }}
            />
            <motion.rect
              x="18"
              y="8"
              width="1"
              height="12"
              fill={seasonalColors.primary}
              animate={{
                scaleY: [0.8, 1.1, 0.8],
                opacity: [0.6, 0.9, 0.6],
              }}
              transition={{
                duration: 1.2,
                repeat: Infinity,
                delay: 0.9,
              }}
            />
          </motion.g>

          {/* Water droplets */}
          {springDropsIndices.map((i) => (
            <motion.rect
              key={`spring-drop-${i}`}
              x={12 + i * 2}
              y={6 + i * 1}
              width="1"
              height="1"
              fill={seasonalColors.accent}
              animate={{
                y: [6 + i, 24, 6 + i],
                opacity: [0, 1, 0],
                scale: [0.5, 1, 0.5],
              }}
              transition={{
                duration: 2,
                repeat: repeatInf,
                delay: 1 + i * 0.2,
                ease: 'easeOut',
              }}
            />
          ))}

          {/* Magical spring effects for higher rarities */}
          {(rarity === RarityLevel.RARE ||
            rarity === RarityLevel.EPIC ||
            rarity === RarityLevel.LEGENDARY) && (
            <motion.g>
              {/* Magic sparkles around spring */}
              {Array.from({ length: 4 }, (_, i) => {
                const positions = [
                  { x: 4, y: 12 },
                  { x: 28, y: 14 },
                  { x: 6, y: 30 },
                  { x: 26, y: 28 },
                ]
                const pos = positions[i]
                if (!pos) return null

                return (
                  <motion.rect
                    key={`spring-sparkle-${i}`}
                    x={pos.x}
                    y={pos.y}
                    width="1"
                    height="1"
                    fill={getRarityGlow()}
                    animate={{
                      opacity: [0, 1, 0],
                      scale: [0.5, 1.5, 0.5],
                    }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      delay: 2 + i * 0.3,
                    }}
                  />
                )
              })}
            </motion.g>
          )}
        </motion.svg>
      </motion.div>
    )
  }

  if (isPuddle) {
    return (
      <motion.div
        className="pixel-container relative flex items-center justify-center"
        style={{ width: size, height: size }}
        initial={{ scale: 0 }}
        animate={{
          scale: 1,
          filter: isSelected
            ? `drop-shadow(0 0 20px ${getRarityGlow()})`
            : 'none',
        }}
        whileHover={{
          scale: 1.05,
          y: -1,
        }}
        transition={{
          type: 'spring',
          stiffness: 400,
          damping: 25,
        }}
      >
        <motion.svg
          width={size}
          height={size}
          viewBox="0 0 32 32"
          className="pixel-svg overflow-visible"
          style={{
            imageRendering: 'pixelated',
            shapeRendering: 'crispEdges',
          }}
        >
          {/* Small puddle */}
          <motion.g
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            {/* Puddle main body */}
            <rect
              x="10"
              y="26"
              width="12"
              height="4"
              fill={seasonalColors.primary}
            />
            <rect
              x="12"
              y="24"
              width="8"
              height="2"
              fill={seasonalColors.primary}
            />
            <rect
              x="14"
              y="22"
              width="4"
              height="2"
              fill={seasonalColors.secondary}
            />

            {/* Water surface highlights */}
            <rect
              x="10"
              y="26"
              width="6"
              height="2"
              fill="#ffffff"
              opacity="0.5"
            />
            <rect
              x="12"
              y="24"
              width="3"
              height="2"
              fill="#ffffff"
              opacity="0.6"
            />

            {/* Water depth shadows */}
            <rect
              x="16"
              y="27"
              width="6"
              height="3"
              fill="#000000"
              opacity="0.2"
            />
            <rect
              x="15"
              y="25"
              width="5"
              height="2"
              fill="#000000"
              opacity="0.15"
            />

            {/* Surface ripples */}
            <motion.g
              animate={{
                opacity: [0.3, 0.8, 0.3],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                delay: 1,
              }}
            >
              <rect
                x="13"
                y="25"
                width="6"
                height="1"
                fill={seasonalColors.accent}
                opacity="0.7"
              />
              <rect
                x="11"
                y="27"
                width="10"
                height="1"
                fill={seasonalColors.accent}
                opacity="0.6"
              />
            </motion.g>
          </motion.g>

          {/* Puddle reflections */}
          {Array.from({ length: 3 }, (_, i) => (
            <motion.rect
              key={`puddle-reflection-${i}`}
              x={11 + i * 3}
              y={26 + i}
              width="1"
              height="1"
              fill="#ffffff"
              opacity="0.8"
              animate={{
                opacity: [0.4, 0.9, 0.4],
                scale: [0.8, 1.2, 0.8],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                delay: 1.5 + i * 0.3,
              }}
            />
          ))}
        </motion.svg>
      </motion.div>
    )
  }

  if (isStream) {
    return (
      <motion.div
        className="pixel-container relative flex items-center justify-center"
        style={{ width: size, height: size }}
        initial={{ scale: 0 }}
        animate={{
          scale: 1,
          filter: isSelected
            ? `drop-shadow(0 0 20px ${getRarityGlow()})`
            : 'none',
        }}
        whileHover={{
          scale: 1.05,
          y: -1,
        }}
        transition={{
          type: 'spring',
          stiffness: 400,
          damping: 25,
        }}
      >
        <motion.svg
          width={size}
          height={size}
          viewBox="0 0 32 32"
          className="pixel-svg overflow-visible"
          style={{
            imageRendering: 'pixelated',
            shapeRendering: 'crispEdges',
          }}
        >
          {/* Winding stream */}
          <motion.g
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            {/* Stream main flow */}
            <rect
              x="2"
              y="20"
              width="8"
              height="3"
              fill={seasonalColors.primary}
            />
            <rect
              x="8"
              y="16"
              width="6"
              height="3"
              fill={seasonalColors.primary}
            />
            <rect
              x="12"
              y="12"
              width="8"
              height="3"
              fill={seasonalColors.primary}
            />
            <rect
              x="18"
              y="8"
              width="6"
              height="3"
              fill={seasonalColors.primary}
            />
            <rect
              x="22"
              y="4"
              width="8"
              height="3"
              fill={seasonalColors.primary}
            />

            {/* Stream banks */}
            <rect x="2" y="19" width="8" height="1" fill="#8b7355" />
            <rect x="2" y="23" width="8" height="1" fill="#8b7355" />
            <rect x="8" y="15" width="6" height="1" fill="#8b7355" />
            <rect x="8" y="19" width="6" height="1" fill="#8b7355" />

            {/* Water highlights */}
            <rect
              x="2"
              y="20"
              width="4"
              height="1"
              fill="#ffffff"
              opacity="0.6"
            />
            <rect
              x="12"
              y="12"
              width="4"
              height="1"
              fill="#ffffff"
              opacity="0.6"
            />
            <rect
              x="22"
              y="4"
              width="4"
              height="1"
              fill="#ffffff"
              opacity="0.6"
            />

            {/* Flow animation */}
            <motion.g
              animate={{
                x: [0, -2, 0, 2, 0],
                opacity: [0.5, 1, 0.5],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            >
              <rect
                x="4"
                y="21"
                width="2"
                height="1"
                fill={seasonalColors.accent}
              />
              <rect
                x="10"
                y="17"
                width="2"
                height="1"
                fill={seasonalColors.accent}
              />
              <rect
                x="16"
                y="13"
                width="2"
                height="1"
                fill={seasonalColors.accent}
              />
              <rect
                x="20"
                y="9"
                width="2"
                height="1"
                fill={seasonalColors.accent}
              />
              <rect
                x="26"
                y="5"
                width="2"
                height="1"
                fill={seasonalColors.accent}
              />
            </motion.g>
          </motion.g>
        </motion.svg>
      </motion.div>
    )
  }

  // Pond (default water)
  return (
    <motion.div
      className="pixel-container relative flex items-center justify-center"
      style={{ width: size, height: size }}
      initial={{ scale: 0 }}
      animate={{
        scale: 1,
        filter: isSelected
          ? `drop-shadow(0 0 20px ${getRarityGlow()})`
          : 'none',
      }}
      whileHover={{
        scale: 1.05,
        y: -1,
      }}
      transition={{
        type: 'spring',
        stiffness: 400,
        damping: 25,
      }}
    >
      <motion.svg
        width={size}
        height={size}
        viewBox="0 0 32 32"
        className="pixel-svg overflow-visible"
        style={{
          imageRendering: 'pixelated',
          shapeRendering: 'crispEdges',
        }}
      >
        {/* Pond main body */}
        <motion.g
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          {/* Water surface */}
          <rect
            x="6"
            y="18"
            width="20"
            height="10"
            fill={seasonalColors.primary}
          />
          <rect
            x="8"
            y="16"
            width="16"
            height="2"
            fill={seasonalColors.primary}
          />
          <rect
            x="10"
            y="14"
            width="12"
            height="2"
            fill={seasonalColors.secondary}
          />
          <rect
            x="12"
            y="12"
            width="8"
            height="2"
            fill={seasonalColors.secondary}
          />

          {/* Pond banks */}
          <rect x="6" y="17" width="20" height="1" fill="#8b7355" />
          <rect x="6" y="28" width="20" height="1" fill="#8b7355" />
          <rect x="8" y="15" width="16" height="1" fill="#8b7355" />
          <rect x="10" y="13" width="12" height="1" fill="#8b7355" />

          {/* Water depth gradient */}
          <rect
            x="6"
            y="18"
            width="8"
            height="6"
            fill="#ffffff"
            opacity="0.3"
          />
          <rect
            x="8"
            y="16"
            width="6"
            height="2"
            fill="#ffffff"
            opacity="0.4"
          />
          <rect
            x="10"
            y="14"
            width="4"
            height="2"
            fill="#ffffff"
            opacity="0.5"
          />

          {/* Water shadows */}
          <rect
            x="18"
            y="22"
            width="8"
            height="6"
            fill="#000000"
            opacity="0.2"
          />
          <rect
            x="16"
            y="20"
            width="10"
            height="4"
            fill="#000000"
            opacity="0.15"
          />
        </motion.g>

        {/* Animated water ripples */}
        <motion.g
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.3, 0.8, 0.3],
          }}
            transition={{
              duration: 3,
              repeat: repeatInf,
              delay: 1,
            }}
        >
          {/* Concentric ripples */}
          <rect
            x="14"
            y="20"
            width="4"
            height="1"
            fill={seasonalColors.accent}
            opacity="0.7"
          />
          <rect
            x="12"
            y="22"
            width="8"
            height="1"
            fill={seasonalColors.accent}
            opacity="0.6"
          />
          <rect
            x="10"
            y="24"
            width="12"
            height="1"
            fill={seasonalColors.accent}
            opacity="0.5"
          />
        </motion.g>

        {/* Water surface reflections */}
        {pondReflectionPositions.map((pos, i) => (
          <motion.rect
            key={`reflection-${i}`}
            x={pos.x}
            y={pos.y}
            width="1"
            height="1"
            fill="#ffffff"
            opacity="0.8"
            animate={{
              opacity: [0.4, 0.9, 0.4],
              scale: [0.8, 1.2, 0.8],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              delay: 1.5 + i * 0.2,
            }}
          />
        ))}

        {/* Seasonal effects */}
        {season === SeasonalVariant.WINTER && (
          <motion.g
            animate={{
              opacity: [0.7, 1, 0.7],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              delay: 2,
            }}
          >
            {/* Ice crystals on surface */}
            <rect
              x="12"
              y="16"
              width="8"
              height="1"
              fill="#ffffff"
              opacity="0.9"
            />
            <rect
              x="10"
              y="20"
              width="12"
              height="1"
              fill="#ffffff"
              opacity="0.8"
            />
            <rect
              x="14"
              y="24"
              width="4"
              height="1"
              fill="#ffffff"
              opacity="0.9"
            />
          </motion.g>
        )}

        {season === SeasonalVariant.SPRING && (
          <motion.g
            animate={{
              y: [0, -2, 0],
              opacity: [0.6, 1, 0.6],
            }}
            transition={{
              duration: 2,
              repeat: repeatInf,
              delay: 2,
            }}
          >
            {/* Bubbles rising */}
            <rect
              x="15"
              y="26"
              width="1"
              height="1"
              fill="#ffffff"
              opacity="0.8"
            />
            <rect
              x="17"
              y="24"
              width="1"
              height="1"
              fill="#ffffff"
              opacity="0.7"
            />
            <rect
              x="19"
              y="22"
              width="1"
              height="1"
              fill="#ffffff"
              opacity="0.8"
            />
          </motion.g>
        )}

        {/* Magical effects for rare water */}
        {rarity !== RarityLevel.COMMON && (
          <motion.g
            animate={{
              opacity: [0.5, 1, 0.5],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              delay: 2,
            }}
          >
            {/* Magical sparkles on water surface  e*/}
            <rect
              x="8"
              y="18"
              width="1"
              height="1"
              fill={getRarityGlow()}
              opacity="0.8"
            />
            <rect
              x="24"
              y="22"
              width="1"
              height="1"
              fill={getRarityGlow()}
              opacity="0.8"
            />
            <rect
              x="16"
              y="14"
              width="1"
              height="1"
              fill={getRarityGlow()}
              opacity="0.9"
            />
            <rect
              x="12"
              y="26"
              width="1"
              height="1"
              fill={getRarityGlow()}
              opacity="0.8"
            />
            <rect
              x="20"
              y="16"
              width="1"
              height="1"
              fill={getRarityGlow()}
              opacity="0.8"
            />
          </motion.g>
        )}

        {/* Legendary water effects */}
        {rarity === RarityLevel.LEGENDARY && (
          <motion.g>
            {/* Mystical whirlpool center */}
            <motion.rect
              x="15"
              y="21"
              width="2"
              height="2"
              fill="#fbbf24"
              opacity="0.7"
              animate={{
                opacity: [0.3, 0.9, 0.3],
                scale: [1, 1.3, 1],
                rotate: [0, 360],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                delay: 3,
              }}
            />

            {/* Legendary sparkles around pond */}
            {legendaryPondSparkles.map((pos, i) => (
              <motion.rect
                key={`legendary-sparkle-${i}`}
                x={pos.x}
                y={pos.y}
                width="1"
                height="1"
                fill="#ffffff"
                animate={{
                  opacity: [0, 1, 0],
                  scale: [0, 1, 0],
                }}
                  transition={{
                    duration: 1.5,
                    repeat: repeatInf,
                    delay: 3.5 + i * 0.3,
                  }}
              />
            ))}
          </motion.g>
        )}
      </motion.svg>

      {/* Magical aura */}
      {rarity !== RarityLevel.COMMON && (
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{
            background: `radial-gradient(circle, ${getRarityGlow()}15 0%, transparent 70%)`,
          }}
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.2, 0.4, 0.2],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      )}
    </motion.div>
  )
}
