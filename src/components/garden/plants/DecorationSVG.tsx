import { motion, useReducedMotion } from 'framer-motion'
import { memo, useMemo } from 'react'
import { RarityLevel, SeasonalVariant } from '@/types'

interface DecorationSVGProps {
  size?: number
  color?: string
  rarity?: RarityLevel
  season?: SeasonalVariant | undefined
  isSelected?: boolean
  isHovered?: boolean
  name?: string
  isVisible?: boolean
  staticMode?: boolean
}

function DecorationSVGComponent({
  size = 64,
  color = '#f59e0b',
  rarity = RarityLevel.COMMON,
  season,
  isSelected = false,
  isHovered: _isHovered = false,
  name = 'Decoration',
  isVisible = true,
  staticMode = false,
}: DecorationSVGProps) {
  const prefersReducedMotion = useReducedMotion()
  const repeatInf = isVisible && !prefersReducedMotion && !staticMode ? Infinity : 0

  const getRarityGlow = useMemo(() => {
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
  }, [rarity, color])

  const getSeasonalColors = useMemo(() => {
    const baseColor = color
    switch (season) {
      case SeasonalVariant.SPRING:
        return {
          primary: '#ec4899', // Розовый весенний
          secondary: '#f97316',
          accent: '#fbbf24',
          wing: '#fce7f3',
        }
      case SeasonalVariant.SUMMER:
        return {
          primary: '#f59e0b', // Яркий летний оранжевый
          secondary: '#dc2626',
          accent: '#fbbf24',
          wing: '#fef3c7',
        }
      case SeasonalVariant.AUTUMN:
        return {
          primary: '#dc2626', // Тёплый осенний красный
          secondary: '#ea580c',
          accent: '#f59e0b',
          wing: '#fed7aa',
        }
      case SeasonalVariant.WINTER:
        return {
          primary: '#6366f1', // Холодный зимний фиолетовый
          secondary: '#8b5cf6',
          accent: '#a855f7',
          wing: '#e0e7ff',
        }
      default:
        return {
          primary: baseColor,
          secondary: '#f97316',
          accent: '#fbbf24',
          wing: '#fef3c7',
        }
    }
  }, [season, color])

  const seasonalColors = getSeasonalColors

  // Мемоизация позиций для вращающихся искр и легендарных эффектов
  const defaultSparkles = useMemo(() => {
    const radius = 12
    return Array.from({ length: 6 }, (_, i) => {
      const angle = i * 60
      const x = 16 + Math.cos((angle * Math.PI) / 180) * radius
      const y = 16 + Math.sin((angle * Math.PI) / 180) * radius
      return { x, y }
    })
  }, [])

  const legendaryDecorationSparkles = useMemo(
    () => [
      { x: 4, y: 8 },
      { x: 28, y: 12 },
      { x: 2, y: 20 },
      { x: 30, y: 24 },
      { x: 8, y: 2 },
      { x: 24, y: 4 },
      { x: 12, y: 30 },
      { x: 20, y: 28 },
    ],
    []
  )

  // Определяем тип украшения по имени
  const isFirefly = name === 'Светлячок'
  const isButterfly = name === 'Бабочка'
  const isFeather = name === 'Перо'
  const isShell = name === 'Ракушка'
  const isLeaf = name === 'Листок'
  const isBell = name === 'Колокольчик'
  const isCloud = name === 'Облачко'
  const isStar = name === 'Звёздочка'
  const isHeart = name === 'Сердечко'

  if (isFirefly) {
    return (
      <motion.div
        className="pixel-container relative flex items-center justify-center"
        style={{ width: size, height: size, willChange: 'transform, opacity' }}
        initial={{ scale: 0, opacity: 0 }}
        animate={{
          scale: 1,
          opacity: 1,
          filter: isSelected
            ? `drop-shadow(0 0 20px ${getRarityGlow})`
            : 'none',
        }}
        whileHover={{
          scale: 1.1,
          y: -3,
        }}
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
          {/* Firefly body */}
          <motion.g
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            {/* Main body */}
            <rect x="15" y="16" width="2" height="6" fill="#4a5568" />
            <rect x="15" y="16" width="1" height="6" fill="#718096" />

            {/* Head */}
            <rect x="15" y="14" width="2" height="2" fill="#2d3748" />
            <rect x="15" y="14" width="1" height="1" fill="#4a5568" />

            {/* Glowing abdomen */}
            <motion.rect
              x="15"
              y="18"
              width="2"
              height="3"
                fill="#fbbf24"
              animate={{
                opacity: [0.6, 1, 0.6],
                scale: [1, 1.1, 1],
              }}
              transition={{
                duration: 2,
                repeat: repeatInf,
                ease: 'easeInOut',
              }}
            />
            <rect
              x="15"
              y="18"
              width="1"
              height="2"
              fill="#ffffff"
              opacity="0.8"
            />
          </motion.g>

          {/* Wings */}
          <motion.g
            animate={{
              rotate: [-2, 2, -2],
            }}
            transition={{
              duration: 0.2,
              repeat: repeatInf,
              ease: 'easeInOut',
            }}
            style={{
              transformOrigin: '16px 16px',
            }}
          >
            {/* Left wing */}
            <rect
              x="12"
              y="15"
              width="3"
              height="4"
              fill="#ffffff"
              opacity="0.7"
            />
            <rect
              x="12"
              y="15"
              width="1"
              height="4"
              fill="#ffffff"
              opacity="0.9"
            />

            {/* Right wing */}
            <rect
              x="17"
              y="15"
              width="3"
              height="4"
              fill="#ffffff"
              opacity="0.7"
            />
            <rect
              x="19"
              y="15"
              width="1"
              height="4"
              fill="#ffffff"
              opacity="0.9"
            />
          </motion.g>

          {/* Antennae */}
          <rect x="15" y="12" width="1" height="2" fill="#2d3748" />
          <rect x="16" y="12" width="1" height="2" fill="#2d3748" />
          <rect x="15" y="12" width="1" height="1" fill="#4a5568" />
          <rect x="16" y="12" width="1" height="1" fill="#4a5568" />

          {/* Legs */}
          <rect x="14" y="20" width="1" height="2" fill="#2d3748" />
          <rect x="17" y="20" width="1" height="2" fill="#2d3748" />
          <rect x="15" y="21" width="1" height="1" fill="#2d3748" />
          <rect x="16" y="21" width="1" height="1" fill="#2d3748" />

          {/* Light trail */}
          <motion.g
            animate={{
              opacity: [0.3, 0.8, 0.3],
              scale: [0.8, 1.2, 0.8],
            }}
            transition={{
              duration: 2,
              repeat: repeatInf,
              ease: 'easeInOut',
              delay: 0.5,
            }}
          >
            {Array.from({ length: 5 }, (_, i) => (
              <rect
                key={`trail-${i}`}
                x={13 + i}
                y={22 + i}
                width="1"
                height="1"
                fill="#fbbf24"
                opacity={0.8 - i * 0.15}
              />
            ))}
          </motion.g>
        </motion.svg>
      </motion.div>
    )
  }

  if (isButterfly) {
    return (
      <motion.div
        className="pixel-container relative flex items-center justify-center"
        style={{ width: size, height: size, willChange: 'transform, opacity' }}
        initial={{ scale: 0, opacity: 0 }}
        animate={{
          scale: 1,
          opacity: 1,
          filter: isSelected
            ? `drop-shadow(0 0 20px ${getRarityGlow})`
            : 'none',
        }}
        whileHover={{
          scale: 1.1,
          y: -3,
        }}
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
          {/* Butterfly wings - animated */}
          <motion.g
            animate={{
              rotate: [0, 5, 0, -5, 0],
            }}
            transition={{
              duration: 2,
              repeat: repeatInf,
              ease: 'easeInOut',
            }}
            style={{
              transformOrigin: '16px 16px',
            }}
          >
            {/* Upper wings */}
            <rect
              x="8"
              y="10"
              width="6"
              height="6"
              fill={seasonalColors.primary}
            />
            <rect
              x="18"
              y="10"
              width="6"
              height="6"
              fill={seasonalColors.primary}
            />

            {/* Wing patterns */}
            <rect
              x="9"
              y="11"
              width="4"
              height="4"
              fill={seasonalColors.secondary}
            />
            <rect
              x="19"
              y="11"
              width="4"
              height="4"
              fill={seasonalColors.secondary}
            />

            {/* Wing highlights */}
            <rect
              x="8"
              y="10"
              width="2"
              height="3"
              fill="#ffffff"
              opacity="0.6"
            />
            <rect
              x="18"
              y="10"
              width="2"
              height="3"
              fill="#ffffff"
              opacity="0.6"
            />

            {/* Wing spots */}
            <rect
              x="10"
              y="12"
              width="2"
              height="2"
              fill={seasonalColors.accent}
            />
            <rect
              x="20"
              y="12"
              width="2"
              height="2"
              fill={seasonalColors.accent}
            />
            <rect
              x="11"
              y="13"
              width="1"
              height="1"
              fill="#ffffff"
              opacity="0.8"
            />
            <rect
              x="21"
              y="13"
              width="1"
              height="1"
              fill="#ffffff"
              opacity="0.8"
            />

            {/* Lower wings */}
            <rect
              x="10"
              y="16"
              width="4"
              height="4"
              fill={seasonalColors.secondary}
            />
            <rect
              x="18"
              y="16"
              width="4"
              height="4"
              fill={seasonalColors.secondary}
            />

            {/* Lower wing patterns */}
            <rect
              x="11"
              y="17"
              width="2"
              height="2"
              fill={seasonalColors.accent}
            />
            <rect
              x="19"
              y="17"
              width="2"
              height="2"
              fill={seasonalColors.accent}
            />

            {/* Lower wing highlights */}
            <rect
              x="10"
              y="16"
              width="1"
              height="2"
              fill="#ffffff"
              opacity="0.5"
            />
            <rect
              x="18"
              y="16"
              width="1"
              height="2"
              fill="#ffffff"
              opacity="0.5"
            />
          </motion.g>

          {/* Butterfly body */}
          <motion.g
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            {/* Main body */}
            <rect x="15" y="12" width="2" height="8" fill="#4a5568" />
            <rect x="15" y="12" width="1" height="8" fill="#718096" />

            {/* Head */}
            <rect x="15" y="10" width="2" height="2" fill="#2d3748" />
            <rect x="15" y="10" width="1" height="1" fill="#4a5568" />

            {/* Antennae */}
            <rect x="15" y="8" width="1" height="2" fill="#2d3748" />
            <rect x="16" y="8" width="1" height="2" fill="#2d3748" />
            <rect x="15" y="8" width="1" height="1" fill="#4a5568" />
            <rect x="16" y="8" width="1" height="1" fill="#4a5568" />
          </motion.g>

          {/* Flutter trail */}
          <motion.g
            animate={{
              opacity: [0.2, 0.6, 0.2],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: 1,
            }}
          >
            {Array.from({ length: 4 }, (_, i) => (
              <rect
                key={`flutter-${i}`}
                x={6 + i * 5}
                y={22 + i}
                width="1"
                height="1"
                fill={seasonalColors.accent}
                opacity={0.6 - i * 0.1}
              />
            ))}
          </motion.g>
        </motion.svg>
      </motion.div>
    )
  }

  // Перо - легкое и изящное
  if (isFeather) {
    return (
      <motion.div
        className="pixel-container relative flex items-center justify-center"
        style={{ width: size, height: size, willChange: 'transform, opacity' }}
        initial={{ scale: 0, rotate: -90 }}
        animate={{
          scale: 1,
          rotate: 0,
          filter: isSelected
            ? `drop-shadow(0 0 20px ${getRarityGlow})`
            : 'none',
        }}
        whileHover={{
          scale: 1.1,
          y: -3,
          rotate: 15,
        }}
        transition={{
          type: 'spring',
          stiffness: 200,
          damping: 15,
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
          {/* Feather shadow */}
          <motion.ellipse
            cx="16"
            cy="29"
            rx="3"
            ry="1"
            fill="#000000"
            opacity="0.2"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          />

          {/* Feather quill (стержень) */}
          <motion.g
            initial={{ scaleY: 0 }}
            animate={{ scaleY: 1 }}
            transition={{ duration: 0.8, delay: 0.3 }}
          >
            <rect
              x="15"
              y="6"
              width="2"
              height="22"
              fill={seasonalColors.primary}
            />
            <rect
              x="15"
              y="6"
              width="1"
              height="22"
              fill="#ffffff"
              opacity="0.6"
            />
          </motion.g>

          {/* Feather vanes (перья по бокам) */}
          <motion.g
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.6, delay: 0.5 }}
          >
            {/* Left side */}
            <rect
              x="11"
              y="8"
              width="4"
              height="2"
              fill={seasonalColors.secondary}
            />
            <rect
              x="10"
              y="10"
              width="5"
              height="2"
              fill={seasonalColors.secondary}
            />
            <rect
              x="9"
              y="12"
              width="6"
              height="2"
              fill={seasonalColors.secondary}
            />
            <rect
              x="8"
              y="14"
              width="7"
              height="2"
              fill={seasonalColors.secondary}
            />
            <rect
              x="9"
              y="16"
              width="6"
              height="2"
              fill={seasonalColors.secondary}
            />
            <rect
              x="10"
              y="18"
              width="5"
              height="2"
              fill={seasonalColors.secondary}
            />
            <rect
              x="11"
              y="20"
              width="4"
              height="2"
              fill={seasonalColors.secondary}
            />
            <rect
              x="12"
              y="22"
              width="3"
              height="2"
              fill={seasonalColors.secondary}
            />

            {/* Right side */}
            <rect
              x="17"
              y="8"
              width="4"
              height="2"
              fill={seasonalColors.accent}
            />
            <rect
              x="17"
              y="10"
              width="5"
              height="2"
              fill={seasonalColors.accent}
            />
            <rect
              x="17"
              y="12"
              width="6"
              height="2"
              fill={seasonalColors.accent}
            />
            <rect
              x="17"
              y="14"
              width="7"
              height="2"
              fill={seasonalColors.accent}
            />
            <rect
              x="17"
              y="16"
              width="6"
              height="2"
              fill={seasonalColors.accent}
            />
            <rect
              x="17"
              y="18"
              width="5"
              height="2"
              fill={seasonalColors.accent}
            />
            <rect
              x="17"
              y="20"
              width="4"
              height="2"
              fill={seasonalColors.accent}
            />
            <rect
              x="17"
              y="22"
              width="3"
              height="2"
              fill={seasonalColors.accent}
            />

            {/* Feather tip */}
            <rect
              x="14"
              y="4"
              width="4"
              height="2"
              fill={seasonalColors.primary}
            />
            <rect
              x="15"
              y="2"
              width="2"
              height="2"
              fill={seasonalColors.accent}
            />

            {/* Highlights */}
            <rect
              x="11"
              y="8"
              width="2"
              height="1"
              fill="#ffffff"
              opacity="0.5"
            />
            <rect
              x="10"
              y="12"
              width="3"
              height="1"
              fill="#ffffff"
              opacity="0.4"
            />
            <rect
              x="17"
              y="10"
              width="2"
              height="1"
              fill="#ffffff"
              opacity="0.5"
            />
          </motion.g>

          {/* Floating animation */}
          <motion.g
            animate={{
              y: [-2, 2, -2],
              rotate: [-3, 3, -3],
            }}
            transition={{
              duration: 3,
              repeat: repeatInf,
              ease: 'easeInOut',
            }}
          >
            {Array.from({ length: 3 }, (_, i) => (
              <rect
                key={`float-${i}`}
                x={6 + i * 10}
                y={6 + i * 2}
                width="1"
                height="1"
                fill={seasonalColors.accent}
                opacity="0.6"
              />
            ))}
          </motion.g>
        </motion.svg>
      </motion.div>
    )
  }

  // Ракушка - спиральная
  if (isShell) {
    return (
      <motion.div
        className="pixel-container relative flex items-center justify-center"
        style={{ width: size, height: size, willChange: 'transform, opacity' }}
        initial={{ scale: 0, rotate: 180 }}
        animate={{
          scale: 1,
          rotate: 0,
          filter: isSelected
            ? `drop-shadow(0 0 20px ${getRarityGlow})`
            : 'none',
        }}
        whileHover={{
          scale: 1.1,
          y: -2,
        }}
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
          {/* Shell shadow */}
          <motion.ellipse
            cx="16"
            cy="28"
            rx="5"
            ry="1.5"
            fill="#000000"
            opacity="0.3"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          />

          {/* Shell body - spiral */}
          <motion.g
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.8, delay: 0.3 }}
          >
            {/* Outer shell */}
            <rect
              x="8"
              y="16"
              width="16"
              height="10"
              fill={seasonalColors.primary}
            />
            <rect
              x="10"
              y="14"
              width="12"
              height="2"
              fill={seasonalColors.primary}
            />
            <rect
              x="12"
              y="12"
              width="8"
              height="2"
              fill={seasonalColors.secondary}
            />
            <rect
              x="14"
              y="10"
              width="4"
              height="2"
              fill={seasonalColors.secondary}
            />

            {/* Spiral pattern */}
            <rect
              x="14"
              y="16"
              width="4"
              height="4"
              fill={seasonalColors.accent}
            />
            <rect
              x="16"
              y="18"
              width="2"
              height="2"
              fill={seasonalColors.secondary}
            />

            {/* Shell ridges */}
            <rect
              x="10"
              y="16"
              width="2"
              height="8"
              fill="#ffffff"
              opacity="0.4"
            />
            <rect
              x="20"
              y="17"
              width="2"
              height="7"
              fill="#000000"
              opacity="0.2"
            />

            {/* Vertical ridges */}
            <rect
              x="12"
              y="14"
              width="1"
              height="10"
              fill="#000000"
              opacity="0.15"
            />
            <rect
              x="14"
              y="12"
              width="1"
              height="12"
              fill="#000000"
              opacity="0.15"
            />
            <rect
              x="18"
              y="12"
              width="1"
              height="12"
              fill="#000000"
              opacity="0.15"
            />
            <rect
              x="20"
              y="14"
              width="1"
              height="10"
              fill="#000000"
              opacity="0.15"
            />

            {/* Opening */}
            <rect
              x="8"
              y="22"
              width="4"
              height="4"
              fill="#000000"
              opacity="0.4"
            />
            <rect
              x="9"
              y="23"
              width="2"
              height="2"
              fill="#000000"
              opacity="0.3"
            />
          </motion.g>

          {/* Pearl inside (for rare shells) */}
          {rarity !== RarityLevel.COMMON && (
            <motion.rect
              x="10"
              y="24"
              width="2"
              height="2"
              fill="#ffffff"
              opacity="0.9"
              animate={{
                opacity: [0.6, 1, 0.6],
                scale: [1, 1.2, 1],
              }}
              transition={{
                duration: 2,
                repeat: repeatInf,
              }}
            />
          )}
        </motion.svg>
      </motion.div>
    )
  }

  // Листок - кленовый
  if (isLeaf) {
    return (
      <motion.div
        className="pixel-container relative flex items-center justify-center"
        style={{ width: size, height: size, willChange: 'transform, opacity' }}
        initial={{ scale: 0, rotate: -45 }}
        animate={{
          scale: 1,
          rotate: 0,
          filter: isSelected
            ? `drop-shadow(0 0 20px ${getRarityGlow})`
            : 'none',
        }}
        whileHover={{
          scale: 1.1,
          rotate: 15,
        }}
        transition={{
          type: 'spring',
          stiffness: 200,
          damping: 15,
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
          {/* Leaf shadow */}
          <motion.ellipse
            cx="16"
            cy="29"
            rx="4"
            ry="1"
            fill="#000000"
            opacity="0.3"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          />

          {/* Leaf stem */}
          <motion.rect
            x="15"
            y="20"
            width="2"
            height="8"
            fill={seasonalColors.secondary}
            initial={{ scaleY: 0 }}
            animate={{ scaleY: 1 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          />

          {/* Maple leaf body */}
          <motion.g
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.8, delay: 0.5 }}
          >
            {/* Center */}
            <rect
              x="14"
              y="14"
              width="4"
              height="6"
              fill={seasonalColors.primary}
            />

            {/* Left points */}
            <rect
              x="10"
              y="12"
              width="4"
              height="4"
              fill={seasonalColors.primary}
            />
            <rect
              x="8"
              y="10"
              width="2"
              height="2"
              fill={seasonalColors.primary}
            />
            <rect
              x="9"
              y="16"
              width="3"
              height="3"
              fill={seasonalColors.primary}
            />

            {/* Right points */}
            <rect
              x="18"
              y="12"
              width="4"
              height="4"
              fill={seasonalColors.primary}
            />
            <rect
              x="22"
              y="10"
              width="2"
              height="2"
              fill={seasonalColors.primary}
            />
            <rect
              x="20"
              y="16"
              width="3"
              height="3"
              fill={seasonalColors.primary}
            />

            {/* Top point */}
            <rect
              x="14"
              y="8"
              width="4"
              height="2"
              fill={seasonalColors.primary}
            />
            <rect
              x="15"
              y="6"
              width="2"
              height="2"
              fill={seasonalColors.accent}
            />

            {/* Leaf veins */}
            <rect
              x="16"
              y="8"
              width="1"
              height="12"
              fill={seasonalColors.secondary}
              opacity="0.6"
            />
            <rect
              x="12"
              y="14"
              width="4"
              height="1"
              fill={seasonalColors.secondary}
              opacity="0.5"
            />
            <rect
              x="16"
              y="16"
              width="4"
              height="1"
              fill={seasonalColors.secondary}
              opacity="0.5"
            />

            {/* Highlights */}
            <rect
              x="14"
              y="14"
              width="2"
              height="3"
              fill="#ffffff"
              opacity="0.4"
            />
            <rect
              x="10"
              y="12"
              width="2"
              height="2"
              fill="#ffffff"
              opacity="0.3"
            />
          </motion.g>

          {/* Falling animation */}
          <motion.g
            animate={{
              rotate: [-5, 5, -5],
              y: [0, 2, 0],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        </motion.svg>
      </motion.div>
    )
  }

  // Колокольчик
  if (isBell) {
    return (
      <motion.div
        className="pixel-container relative flex items-center justify-center"
        style={{ width: size, height: size, willChange: 'transform, opacity' }}
        initial={{ scale: 0, y: -20 }}
        animate={{
          scale: 1,
          y: 0,
          filter: isSelected
            ? `drop-shadow(0 0 20px ${getRarityGlow})`
            : 'none',
        }}
        whileHover={{
          scale: 1.1,
        }}
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
          {/* Bell shadow */}
          <motion.ellipse
            cx="16"
            cy="29"
            rx="4"
            ry="1"
            fill="#000000"
            opacity="0.3"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          />

          {/* Bell top hook */}
          <motion.g
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <rect
              x="15"
              y="6"
              width="2"
              height="2"
              fill={seasonalColors.secondary}
            />
            <rect
              x="14"
              y="8"
              width="4"
              height="1"
              fill={seasonalColors.secondary}
            />
          </motion.g>

          {/* Bell body */}
          <motion.g
            initial={{ scale: 0 }}
            animate={{
              scale: 1,
              rotate: [-2, 2, -2],
            }}
            transition={{
              scale: { duration: 0.8, delay: 0.5 },
              rotate: { duration: 1.5, repeat: Infinity, ease: 'easeInOut' },
            }}
            style={{
              transformOrigin: '16px 10px',
            }}
          >
            {/* Bell shape */}
            <rect
              x="14"
              y="9"
              width="4"
              height="2"
              fill={seasonalColors.primary}
            />
            <rect
              x="12"
              y="11"
              width="8"
              height="2"
              fill={seasonalColors.primary}
            />
            <rect
              x="11"
              y="13"
              width="10"
              height="4"
              fill={seasonalColors.primary}
            />
            <rect
              x="10"
              y="17"
              width="12"
              height="4"
              fill={seasonalColors.primary}
            />
            <rect
              x="11"
              y="21"
              width="10"
              height="2"
              fill={seasonalColors.primary}
            />

            {/* Bell highlights */}
            <rect
              x="11"
              y="13"
              width="4"
              height="4"
              fill="#ffffff"
              opacity="0.5"
            />
            <rect
              x="12"
              y="17"
              width="3"
              height="3"
              fill="#ffffff"
              opacity="0.4"
            />

            {/* Bell shadows */}
            <rect
              x="17"
              y="15"
              width="4"
              height="6"
              fill="#000000"
              opacity="0.2"
            />

            {/* Bell opening */}
            <rect
              x="12"
              y="23"
              width="8"
              height="1"
              fill="#000000"
              opacity="0.4"
            />
          </motion.g>

          {/* Bell clapper */}
          <motion.g
            animate={{
              x: [-1, 1, -1],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          >
            <rect
              x="15"
              y="22"
              width="2"
              height="3"
              fill={seasonalColors.accent}
            />
            <rect
              x="15"
              y="25"
              width="2"
              height="2"
              fill={seasonalColors.secondary}
            />
          </motion.g>

          {/* Sound waves */}
          {rarity !== RarityLevel.COMMON && (
            <motion.g
              animate={{
                opacity: [0, 0.8, 0],
                scale: [0.8, 1.3, 0.8],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
              }}
            >
              <rect
                x="6"
                y="14"
                width="2"
                height="1"
                fill={getRarityGlow}
                opacity="0.6"
              />
              <rect
                x="24"
                y="14"
                width="2"
                height="1"
                fill={getRarityGlow}
                opacity="0.6"
              />
              <rect
                x="4"
                y="16"
                width="2"
                height="1"
                fill={getRarityGlow}
                opacity="0.4"
              />
              <rect
                x="26"
                y="16"
                width="2"
                height="1"
                fill={getRarityGlow}
                opacity="0.4"
              />
            </motion.g>
          )}
        </motion.svg>
      </motion.div>
    )
  }

  // Облачко
  if (isCloud) {
    return (
      <motion.div
        className="pixel-container relative flex items-center justify-center"
        style={{ width: size, height: size, willChange: 'transform, opacity' }}
        initial={{ scale: 0, opacity: 0 }}
        animate={{
          scale: 1,
          opacity: 1,
          filter: isSelected
            ? `drop-shadow(0 0 20px ${getRarityGlow})`
            : 'none',
        }}
        whileHover={{
          scale: 1.1,
          y: -3,
        }}
        transition={{
          type: 'spring',
          stiffness: 200,
          damping: 15,
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
          {/* Cloud body */}
          <motion.g
            initial={{ scale: 0 }}
            animate={{
              scale: 1,
              x: [-2, 2, -2],
            }}
            transition={{
              scale: { duration: 0.8, delay: 0.3 },
              x: { duration: 4, repeat: Infinity, ease: 'easeInOut' },
            }}
          >
            {/* Cloud puffs */}
            <rect
              x="8"
              y="14"
              width="16"
              height="6"
              fill={seasonalColors.primary}
            />
            <rect
              x="6"
              y="16"
              width="2"
              height="2"
              fill={seasonalColors.primary}
            />
            <rect
              x="24"
              y="16"
              width="2"
              height="2"
              fill={seasonalColors.primary}
            />
            <rect
              x="10"
              y="12"
              width="4"
              height="2"
              fill={seasonalColors.primary}
            />
            <rect
              x="18"
              y="12"
              width="4"
              height="2"
              fill={seasonalColors.primary}
            />
            <rect
              x="14"
              y="10"
              width="4"
              height="2"
              fill={seasonalColors.accent}
            />

            {/* Cloud highlights - fluffy look */}
            <rect
              x="8"
              y="14"
              width="8"
              height="3"
              fill="#ffffff"
              opacity="0.7"
            />
            <rect
              x="10"
              y="12"
              width="4"
              height="2"
              fill="#ffffff"
              opacity="0.6"
            />
            <rect
              x="14"
              y="10"
              width="4"
              height="2"
              fill="#ffffff"
              opacity="0.8"
            />

            {/* Cloud shadows */}
            <rect
              x="16"
              y="17"
              width="8"
              height="3"
              fill="#000000"
              opacity="0.1"
            />
          </motion.g>

          {/* Rain drops for higher rarity */}
          {rarity !== RarityLevel.COMMON && (
            <motion.g>
              {Array.from({ length: 4 }, (_, i) => (
                <motion.rect
                  key={`rain-${i}`}
                  x={10 + i * 4}
                  y={22}
                  width="1"
                  height="2"
                  fill={seasonalColors.accent}
                  animate={{
                    y: [22, 28, 22],
                    opacity: [0, 1, 0],
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    delay: i * 0.3,
                  }}
                />
              ))}
            </motion.g>
          )}
        </motion.svg>
      </motion.div>
    )
  }

  // Звёздочка (простая 4-конечная)
  if (isStar) {
    return (
      <motion.div
        className="pixel-container relative flex items-center justify-center"
        style={{ width: size, height: size, willChange: 'transform, opacity' }}
        initial={{ scale: 0, rotate: 180 }}
        animate={{
          scale: 1,
          rotate: 0,
          filter: isSelected
            ? `drop-shadow(0 0 20px ${getRarityGlow})`
            : 'none',
        }}
        whileHover={{
          scale: 1.15,
          rotate: 45,
        }}
        transition={{
          type: 'spring',
          stiffness: 250,
          damping: 15,
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
          {/* Star glow */}
          <motion.ellipse
            cx="16"
            cy="16"
            rx="6"
            ry="6"
            fill={seasonalColors.accent}
            opacity="0.3"
            animate={{
              scale: [1, 1.3, 1],
              opacity: [0.2, 0.5, 0.2],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
            }}
          />

          {/* Star body */}
          <motion.g
            initial={{ scale: 0 }}
            animate={{
              scale: 1,
              rotate: [0, 360],
            }}
            transition={{
              scale: { duration: 0.8, delay: 0.3 },
              rotate: { duration: 10, repeat: Infinity, ease: 'linear' },
            }}
            style={{
              transformOrigin: '16px 16px',
            }}
          >
            {/* Center */}
            <rect
              x="14"
              y="14"
              width="4"
              height="4"
              fill={seasonalColors.primary}
            />
            <rect
              x="15"
              y="15"
              width="2"
              height="2"
              fill="#ffffff"
              opacity="0.9"
            />

            {/* Vertical beam */}
            <rect
              x="15"
              y="8"
              width="2"
              height="6"
              fill={seasonalColors.primary}
            />
            <rect
              x="15"
              y="18"
              width="2"
              height="6"
              fill={seasonalColors.primary}
            />
            <rect
              x="15"
              y="6"
              width="2"
              height="2"
              fill={seasonalColors.accent}
            />
            <rect
              x="15"
              y="24"
              width="2"
              height="2"
              fill={seasonalColors.accent}
            />

            {/* Horizontal beam */}
            <rect
              x="8"
              y="15"
              width="6"
              height="2"
              fill={seasonalColors.primary}
            />
            <rect
              x="18"
              y="15"
              width="6"
              height="2"
              fill={seasonalColors.primary}
            />
            <rect
              x="6"
              y="15"
              width="2"
              height="2"
              fill={seasonalColors.accent}
            />
            <rect
              x="24"
              y="15"
              width="2"
              height="2"
              fill={seasonalColors.accent}
            />

            {/* Star highlights */}
            <rect
              x="15"
              y="8"
              width="1"
              height="6"
              fill="#ffffff"
              opacity="0.6"
            />
            <rect
              x="8"
              y="15"
              width="6"
              height="1"
              fill="#ffffff"
              opacity="0.6"
            />
          </motion.g>

          {/* Sparkle effects */}
          <motion.g
            animate={{
              opacity: [0.3, 1, 0.3],
              scale: [0.8, 1.2, 0.8],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
            }}
          >
            {[
              { x: 10, y: 10 },
              { x: 22, y: 10 },
              { x: 10, y: 22 },
              { x: 22, y: 22 },
            ].map((pos, i) => (
              <rect
                key={`sparkle-${i}`}
                x={pos.x}
                y={pos.y}
                width="1"
                height="1"
                fill="#ffffff"
                opacity="0.8"
              />
            ))}
          </motion.g>
        </motion.svg>
      </motion.div>
    )
  }

  // Сердечко
  if (isHeart) {
    return (
      <motion.div
        className="pixel-container relative flex items-center justify-center"
        style={{ width: size, height: size, willChange: 'transform, opacity' }}
        initial={{ scale: 0 }}
        animate={{
          scale: 1,
          filter: isSelected
            ? `drop-shadow(0 0 20px ${getRarityGlow})`
            : 'none',
        }}
        whileHover={{
          scale: 1.15,
        }}
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
          {/* Heart shadow */}
          <motion.ellipse
            cx="16"
            cy="28"
            rx="4"
            ry="1"
            fill="#000000"
            opacity="0.3"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          />

          {/* Heart body */}
          <motion.g
            initial={{ scale: 0 }}
            animate={{
              scale: [1, 1.05, 1],
            }}
            transition={{
              scale: {
                duration: 1.5,
                repeat: Infinity,
                ease: 'easeInOut',
                delay: 0.3,
              },
            }}
            style={{
              transformOrigin: '16px 16px',
            }}
          >
            {/* Heart shape */}
            {/* Top curves */}
            <rect
              x="10"
              y="10"
              width="4"
              height="2"
              fill={seasonalColors.primary}
            />
            <rect
              x="18"
              y="10"
              width="4"
              height="2"
              fill={seasonalColors.primary}
            />
            <rect
              x="9"
              y="12"
              width="6"
              height="2"
              fill={seasonalColors.primary}
            />
            <rect
              x="17"
              y="12"
              width="6"
              height="2"
              fill={seasonalColors.primary}
            />

            {/* Middle */}
            <rect
              x="8"
              y="14"
              width="16"
              height="4"
              fill={seasonalColors.primary}
            />
            <rect
              x="9"
              y="18"
              width="14"
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

            {/* Bottom point */}
            <rect
              x="12"
              y="22"
              width="8"
              height="2"
              fill={seasonalColors.primary}
            />
            <rect
              x="14"
              y="24"
              width="4"
              height="2"
              fill={seasonalColors.primary}
            />
            <rect
              x="15"
              y="26"
              width="2"
              height="1"
              fill={seasonalColors.accent}
            />

            {/* Heart highlights */}
            <rect
              x="10"
              y="10"
              width="3"
              height="2"
              fill="#ffffff"
              opacity="0.6"
            />
            <rect
              x="9"
              y="12"
              width="4"
              height="2"
              fill="#ffffff"
              opacity="0.5"
            />
            <rect
              x="8"
              y="14"
              width="6"
              height="3"
              fill="#ffffff"
              opacity="0.4"
            />

            {/* Heart shadows */}
            <rect
              x="19"
              y="15"
              width="5"
              height="3"
              fill="#000000"
              opacity="0.2"
            />
            <rect
              x="16"
              y="20"
              width="6"
              height="2"
              fill="#000000"
              opacity="0.15"
            />
          </motion.g>

          {/* Small hearts floating */}
          {rarity !== RarityLevel.COMMON && (
            <motion.g>
              {Array.from({ length: 3 }, (_, i) => (
                <motion.g
                  key={`mini-heart-${i}`}
                  animate={{
                    y: [0, -15, 0],
                    opacity: [0, 1, 0],
                    scale: [0.5, 1, 0.5],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    delay: i * 0.6,
                  }}
                >
                  <rect
                    x={6 + i * 10}
                    y={6}
                    width="2"
                    height="1"
                    fill={seasonalColors.accent}
                  />
                  <rect
                    x={6 + i * 10}
                    y={7}
                    width="3"
                    height="1"
                    fill={seasonalColors.accent}
                  />
                  <rect
                    x={7 + i * 10}
                    y={8}
                    width="1"
                    height="1"
                    fill={seasonalColors.accent}
                  />
                </motion.g>
              ))}
            </motion.g>
          )}
        </motion.svg>
      </motion.div>
    )
  }

  // Default decoration - decorative ornament (для "Украшение")
  return (
    <motion.div
      className="pixel-container relative flex items-center justify-center"
      style={{ width: size, height: size }}
      initial={{ scale: 0, rotate: -45 }}
      animate={{
        scale: 1,
        rotate: 0,
        filter: isSelected
          ? `drop-shadow(0 0 20px ${getRarityGlow})`
          : 'none',
      }}
      whileHover={{
        scale: 1.1,
        y: -2,
        rotate: 5,
      }}
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
        {/* Shadow */}
        <motion.ellipse
          cx="16"
          cy="30"
          rx="4"
          ry="1.5"
          fill="#000000"
          opacity="0.3"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        />

        {/* Main decorative element */}
        <motion.g
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.8, delay: 0.3 }}
        >
          {/* Central ornament */}
          <rect
            x="12"
            y="12"
            width="8"
            height="8"
            fill={seasonalColors.primary}
          />
          <rect
            x="14"
            y="10"
            width="4"
            height="4"
            fill={seasonalColors.primary}
          />
          <rect
            x="15"
            y="8"
            width="2"
            height="2"
            fill={seasonalColors.secondary}
          />

          {/* Ornament pattern */}
          <rect
            x="12"
            y="12"
            width="4"
            height="4"
            fill="#ffffff"
            opacity="0.5"
          />
          <rect
            x="14"
            y="10"
            width="2"
            height="2"
            fill="#ffffff"
            opacity="0.6"
          />
          <rect
            x="15"
            y="8"
            width="1"
            height="2"
            fill="#ffffff"
            opacity="0.8"
          />

          {/* Right side shadow */}
          <rect
            x="16"
            y="12"
            width="4"
            height="8"
            fill="#000000"
            opacity="0.2"
          />
          <rect
            x="16"
            y="10"
            width="2"
            height="4"
            fill="#000000"
            opacity="0.15"
          />

          {/* Decorative elements around */}
          <rect
            x="10"
            y="14"
            width="2"
            height="2"
            fill={seasonalColors.accent}
          />
          <rect
            x="20"
            y="16"
            width="2"
            height="2"
            fill={seasonalColors.accent}
          />
          <rect
            x="14"
            y="6"
            width="2"
            height="2"
            fill={seasonalColors.accent}
          />
          <rect
            x="16"
            y="22"
            width="2"
            height="2"
            fill={seasonalColors.accent}
          />

          {/* Small accent details */}
          <rect
            x="10"
            y="14"
            width="1"
            height="1"
            fill="#ffffff"
            opacity="0.7"
          />
          <rect
            x="20"
            y="16"
            width="1"
            height="1"
            fill="#ffffff"
            opacity="0.7"
          />
          <rect
            x="14"
            y="6"
            width="1"
            height="1"
            fill="#ffffff"
            opacity="0.7"
          />
          <rect
            x="16"
            y="22"
            width="1"
            height="1"
            fill="#ffffff"
            opacity="0.7"
          />
        </motion.g>

        {/* Floating sparkles around decoration */}
        <motion.g
          animate={{
            rotate: [0, 360],
          }}
          transition={{
            duration: 8,
            repeat: repeatInf,
            ease: 'linear',
          }}
          style={{
            transformOrigin: '16px 16px',
          }}
        >
          {defaultSparkles.map((pos, i) => (
            <motion.rect
              key={`sparkle-${i}`}
              x={pos.x}
              y={pos.y}
              width="1"
              height="1"
              fill={seasonalColors.accent}
              animate={{
                opacity: [0.3, 1, 0.3],
                scale: [0.5, 1, 0.5],
              }}
              transition={{
                duration: 2,
                repeat: repeatInf,
                delay: i * 0.3,
                ease: 'easeInOut',
              }}
            />
          ))}
        </motion.g>

        {/* Seasonal decorations */}
        {season === SeasonalVariant.SPRING && (
          <motion.g
            animate={{
              scale: [0, 1, 0],
              opacity: [0, 1, 0],
            }}
            transition={{
              duration: 3,
              repeat: repeatInf,
              delay: 2,
            }}
          >
            {/* Spring petals */}
            <rect
              x="8"
              y="10"
              width="2"
              height="1"
              fill="#ec4899"
              opacity="0.8"
            />
            <rect
              x="22"
              y="18"
              width="2"
              height="1"
              fill="#f97316"
              opacity="0.8"
            />
            <rect
              x="6"
              y="20"
              width="1"
              height="2"
              fill="#fbbf24"
              opacity="0.8"
            />
          </motion.g>
        )}

        {season === SeasonalVariant.AUTUMN && (
          <motion.g
            animate={{
              y: [0, 15],
              opacity: [1, 0],
              rotate: [0, 90],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              delay: 2,
              stagger: 0.5,
            }}
          >
            {/* Falling leaves */}
            <rect x="6" y="8" width="2" height="1" fill="#dc2626" />
            <rect x="24" y="12" width="1" height="2" fill="#ea580c" />
            <rect x="26" y="20" width="2" height="1" fill="#f59e0b" />
          </motion.g>
        )}

        {/* Magical effects for rare decorations */}
        {rarity !== RarityLevel.COMMON && (
          <motion.g
            animate={{
              opacity: [0.5, 1, 0.5],
            }}
            transition={{
              duration: 2,
              repeat: repeatInf,
              delay: 2,
            }}
          >
            {/* Magical glow points */}
            <rect
              x="6"
              y="12"
              width="1"
              height="1"
              fill={getRarityGlow}
              opacity="0.8"
            />
            <rect
              x="26"
              y="18"
              width="1"
              height="1"
              fill={getRarityGlow}
              opacity="0.8"
            />
            <rect
              x="16"
              y="4"
              width="1"
              height="1"
              fill={getRarityGlow}
              opacity="0.9"
            />
            <rect
              x="12"
              y="26"
              width="1"
              height="1"
              fill={getRarityGlow}
              opacity="0.8"
            />
          </motion.g>
        )}

        {/* Legendary effects */}
        {rarity === RarityLevel.LEGENDARY && (
          <motion.g>
            {/* Central energy */}
            <motion.rect
              x="15"
              y="15"
              width="2"
              height="2"
              fill="#fbbf24"
              opacity="0.8"
              animate={{
                opacity: [0.4, 1, 0.4],
                scale: [1, 1.3, 1],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                delay: 3,
              }}
            />

            {/* Legendary sparkles */}
            {legendaryDecorationSparkles.map((pos, i) => (
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
                delay: 3.5 + i * 0.2,
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
            background: `radial-gradient(circle, ${getRarityGlow}20 0%, transparent 70%)`,
          }}
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{
            duration: 3,
            repeat: repeatInf,
            ease: 'easeInOut',
          }}
        />
      )}
    </motion.div>
  )
}

function areEqual(
  prev: Readonly<DecorationSVGProps>,
  next: Readonly<DecorationSVGProps>
) {
  return (
    prev.size === next.size &&
    prev.color === next.color &&
    prev.rarity === next.rarity &&
    prev.season === next.season &&
    prev.isSelected === next.isSelected &&
    prev.isHovered === next.isHovered &&
    prev.name === next.name &&
    prev.isVisible === next.isVisible
  )
}

export const DecorationSVG = memo(DecorationSVGComponent, areEqual)
