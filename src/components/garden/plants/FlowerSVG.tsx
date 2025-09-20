import { motion } from 'framer-motion'
import { RarityLevel } from '@/types'

interface FlowerSVGProps {
  size?: number
  color?: string
  rarity?: RarityLevel
  isSelected?: boolean
  isHovered?: boolean
  name?: string
}

export function FlowerSVG({
  size = 64,
  color = '#ec4899',
  rarity = RarityLevel.COMMON,
  isSelected = false,
  isHovered: _isHovered = false, // Acknowledged but not used in this component
  name: _name = 'Flower', // Acknowledged but not used in this component
}: FlowerSVGProps) {
  const getGradientId = () =>
    `flower-gradient-${Math.random().toString(36).substr(2, 9)}`
  const gradientId = getGradientId()

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
      initial={{ scale: 0, rotate: -45 }}
      animate={{
        scale: 1,
        rotate: 0,
        filter: isSelected
          ? `drop-shadow(0 0 20px ${getRarityGlow()})`
          : 'none',
      }}
      whileHover={{
        scale: 1.1,
        y: -5,
        filter: `drop-shadow(0 8px 25px ${color}50)`,
      }}
      transition={{
        type: 'spring',
        stiffness: 200,
        damping: 15,
      }}
    >
      {/* Particles for legendary */}
      {(rarity === RarityLevel.LEGENDARY || rarity === RarityLevel.EPIC) && (
        <div className="pointer-events-none absolute inset-0">
          {Array.from({ length: 6 }, (_, i) => (
            <motion.div
              key={i}
              className="absolute h-1 w-1 rounded-full bg-yellow-300"
              style={{
                left: `${20 + Math.random() * 60}%`,
                top: `${20 + Math.random() * 60}%`,
              }}
              animate={{
                scale: [0, 1, 0],
                opacity: [0, 1, 0],
                rotate: [0, 360],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                delay: i * 0.3,
                ease: 'easeInOut',
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
          {/* Iridescent petal gradient */}
          <radialGradient id={gradientId} cx="50%" cy="30%" r="80%">
            <stop
              offset="0%"
              style={{ stopColor: '#ffffff', stopOpacity: 0.9 }}
            />
            <stop offset="20%" style={{ stopColor: color, stopOpacity: 1 }} />
            <stop offset="50%" style={{ stopColor: color, stopOpacity: 0.8 }} />
            <stop
              offset="80%"
              style={{ stopColor: '#8b5cf6', stopOpacity: 0.6 }}
            />
            <stop
              offset="100%"
              style={{ stopColor: '#ec4899', stopOpacity: 0.4 }}
            />
          </radialGradient>

          {/* Shimmer effect */}
          <linearGradient
            id={`${gradientId}-shimmer`}
            x1="0%"
            y1="0%"
            x2="100%"
            y2="100%"
          >
            <stop
              offset="0%"
              style={{ stopColor: 'rgba(255,255,255,0.8)', stopOpacity: 0 }}
            />
            <stop
              offset="50%"
              style={{ stopColor: 'rgba(255,255,255,0.8)', stopOpacity: 1 }}
            />
            <stop
              offset="100%"
              style={{ stopColor: 'rgba(255,255,255,0.8)', stopOpacity: 0 }}
            />
          </linearGradient>

          {/* Holographic center */}
          <radialGradient id={`${gradientId}-center`} cx="50%" cy="50%" r="40%">
            <stop
              offset="0%"
              style={{ stopColor: '#ffffff', stopOpacity: 1 }}
            />
            <stop
              offset="30%"
              style={{ stopColor: '#fbbf24', stopOpacity: 1 }}
            />
            <stop
              offset="60%"
              style={{ stopColor: '#f59e0b', stopOpacity: 0.8 }}
            />
            <stop
              offset="100%"
              style={{ stopColor: '#dc2626', stopOpacity: 0.6 }}
            />
          </radialGradient>

          {/* Enhanced shadow with glow */}
          <filter id={`${gradientId}-shadow`}>
            <feDropShadow
              dx="0"
              dy="6"
              stdDeviation="8"
              floodColor={color}
              floodOpacity="0.4"
            />
            <feGaussianBlur stdDeviation="3" result="glow" />
            <feMerge>
              <feMergeNode in="glow" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Petal vein pattern */}
          <pattern
            id={`${gradientId}-veins`}
            x="0"
            y="0"
            width="20"
            height="30"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M10 0 Q15 15 10 30 Q5 15 10 0"
              stroke="rgba(255,255,255,0.3)"
              strokeWidth="0.5"
              fill="none"
            />
          </pattern>
        </defs>

        {/* Stem */}
        <motion.path
          d="M50 85 Q48 70 50 55 Q52 70 50 85"
          fill="url(#stem-gradient)"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1, delay: 0.5 }}
        />

        {/* Leaves */}
        <motion.ellipse
          cx="45"
          cy="70"
          rx="8"
          ry="15"
          fill="#22c55e"
          transform="rotate(-30 45 70)"
          initial={{ scale: 0, rotate: -90 }}
          animate={{
            scale: 1,
            rotate: [-30, -25, -30],
          }}
          transition={{
            scale: { duration: 0.8, delay: 0.7 },
            rotate: { duration: 3, repeat: Infinity, ease: 'easeInOut' },
          }}
        />

        <motion.ellipse
          cx="55"
          cy="75"
          rx="8"
          ry="15"
          fill="#16a34a"
          transform="rotate(30 55 75)"
          initial={{ scale: 0, rotate: 90 }}
          animate={{
            scale: 1,
            rotate: [30, 35, 30],
          }}
          transition={{
            scale: { duration: 0.8, delay: 0.9 },
            rotate: {
              duration: 3,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: 1,
            },
          }}
        />

        {/* Flower petals */}
        {Array.from({ length: 8 }, (_, i) => {
          const angle = i * 45 - 22.5
          const x = 50 + Math.cos((angle * Math.PI) / 180) * 20
          const y = 50 + Math.sin((angle * Math.PI) / 180) * 20

          return (
            <motion.g key={i}>
              {/* Main petal */}
              <motion.ellipse
                cx={x}
                cy={y}
                rx="15"
                ry="10"
                fill={`url(#${gradientId})`}
                stroke="rgba(255,255,255,0.6)"
                strokeWidth="0.5"
                transform={`rotate(${angle} ${x} ${y})`}
                filter={`url(#${gradientId}-shadow)`}
                initial={{ scale: 0, rotate: angle - 180, opacity: 0 }}
                animate={{
                  scale: [0, 1.3, 1.1],
                  rotate: angle,
                  opacity: [0, 1, 0.9],
                }}
                transition={{
                  duration: 0.8,
                  delay: 0.1 + i * 0.08,
                  type: 'spring',
                  stiffness: 150,
                }}
              />

              {/* Shimmer effect */}
              <motion.ellipse
                cx={x}
                cy={y}
                rx="15"
                ry="10"
                fill={`url(#${gradientId}-shimmer)`}
                transform={`rotate(${angle} ${x} ${y})`}
                initial={{ opacity: 0 }}
                animate={{
                  opacity: [0, 0.8, 0],
                  scale: [1, 1.05, 1],
                }}
                transition={{
                  duration: 2,
                  delay: 1 + i * 0.2,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              />

              {/* Vein pattern */}
              <motion.ellipse
                cx={x}
                cy={y}
                rx="15"
                ry="10"
                fill={`url(#${gradientId}-veins)`}
                transform={`rotate(${angle} ${x} ${y})`}
                opacity="0.6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.6 }}
                transition={{ delay: 1.2 + i * 0.05 }}
              />
            </motion.g>
          )
        })}

        {/* Holographic center */}
        <motion.circle
          cx="50"
          cy="50"
          r="10"
          fill={`url(#${gradientId}-center)`}
          stroke="rgba(255,255,255,0.8)"
          strokeWidth="1"
          filter={`url(#${gradientId}-shadow)`}
          initial={{ scale: 0, rotate: 0 }}
          animate={{
            scale: 1,
            rotate: [0, 360],
          }}
          transition={{
            scale: { duration: 0.4, delay: 1.2 },
            rotate: { duration: 8, repeat: Infinity, ease: 'linear' },
          }}
        />

        {/* Pollen particles */}
        {Array.from({ length: 6 }, (_, i) => (
          <motion.circle
            key={`pollen-${i}`}
            cx={50 + Math.cos((i * 60 * Math.PI) / 180) * 4}
            cy={50 + Math.sin((i * 60 * Math.PI) / 180) * 4}
            r="1.5"
            fill="#fbbf24"
            initial={{ scale: 0, opacity: 0 }}
            animate={{
              scale: [0, 1.2, 1],
              opacity: [0, 1, 0.8],
              y: [0, -3, 0],
            }}
            transition={{
              duration: 1.5,
              delay: 1.5 + i * 0.1,
              repeat: Infinity,
              repeatType: 'reverse',
            }}
          />
        ))}

        {/* Magical sparkles around center */}
        <motion.circle
          cx="50"
          cy="50"
          r="12"
          fill="none"
          stroke="rgba(255,255,255,0.6)"
          strokeWidth="0.5"
          strokeDasharray="2 4"
          initial={{ scale: 0, opacity: 0 }}
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.6, 0.2, 0.6],
            rotate: [0, 360],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            delay: 2,
          }}
        />

        {/* Additional gradients for stem */}
        <defs>
          <linearGradient id="stem-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop
              offset="0%"
              style={{ stopColor: '#22c55e', stopOpacity: 1 }}
            />
            <stop
              offset="100%"
              style={{ stopColor: '#16a34a', stopOpacity: 1 }}
            />
          </linearGradient>
        </defs>
      </motion.svg>

      {/* Magical aura for rare plants */}
      {rarity !== RarityLevel.COMMON && (
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{
            background: `radial-gradient(circle, ${getRarityGlow()}20 0%, transparent 70%)`,
          }}
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.6, 0.3],
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
