import { motion, useReducedMotion } from 'framer-motion'
import { memo, useMemo } from 'react'
import { RarityLevel } from '@/types'

interface GlowingCrystalSVGProps {
  size?: number
  color?: string
  rarity?: RarityLevel
  isSelected?: boolean
  isHovered?: boolean
  name?: string
  isVisible?: boolean
  staticMode?: boolean
}

function areEqual(
  prev: Readonly<GlowingCrystalSVGProps>,
  next: Readonly<GlowingCrystalSVGProps>
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

export const GlowingCrystalSVG = memo(GlowingCrystalSVGComponent, areEqual)

function GlowingCrystalSVGComponent({
  size = 64,
  color = '#06b6d4',
  rarity = RarityLevel.EPIC,
  isSelected = false,
  isHovered: _isHovered = false,
  name: _name = 'Glowing Crystal',
  isVisible = true,
  staticMode = false,
}: GlowingCrystalSVGProps) {
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

  const pseudoRandom = (seed: number): number => {
    const x = Math.sin(seed) * 10000
    return x - Math.floor(x)
  }
  const energyParticles = useMemo(() => {
    const count = 15
    const items = [] as Array<{ key: number; left: string; top: string; dx: number }>
    for (let i = 0; i < count; i++) {
      const left = 25 + pseudoRandom(1300 + i) * 50
      const top = 15 + pseudoRandom(1400 + i) * 70
      const dx = (pseudoRandom(1500 + i) - 0.5) * 50
      items.push({ key: i, left: `${left}%`, top: `${top}%`, dx })
    }
    return items
  }, [])

  return (
    <motion.div
      className="pixel-container relative flex items-center justify-center"
      style={{ width: size, height: size, willChange: 'transform, opacity' }}
      initial={{ scale: 0, rotate: -180, opacity: 0 }}
      animate={{
        scale: 1,
        rotate: 0,
        opacity: 1,
        filter: isSelected
          ? `drop-shadow(0 0 30px ${getRarityGlow})`
          : 'none',
      }}
      whileHover={{
        scale: 1.2,
        y: -5,
        filter: `drop-shadow(0 15px 35px ${color}80) brightness(1.3)`,
      }}
      transition={{
        type: 'spring',
        stiffness: 200,
        damping: 15,
      }}
    >
      {/* Intense energy particles */}
      {!staticMode && (
        <div className="pointer-events-none absolute inset-0">
          {energyParticles.map((p, i) => (
            <motion.div
              key={p.key}
              className="absolute h-1 w-1 rounded-full"
              style={{ background: color, left: p.left, top: p.top }}
              animate={{ y: [0, -40, 0], x: [0, p.dx, 0], opacity: [0, 1, 0], scale: [0.5, 2, 0.5] }}
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
        {/* Glowing base energy field */}
        <motion.ellipse
          cx="16"
          cy="29"
          rx="8"
          ry="2"
          fill={color}
          opacity="0.6"
          initial={{ scaleX: 0 }}
          animate={{
            scaleX: [1, 1.3, 1],
            opacity: [0.4, 0.8, 0.4],
          }}
          transition={{
            scaleX: { duration: 0.8, delay: 0.5 },
            opacity: { duration: 2, repeat: repeatInf },
          }}
        />

        {/* Main crystal body - enhanced with glow */}
        <motion.g
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 1.2, delay: 0.2 }}
        >
          {/* Crystal main body (enhanced diamond shape) */}
          <rect x="10" y="12" width="12" height="12" fill={color} />

          {/* Crystal top sections with intense glow */}
          <rect x="12" y="8" width="8" height="4" fill={color} />
          <rect x="14" y="6" width="4" height="2" fill={color} />
          <rect x="15" y="4" width="2" height="2" fill="#ffffff" />
          <rect x="15" y="2" width="2" height="2" fill="#ffffff" />

          {/* Crystal bottom point with glow */}
          <rect x="14" y="24" width="4" height="2" fill={color} />
          <rect x="15" y="26" width="2" height="2" fill={color} />
          <rect x="15" y="28" width="2" height="1" fill={color} />

          {/* Left facet - intense highlight */}
          <rect
            x="10"
            y="12"
            width="6"
            height="12"
            fill="#ffffff"
            opacity="0.7"
          />
          <rect
            x="12"
            y="8"
            width="4"
            height="4"
            fill="#ffffff"
            opacity="0.8"
          />
          <rect
            x="14"
            y="6"
            width="2"
            height="2"
            fill="#ffffff"
            opacity="0.9"
          />
          <rect x="15" y="4" width="1" height="2" fill="#ffffff" />
          <rect x="15" y="2" width="1" height="2" fill="#ffffff" />

          {/* Right facet - deep shadow */}
          <rect
            x="16"
            y="12"
            width="6"
            height="12"
            fill="#000000"
            opacity="0.4"
          />
          <rect
            x="16"
            y="8"
            width="4"
            height="4"
            fill="#000000"
            opacity="0.3"
          />
          <rect
            x="16"
            y="6"
            width="2"
            height="2"
            fill="#000000"
            opacity="0.2"
          />

          {/* Bottom facet highlights */}
          <rect
            x="14"
            y="24"
            width="2"
            height="2"
            fill="#ffffff"
            opacity="0.6"
          />
          <rect
            x="16"
            y="24"
            width="2"
            height="2"
            fill="#000000"
            opacity="0.3"
          />
          <rect
            x="15"
            y="26"
            width="1"
            height="2"
            fill="#ffffff"
            opacity="0.5"
          />
          <rect
            x="16"
            y="26"
            width="1"
            height="2"
            fill="#000000"
            opacity="0.25"
          />
        </motion.g>

        {/* Enhanced crystal inner facets */}
        <motion.g
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.8 }}
        >
          {/* Glowing inner facet lines */}
          <rect
            x="12"
            y="10"
            width="8"
            height="1"
            fill="#ffffff"
            opacity="0.9"
          />
          <rect
            x="11"
            y="14"
            width="10"
            height="1"
            fill={color}
            opacity="0.8"
          />
          <rect
            x="12"
            y="18"
            width="8"
            height="1"
            fill="#ffffff"
            opacity="0.7"
          />
          <rect
            x="11"
            y="22"
            width="10"
            height="1"
            fill={color}
            opacity="0.6"
          />

          {/* Vertical energy lines */}
          <rect
            x="15"
            y="8"
            width="1"
            height="16"
            fill="#ffffff"
            opacity="0.5"
          />
          <rect x="16" y="8" width="1" height="16" fill={color} opacity="0.3" />

          {/* Cross energy pattern */}
          <rect
            x="13"
            y="15"
            width="6"
            height="1"
            fill="#ffffff"
            opacity="0.6"
          />
          <rect
            x="15"
            y="13"
            width="1"
            height="6"
            fill="#ffffff"
            opacity="0.6"
          />
        </motion.g>

        {/* Pulsing energy core - much more intense */}
        <motion.g
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.6, delay: 1.6 }}
        >
          {/* Main energy core */}
          <motion.rect
            x="14"
            y="15"
            width="4"
            height="6"
            fill="#ffffff"
            opacity="0.9"
            animate={{
              opacity: [0.6, 1, 0.6],
              scaleY: [1, 1.2, 1],
              scaleX: [1, 1.1, 1],
            }}
            transition={{
              duration: 1.5,
              repeat: repeatInf,
              ease: 'easeInOut',
            }}
          />

          {/* Intense inner glow pixels */}
          <rect
            x="13"
            y="16"
            width="1"
            height="1"
            fill="#ffffff"
            opacity="0.8"
          />
          <rect
            x="18"
            y="16"
            width="1"
            height="1"
            fill="#ffffff"
            opacity="0.8"
          />
          <rect
            x="15"
            y="14"
            width="2"
            height="1"
            fill="#ffffff"
            opacity="0.9"
          />
          <rect
            x="15"
            y="21"
            width="2"
            height="1"
            fill="#ffffff"
            opacity="0.9"
          />

          {/* Energy burst center */}
          <motion.rect
            x="15"
            y="17"
            width="2"
            height="2"
            fill="#ffffff"
            animate={{
              opacity: [0.8, 1, 0.8],
              scale: [1, 1.5, 1],
            }}
            transition={{
              duration: 1,
              repeat: repeatInf,
              ease: 'easeInOut',
            }}
          />
        </motion.g>

        {/* Intense magical rune effects */}
        <motion.g
          animate={{
            opacity: [0.6, 1, 0.6],
          }}
          transition={{
            duration: 2,
            repeat: repeatInf,
            delay: 2,
          }}
        >
          {/* Glowing magical rune pixels */}
          <rect
            x="11"
            y="9"
            width="1"
            height="1"
            fill={getRarityGlow}
            opacity="1"
          />
          <rect
            x="20"
            y="11"
            width="1"
            height="1"
            fill={getRarityGlow}
            opacity="1"
          />
          <rect
            x="9"
            y="17"
            width="1"
            height="1"
            fill={getRarityGlow}
            opacity="1"
          />
          <rect
            x="22"
            y="19"
            width="1"
            height="1"
            fill={getRarityGlow}
            opacity="1"
          />
          <rect
            x="16"
            y="25"
            width="1"
            height="1"
            fill={getRarityGlow}
            opacity="1"
          />

          {/* Additional energy points */}
          <rect
            x="8"
            y="14"
            width="1"
            height="1"
            fill="#ffffff"
            opacity="0.9"
          />
          <rect
            x="23"
            y="16"
            width="1"
            height="1"
            fill="#ffffff"
            opacity="0.9"
          />
          <rect
            x="13"
            y="3"
            width="1"
            height="1"
            fill="#ffffff"
            opacity="0.9"
          />
          <rect
            x="18"
            y="1"
            width="1"
            height="1"
            fill="#ffffff"
            opacity="0.9"
          />
        </motion.g>

        {/* Magical energy orbiting particles */}
        <motion.g
          animate={{
            rotate: [0, 360],
          }}
          transition={{
            duration: 4,
            repeat: repeatInf,
            ease: 'linear',
          }}
          style={{
            transformOrigin: '16px 16px',
          }}
        >
          {Array.from({ length: 8 }, (_, i) => {
            const positions = [
              { x: 6, y: 12 },
              { x: 26, y: 12 },
              { x: 6, y: 20 },
              { x: 26, y: 20 },
              { x: 12, y: 6 },
              { x: 20, y: 6 },
              { x: 12, y: 26 },
              { x: 20, y: 26 },
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
                  opacity: [0.4, 1, 0.4],
                  scale: [0.5, 1.5, 0.5],
                }}
                transition={{
                  duration: 2,
                  repeat: repeatInf,
                  delay: 2.5 + i * 0.3,
                }}
              />
            )
          })}
        </motion.g>

        {/* Legendary effects */}
        {rarity === RarityLevel.LEGENDARY && (
          <motion.g>
            {/* Intense energy waves */}
            <motion.rect
              x="6"
              y="6"
              width="20"
              height="20"
              fill="none"
            stroke={getRarityGlow}
              strokeWidth="1"
              opacity="0.6"
              strokeDasharray="2,1"
              animate={{
                scale: [1, 1.4, 1],
                opacity: [0.6, 0.2, 0.6],
              }}
              transition={{
                duration: 3,
                repeat: repeatInf,
                delay: 3,
              }}
            />

            {/* Legendary power sparkles */}
            {Array.from({ length: 12 }, (_, i) => {
              const sparklePositions = [
                { x: 2, y: 8 },
                { x: 30, y: 10 },
                { x: 4, y: 24 },
                { x: 28, y: 22 },
                { x: 16, y: 0 },
                { x: 8, y: 2 },
                { x: 24, y: 30 },
                { x: 12, y: 30 },
                { x: 0, y: 16 },
                { x: 31, y: 16 },
                { x: 6, y: 4 },
                { x: 26, y: 28 },
              ]
              const pos = sparklePositions[i]
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
                    scale: [0, 2, 0],
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: repeatInf,
                    delay: 3.5 + i * 0.2,
                  }}
                />
              )
            })}
          </motion.g>
        )}

        {/* Reflection highlights - more intense */}
        <motion.g
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 2 }}
        >
          {/* Sharp intense highlights */}
          <rect x="13" y="7" width="1" height="3" fill="#ffffff" />
          <rect
            x="11"
            y="13"
            width="1"
            height="2"
            fill="#ffffff"
            opacity="0.9"
          />
          <rect
            x="9"
            y="20"
            width="1"
            height="2"
            fill="#ffffff"
            opacity="0.8"
          />

          {/* Moving energy reflection */}
          <motion.rect
            x="15"
            y="10"
            width="1"
            height="12"
            fill="#ffffff"
            opacity="0.8"
            animate={{
              opacity: [0, 1, 0],
              x: [15, 17, 15],
              scaleY: [1, 1.2, 1],
            }}
            transition={{
              duration: 2,
              repeat: repeatInf,
              delay: 3,
              ease: 'easeInOut',
            }}
          />

          {/* Cross reflection pattern */}
          <motion.rect
            x="12"
            y="17"
            width="8"
            height="1"
            fill="#ffffff"
            opacity="0.6"
            animate={{
              opacity: [0.3, 0.8, 0.3],
              scaleX: [1, 1.2, 1],
            }}
            transition={{
              duration: 2.5,
              repeat: repeatInf,
              delay: 3.5,
            }}
          />
        </motion.g>
      </motion.svg>

      {/* Intense magical aura */}
      <motion.div
        className="absolute inset-0 rounded-full"
        style={{
          background: `conic-gradient(from 0deg, ${getRarityGlow}40, transparent, ${color}40, transparent, ${getRarityGlow}40)`,
        }}
        animate={{
          rotate: [0, 360],
          scale: [1, 1.3, 1],
          opacity: [0.4, 0.8, 0.4],
        }}
        transition={{
          rotate: { duration: 6, repeat: repeatInf, ease: 'linear' },
          scale: { duration: 2, repeat: repeatInf, ease: 'easeInOut' },
          opacity: { duration: 2, repeat: repeatInf, ease: 'easeInOut' },
        }}
      />
    </motion.div>
  )
}
