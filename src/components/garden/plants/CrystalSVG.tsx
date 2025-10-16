import { motion } from 'framer-motion'
import { RarityLevel, SeasonalVariant } from '@/types'

interface CrystalSVGProps {
  size?: number
  color?: string
  rarity?: RarityLevel
  season?: SeasonalVariant | undefined
  isSelected?: boolean
  isHovered?: boolean
  name?: string
}

export function CrystalSVG({
  size = 64,
  color = '#3b82f6',
  rarity = RarityLevel.COMMON,
  season,
  isSelected = false,
  isHovered: _isHovered = false,
  name: _name = 'Crystal',
}: CrystalSVGProps) {
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

  // Сезонные цвета для кристаллов d
  const getSeasonalColors = () => {
    const baseColor = color
    switch (season) {
      case SeasonalVariant.SPRING:
        return {
          main: '#22c55e', // Весенний зеленый кристалл
          core: '#dcfce7',
          facets: '#16a34a',
          glow: '#4ade80',
          decoration: '#a3e635', // Растительные элементы
        }
      case SeasonalVariant.SUMMER:
        return {
          main: '#eab308', // Летний золотой кристалл
          core: '#fef9c3',
          facets: '#ca8a04',
          glow: '#fde047',
          decoration: '#f59e0b', // Солнечные блики
        }
      case SeasonalVariant.AUTUMN:
        return {
          main: '#ea580c', // Осенний оранжевый кристалл
          core: '#fed7aa',
          facets: '#c2410c',
          glow: '#fb923c',
          decoration: '#dc2626', // Осенние листья
        }
      case SeasonalVariant.WINTER:
        return {
          main: '#e0e7ff', // Зимний ледяной кристалл
          core: '#f8fafc',
          facets: '#c7d2fe',
          glow: '#cbd5e1',
          decoration: '#ffffff', // Снежинки
        }
      default:
        return {
          main: baseColor,
          core: '#dbeafe',
          facets: '#1d4ed8',
          glow: '#60a5fa',
          decoration: baseColor,
        }
    }
  }

  const seasonalColors = getSeasonalColors()

  return (
    <motion.div
      className="pixel-container relative flex items-center justify-center"
      style={{ width: size, height: size }}
      initial={{ scale: 0, rotate: -180, opacity: 0 }}
      animate={{
        scale: 1,
        rotate: 0,
        opacity: 1,
        filter: isSelected
          ? `drop-shadow(0 0 25px ${getRarityGlow()})`
          : 'none',
      }}
      whileHover={{
        scale: 1.15,
        y: -5,
        filter: `drop-shadow(0 10px 30px ${color}60) brightness(1.2)`,
      }}
      transition={{
        type: 'spring',
        stiffness: 200,
        damping: 15,
      }}
    >
      {/* Energy particles */}
      <div className="pointer-events-none absolute inset-0">
        {Array.from({ length: 8 }, (_, i) => (
          <motion.div
            key={i}
            className="absolute h-1 w-1 rounded-full"
            style={{
              background: color,
              left: `${30 + Math.random() * 40}%`,
              top: `${20 + Math.random() * 60}%`,
            }}
            animate={{
              y: [0, -30, 0],
              x: [0, (Math.random() - 0.5) * 40, 0],
              opacity: [0, 1, 0],
              scale: [0.5, 1.5, 0.5],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              delay: i * 0.4,
              ease: 'easeInOut',
            }}
          />
        ))}
      </div>

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
        {/* Crystal base/shadow */}
        <motion.ellipse
          cx="16"
          cy="29"
          rx="6"
          ry="1.5"
          fill="#000000"
          opacity="0.4"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 0.8, delay: 0.5 }}
        />

        {/* Main crystal body - pixelated gem shape */}
        <motion.g
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 1.2, delay: 0.2 }}
        >
          {/* Crystal main body (diamond shape) */}
          <rect
            x="12"
            y="12"
            width="8"
            height="12"
            fill={seasonalColors.main}
          />

          {/* Crystal top point */}
          <rect x="14" y="8" width="4" height="4" fill={seasonalColors.main} />
          <rect x="15" y="6" width="2" height="2" fill={seasonalColors.main} />
          <rect x="15" y="4" width="2" height="2" fill={seasonalColors.main} />

          {/* Crystal bottom point */}
          <rect x="14" y="24" width="4" height="2" fill={seasonalColors.main} />
          <rect x="15" y="26" width="2" height="2" fill={seasonalColors.main} />

          {/* Left facet highlight */}
          <rect
            x="12"
            y="12"
            width="4"
            height="12"
            fill="#ffffff"
            opacity="0.5"
          />
          <rect
            x="14"
            y="8"
            width="2"
            height="4"
            fill="#ffffff"
            opacity="0.6"
          />
          <rect
            x="15"
            y="6"
            width="1"
            height="2"
            fill="#ffffff"
            opacity="0.8"
          />
          <rect
            x="15"
            y="4"
            width="1"
            height="2"
            fill="#ffffff"
            opacity="0.9"
          />

          {/* Right facet shadow */}
          <rect
            x="16"
            y="12"
            width="4"
            height="12"
            fill="#000000"
            opacity="0.3"
          />
          <rect
            x="16"
            y="8"
            width="2"
            height="4"
            fill="#000000"
            opacity="0.2"
          />
          <rect
            x="16"
            y="6"
            width="1"
            height="2"
            fill="#000000"
            opacity="0.15"
          />

          {/* Bottom facet */}
          <rect
            x="14"
            y="24"
            width="2"
            height="2"
            fill="#ffffff"
            opacity="0.4"
          />
          <rect
            x="16"
            y="24"
            width="2"
            height="2"
            fill="#000000"
            opacity="0.25"
          />
          <rect
            x="15"
            y="26"
            width="1"
            height="2"
            fill="#ffffff"
            opacity="0.3"
          />
          <rect
            x="16"
            y="26"
            width="1"
            height="2"
            fill="#000000"
            opacity="0.2"
          />
        </motion.g>

        {/* Crystal inner facets and details */}
        <motion.g
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.8 }}
        >
          {/* Inner facet lines */}
          <rect
            x="14"
            y="10"
            width="4"
            height="1"
            fill="#ffffff"
            opacity="0.7"
          />
          <rect
            x="13"
            y="14"
            width="6"
            height="1"
            fill="#000000"
            opacity="0.2"
          />
          <rect
            x="14"
            y="18"
            width="4"
            height="1"
            fill="#ffffff"
            opacity="0.5"
          />
          <rect
            x="13"
            y="22"
            width="6"
            height="1"
            fill="#000000"
            opacity="0.25"
          />

          {/* Vertical facet lines */}
          <rect
            x="15"
            y="8"
            width="1"
            height="16"
            fill="#000000"
            opacity="0.15"
          />
          <rect
            x="16"
            y="8"
            width="1"
            height="16"
            fill="#000000"
            opacity="0.1"
          />
        </motion.g>

        {/* Crystal core energy */}
        <motion.g
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.6, delay: 1.6 }}
        >
          {/* Pulsing core */}
          <motion.rect
            x="15"
            y="15"
            width="2"
            height="6"
            fill="#ffffff"
            opacity="0.8"
            animate={{
              opacity: [0.4, 1, 0.4],
              scaleY: [1, 1.1, 1],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />

          {/* Inner glow pixels */}
          <rect
            x="14"
            y="16"
            width="1"
            height="1"
            fill="#ffffff"
            opacity="0.6"
          />
          <rect
            x="17"
            y="16"
            width="1"
            height="1"
            fill="#ffffff"
            opacity="0.6"
          />
          <rect
            x="15"
            y="14"
            width="2"
            height="1"
            fill="#ffffff"
            opacity="0.7"
          />
          <rect
            x="15"
            y="21"
            width="2"
            height="1"
            fill="#ffffff"
            opacity="0.7"
          />
        </motion.g>

        {/* Special effects for rare crystals */}
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
            {/* Magical rune pixels */}
            <rect
              x="13"
              y="9"
              width="1"
              height="1"
              fill={getRarityGlow()}
              opacity="0.9"
            />
            <rect
              x="18"
              y="11"
              width="1"
              height="1"
              fill={getRarityGlow()}
              opacity="0.9"
            />
            <rect
              x="12"
              y="17"
              width="1"
              height="1"
              fill={getRarityGlow()}
              opacity="0.9"
            />
            <rect
              x="19"
              y="19"
              width="1"
              height="1"
              fill={getRarityGlow()}
              opacity="0.9"
            />
            <rect
              x="16"
              y="23"
              width="1"
              height="1"
              fill={getRarityGlow()}
              opacity="0.9"
            />
          </motion.g>
        )}

        {/* Magical energy for epic/legendary */}
        {(rarity === RarityLevel.EPIC || rarity === RarityLevel.LEGENDARY) && (
          <motion.g>
            {/* Energy orbs around crystal */}
            {Array.from({ length: 4 }, (_, i) => {
              const positions = [
                { x: 10, y: 10 },
                { x: 22, y: 10 },
                { x: 10, y: 22 },
                { x: 22, y: 22 },
              ]
              const pos = positions[i]
              if (!pos) return null

              return (
                <motion.rect
                  key={i}
                  x={pos.x}
                  y={pos.y}
                  width="1"
                  height="1"
                  fill="#fbbf24"
                  animate={{
                    opacity: [0, 1, 0],
                    scale: [0.5, 2, 0.5],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    delay: 2.5 + i * 0.5,
                  }}
                />
              )
            })}
          </motion.g>
        )}

        {/* Legendary effects */}
        {rarity === RarityLevel.LEGENDARY && (
          <motion.g>
            {/* Pulsing energy waves */}
            <motion.rect
              x="8"
              y="8"
              width="16"
              height="16"
              fill="none"
              stroke={getRarityGlow()}
              strokeWidth="1"
              opacity="0.4"
              strokeDasharray="1,1"
              animate={{
                scale: [1, 1.3, 1],
                opacity: [0.4, 0.1, 0.4],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                delay: 3,
              }}
            />

            {/* Legendary sparkles */}
            {Array.from({ length: 6 }, (_, i) => {
              const sparklePositions = [
                { x: 8, y: 16 },
                { x: 24, y: 16 },
                { x: 16, y: 3 },
                { x: 16, y: 28 },
                { x: 11, y: 7 },
                { x: 21, y: 25 },
              ]
              const pos = sparklePositions[i]
              if (!pos) return null

              return (
                <motion.rect
                  key={`sparkle-${i}`}
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
                    repeat: Infinity,
                    delay: 3.5 + i * 0.3,
                  }}
                />
              )
            })}
          </motion.g>
        )}

        {/* Reflection highlights */}
        <motion.g
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 2 }}
        >
          {/* Sharp pixel highlights */}
          <rect
            x="14"
            y="7"
            width="1"
            height="2"
            fill="#ffffff"
            opacity="0.9"
          />
          <rect
            x="13"
            y="13"
            width="1"
            height="1"
            fill="#ffffff"
            opacity="0.8"
          />
          <rect
            x="12"
            y="20"
            width="1"
            height="1"
            fill="#ffffff"
            opacity="0.7"
          />

          {/* Moving reflection */}
          <motion.rect
            x="15"
            y="12"
            width="1"
            height="8"
            fill="#ffffff"
            opacity="0.6"
            animate={{
              opacity: [0, 0.8, 0],
              x: [15, 16, 15],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              delay: 3,
              ease: 'easeInOut',
            }}
          />
        </motion.g>
      </motion.svg>

      {/* Magical aura */}
      <motion.div
        className="absolute inset-0 rounded-full"
        style={{
          background: `conic-gradient(from 0deg, ${getRarityGlow()}20, transparent, ${getRarityGlow()}20)`,
        }}
        animate={{
          rotate: [0, 360],
          scale: [1, 1.2, 1],
          opacity: [0.2, 0.5, 0.2],
        }}
        transition={{
          rotate: { duration: 8, repeat: Infinity, ease: 'linear' },
          scale: { duration: 3, repeat: Infinity, ease: 'easeInOut' },
          opacity: { duration: 3, repeat: Infinity, ease: 'easeInOut' },
        }}
      />
    </motion.div>
  )
}
