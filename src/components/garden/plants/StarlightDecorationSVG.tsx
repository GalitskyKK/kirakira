import { motion, useReducedMotion } from 'framer-motion'
import { memo, useMemo } from 'react'
import { RarityLevel } from '@/types'

interface StarlightDecorationSVGProps {
  size?: number
  color?: string
  rarity?: RarityLevel
  isSelected?: boolean
  isHovered?: boolean
  name?: string
  isVisible?: boolean
  staticMode?: boolean
}

function StarlightDecorationSVGComponent({
  size = 64,
  color = '#fbbf24',
  rarity = RarityLevel.EPIC,
  isSelected = false,
  isHovered: _isHovered = false,
  name: _name = 'Starlight Decoration',
  isVisible = true,
  staticMode = false,
}: StarlightDecorationSVGProps) {
  const prefersReducedMotion = useReducedMotion()
  const repeatInf =
    isVisible && !prefersReducedMotion && !staticMode ? Infinity : 0

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

  const pseudoRandom = (seed: number): number => {
    const x = Math.sin(seed) * 10000
    return x - Math.floor(x)
  }
  const starlightParticles = useMemo(() => {
    if (staticMode) return []
    const count = 8 // Уменьшено с 16 до 8
    const items = [] as Array<{
      key: number
      left: string
      top: string
      dx: number
    }>
    const pseudoRandom = (seed: number): number => {
      const x = Math.sin(seed) * 10000
      return x - Math.floor(x)
    }
    for (let i = 0; i < count; i++) {
      const left = 20 + pseudoRandom(2000 + i) * 60
      const top = 10 + pseudoRandom(2100 + i) * 80
      const dx = (pseudoRandom(2200 + i) - 0.5) * 40
      items.push({ key: i, left: `${left}%`, top: `${top}%`, dx })
    }
    return items
  }, [staticMode])

  const twinkleTimings = useMemo(() => {
    const count = 10
    const items = [] as Array<{ dur: number; delay: number }>
    for (let i = 0; i < count; i++) {
      const dur = 1 + pseudoRandom(2300 + i) * 2 // 1..3
      const delay = 2 + pseudoRandom(2400 + i) * 3 // 2..5
      items.push({ dur, delay })
    }
    return items
  }, [])

  return (
    <motion.div
      className="pixel-container relative flex items-center justify-center"
      style={{ width: size, height: size, willChange: 'transform, opacity' }}
      initial={{ scale: 0, opacity: 0, rotate: -90 }}
      animate={{
        scale: 1,
        opacity: 1,
        rotate: 0,
        filter: isSelected ? `drop-shadow(0 0 30px ${getRarityGlow})` : 'none',
      }}
      whileHover={{
        scale: 1.2,
        y: -3,
        filter: `drop-shadow(0 15px 35px ${color}80) brightness(1.4)`,
      }}
      transition={{
        type: 'spring',
        stiffness: 250,
        damping: 15,
      }}
    >
      {/* Starlight particles */}
      {!staticMode && (
        <div className="pointer-events-none absolute inset-0">
          {starlightParticles.map((p, i) => (
            <motion.div
              key={p.key}
              className="absolute h-1 w-1 rounded-full bg-yellow-300"
              style={{ left: p.left, top: p.top }}
              animate={{
                y: [0, -30, 0],
                x: [0, p.dx, 0],
                opacity: [0, 1, 0],
                scale: [0.5, 1.5, 0.5],
                rotate: [0, 360],
              }}
              transition={{
                duration: 4,
                repeat: repeatInf,
                delay: i * 0.2,
                ease: 'easeInOut',
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
        {/* Starlight base glow */}
        <motion.ellipse
          cx="16"
          cy="30"
          rx="6"
          ry="2"
          fill="#fbbf24"
          opacity="0.5"
          initial={{ scaleX: 0 }}
          animate={{
            scaleX: [1, 1.4, 1],
            opacity: [0.3, 0.7, 0.3],
          }}
          transition={{
            scaleX: { duration: 0.8, delay: 0.3 },
            opacity: { duration: 2.5, repeat: repeatInf },
          }}
        />

        {/* Central star body - main decoration */}
        <motion.g
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 1.0, delay: 0.5 }}
        >
          {/* Main star center */}
          <rect x="14" y="14" width="4" height="4" fill="#fbbf24" />
          <rect x="15" y="15" width="2" height="2" fill="#ffffff" />

          {/* Star points - top */}
          <rect x="15" y="10" width="2" height="4" fill="#fbbf24" />
          <rect x="16" y="8" width="1" height="2" fill="#fbbf24" />
          <rect x="16" y="6" width="1" height="2" fill="#ffffff" />

          {/* Star points - bottom */}
          <rect x="15" y="18" width="2" height="4" fill="#fbbf24" />
          <rect x="16" y="22" width="1" height="2" fill="#fbbf24" />
          <rect x="16" y="24" width="1" height="2" fill="#f59e0b" />

          {/* Star points - left */}
          <rect x="10" y="15" width="4" height="2" fill="#fbbf24" />
          <rect x="8" y="16" width="2" height="1" fill="#fbbf24" />
          <rect x="6" y="16" width="2" height="1" fill="#ffffff" />

          {/* Star points - right */}
          <rect x="18" y="15" width="4" height="2" fill="#fbbf24" />
          <rect x="22" y="16" width="2" height="1" fill="#fbbf24" />
          <rect x="24" y="16" width="2" height="1" fill="#ffffff" />

          {/* Diagonal star points */}
          <rect x="12" y="12" width="2" height="2" fill="#f59e0b" />
          <rect x="18" y="12" width="2" height="2" fill="#f59e0b" />
          <rect x="12" y="18" width="2" height="2" fill="#f59e0b" />
          <rect x="18" y="18" width="2" height="2" fill="#f59e0b" />

          {/* Inner highlights */}
          <rect
            x="12"
            y="12"
            width="1"
            height="2"
            fill="#ffffff"
            opacity="0.8"
          />
          <rect
            x="19"
            y="12"
            width="1"
            height="2"
            fill="#ffffff"
            opacity="0.8"
          />
          <rect
            x="12"
            y="19"
            width="1"
            height="1"
            fill="#ffffff"
            opacity="0.8"
          />
          <rect
            x="19"
            y="19"
            width="1"
            height="1"
            fill="#ffffff"
            opacity="0.8"
          />
        </motion.g>

        {/* Pulsing star core */}
        <motion.g
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.6, delay: 1.0 }}
        >
          <motion.rect
            x="15"
            y="15"
            width="2"
            height="2"
            fill="#ffffff"
            animate={{
              opacity: [0.8, 1, 0.8],
              scale: [1, 1.3, 1],
            }}
            transition={{
              duration: 1.5,
              repeat: repeatInf,
              ease: 'easeInOut',
            }}
          />
        </motion.g>

        {/* Orbiting starlight pixels */}
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
            transformOrigin: '16px 16px',
          }}
        >
          {Array.from({ length: 8 }, (_, i) => {
            const angle = i * 45
            const radius = 12
            const x = 16 + Math.cos((angle * Math.PI) / 180) * radius
            const y = 16 + Math.sin((angle * Math.PI) / 180) * radius

            return (
              <motion.rect
                key={`orbit-${i}`}
                x={x}
                y={y}
                width="1"
                height="1"
                fill="#ffffff"
                animate={{
                  opacity: [0.4, 1, 0.4],
                  scale: [0.5, 1.5, 0.5],
                }}
                transition={{
                  duration: 2,
                  repeat: repeatInf,
                  delay: 1.5 + i * 0.2,
                }}
              />
            )
          })}
        </motion.g>

        {/* Magical constellation */}
        <motion.g
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 1.5 }}
        >
          {/* Small stars around main star */}
          <rect x="8" y="8" width="1" height="1" fill="#fbbf24" />
          <rect x="24" y="8" width="1" height="1" fill="#f59e0b" />
          <rect x="8" y="24" width="1" height="1" fill="#f59e0b" />
          <rect x="24" y="24" width="1" height="1" fill="#fbbf24" />

          {/* Connecting constellation lines */}
          <motion.g
            animate={{
              opacity: [0.3, 0.8, 0.3],
            }}
            transition={{
              duration: 3,
              repeat: repeatInf,
              delay: 2,
            }}
          >
            <rect
              x="9"
              y="8"
              width="6"
              height="1"
              fill="#f59e0b"
              opacity="0.5"
            />
            <rect
              x="8"
              y="9"
              width="1"
              height="6"
              fill="#f59e0b"
              opacity="0.5"
            />
            <rect
              x="17"
              y="8"
              width="6"
              height="1"
              fill="#f59e0b"
              opacity="0.5"
            />
            <rect
              x="24"
              y="9"
              width="1"
              height="6"
              fill="#f59e0b"
              opacity="0.5"
            />
          </motion.g>
        </motion.g>

        {/* Energy bursts */}
        <motion.g
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.6, 1, 0.6],
          }}
          transition={{
            duration: 2,
            repeat: repeatInf,
            delay: 2.5,
          }}
        >
          {/* Cross energy pattern */}
          <rect
            x="16"
            y="4"
            width="1"
            height="8"
            fill="#ffffff"
            opacity="0.8"
          />
          <rect
            x="16"
            y="20"
            width="1"
            height="8"
            fill="#ffffff"
            opacity="0.8"
          />
          <rect
            x="4"
            y="16"
            width="8"
            height="1"
            fill="#ffffff"
            opacity="0.8"
          />
          <rect
            x="20"
            y="16"
            width="8"
            height="1"
            fill="#ffffff"
            opacity="0.8"
          />

          {/* Diagonal energy lines */}
          <rect x="10" y="10" width="1" height="1" fill="#fbbf24" />
          <rect x="11" y="11" width="1" height="1" fill="#fbbf24" />
          <rect x="21" y="10" width="1" height="1" fill="#fbbf24" />
          <rect x="20" y="11" width="1" height="1" fill="#fbbf24" />
          <rect x="10" y="21" width="1" height="1" fill="#fbbf24" />
          <rect x="11" y="20" width="1" height="1" fill="#fbbf24" />
          <rect x="21" y="21" width="1" height="1" fill="#fbbf24" />
          <rect x="20" y="20" width="1" height="1" fill="#fbbf24" />
        </motion.g>

        {/* Legendary stellar effects */}
        {rarity === RarityLevel.LEGENDARY && (
          <motion.g>
            {/* Supernova ring */}
            <motion.rect
              x="4"
              y="4"
              width="24"
              height="24"
              fill="none"
              stroke="#ffffff"
              strokeWidth="1"
              opacity="0.6"
              strokeDasharray="2,1"
              animate={{
                scale: [1, 1.5, 1],
                opacity: [0.6, 0.2, 0.6],
                rotate: [0, 360],
              }}
              transition={{
                duration: 4,
                repeat: repeatInf,
                delay: 3,
              }}
            />

            {/* Stellar explosion particles */}
            {Array.from({ length: 12 }, (_, i) => {
              const positions = [
                { x: 2, y: 6 },
                { x: 30, y: 8 },
                { x: 4, y: 26 },
                { x: 28, y: 24 },
                { x: 16, y: 2 },
                { x: 6, y: 30 },
                { x: 26, y: 2 },
                { x: 16, y: 30 },
                { x: 0, y: 16 },
                { x: 31, y: 16 },
                { x: 8, y: 0 },
                { x: 24, y: 31 },
              ]
              const pos = positions[i]
              if (!pos) return null

              return (
                <motion.rect
                  key={`stellar-${i}`}
                  x={pos.x}
                  y={pos.y}
                  width="1"
                  height="1"
                  fill="#ffffff"
                  animate={{
                    opacity: [0, 1, 0],
                    scale: [0, 2, 0],
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: repeatInf,
                    delay: 3.5 + i * 0.15,
                  }}
                />
              )
            })}
          </motion.g>
        )}

        {/* Twinkling effect pixels */}
        <motion.g>
          {Array.from({ length: 10 }, (_, i) => {
            const twinklePositions = [
              { x: 5, y: 12 },
              { x: 27, y: 14 },
              { x: 7, y: 20 },
              { x: 25, y: 18 },
              { x: 12, y: 5 },
              { x: 20, y: 27 },
              { x: 3, y: 22 },
              { x: 29, y: 10 },
              { x: 14, y: 3 },
              { x: 18, y: 29 },
            ]
            const pos = twinklePositions[i]
            if (!pos) return null
            const timing = twinkleTimings[i]

            return (
              <motion.rect
                key={`twinkle-${i}`}
                x={pos.x}
                y={pos.y}
                width="1"
                height="1"
                fill="#ffffff"
                animate={{
                  opacity: [0, 1, 0],
                  scale: [0.5, 1.2, 0.5],
                }}
                transition={{
                  duration: timing?.dur ?? 2,
                  repeat: repeatInf,
                  delay: timing?.delay ?? 2,
                  ease: 'easeInOut',
                }}
              />
            )
          })}
        </motion.g>

        {/* Central star shimmer */}
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
          <motion.rect
            x="15"
            y="14"
            width="2"
            height="1"
            fill="#ffffff"
            opacity="0.9"
            animate={{
              opacity: [0.5, 1, 0.5],
              scaleX: [1, 1.5, 1],
            }}
            transition={{
              duration: 2,
              repeat: repeatInf,
              delay: 3,
            }}
          />
          <motion.rect
            x="16"
            y="15"
            width="1"
            height="2"
            fill="#ffffff"
            opacity="0.9"
            animate={{
              opacity: [0.5, 1, 0.5],
              scaleY: [1, 1.5, 1],
            }}
            transition={{
              duration: 2,
              repeat: repeatInf,
              delay: 3.2,
            }}
          />
        </motion.g>
      </motion.svg>

      {/* Starlight magical aura */}
      <motion.div
        className="absolute inset-0 rounded-full"
        style={{
          background: `radial-gradient(circle, ${getRarityGlow}30, transparent 70%)`,
        }}
        animate={{
          scale: [1, 1.4, 1],
          opacity: [0.3, 0.7, 0.3],
        }}
        transition={{
          duration: 3,
          repeat: repeatInf,
          ease: 'easeInOut',
        }}
      />
    </motion.div>
  )
}

function areEqual(
  prev: Readonly<StarlightDecorationSVGProps>,
  next: Readonly<StarlightDecorationSVGProps>
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

export const StarlightDecorationSVG = memo(
  StarlightDecorationSVGComponent,
  areEqual
)
