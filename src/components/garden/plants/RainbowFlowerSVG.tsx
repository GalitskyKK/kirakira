import { motion, useReducedMotion } from 'framer-motion'
import { memo, useMemo } from 'react'
import { RarityLevel } from '@/types'

interface RainbowFlowerSVGProps {
  size?: number
  color?: string
  rarity?: RarityLevel
  isSelected?: boolean
  isHovered?: boolean
  name?: string
  isVisible?: boolean
  staticMode?: boolean
}

 

function RainbowFlowerSVGComponent({
  size = 64,
  color = '#ec4899',
  rarity = RarityLevel.EPIC,
  isSelected = false,
  isHovered: _isHovered = false,
  name: _name = 'Rainbow Flower',
  isVisible = true,
  staticMode = false,
}: RainbowFlowerSVGProps) {
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

  // Rainbow colors for petals
  const rainbowColors = [
    '#ef4444', // red
    '#f97316', // orange
    '#eab308', // yellow
    '#22c55e', // green
    '#06b6d4', // cyan
    '#3b82f6', // blue
    '#8b5cf6', // purple
    '#ec4899', // pink
  ]

  const rainbowParticles = useMemo(() => {
    if (staticMode) return []
    const count = 8 // Уменьшено с 12 до 8
    const items = [] as Array<{ key: number; left: string; top: string }>
    const pseudoRandom = (seed: number): number => {
      const x = Math.sin(seed) * 10000
      return x - Math.floor(x)
    }
    for (let i = 0; i < count; i++) {
      const left = 20 + pseudoRandom(1100 + i) * 60
      const top = 20 + pseudoRandom(1200 + i) * 60
      items.push({ key: i, left: `${left}%`, top: `${top}%` })
    }
    return items
  }, [staticMode])

  return (
    <motion.div
      className="pixel-container relative flex items-center justify-center"
      style={{ width: size, height: size, willChange: 'transform, opacity' }}
      initial={{ scale: 0, rotate: -45 }}
      animate={{
        scale: 1,
        rotate: 0,
        filter: isSelected
          ? `drop-shadow(0 0 25px ${getRarityGlow})`
          : 'none',
      }}
      whileHover={{
        scale: 1.15,
        y: -5,
        filter: `drop-shadow(0 10px 30px rgba(236, 72, 153, 0.5))`,
      }}
      transition={{
        type: 'spring',
        stiffness: 200,
        damping: 15,
      }}
    >
      {/* Rainbow particles floating */}
      {!staticMode && (
        <div className="pointer-events-none absolute inset-0">
          {rainbowParticles.map((p, i) => (
            <motion.div
              key={p.key}
              className="absolute h-1 w-1 rounded-full"
              style={{
                background: rainbowColors[i % rainbowColors.length],
                left: p.left,
                top: p.top,
              }}
              animate={{ scale: [0, 1, 0], opacity: [0, 1, 0], rotate: [0, 360], y: [0, -20, 0] }}
              transition={{ duration: 3, repeat: repeatInf, delay: i * 0.2, ease: 'easeInOut' }}
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
        {/* Rainbow shadow */}
        <motion.ellipse
          cx="16"
          cy="30"
          rx="5"
          ry="1.5"
          fill="#000000"
          opacity="0.4"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        />

        {/* Rainbow stem */}
        <motion.g
          initial={{ scaleY: 0 }}
          animate={{ scaleY: 1 }}
          transition={{ duration: 0.8, delay: 0.3 }}
        >
          {/* Main stem - объединен */}
          <path d="M15,20h2v8h-2z" fill="#22c55e" />
          <motion.path
            d="M15,20h1v8h-1z"
            fill="#4ade80"
            animate={{
              fill: ['#4ade80', '#fbbf24', '#f59e0b', '#ef4444', '#4ade80'],
            }}
            transition={{
              duration: 4,
              repeat: repeatInf,
              delay: 2,
            }}
          />
        </motion.g>

        {/* Rainbow leaves - объединены */}
        <motion.g
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.6, delay: 0.7 }}
        >
          <path d="M12,24h3v2h-3z M11,25h2v1h-2z" fill="#22c55e" />
          <motion.path
            d="M12,24h1v2h-1z"
            fill="#4ade80"
            animate={{
              fill: ['#4ade80', '#06b6d4', '#3b82f6', '#4ade80'],
            }}
            transition={{
              duration: 3,
              repeat: repeatInf,
              delay: 2.5,
            }}
          />
          <path d="M17,26h3v2h-3z M19,27h2v1h-2z" fill="#22c55e" />
          <motion.path
            d="M19,26h1v2h-1z"
            fill="#4ade80"
            animate={{
              fill: ['#4ade80', '#8b5cf6', '#ec4899', '#4ade80'],
            }}
            transition={{
              duration: 3,
              repeat: repeatInf,
              delay: 3,
            }}
          />
        </motion.g>

        {/* Rainbow flower petals - объединены */}
        <motion.g
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.8, delay: 0.9 }}
        >
          <path
            d="M14,14h4v3h-4z M15,17h2v1h-2z"
            fill="#ef4444"
          />
          <path d="M14,14h1v3h-1z" fill="#ffffff" opacity="0.6" />
          <path
            d="M14,8h4v3h-4z M15,7h2v1h-2z"
            fill="#8b5cf6"
          />
          <path d="M17,8h1v3h-1z" fill="#000000" opacity="0.2" />

          {/* Left petal - green */}
          <rect x="10" y="10" width="3" height="4" fill="#22c55e" />
          <rect x="9" y="11" width="1" height="2" fill="#22c55e" />
          <rect
            x="10"
            y="10"
            width="3"
            height="1"
            fill="#ffffff"
            opacity="0.6"
          />

          {/* Right petal - blue */}
          <rect x="19" y="10" width="3" height="4" fill="#3b82f6" />
          <rect x="22" y="11" width="1" height="2" fill="#3b82f6" />
          <rect
            x="19"
            y="13"
            width="3"
            height="1"
            fill="#000000"
            opacity="0.2"
          />
        </motion.g>

        {/* Rainbow flower center */}
        <motion.g
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.6, delay: 1.2 }}
        >
          {/* Center base */}
          <rect x="14" y="10" width="4" height="4" fill="#fbbf24" />

          {/* Center rainbow cycling */}
          <motion.rect
            x="14"
            y="10"
            width="2"
            height="2"
            fill="#ffffff"
            animate={{
              fill: rainbowColors,
            }}
            transition={{
              duration: 4,
              repeat: repeatInf,
              delay: 2,
            }}
          />

          {/* Center shadow */}
          <rect x="16" y="12" width="2" height="2" fill="#f59e0b" />

          {/* Inner rainbow details */}
          <motion.rect
            x="15"
            y="11"
            width="1"
            height="1"
            fill="#ffffff"
            animate={{
              fill: ['#ffffff', ...rainbowColors, '#ffffff'],
            }}
            transition={{
              duration: 5,
              repeat: repeatInf,
              delay: 2.5,
            }}
          />
          <rect
            x="16"
            y="12"
            width="1"
            height="1"
            fill="#ffffff"
            opacity="0.8"
          />
        </motion.g>

        {/* Rainbow shimmer effects */}
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
            transformOrigin: '16px 12px',
          }}
        >
          {Array.from({ length: 8 }, (_, i) => {
            const angle = i * 45
            const radius = 10
            const x = 16 + Math.cos((angle * Math.PI) / 180) * radius
            const y = 12 + Math.sin((angle * Math.PI) / 180) * radius

            return (
              <motion.rect
                key={`shimmer-${i}`}
                x={x}
                y={y}
                width="1"
                height="1"
                fill={rainbowColors[i]}
                animate={{
                  opacity: [0.3, 1, 0.3],
                  scale: [0.5, 1.2, 0.5],
                }}
                transition={{
                  duration: 2,
                  repeat: repeatInf,
                  delay: 1.5 + i * 0.25,
                }}
              />
            )
          })}
        </motion.g>

        {/* Rainbow petal color cycling */}
        {Array.from({ length: 4 }, (_, i) => {
          const petalPositions = [
            { x: 16, y: 15 }, // bottom
            { x: 16, y: 9 }, // top
            { x: 12, y: 12 }, // left
            { x: 20, y: 12 }, // right
          ]
          const pos = petalPositions[i]
          if (!pos) return null

          return (
            <motion.rect
              key={`rainbow-accent-${i}`}
              x={pos.x}
              y={pos.y}
              width="1"
              height="1"
              fill={rainbowColors[i * 2]}
              animate={{
                fill: rainbowColors,
                opacity: [0.5, 1, 0.5],
              }}
              transition={{
                fill: { duration: 6, repeat: repeatInf },
                opacity: { duration: 2, repeat: repeatInf },
                delay: 2 + i * 0.5,
              }}
            />
          )
        })}

        {/* Legendary rainbow effects */}
        {rarity === RarityLevel.LEGENDARY && (
          <motion.g>
            {/* Rainbow trail */}
            <motion.g
              animate={{
                rotate: [0, 360],
              }}
              transition={{
                duration: 6,
                repeat: repeatInf,
                ease: 'linear',
              }}
              style={{
                transformOrigin: '16px 12px',
              }}
            >
              {Array.from({ length: 12 }, (_, i) => {
                const angle = i * 30
                const radius = 14
                const x = 16 + Math.cos((angle * Math.PI) / 180) * radius
                const y = 12 + Math.sin((angle * Math.PI) / 180) * radius

                return (
                  <motion.rect
                    key={`rainbow-trail-${i}`}
                    x={x}
                    y={y}
                    width="1"
                    height="1"
                    fill={rainbowColors[i % rainbowColors.length]}
                    animate={{
                      opacity: [0, 1, 0],
                      scale: [0.5, 1.5, 0.5],
                    }}
                    transition={{
                      duration: 2,
                      repeat: repeatInf,
                      delay: 3 + i * 0.1,
                    }}
                  />
                )
              })}
            </motion.g>
          </motion.g>
        )}

        {/* Special rainbow sparkles */}
        {Array.from({ length: 6 }, (_, i) => {
          const positions = [
            { x: 6, y: 8 },
            { x: 26, y: 10 },
            { x: 4, y: 16 },
            { x: 28, y: 14 },
            { x: 8, y: 4 },
            { x: 24, y: 18 },
          ]
          const pos = positions[i]
          if (!pos) return null

          return (
            <motion.rect
              key={`rainbow-sparkle-${i}`}
              x={pos.x}
              y={pos.y}
              width="1"
              height="1"
              fill={rainbowColors[i]}
              animate={{
                opacity: [0, 1, 0],
                scale: [0, 1.5, 0],
                fill: [
                  rainbowColors[i],
                  rainbowColors[(i + 1) % rainbowColors.length],
                ],
              }}
              transition={{
                opacity: {
                  duration: 1.5,
                  repeat: repeatInf,
                  delay: 2.5 + i * 0.3,
                },
                scale: {
                  duration: 1.5,
                  repeat: repeatInf,
                  delay: 2.5 + i * 0.3,
                },
                fill: { duration: 4, repeat: repeatInf, delay: 3 + i * 0.2 },
              }}
            />
          )
        })}
      </motion.svg>

      {/* Rainbow magical aura */}
      <motion.div
        className="absolute inset-0 rounded-full"
        style={{
          background: `conic-gradient(from 0deg, #ef444440, #f9731640, #eab30840, #22c55e40, #06b6d440, #3b82f640, #8b5cf640, #ec489940)`,
        }}
        animate={{
          rotate: [0, 360],
          scale: [1, 1.3, 1],
          opacity: [0.4, 0.8, 0.4],
        }}
        transition={{
          rotate: { duration: 4, repeat: repeatInf, ease: 'linear' },
          scale: { duration: 2, repeat: repeatInf, ease: 'easeInOut' },
          opacity: { duration: 2, repeat: repeatInf, ease: 'easeInOut' },
        }}
      />
    </motion.div>
  )
}

function areEqual(
  prev: Readonly<RainbowFlowerSVGProps>,
  next: Readonly<RainbowFlowerSVGProps>
) {
  return (
    prev.size === next.size &&
    prev.color === next.color &&
    prev.rarity === next.rarity &&
    prev.isSelected === next.isSelected &&
    prev.isHovered === next.isHovered &&
    prev.name === next.name &&
    prev.isVisible === next.isVisible
  )
}

export const RainbowFlowerSVG = memo(RainbowFlowerSVGComponent, areEqual)
