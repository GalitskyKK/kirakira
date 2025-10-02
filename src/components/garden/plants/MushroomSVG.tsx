import { motion } from 'framer-motion'
import { RarityLevel, SeasonalVariant } from '@/types'

interface MushroomSVGProps {
  size?: number
  color?: string
  rarity?: RarityLevel
  season?: SeasonalVariant | undefined
  isSelected?: boolean
  isHovered?: boolean
  name?: string
}

export function MushroomSVG({
  size = 64,
  color = '#ef4444',
  rarity = RarityLevel.COMMON,
  season,
  isSelected = false,
  isHovered: _isHovered = false,
  name: _name = 'Mushroom',
}: MushroomSVGProps) {
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

  // Сезонные цвета для грибов
  const getSeasonalColors = () => {
    const baseColor = color
    switch (season) {
      case SeasonalVariant.SPRING:
        return {
          cap: '#ef4444', // Яркий весенний красный
          stem: '#f3f4f6',
          spots: '#fbbf24', // Золотые весенние пятна
          gills: '#fee2e2',
          decoration: '#22c55e', // Молодая зелень
        }
      case SeasonalVariant.SUMMER:
        return {
          cap: '#dc2626', // Глубокий летний красный
          stem: '#e5e7eb',
          spots: '#fde047', // Яркие летние пятна
          gills: '#fecaca',
          decoration: '#eab308', // Летние цветочки
        }
      case SeasonalVariant.AUTUMN:
        return {
          cap: '#ea580c', // Осенний оранжево-красный
          stem: '#d6d3d1',
          spots: '#f59e0b', // Осенние пятна
          gills: '#fed7aa',
          decoration: '#dc2626', // Осенние листья
        }
      case SeasonalVariant.WINTER:
        return {
          cap: '#b91c1c', // Темный зимний красный
          stem: '#f9fafb',
          spots: '#e5e7eb', // Бледные зимние пятна
          gills: '#f3f4f6',
          decoration: '#e0e7ff', // Зимний иней
        }
      default:
        return {
          cap: baseColor,
          stem: '#f3f4f6',
          spots: '#fbbf24',
          gills: '#fee2e2',
          decoration: baseColor,
        }
    }
  }

  const seasonalColors = getSeasonalColors()

  return (
    <motion.div
      className="pixel-container relative flex items-center justify-center"
      style={{ width: size, height: size }}
      initial={{ scale: 0, y: 10 }}
      animate={{
        scale: 1,
        y: 0,
        filter: isSelected
          ? `drop-shadow(0 0 20px ${getRarityGlow()})`
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
      {/* Spores for magical mushrooms */}
      {(rarity === RarityLevel.EPIC || rarity === RarityLevel.LEGENDARY) && (
        <div className="pointer-events-none absolute inset-0">
          {Array.from({ length: 10 }, (_, i) => (
            <motion.div
              key={i}
              className="absolute h-0.5 w-0.5 rounded-full bg-purple-300"
              style={{
                left: `${20 + Math.random() * 60}%`,
                top: `${30 + Math.random() * 40}%`,
              }}
              animate={{
                y: [0, -40, 0],
                x: [0, (Math.random() - 0.5) * 30, 0],
                opacity: [0, 1, 0],
                scale: [0, 1, 0],
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                delay: i * 0.3,
                ease: 'easeOut',
              }}
            />
          ))}
        </div>
      )}

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
        {/* Ground/shadow */}
        <motion.ellipse
          cx="16"
          cy="30"
          rx="5"
          ry="1"
          fill="#000000"
          opacity="0.3"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        />

        {/* Moss around base */}
        <motion.g
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <rect
            x="12"
            y="28"
            width="2"
            height="1"
            fill={seasonalColors.decoration}
            opacity="0.7"
          />
          <rect
            x="18"
            y="29"
            width="3"
            height="1"
            fill="#16a34a"
            opacity="0.6"
          />
          <rect
            x="13"
            y="29"
            width="1"
            height="1"
            fill={seasonalColors.decoration}
            opacity="0.8"
          />
        </motion.g>

        {/* Stem - pixelated style */}
        <motion.g
          initial={{ scaleY: 0 }}
          animate={{ scaleY: 1 }}
          transition={{ duration: 0.8, delay: 0.5 }}
        >
          {/* Main stem body */}
          <rect
            x="14"
            y="18"
            width="4"
            height="10"
            fill={seasonalColors.stem}
          />

          {/* Stem highlight */}
          <rect x="14" y="18" width="2" height="10" fill="#ffffff" />

          {/* Stem shadow */}
          <rect x="16" y="18" width="2" height="10" fill="#e5e7eb" />

          {/* Stem texture lines */}
          <rect
            x="14"
            y="22"
            width="4"
            height="1"
            fill="#d1d5db"
            opacity="0.5"
          />
          <rect
            x="14"
            y="25"
            width="4"
            height="1"
            fill="#d1d5db"
            opacity="0.3"
          />
        </motion.g>

        {/* Cap base/underside */}
        <motion.g
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.6, delay: 0.8 }}
        >
          {/* Cap underside */}
          <ellipse cx="16" cy="18" rx="8" ry="2" fill="#8b5cf6" opacity="0.7" />

          {/* Gills (pixel art style) */}
          {Array.from({ length: 7 }, (_, i) => (
            <rect
              key={i}
              x={10 + i * 2}
              y="18"
              width="1"
              height="1"
              fill="#8b5cf6"
              opacity="0.4"
            />
          ))}
        </motion.g>

        {/* Main cap - pixel art mushroom */}
        <motion.g
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.8, delay: 1.0 }}
        >
          {/* Cap main body */}
          <rect x="8" y="12" width="16" height="6" fill={seasonalColors.cap} />

          {/* Cap rounded edges */}
          <rect x="10" y="10" width="12" height="2" fill={seasonalColors.cap} />
          <rect x="12" y="8" width="8" height="2" fill={seasonalColors.cap} />

          {/* Cap highlight (top left) */}
          <rect
            x="8"
            y="12"
            width="6"
            height="3"
            fill="#ffffff"
            opacity="0.4"
          />
          <rect
            x="10"
            y="10"
            width="4"
            height="2"
            fill="#ffffff"
            opacity="0.3"
          />
          <rect
            x="12"
            y="8"
            width="3"
            height="2"
            fill="#ffffff"
            opacity="0.5"
          />

          {/* Cap shadow (bottom right) */}
          <rect
            x="18"
            y="15"
            width="6"
            height="3"
            fill="#000000"
            opacity="0.2"
          />
          <rect
            x="16"
            y="13"
            width="8"
            height="2"
            fill="#000000"
            opacity="0.15"
          />
        </motion.g>

        {/* Mushroom spots - classic white spots */}
        <motion.g
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.6, delay: 1.2 }}
        >
          {/* Large spots */}
          <rect
            x="12"
            y="10"
            width="2"
            height="2"
            fill="#ffffff"
            opacity="0.9"
          />
          <rect
            x="18"
            y="12"
            width="2"
            height="2"
            fill="#ffffff"
            opacity="0.9"
          />
          <rect
            x="10"
            y="14"
            width="2"
            height="2"
            fill="#ffffff"
            opacity="0.9"
          />
          <rect
            x="20"
            y="16"
            width="2"
            height="2"
            fill="#ffffff"
            opacity="0.9"
          />

          {/* Small spots */}
          <rect
            x="15"
            y="9"
            width="1"
            height="1"
            fill="#ffffff"
            opacity="0.8"
          />
          <rect
            x="22"
            y="14"
            width="1"
            height="1"
            fill="#ffffff"
            opacity="0.8"
          />
          <rect
            x="9"
            y="16"
            width="1"
            height="1"
            fill="#ffffff"
            opacity="0.8"
          />
          <rect
            x="16"
            y="15"
            width="1"
            height="1"
            fill="#ffffff"
            opacity="0.8"
          />
        </motion.g>

        {/* Cap edge details */}
        <motion.g
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 1.5 }}
        >
          {/* Edge shading */}
          <rect
            x="8"
            y="17"
            width="16"
            height="1"
            fill="#000000"
            opacity="0.1"
          />

          {/* Edge highlight */}
          <rect
            x="9"
            y="12"
            width="14"
            height="1"
            fill="#ffffff"
            opacity="0.2"
          />
        </motion.g>

        {/* Special effects for rare mushrooms */}
        {rarity !== RarityLevel.COMMON && (
          <motion.g
            animate={{
              opacity: [0.5, 1, 0.5],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              delay: 2,
            }}
          >
            {/* Magical glow spots */}
            <rect
              x="11"
              y="9"
              width="1"
              height="1"
              fill={getRarityGlow()}
              opacity="0.8"
            />
            <rect
              x="19"
              y="11"
              width="1"
              height="1"
              fill={getRarityGlow()}
              opacity="0.8"
            />
            <rect
              x="13"
              y="16"
              width="1"
              height="1"
              fill={getRarityGlow()}
              opacity="0.8"
            />
            <rect
              x="21"
              y="15"
              width="1"
              height="1"
              fill={getRarityGlow()}
              opacity="0.8"
            />
          </motion.g>
        )}

        {/* Bioluminescent effect for legendary */}
        {rarity === RarityLevel.LEGENDARY && (
          <motion.g>
            {/* Glowing center */}
            <motion.rect
              x="14"
              y="12"
              width="4"
              height="4"
              fill={seasonalColors.spots}
              opacity="0.6"
              animate={{
                opacity: [0.3, 0.8, 0.3],
                scale: [1, 1.1, 1],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                delay: 2.5,
              }}
            />

            {/* Pulsing glow spots */}
            {Array.from({ length: 3 }, (_, i) => {
              const positions = [
                { x: 10, y: 13 },
                { x: 22, y: 15 },
                { x: 16, y: 8 },
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
                  fill="#ffffff"
                  animate={{
                    opacity: [0, 1, 0],
                    scale: [0.5, 1.5, 0.5],
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    delay: 3 + i * 0.5,
                  }}
                />
              )
            })}
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
            scale: [1, 1.15, 1],
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
