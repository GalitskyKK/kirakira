import { motion } from 'framer-motion'
import { useMemo } from 'react'
import { RarityLevel, SeasonalVariant } from '@/types'

interface TreeSVGProps {
  size?: number
  color?: string
  rarity?: RarityLevel
  season?: SeasonalVariant | undefined
  isSelected?: boolean
  isHovered?: boolean
  name?: string
  isVisible?: boolean
}

export function TreeSVG({
  size = 64,
  color = '#22c55e',
  rarity = RarityLevel.COMMON,
  season,
  isSelected = false,
  isHovered: _isHovered = false,
  name = 'Tree',
  isVisible = true,
}: TreeSVGProps) {
  // Определяем тип дерева по имени
  const isSprout = name === 'Росток'
  const isBranch = name === 'Веточка'
  const isSapling = name === 'Саженец'
  const isTreeOfLife =
    name?.toLowerCase().includes('древо жизни') ||
    name?.toLowerCase().includes('tree of life')
  const isAuroraTree =
    name?.toLowerCase().includes('дерево авроры') ||
    name?.toLowerCase().includes('aurora tree')

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
          trunk: '#8b4513',
          leaves: '#84cc16',
          accent: '#a3e635',
        }
      case SeasonalVariant.SUMMER:
        return {
          trunk: '#8b4513',
          leaves: '#22c55e',
          accent: '#4ade80',
        }
      case SeasonalVariant.AUTUMN:
        return {
          trunk: '#8b4513',
          leaves: '#ea580c',
          accent: '#f59e0b',
        }
      case SeasonalVariant.WINTER:
        return {
          trunk: '#6b7280',
          leaves: '#94a3b8',
          accent: '#cbd5e1',
        }
      default:
        return {
          trunk: '#8b4513',
          leaves: color,
          accent: '#4ade80',
        }
    }
  }

  const seasonalColors = getSeasonalColors()

  // Деторминатор для стабильных псевдослучайных значений (чтобы не пересоздавать layout)
  const pseudoRandom = (seed: number): number => {
    const x = Math.sin(seed) * 10000
    return x - Math.floor(x)
  }
  const repeatInf = isVisible ? Infinity : 0

  // Пиксельное дерево в зависимости от типа
  if (isSprout) {
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
          {/* Shadow */}
          <motion.ellipse
            cx="16"
            cy="30"
            rx="3"
            ry="1"
            fill="#000000"
            opacity="0.3"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          />

          {/* Small sprout */}
          <motion.g
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.8, delay: 0.3 }}
          >
            {/* Tiny stem */}
            <rect
              x="15"
              y="26"
              width="2"
              height="4"
              fill={seasonalColors.trunk}
            />
            <rect x="15" y="26" width="1" height="4" fill="#a0785a" />

            {/* Small leaves */}
            <rect
              x="13"
              y="24"
              width="2"
              height="2"
              fill={seasonalColors.leaves}
            />
            <rect
              x="17"
              y="25"
              width="2"
              height="2"
              fill={seasonalColors.leaves}
            />
            <rect
              x="15"
              y="22"
              width="2"
              height="2"
              fill={seasonalColors.accent}
            />

            {/* Leaf highlights */}
            <rect
              x="13"
              y="24"
              width="1"
              height="1"
              fill="#ffffff"
              opacity="0.6"
            />
            <rect
              x="17"
              y="25"
              width="1"
              height="1"
              fill="#ffffff"
              opacity="0.6"
            />
            <rect
              x="15"
              y="22"
              width="1"
              height="1"
              fill="#ffffff"
              opacity="0.7"
            />
          </motion.g>

          {/* Sparkles for rare sprouts */}
          {rarity !== RarityLevel.COMMON && (
            <motion.g
              animate={{
                opacity: [0.5, 1, 0.5],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                delay: 1,
              }}
            >
              <rect
                x="12"
                y="21"
                width="1"
                height="1"
                fill={getRarityGlow()}
                opacity="0.8"
              />
              <rect
                x="19"
                y="23"
                width="1"
                height="1"
                fill={getRarityGlow()}
                opacity="0.8"
              />
            </motion.g>
          )}
        </motion.svg>
      </motion.div>
    )
  }

  if (isBranch) {
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
            transition={{ duration: 0.6, delay: 0.2 }}
          />

          {/* Branch sapling */}
          <motion.g
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.8, delay: 0.3 }}
          >
            {/* Main stem */}
            <rect
              x="15"
              y="20"
              width="2"
              height="10"
              fill={seasonalColors.trunk}
            />
            <rect x="15" y="20" width="1" height="10" fill="#a0785a" />

            {/* Side branches */}
            <rect
              x="13"
              y="22"
              width="2"
              height="1"
              fill={seasonalColors.trunk}
            />
            <rect
              x="17"
              y="24"
              width="2"
              height="1"
              fill={seasonalColors.trunk}
            />

            {/* Leaf clusters */}
            <rect
              x="11"
              y="20"
              width="3"
              height="3"
              fill={seasonalColors.leaves}
            />
            <rect
              x="18"
              y="22"
              width="3"
              height="3"
              fill={seasonalColors.leaves}
            />
            <rect
              x="14"
              y="18"
              width="4"
              height="3"
              fill={seasonalColors.accent}
            />

            {/* Leaf highlights */}
            <rect
              x="11"
              y="20"
              width="1"
              height="2"
              fill="#ffffff"
              opacity="0.5"
            />
            <rect
              x="18"
              y="22"
              width="1"
              height="2"
              fill="#ffffff"
              opacity="0.5"
            />
            <rect
              x="14"
              y="18"
              width="2"
              height="1"
              fill="#ffffff"
              opacity="0.6"
            />
          </motion.g>

          {/* Magic effects for rare branches */}
          {rarity !== RarityLevel.COMMON && (
            <motion.g
              animate={{
                opacity: [0.5, 1, 0.5],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                delay: 1,
              }}
            >
              <rect
                x="10"
                y="19"
                width="1"
                height="1"
                fill={getRarityGlow()}
                opacity="0.8"
              />
              <rect
                x="21"
                y="21"
                width="1"
                height="1"
                fill={getRarityGlow()}
                opacity="0.8"
              />
              <rect
                x="16"
                y="17"
                width="1"
                height="1"
                fill={getRarityGlow()}
                opacity="0.8"
              />
            </motion.g>
          )}
        </motion.svg>
      </motion.div>
    )
  }

  if (isSapling) {
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
          {/* Shadow */}
          <motion.ellipse
            cx="16"
            cy="30"
            rx="5"
            ry="2"
            fill="#000000"
            opacity="0.3"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          />

          {/* Young sapling */}
          <motion.g
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.8, delay: 0.3 }}
          >
            {/* Trunk */}
            <rect
              x="14"
              y="18"
              width="4"
              height="12"
              fill={seasonalColors.trunk}
            />
            <rect x="14" y="18" width="2" height="12" fill="#a0785a" />
            <rect x="16" y="18" width="2" height="12" fill="#6b4423" />

            {/* Small crown */}
            <rect
              x="10"
              y="14"
              width="12"
              height="6"
              fill={seasonalColors.leaves}
            />
            <rect
              x="12"
              y="12"
              width="8"
              height="2"
              fill={seasonalColors.leaves}
            />
            <rect
              x="14"
              y="10"
              width="4"
              height="2"
              fill={seasonalColors.accent}
            />

            {/* Crown highlights */}
            <rect
              x="10"
              y="14"
              width="4"
              height="3"
              fill="#ffffff"
              opacity="0.4"
            />
            <rect
              x="12"
              y="12"
              width="3"
              height="2"
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

            {/* Crown shadows */}
            <rect
              x="18"
              y="17"
              width="4"
              height="3"
              fill="#000000"
              opacity="0.2"
            />
            <rect
              x="16"
              y="15"
              width="6"
              height="2"
              fill="#000000"
              opacity="0.15"
            />
          </motion.g>

          {/* Magic effects */}
          {rarity !== RarityLevel.COMMON && (
            <motion.g
              animate={{
                opacity: [0.5, 1, 0.5],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                delay: 1,
              }}
            >
              <rect
                x="9"
                y="13"
                width="1"
                height="1"
                fill={getRarityGlow()}
                opacity="0.8"
              />
              <rect
                x="22"
                y="15"
                width="1"
                height="1"
                fill={getRarityGlow()}
                opacity="0.8"
              />
              <rect
                x="15"
                y="9"
                width="1"
                height="1"
                fill={getRarityGlow()}
                opacity="0.8"
              />
              <rect
                x="17"
                y="11"
                width="1"
                height="1"
                fill={getRarityGlow()}
                opacity="0.8"
              />
            </motion.g>
          )}
        </motion.svg>
      </motion.div>
    )
  }

  // Взрослое дерево (по умолчанию)
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
        scale: 1.1,
        y: -2,
      }}
      transition={{
        type: 'spring',
        stiffness: 300,
        damping: 20,
      }}
    >
      {/* Wind particles for legendary trees */}
      {(rarity === RarityLevel.LEGENDARY || rarity === RarityLevel.EPIC) && (
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          {useMemo(() => {
            const count = 8
            const items = [] as Array<{ key: number; left: string; top: string }>
            for (let i = 0; i < count; i++) {
              const left = 10 + pseudoRandom(100 + i) * 80
              const top = 10 + pseudoRandom(200 + i) * 30
              items.push({ key: i, left: `${left}%`, top: `${top}%` })
            }
            return items
          }, [])
            .map((p, i) => (
              <motion.div
                key={p.key}
                className="absolute h-1 w-1 rounded-full bg-green-300"
                style={{ left: p.left, top: p.top }}
                animate={{
                  x: [0, 50, -20, 0],
                  y: [0, -20, 10, 0],
                  opacity: [0, 1, 0.5, 0],
                  scale: [0.5, 1, 0.8, 0.5],
                }}
              transition={{
                duration: 4,
                repeat: repeatInf,
                delay: i * 0.5,
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
        {/* Shadow */}
        <motion.ellipse
          cx="16"
          cy="30"
          rx="8"
          ry="2"
          fill="#000000"
          opacity="0.4"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        />

        {/* Tree trunk */}
        <motion.g
          initial={{ scaleY: 0 }}
          animate={{ scaleY: 1 }}
          transition={{ duration: 1, delay: 0.4 }}
        >
          {/* Main trunk */}
          <rect
            x="13"
            y="16"
            width="6"
            height="14"
            fill={seasonalColors.trunk}
          />

          {/* Trunk highlights */}
          <rect x="13" y="16" width="3" height="14" fill="#a0785a" />

          {/* Trunk shadows */}
          <rect x="16" y="16" width="3" height="14" fill="#6b4423" />

          {/* Trunk texture */}
          <rect
            x="14"
            y="20"
            width="4"
            height="1"
            fill="#654321"
            opacity="0.6"
          />
          <rect
            x="14"
            y="24"
            width="4"
            height="1"
            fill="#654321"
            opacity="0.6"
          />
          <rect
            x="14"
            y="28"
            width="4"
            height="1"
            fill="#654321"
            opacity="0.6"
          />

          {/* Trunk highlights */}
          <rect
            x="13"
            y="18"
            width="1"
            height="8"
            fill="#b8946f"
            opacity="0.8"
          />
        </motion.g>

        {/* Tree crown - детализированная крона */}
        <motion.g
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.8, delay: 0.8 }}
        >
          {/* Main crown body */}
          <rect
            x="6"
            y="8"
            width="20"
            height="12"
            fill={seasonalColors.leaves}
          />

          {/* Crown rounded top */}
          <rect
            x="8"
            y="6"
            width="16"
            height="2"
            fill={seasonalColors.leaves}
          />
          <rect
            x="10"
            y="4"
            width="12"
            height="2"
            fill={seasonalColors.leaves}
          />
          <rect
            x="12"
            y="2"
            width="8"
            height="2"
            fill={seasonalColors.accent}
          />

          {/* Crown left highlight */}
          <rect x="6" y="8" width="8" height="6" fill="#ffffff" opacity="0.3" />
          <rect x="8" y="6" width="6" height="2" fill="#ffffff" opacity="0.4" />
          <rect
            x="10"
            y="4"
            width="4"
            height="2"
            fill="#ffffff"
            opacity="0.5"
          />
          <rect
            x="12"
            y="2"
            width="3"
            height="2"
            fill="#ffffff"
            opacity="0.6"
          />

          {/* Crown right shadow */}
          <rect
            x="18"
            y="8"
            width="8"
            height="12"
            fill="#000000"
            opacity="0.2"
          />
          <rect
            x="18"
            y="6"
            width="6"
            height="2"
            fill="#000000"
            opacity="0.15"
          />
          <rect
            x="17"
            y="4"
            width="5"
            height="2"
            fill="#000000"
            opacity="0.1"
          />

          {/* Crown details and texture */}
          <rect
            x="9"
            y="10"
            width="2"
            height="2"
            fill={seasonalColors.accent}
            opacity="0.8"
          />
          <rect
            x="21"
            y="12"
            width="2"
            height="2"
            fill={seasonalColors.accent}
            opacity="0.8"
          />
          <rect
            x="14"
            y="6"
            width="2"
            height="2"
            fill={seasonalColors.accent}
            opacity="0.9"
          />
          <rect
            x="7"
            y="16"
            width="2"
            height="2"
            fill={seasonalColors.accent}
            opacity="0.7"
          />
        </motion.g>

        {/* Seasonal decorations */}
        {season === SeasonalVariant.AUTUMN && (
          <motion.g
            animate={{
              y: [0, 20],
              opacity: [1, 0],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              delay: 2,
              stagger: 0.5,
            }}
          >
            {/* Falling leaves */}
            <rect x="12" y="20" width="1" height="1" fill="#ea580c" />
            <rect x="18" y="22" width="1" height="1" fill="#f59e0b" />
            <rect x="10" y="24" width="1" height="1" fill="#dc2626" />
          </motion.g>
        )}

        {season === SeasonalVariant.SPRING && (
          <motion.g
            animate={{
              scale: [0, 1, 0],
              opacity: [0, 1, 0],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              delay: 2,
            }}
          >
            {/* Spring flowers on tree */}
            <rect x="11" y="9" width="1" height="1" fill="#f8fafc" />
            <rect x="19" y="11" width="1" height="1" fill="#f8fafc" />
            <rect x="15" y="7" width="1" height="1" fill="#f8fafc" />
            <rect x="8" y="14" width="1" height="1" fill="#f8fafc" />
          </motion.g>
        )}

        {season === SeasonalVariant.WINTER && (
          <motion.g
            animate={{
              opacity: [0.7, 1, 0.7],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              delay: 2,
            }}
          >
            {/* Snow on branches */}
            <rect
              x="8"
              y="8"
              width="16"
              height="1"
              fill="#ffffff"
              opacity="0.9"
            />
            <rect
              x="10"
              y="4"
              width="12"
              height="1"
              fill="#ffffff"
              opacity="0.9"
            />
            <rect
              x="12"
              y="2"
              width="8"
              height="1"
              fill="#ffffff"
              opacity="0.9"
            />
            <rect
              x="6"
              y="12"
              width="20"
              height="1"
              fill="#ffffff"
              opacity="0.8"
            />
          </motion.g>
        )}

        {/* Magical effects for rare trees */}
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
            {/* Magical leaves */}
            <rect
              x="5"
              y="10"
              width="1"
              height="1"
              fill={getRarityGlow()}
              opacity="0.8"
            />
            <rect
              x="26"
              y="13"
              width="1"
              height="1"
              fill={getRarityGlow()}
              opacity="0.8"
            />
            <rect
              x="13"
              y="1"
              width="1"
              height="1"
              fill={getRarityGlow()}
              opacity="0.8"
            />
            <rect
              x="19"
              y="3"
              width="1"
              height="1"
              fill={getRarityGlow()}
              opacity="0.8"
            />
            <rect
              x="9"
              y="18"
              width="1"
              height="1"
              fill={getRarityGlow()}
              opacity="0.8"
            />
          </motion.g>
        )}

        {/* Legendary tree effects */}
        {rarity === RarityLevel.LEGENDARY && (
          <motion.g>
            {/* Mystical energy in trunk */}
            <motion.rect
              x="15"
              y="22"
              width="2"
              height="4"
              fill="#fbbf24"
              opacity="0.7"
              animate={{
                opacity: [0.3, 0.9, 0.3],
                scaleY: [1, 1.2, 1],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                delay: 3,
              }}
            />

            {/* Legendary sparkles around crown */}
            {Array.from({ length: 6 }, (_, i) => {
              const positions = [
                { x: 4, y: 12 },
                { x: 28, y: 15 },
                { x: 15, y: 0 },
                { x: 11, y: 2 },
                { x: 21, y: 4 },
                { x: 16, y: 20 },
              ]
              const pos = positions[i]
              if (!pos) return null

              return (
                <motion.rect
                  key={`tree-sparkle-${i}`}
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
                    duration: 1.5,
                    repeat: Infinity,
                    delay: 3.5 + i * 0.3,
                  }}
                />
              )
            })}
          </motion.g>
        )}

        {/* Tree of Life effects (Legendary) */}
        {isTreeOfLife && (
          <motion.g>
            {/* Sacred light emanating from the tree */}
            <motion.g
              animate={{
                opacity: [0.4, 0.8, 0.4],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                delay: 2,
              }}
            >
              {/* Golden light rays */}
              <rect
                x="16"
                y="2"
                width="1"
                height="8"
                fill="#fbbf24"
                opacity="0.8"
              />
              <rect
                x="2"
                y="16"
                width="8"
                height="1"
                fill="#fbbf24"
                opacity="0.8"
              />
              <rect
                x="22"
                y="16"
                width="8"
                height="1"
                fill="#fbbf24"
                opacity="0.8"
              />

              {/* Sacred symbols on trunk */}
              <rect
                x="14"
                y="20"
                width="4"
                height="1"
                fill="#ffffff"
                opacity="0.9"
              />
              <rect
                x="15"
                y="19"
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
              <rect
                x="16"
                y="18"
                width="1"
                height="4"
                fill="#ffffff"
                opacity="0.9"
              />
            </motion.g>

            {/* Life essence particles */}
            {Array.from({ length: 8 }, (_, i) => {
              const angle = i * 45
              const radius = 18
              const x = 16 + Math.cos((angle * Math.PI) / 180) * radius
              const y = 16 + Math.sin((angle * Math.PI) / 180) * radius

              return (
                <motion.rect
                  key={`life-essence-${i}`}
                  x={x}
                  y={y}
                  width="1"
                  height="1"
                  fill="#22c55e"
                  animate={{
                    opacity: [0.3, 1, 0.3],
                    scale: [0.5, 1.5, 0.5],
                    y: [y, y - 10, y],
                  }}
                  transition={{
                    duration: 4,
                    repeat: Infinity,
                    delay: 2.5 + i * 0.2,
                  }}
                />
              )
            })}
          </motion.g>
        )}

        {/* Aurora Tree effects (Premium) */}
        {isAuroraTree && (
          <motion.g>
            {/* Aurora colors flowing through the tree */}
            <motion.g
              animate={{
                opacity: [0.5, 1, 0.5],
              }}
              transition={{
                duration: 2.5,
                repeat: Infinity,
                delay: 1.5,
              }}
            >
              {/* Aurora lights in crown */}
              <rect
                x="8"
                y="8"
                width="2"
                height="1"
                fill="#8b5cf6"
                opacity="0.7"
              />
              <rect
                x="12"
                y="6"
                width="2"
                height="1"
                fill="#06b6d4"
                opacity="0.7"
              />
              <rect
                x="18"
                y="7"
                width="2"
                height="1"
                fill="#ec4899"
                opacity="0.7"
              />
              <rect
                x="22"
                y="10"
                width="2"
                height="1"
                fill="#10b981"
                opacity="0.7"
              />

              {/* Aurora flowing in trunk */}
              <motion.rect
                x="15"
                y="18"
                width="2"
                height="8"
                fill="#8b5cf6"
                opacity="0.6"
                animate={{
                  fill: ['#8b5cf6', '#06b6d4', '#ec4899', '#10b981', '#8b5cf6'],
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  delay: 2,
                }}
              />
            </motion.g>

            {/* Aurora particles */}
            {Array.from({ length: 10 }, (_, i) => {
              const colors = [
                '#8b5cf6',
                '#06b6d4',
                '#ec4899',
                '#10b981',
                '#f59e0b',
              ]
              const positions = [
                { x: 6, y: 12 },
                { x: 26, y: 14 },
                { x: 4, y: 18 },
                { x: 28, y: 16 },
                { x: 10, y: 4 },
                { x: 22, y: 6 },
                { x: 8, y: 24 },
                { x: 24, y: 22 },
                { x: 2, y: 20 },
                { x: 30, y: 18 },
              ]
              const pos = positions[i]
              const color = colors[i % colors.length]
              if (!pos) return null

              return (
                <motion.rect
                  key={`aurora-particle-${i}`}
                  x={pos.x}
                  y={pos.y}
                  width="1"
                  height="1"
                  fill={color}
                  animate={{
                    opacity: [0, 1, 0],
                    scale: [0.5, 1.2, 0.5],
                    x: [pos.x, pos.x + (Math.random() - 0.5) * 6, pos.x],
                    y: [pos.y, pos.y - 5, pos.y],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    delay: 2 + i * 0.2,
                    ease: 'easeOut',
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
