import { motion } from 'framer-motion'
import { useId } from 'react'
import { RarityLevel } from '@/types'

interface MushroomSVGProps {
  size?: number
  color?: string
  rarity?: RarityLevel
  isSelected?: boolean
  isHovered?: boolean
  name?: string
}

export function MushroomSVG({
  size = 64,
  color = '#ef4444',
  rarity = RarityLevel.COMMON,
  isSelected = false,
  isHovered: _isHovered = false,
  name: _name = 'Mushroom',
}: MushroomSVGProps) {
  const uniqueId = useId()
  const gradientId = `mushroom-${uniqueId}`

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

  return (
    <motion.div
      className="relative flex items-center justify-center"
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
        viewBox="0 0 100 100"
        className="overflow-visible"
      >
        <defs>
          {/* Cap gradient */}
          <radialGradient id={`${gradientId}-cap`} cx="50%" cy="30%" r="70%">
            <stop offset="0%" style={{ stopColor: color, stopOpacity: 1 }} />
            <stop offset="70%" style={{ stopColor: color, stopOpacity: 0.8 }} />
            <stop
              offset="100%"
              style={{ stopColor: color, stopOpacity: 0.6 }}
            />
          </radialGradient>

          {/* Stem gradient */}
          <linearGradient
            id={`${gradientId}-stem`}
            x1="0%"
            y1="0%"
            x2="100%"
            y2="0%"
          >
            <stop
              offset="0%"
              style={{ stopColor: '#f3f4f6', stopOpacity: 1 }}
            />
            <stop
              offset="50%"
              style={{ stopColor: '#ffffff', stopOpacity: 1 }}
            />
            <stop
              offset="100%"
              style={{ stopColor: '#e5e7eb', stopOpacity: 1 }}
            />
          </linearGradient>

          {/* Glow filter */}
          <filter id={`${gradientId}-glow`}>
            <feGaussianBlur stdDeviation="2" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Ground/moss */}
        <motion.ellipse
          cx="50"
          cy="85"
          rx="12"
          ry="2"
          fill="#22c55e"
          opacity="0.4"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        />

        {/* Stem */}
        <motion.rect
          x="48"
          y="45"
          width="4"
          height="40"
          fill={`url(#${gradientId}-stem)`}
          rx="2"
          initial={{ scaleY: 0, y: 40 }}
          animate={{ scaleY: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
        />

        {/* Stem texture */}
        <motion.line
          x1="48.5"
          y1="45"
          x2="48.5"
          y2="35"
          stroke="#d1d5db"
          strokeWidth="0.5"
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.6 }}
          transition={{ delay: 1 }}
        />

        {/* Cap base */}
        <motion.ellipse
          cx="50"
          cy="50"
          rx="20"
          ry="8"
          fill={`url(#${gradientId}-cap)`}
          filter={`url(#${gradientId}-glow)`}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{
            duration: 0.6,
            delay: 0.8,
            type: 'spring',
            stiffness: 200,
          }}
        />

        {/* Cap top */}
        <motion.ellipse
          cx="50"
          cy="45"
          rx="18"
          ry="15"
          fill={`url(#${gradientId}-cap)`}
          filter={`url(#${gradientId}-glow)`}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{
            duration: 0.6,
            delay: 1.0,
            type: 'spring',
            stiffness: 200,
          }}
        />

        {/* Spots on cap */}
        {Array.from({ length: 6 }, (_, i) => {
          const positions = [
            { x: 45, y: 42, r: 2.5 },
            { x: 58, y: 38, r: 1.5 },
            { x: 52, y: 35, r: 2 },
            { x: 40, y: 48, r: 1.5 },
            { x: 62, y: 47, r: 2 },
            { x: 48, y: 40, r: 1 },
          ]
          const spot = positions[i]
          if (!spot) return null

          return (
            <motion.circle
              key={i}
              cx={spot.x}
              cy={spot.y}
              r={spot.r}
              fill="#ffffff"
              opacity="0.8"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{
                duration: 0.3,
                delay: 1.2 + i * 0.1,
                type: 'spring',
                stiffness: 300,
              }}
            />
          )
        })}

        {/* Cap highlight */}
        <motion.ellipse
          cx="45"
          cy="38"
          rx="8"
          ry="6"
          fill="#ffffff"
          opacity="0.3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.3 }}
          transition={{ delay: 1.5 }}
        />

        {/* Gills under cap */}
        {Array.from({ length: 8 }, (_, i) => {
          const x = 35 + i * 4
          return (
            <motion.line
              key={i}
              x1={x}
              y1="50"
              x2={x}
              y2="52"
              stroke="#8b5cf6"
              strokeWidth="0.5"
              opacity="0.4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.4 }}
              transition={{ delay: 1.6 + i * 0.05 }}
            />
          )
        })}

        {/* Magical glow for rare mushrooms */}
        {rarity !== RarityLevel.COMMON && (
          <motion.circle
            cx="50"
            cy="42"
            r="25"
            fill="none"
            stroke={getRarityGlow()}
            strokeWidth="1"
            opacity="0.3"
            initial={{ scale: 0, opacity: 0 }}
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.1, 0.3],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              delay: 2,
            }}
          />
        )}

        {/* Bioluminescent effect for legendary */}
        {rarity === RarityLevel.LEGENDARY && (
          <motion.g>
            <motion.circle
              cx="50"
              cy="42"
              r="5"
              fill="#fbbf24"
              opacity="0.5"
              initial={{ scale: 0 }}
              animate={{
                scale: [1, 1.5, 1],
                opacity: [0.5, 0.2, 0.5],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                delay: 2.5,
              }}
            />
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
