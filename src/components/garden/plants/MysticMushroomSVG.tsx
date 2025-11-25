import { motion, useReducedMotion } from 'framer-motion'
import { memo, useMemo } from 'react'
import { RarityLevel } from '@/types'

interface MysticMushroomSVGProps {
  size?: number
  color?: string
  rarity?: RarityLevel
  isSelected?: boolean
  isHovered?: boolean
  name?: string
  isVisible?: boolean
  staticMode?: boolean
}

function MysticMushroomSVGComponent({
  size = 64,
  color = '#8b5cf6',
  rarity = RarityLevel.EPIC,
  isSelected = false,
  isHovered: _isHovered = false,
  name: _name = 'Mystic Mushroom',
  isVisible = true,
  staticMode = false,
}: MysticMushroomSVGProps) {
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

  const spores = useMemo(() => {
    if (staticMode) return []
    const count = 6 // Уменьшено с 12 до 6
    const items = [] as Array<{ key: number; left: string; top: string; dx: number }>
    const pseudoRandom = (seed: number): number => {
      const x = Math.sin(seed) * 10000
      return x - Math.floor(x)
    }
    for (let i = 0; i < count; i++) {
      const left = 15 + pseudoRandom(1600 + i) * 70
      const top = 20 + pseudoRandom(1700 + i) * 60
      const dx = (pseudoRandom(1800 + i) - 0.5) * 40
      items.push({ key: i, left: `${left}%`, top: `${top}%`, dx })
    }
    return items
  }, [staticMode])

  return (
    <motion.div
      className="pixel-container relative flex items-center justify-center"
      style={{ width: size, height: size, willChange: 'transform, opacity' }}
      initial={{ scale: 0, y: 10 }}
      animate={{
        scale: 1,
        y: 0,
        filter: isSelected
          ? `drop-shadow(0 0 25px ${getRarityGlow})`
          : 'none',
      }}
      whileHover={{
        scale: 1.15,
        y: -3,
      }}
      transition={{
        type: 'spring',
        stiffness: 300,
        damping: 20,
      }}
    >
      {/* Mystical spores floating around */}
      {!staticMode && (
        <div className="pointer-events-none absolute inset-0">
          {spores.map((s, i) => (
            <motion.div
              key={s.key}
              className="absolute h-1 w-1 rounded-full bg-purple-300"
              style={{ left: s.left, top: s.top }}
              animate={{ y: [0, -50, 0], x: [0, s.dx, 0], opacity: [0, 1, 0], scale: [0, 1.2, 0] }}
              transition={{ duration: 4, repeat: repeatInf, delay: i * 0.3, ease: 'easeOut' }}
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
        {/* Mystical aura ground */}
        <motion.ellipse
          cx="16"
          cy="30"
          rx="7"
          ry="2"
          fill="#8b5cf6"
          opacity="0.4"
          initial={{ scaleX: 0 }}
          animate={{
            scaleX: [1, 1.2, 1],
            opacity: [0.4, 0.6, 0.4],
          }}
          transition={{
            scaleX: { duration: 0.6, delay: 0.2 },
            opacity: { duration: 2, repeat: repeatInf },
          }}
        />

        {/* Mystical energy around base */}
        <motion.g
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.4 }}
        >
          <rect
            x="10"
            y="28"
            width="3"
            height="2"
            fill="#8b5cf6"
            opacity="0.7"
          />
          <rect
            x="19"
            y="29"
            width="4"
            height="2"
            fill="#a855f7"
            opacity="0.6"
          />
          <rect
            x="12"
            y="29"
            width="2"
            height="1"
            fill="#c084fc"
            opacity="0.8"
          />
          <rect
            x="7"
            y="26"
            width="2"
            height="1"
            fill="#8b5cf6"
            opacity="0.5"
          />
          <rect
            x="23"
            y="27"
            width="2"
            height="1"
            fill="#a855f7"
            opacity="0.6"
          />
        </motion.g>

        {/* Mystical stem with runes */}
        <motion.g
          initial={{ scaleY: 0 }}
          animate={{ scaleY: 1 }}
          transition={{ duration: 0.8, delay: 0.5 }}
        >
          {/* Main stem body */}
          <rect x="14" y="18" width="4" height="10" fill="#e2e8f0" />

          {/* Stem mystical glow */}
          <rect x="14" y="18" width="2" height="10" fill="#f1f5f9" />
          <rect x="16" y="18" width="2" height="10" fill="#cbd5e1" />

          {/* Magical runes on stem */}
          <motion.g
            animate={{
              opacity: [0.5, 1, 0.5],
            }}
            transition={{
              duration: 3,
              repeat: repeatInf,
              delay: 1,
            }}
          >
            <rect
              x="15"
              y="22"
              width="2"
              height="1"
              fill="#8b5cf6"
              opacity="0.8"
            />
            <rect
              x="15"
              y="25"
              width="2"
              height="1"
              fill="#a855f7"
              opacity="0.9"
            />
            <rect
              x="16"
              y="20"
              width="1"
              height="1"
              fill="#c084fc"
              opacity="0.7"
            />
          </motion.g>
        </motion.g>

        {/* Mystical cap with cosmic patterns */}
        <motion.g
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.8, delay: 1.0 }}
        >
          {/* Cap main body - cosmic purple */}
          <rect x="6" y="12" width="20" height="6" fill="#7c3aed" />

          {/* Cap rounded edges */}
          <rect x="8" y="10" width="16" height="2" fill="#7c3aed" />
          <rect x="10" y="8" width="12" height="2" fill="#8b5cf6" />
          <rect x="12" y="6" width="8" height="2" fill="#a855f7" />

          {/* Cap mystical highlight (left side) */}
          <rect
            x="6"
            y="12"
            width="8"
            height="3"
            fill="#c084fc"
            opacity="0.6"
          />
          <rect
            x="8"
            y="10"
            width="6"
            height="2"
            fill="#c084fc"
            opacity="0.7"
          />
          <rect
            x="10"
            y="8"
            width="4"
            height="2"
            fill="#ddd6fe"
            opacity="0.8"
          />
          <rect
            x="12"
            y="6"
            width="3"
            height="2"
            fill="#ede9fe"
            opacity="0.9"
          />

          {/* Cap shadow (right side) */}
          <rect
            x="18"
            y="15"
            width="8"
            height="3"
            fill="#581c87"
            opacity="0.7"
          />
          <rect
            x="18"
            y="10"
            width="6"
            height="5"
            fill="#6b21a8"
            opacity="0.5"
          />
          <rect
            x="17"
            y="8"
            width="5"
            height="2"
            fill="#7c2d92"
            opacity="0.4"
          />
        </motion.g>

        {/* Mystical spots - constellation pattern */}
        <motion.g
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.6, delay: 1.2 }}
        >
          {/* Large mystical spots */}
          <rect
            x="10"
            y="10"
            width="2"
            height="2"
            fill="#fbbf24"
            opacity="0.9"
          />
          <rect
            x="20"
            y="12"
            width="2"
            height="2"
            fill="#fbbf24"
            opacity="0.9"
          />
          <rect
            x="8"
            y="14"
            width="2"
            height="2"
            fill="#fbbf24"
            opacity="0.9"
          />
          <rect
            x="22"
            y="16"
            width="2"
            height="2"
            fill="#fbbf24"
            opacity="0.9"
          />

          {/* Small star spots */}
          <rect
            x="14"
            y="9"
            width="1"
            height="1"
            fill="#ffffff"
            opacity="0.9"
          />
          <rect
            x="24"
            y="14"
            width="1"
            height="1"
            fill="#ffffff"
            opacity="0.9"
          />
          <rect
            x="7"
            y="16"
            width="1"
            height="1"
            fill="#ffffff"
            opacity="0.9"
          />
          <rect
            x="17"
            y="15"
            width="1"
            height="1"
            fill="#ffffff"
            opacity="0.9"
          />
          <rect
            x="19"
            y="9"
            width="1"
            height="1"
            fill="#ffffff"
            opacity="0.9"
          />

          {/* Constellation connecting lines */}
          <motion.g
            animate={{
              opacity: [0.3, 0.8, 0.3],
            }}
            transition={{
              duration: 4,
              repeat: repeatInf,
              delay: 2,
            }}
          >
            <rect
              x="11"
              y="11"
              width="8"
              height="1"
              fill="#fbbf24"
              opacity="0.4"
            />
            <rect
              x="9"
              y="13"
              width="1"
              height="3"
              fill="#fbbf24"
              opacity="0.4"
            />
            <rect
              x="21"
              y="13"
              width="1"
              height="3"
              fill="#fbbf24"
              opacity="0.4"
            />
          </motion.g>
        </motion.g>

        {/* Mystical cap underside with energy */}
        <motion.g
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.6, delay: 0.8 }}
        >
          {/* Cap underside glow */}
          <ellipse
            cx="16"
            cy="18"
            rx="10"
            ry="2"
            fill="#a855f7"
            opacity="0.8"
          />

          {/* Mystical gills (energy lines) */}
          {Array.from({ length: 10 }, (_, i) => (
            <motion.rect
              key={i}
              x={8 + i * 2}
              y="18"
              width="1"
              height="1"
              fill="#c084fc"
              opacity="0.6"
              animate={{
                opacity: [0.3, 0.8, 0.3],
              }}
              transition={{
                duration: 2,
                repeat: repeatInf,
                delay: i * 0.1,
              }}
            />
          ))}
        </motion.g>

        {/* Pulsing mystical energy in cap */}
        <motion.g
          animate={{
            opacity: [0.4, 1, 0.4],
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 2,
            repeat: repeatInf,
            delay: 2,
          }}
        >
          <rect
            x="14"
            y="12"
            width="4"
            height="4"
            fill="#fbbf24"
            opacity="0.6"
          />
          <rect
            x="15"
            y="13"
            width="2"
            height="2"
            fill="#ffffff"
            opacity="0.8"
          />
        </motion.g>

        {/* Mystical aura particles */}
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
          {Array.from({ length: 6 }, (_, i) => {
            const angle = i * 60
            const radius = 14
            const x = 16 + Math.cos((angle * Math.PI) / 180) * radius
            const y = 16 + Math.sin((angle * Math.PI) / 180) * radius

            return (
              <motion.rect
                key={`aura-${i}`}
                x={x}
                y={y}
                width="1"
                height="1"
                fill="#8b5cf6"
                animate={{
                  opacity: [0.3, 1, 0.3],
                  scale: [0.5, 1.2, 0.5],
                }}
                transition={{
                  duration: 3,
                  repeat: repeatInf,
                  delay: i * 0.5,
                }}
              />
            )
          })}
        </motion.g>

        {/* Portal effect for legendary rarity */}
        {rarity === RarityLevel.LEGENDARY && (
          <motion.g>
            {/* Portal center */}
            <motion.rect
              x="15"
              y="14"
              width="2"
              height="2"
              fill="#7c3aed"
              animate={{
                opacity: [0.5, 1, 0.5],
                scale: [1, 1.3, 1],
                rotate: [0, 180, 360],
              }}
              transition={{
                duration: 3,
                repeat: repeatInf,
                delay: 3,
              }}
            />

            {/* Portal energy rings */}
            <motion.rect
              x="10"
              y="10"
              width="12"
              height="1"
              fill="#a855f7"
              opacity="0.6"
              animate={{
                scaleX: [1, 1.3, 1],
                opacity: [0.3, 0.8, 0.3],
              }}
              transition={{
                duration: 2,
                repeat: repeatInf,
                delay: 3.5,
              }}
            />
          </motion.g>
        )}

        {/* Legendary cosmic sparkles */}
        {(rarity === RarityLevel.EPIC || rarity === RarityLevel.LEGENDARY) && (
          <motion.g>
            {Array.from({ length: 8 }, (_, i) => {
              const positions = [
                { x: 4, y: 8 },
                { x: 28, y: 10 },
                { x: 2, y: 18 },
                { x: 30, y: 20 },
                { x: 6, y: 4 },
                { x: 26, y: 6 },
                { x: 8, y: 30 },
                { x: 24, y: 28 },
              ]
              const pos = positions[i]
              if (!pos) return null

              return (
                <motion.rect
                  key={`cosmic-sparkle-${i}`}
                  x={pos.x}
                  y={pos.y}
                  width="1"
                  height="1"
                  fill="#ffffff"
                  animate={{
                    opacity: [0, 1, 0],
                    scale: [0, 1.5, 0],
                  }}
                  transition={{
                    duration: 2,
                    repeat: repeatInf,
                    delay: 4 + i * 0.3,
                  }}
                />
              )
            })}
          </motion.g>
        )}
      </motion.svg>

      {/* Mystical aura */}
      <motion.div
        className="absolute inset-0 rounded-full"
        style={{
          background: `conic-gradient(from 0deg, ${getRarityGlow}30, transparent, ${getRarityGlow}30)`,
        }}
        animate={{
          rotate: [0, 360],
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.7, 0.3],
        }}
        transition={{
          rotate: { duration: 6, repeat: repeatInf, ease: 'linear' },
          scale: { duration: 3, repeat: repeatInf, ease: 'easeInOut' },
          opacity: { duration: 3, repeat: repeatInf, ease: 'easeInOut' },
        }}
      />
    </motion.div>
  )
}

function areEqual(
  prev: Readonly<MysticMushroomSVGProps>,
  next: Readonly<MysticMushroomSVGProps>
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

export const MysticMushroomSVG = memo(MysticMushroomSVGComponent, areEqual)
