import { motion } from 'framer-motion'
import { RarityLevel } from '@/types'

interface CrystalSVGProps {
  size?: number
  color?: string
  rarity?: RarityLevel
  isSelected?: boolean
  isHovered?: boolean
  name?: string
}

export function CrystalSVG({
  size = 64,
  color = '#3b82f6',
  rarity = RarityLevel.COMMON,
  isSelected = false,
  isHovered: _isHovered = false,
  name: _name = 'Crystal',
}: CrystalSVGProps) {
  const getGradientId = () =>
    `crystal-gradient-${Math.random().toString(36).substr(2, 9)}`
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
        viewBox="0 0 100 100"
        className="overflow-visible"
      >
        <defs>
          {/* Main crystal gradient */}
          <linearGradient
            id={`${gradientId}-main`}
            x1="0%"
            y1="0%"
            x2="100%"
            y2="100%"
          >
            <stop offset="0%" style={{ stopColor: color, stopOpacity: 0.9 }} />
            <stop offset="30%" style={{ stopColor: color, stopOpacity: 0.7 }} />
            <stop offset="70%" style={{ stopColor: color, stopOpacity: 0.5 }} />
            <stop
              offset="100%"
              style={{ stopColor: color, stopOpacity: 0.8 }}
            />
          </linearGradient>

          {/* Highlight gradient */}
          <linearGradient
            id={`${gradientId}-highlight`}
            x1="0%"
            y1="0%"
            x2="100%"
            y2="100%"
          >
            <stop
              offset="0%"
              style={{ stopColor: '#ffffff', stopOpacity: 0.8 }}
            />
            <stop
              offset="50%"
              style={{ stopColor: '#ffffff', stopOpacity: 0.3 }}
            />
            <stop
              offset="100%"
              style={{ stopColor: color, stopOpacity: 0.1 }}
            />
          </linearGradient>

          {/* Glow filter */}
          <filter id={`${gradientId}-glow`}>
            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Inner glow */}
          <filter id={`${gradientId}-inner-glow`}>
            <feGaussianBlur stdDeviation="2" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Crystal base/ground */}
        <motion.ellipse
          cx="50"
          cy="85"
          rx="15"
          ry="3"
          fill={color}
          opacity="0.3"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 0.8, delay: 0.5 }}
        />

        {/* Main crystal body */}
        <motion.path
          d="M50 20 L35 50 L40 80 L60 80 L65 50 Z"
          fill={`url(#${gradientId}-main)`}
          stroke={color}
          strokeWidth="1"
          filter={`url(#${gradientId}-glow)`}
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 1.2, delay: 0.2 }}
        />

        {/* Crystal facets */}
        <motion.path
          d="M50 20 L42 35 L50 50 Z"
          fill={`url(#${gradientId}-highlight)`}
          opacity="0.6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.6 }}
          transition={{ duration: 0.8, delay: 0.8 }}
        />

        <motion.path
          d="M50 20 L58 35 L50 50 Z"
          fill={color}
          opacity="0.4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.4 }}
          transition={{ duration: 0.8, delay: 1.0 }}
        />

        <motion.path
          d="M50 50 L35 50 L40 80 L50 70 Z"
          fill={`url(#${gradientId}-highlight)`}
          opacity="0.5"
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.5 }}
          transition={{ duration: 0.8, delay: 1.2 }}
        />

        <motion.path
          d="M50 50 L65 50 L60 80 L50 70 Z"
          fill={color}
          opacity="0.3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.3 }}
          transition={{ duration: 0.8, delay: 1.4 }}
        />

        {/* Inner light core */}
        <motion.ellipse
          cx="50"
          cy="50"
          rx="8"
          ry="15"
          fill="#ffffff"
          opacity="0.4"
          filter={`url(#${gradientId}-inner-glow)`}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.6, delay: 1.6 }}
        />

        {/* Pulsing energy core */}
        <motion.circle
          cx="50"
          cy="50"
          r="4"
          fill={color}
          initial={{ scale: 0 }}
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.8, 0.4, 0.8],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            delay: 2,
            ease: 'easeInOut',
          }}
        />

        {/* Magical runes for epic/legendary */}
        {(rarity === RarityLevel.EPIC || rarity === RarityLevel.LEGENDARY) && (
          <motion.g>
            {/* Rune symbols */}
            <motion.circle
              cx="45"
              cy="40"
              r="1.5"
              fill="#fbbf24"
              initial={{ opacity: 0 }}
              animate={{
                opacity: [0, 1, 0],
                scale: [0.5, 1, 0.5],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                delay: 2.5,
              }}
            />
            <motion.circle
              cx="55"
              cy="60"
              r="1.5"
              fill="#fbbf24"
              initial={{ opacity: 0 }}
              animate={{
                opacity: [0, 1, 0],
                scale: [0.5, 1, 0.5],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                delay: 3,
              }}
            />
          </motion.g>
        )}

        {/* Energy waves */}
        <motion.circle
          cx="50"
          cy="50"
          r="25"
          fill="none"
          stroke={color}
          strokeWidth="1"
          opacity="0.3"
          initial={{ scale: 0, opacity: 0 }}
          animate={{
            scale: [1, 1.5, 1],
            opacity: [0.3, 0, 0.3],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            delay: 2.5,
          }}
        />

        {/* Reflection highlights */}
        <motion.line
          x1="48"
          y1="25"
          x2="48"
          y2="45"
          stroke="#ffffff"
          strokeWidth="1"
          opacity="0.6"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0.6, 0] }}
          transition={{
            duration: 2,
            repeat: Infinity,
            delay: 3,
          }}
        />
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
