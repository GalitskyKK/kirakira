import { motion, useReducedMotion } from 'framer-motion'
import { memo, useMemo } from 'react'
import { RarityLevel, SeasonalVariant } from '@/types'

interface GrassSVGProps {
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

function GrassSVGComponent({
  size = 64,
  color = '#22c55e',
  rarity = RarityLevel.COMMON,
  season,
  isSelected = false,
  isHovered: _isHovered = false,
  name = 'Grass',
  isVisible = true,
  staticMode = false,
}: GrassSVGProps) {
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
    const baseGreen = color
    switch (season) {
      case SeasonalVariant.SPRING:
        return {
          primary: '#65a30d', // Свежий зеленый
          secondary: '#84cc16',
          accent: '#a3e635',
        }
      case SeasonalVariant.SUMMER:
        return {
          primary: '#16a34a', // Насыщенный зеленый
          secondary: '#22c55e',
          accent: '#4ade80',
        }
      case SeasonalVariant.AUTUMN:
        return {
          primary: '#a16207', // Желто-коричневый
          secondary: '#ca8a04',
          accent: '#eab308',
        }
      case SeasonalVariant.WINTER:
        return {
          primary: '#64748b', // Серо-зеленый
          secondary: '#94a3b8',
          accent: '#cbd5e1',
        }
      default:
        return {
          primary: baseGreen,
          secondary: '#16a34a',
          accent: '#4ade80',
        }
    }
  }, [season, color])

  const seasonalColors = getSeasonalColors
  const hashDelay = useMemo(() => {
    const src = String(name ?? '')
    let h = 0
    for (let i = 0; i < src.length; i++) h = (h * 31 + src.charCodeAt(i)) | 0
    const base = Math.abs(h % 300) / 1000 // 0..0.299
    return 0.05 + base // 0.05..0.349s
  }, [name])

  // Определяем тип элемента по имени
  const isMoss = name === 'Мох'

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
        scale: 1.05,
        y: -2,
      }}
      transition={{
        type: 'spring',
        stiffness: 300,
        damping: 20,
        delay: hashDelay,
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
          rx="6"
          ry="1.5"
          fill="#000000"
          opacity="0.3"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        />

        {isMoss ? (
          // МОХ - низкий, густой, мягкий
          <motion.g
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            {/* Moss base - низкий и округлый */}
            <rect
              x="8"
              y="26"
              width="16"
              height="4"
              fill={seasonalColors.primary}
            />
            <rect
              x="10"
              y="24"
              width="12"
              height="2"
              fill={seasonalColors.primary}
            />
            <rect
              x="12"
              y="22"
              width="8"
              height="2"
              fill={seasonalColors.secondary}
            />

            {/* Moss texture - мягкие детали */}
            <rect
              x="8"
              y="26"
              width="6"
              height="2"
              fill="#ffffff"
              opacity="0.3"
            />
            <rect
              x="18"
              y="27"
              width="6"
              height="3"
              fill="#000000"
              opacity="0.15"
            />

            {/* Small moss bumps */}
            <rect
              x="11"
              y="23"
              width="2"
              height="1"
              fill={seasonalColors.accent}
            />
            <rect
              x="19"
              y="24"
              width="2"
              height="1"
              fill={seasonalColors.accent}
            />
            <rect
              x="15"
              y="22"
              width="2"
              height="1"
              fill={seasonalColors.accent}
            />

            {/* Moss highlights */}
            <rect
              x="12"
              y="22"
              width="3"
              height="1"
              fill="#ffffff"
              opacity="0.6"
            />
            <rect
              x="10"
              y="24"
              width="4"
              height="1"
              fill="#ffffff"
              opacity="0.4"
            />

            {/* Moss details */}
            <rect
              x="9"
              y="26"
              width="1"
              height="1"
              fill={seasonalColors.accent}
              opacity="0.8"
            />
            <rect
              x="22"
              y="27"
              width="1"
              height="1"
              fill={seasonalColors.accent}
              opacity="0.8"
            />
            <rect
              x="14"
              y="23"
              width="1"
              height="1"
              fill={seasonalColors.accent}
              opacity="0.9"
            />
          </motion.g>
        ) : (
          // ТРАВА - высокая, стройная
          <motion.g
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.8, delay: 0.3 }}
          >
            {/* Grass blades - пиксельные травинки */}

            {/* Tall center blade */}
            <rect
              x="15"
              y="10"
              width="2"
              height="18"
              fill={seasonalColors.primary}
            />
            <rect
              x="15"
              y="10"
              width="1"
              height="18"
              fill={seasonalColors.accent}
            />
            <rect
              x="16"
              y="12"
              width="1"
              height="16"
              fill={seasonalColors.secondary}
            />
            <rect
              x="15"
              y="8"
              width="2"
              height="2"
              fill={seasonalColors.accent}
            />
            <rect
              x="16"
              y="6"
              width="1"
              height="2"
              fill={seasonalColors.accent}
            />

            {/* Left tall blade */}
            <rect
              x="11"
              y="14"
              width="2"
              height="14"
              fill={seasonalColors.secondary}
            />
            <rect
              x="11"
              y="14"
              width="1"
              height="14"
              fill={seasonalColors.accent}
            />
            <rect
              x="11"
              y="12"
              width="2"
              height="2"
              fill={seasonalColors.accent}
            />
            <rect
              x="12"
              y="10"
              width="1"
              height="2"
              fill={seasonalColors.accent}
            />

            {/* Right tall blade */}
            <rect
              x="19"
              y="12"
              width="2"
              height="16"
              fill={seasonalColors.secondary}
            />
            <rect
              x="19"
              y="12"
              width="1"
              height="16"
              fill={seasonalColors.accent}
            />
            <rect
              x="19"
              y="10"
              width="2"
              height="2"
              fill={seasonalColors.accent}
            />
            <rect
              x="20"
              y="8"
              width="1"
              height="2"
              fill={seasonalColors.accent}
            />

            {/* Medium blades */}
            <rect
              x="8"
              y="18"
              width="1"
              height="10"
              fill={seasonalColors.primary}
            />
            <rect
              x="13"
              y="16"
              width="1"
              height="12"
              fill={seasonalColors.secondary}
            />
            <rect
              x="18"
              y="15"
              width="1"
              height="13"
              fill={seasonalColors.primary}
            />
            <rect
              x="23"
              y="20"
              width="1"
              height="8"
              fill={seasonalColors.secondary}
            />

            {/* Short blades */}
            <rect
              x="7"
              y="22"
              width="1"
              height="6"
              fill={seasonalColors.secondary}
            />
            <rect
              x="9"
              y="21"
              width="1"
              height="7"
              fill={seasonalColors.primary}
            />
            <rect
              x="22"
              y="19"
              width="1"
              height="9"
              fill={seasonalColors.secondary}
            />
            <rect
              x="24"
              y="23"
              width="1"
              height="5"
              fill={seasonalColors.primary}
            />
            <rect
              x="6"
              y="24"
              width="1"
              height="4"
              fill={seasonalColors.accent}
            />
            <rect
              x="25"
              y="25"
              width="1"
              height="3"
              fill={seasonalColors.accent}
            />

            {/* Grass highlights */}
            <rect
              x="15"
              y="10"
              width="1"
              height="8"
              fill="#ffffff"
              opacity="0.6"
            />
            <rect
              x="11"
              y="14"
              width="1"
              height="6"
              fill="#ffffff"
              opacity="0.5"
            />
            <rect
              x="19"
              y="12"
              width="1"
              height="7"
              fill="#ffffff"
              opacity="0.5"
            />
          </motion.g>
        )}

        {/* Seasonal decorations */}
        {season === SeasonalVariant.SPRING && (
          <motion.g
            animate={{
              scale: [0, 1, 0],
              opacity: [0, 1, 0],
            }}
            transition={{
              duration: 2,
              repeat: repeatInf,
              delay: 2,
            }}
          >
            {/* Dew drops */}
            <rect
              x="12"
              y="16"
              width="1"
              height="1"
              fill="#06b6d4"
              opacity="0.8"
            />
            <rect
              x="20"
              y="18"
              width="1"
              height="1"
              fill="#06b6d4"
              opacity="0.7"
            />
            <rect
              x="16"
              y="14"
              width="1"
              height="1"
              fill="#06b6d4"
              opacity="0.9"
            />
          </motion.g>
        )}

        {season === SeasonalVariant.SUMMER && (
          <motion.g
            animate={{
              opacity: [0.5, 1, 0.5],
            }}
            transition={{
              duration: 3,
              repeat: repeatInf,
              delay: 2,
            }}
          >
            {/* Sun highlights */}
            <rect
              x="14"
              y="8"
              width="1"
              height="1"
              fill="#fbbf24"
              opacity="0.8"
            />
            <rect
              x="18"
              y="10"
              width="1"
              height="1"
              fill="#fbbf24"
              opacity="0.7"
            />
            <rect
              x="21"
              y="14"
              width="1"
              height="1"
              fill="#fbbf24"
              opacity="0.6"
            />
          </motion.g>
        )}

        {season === SeasonalVariant.AUTUMN && (
          <motion.g
            animate={{
              y: [0, 10],
              opacity: [1, 0],
            }}
            transition={{
              duration: 3,
              repeat: repeatInf,
              delay: 2,
              stagger: 0.3,
            }}
          >
            {/* Dry leaves falling */}
            <rect x="10" y="20" width="1" height="1" fill="#dc2626" />
            <rect x="17" y="22" width="1" height="1" fill="#f59e0b" />
            <rect x="21" y="24" width="1" height="1" fill="#ea580c" />
          </motion.g>
        )}

        {season === SeasonalVariant.WINTER && (
          <motion.g
            animate={{
              opacity: [0.7, 1, 0.7],
            }}
            transition={{
              duration: 4,
              repeat: repeatInf,
              delay: 2,
            }}
          >
            {/* Frost on grass tips */}
            <rect
              x="15"
              y="6"
              width="2"
              height="1"
              fill="#ffffff"
              opacity="0.9"
            />
            <rect
              x="11"
              y="10"
              width="2"
              height="1"
              fill="#ffffff"
              opacity="0.8"
            />
            <rect
              x="19"
              y="8"
              width="2"
              height="1"
              fill="#ffffff"
              opacity="0.9"
            />
            <rect
              x="8"
              y="18"
              width="1"
              height="1"
              fill="#ffffff"
              opacity="0.7"
            />
            <rect
              x="23"
              y="20"
              width="1"
              height="1"
              fill="#ffffff"
              opacity="0.7"
            />
          </motion.g>
        )}

        {/* Swaying animation */}
        <motion.g
          animate={{
            rotate: [-0.5, 0.5, -0.5],
          }}
          transition={{
            duration: 3,
            repeat: repeatInf,
            ease: 'easeInOut',
          }}
          style={{
            transformOrigin: '16px 28px',
          }}
        >
          {/* Wind effect on grass tips */}
          {!isMoss &&
            Array.from({ length: 5 }, (_, i) => {
              const positions = [
                { x: 15, y: 8 },
                { x: 11, y: 12 },
                { x: 19, y: 10 },
                { x: 13, y: 16 },
                { x: 18, y: 15 },
              ]
              const pos = positions[i]
              if (!pos) return null

              return (
                <motion.rect
                  key={`tip-${i}`}
                  x={pos.x}
                  y={pos.y}
                  width="1"
                  height="2"
                  fill={seasonalColors.accent}
                  opacity="0.8"
                  animate={{
                    x: [pos.x, pos.x + 0.5, pos.x - 0.5, pos.x],
                  }}
                  transition={{
                    duration: 2,
                    repeat: repeatInf,
                    delay: i * 0.2,
                    ease: 'easeInOut',
                  }}
                />
              )
            })}
        </motion.g>

        {/* Magical effects for rare grass */}
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
            {/* Magic sparkles */}
            <rect
              x="6"
              y="20"
              width="1"
              height="1"
              fill={getRarityGlow}
              opacity="0.8"
            />
            <rect
              x="26"
              y="22"
              width="1"
              height="1"
              fill={getRarityGlow}
              opacity="0.8"
            />
            <rect
              x="16"
              y="5"
              width="1"
              height="1"
              fill={getRarityGlow}
              opacity="0.9"
            />
            {!isMoss && (
              <>
                <rect
                  x="12"
                  y="9"
                  width="1"
                  height="1"
                  fill={getRarityGlow}
                  opacity="0.8"
                />
                <rect
                  x="20"
                  y="7"
                  width="1"
                  height="1"
                  fill={getRarityGlow}
                  opacity="0.8"
                />
              </>
            )}
          </motion.g>
        )}

        {/* Legendary effects */}
        {rarity === RarityLevel.LEGENDARY && (
          <motion.g>
            {/* Magical growth energy */}
            {!isMoss && (
              <motion.rect
                x="15"
                y="24"
                width="2"
                height="2"
                fill="#fbbf24"
                opacity="0.6"
                animate={{
                  opacity: [0.3, 0.8, 0.3],
                  scale: [1, 1.2, 1],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  delay: 3,
                }}
              />
            )}

            {/* Legendary sparkles */}
            {Array.from({ length: 4 }, (_, i) => {
              const positions = isMoss
                ? [
                    { x: 5, y: 24 },
                    { x: 27, y: 26 },
                    { x: 14, y: 21 },
                    { x: 18, y: 23 },
                  ]
                : [
                    { x: 5, y: 18 },
                    { x: 27, y: 20 },
                    { x: 14, y: 4 },
                    { x: 22, y: 6 },
                  ]
              const pos = positions[i]
              if (!pos) return null

              return (
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
                    repeat: Infinity,
                    delay: 3.5 + i * 0.3,
                  }}
                />
              )
            })}
          </motion.g>
        )}

        {/* Growth particles for epic/legendary */}
        {(rarity === RarityLevel.EPIC || rarity === RarityLevel.LEGENDARY) && (
          <motion.g>
            {Array.from({ length: 3 }, (_, i) => (
              <motion.rect
                key={`particle-${i}`}
                x={12 + i * 4}
                y={isMoss ? 20 : 12}
                width="1"
                height="1"
                fill={getRarityGlow}
                animate={{
                  y: [isMoss ? 20 : 12, isMoss ? 15 : 5, isMoss ? 20 : 12],
                  opacity: [0, 1, 0],
                  scale: [0.5, 1, 0.5],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  delay: 4 + i * 0.5,
                  ease: 'easeOut',
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
            background: `radial-gradient(circle, ${getRarityGlow}15 0%, transparent 70%)`,
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

function areEqual(prev: Readonly<GrassSVGProps>, next: Readonly<GrassSVGProps>) {
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

export const GrassSVG = memo(GrassSVGComponent, areEqual)
