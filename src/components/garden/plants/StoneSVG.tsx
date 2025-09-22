import { motion } from 'framer-motion'
import { useId } from 'react'
import { RarityLevel } from '@/types'

interface StoneSVGProps {
  size?: number
  color?: string
  rarity?: RarityLevel
  isSelected?: boolean
  isHovered?: boolean
  name?: string
}

export function StoneSVG({
  size = 64,
  color = '#6b7280',
  rarity = RarityLevel.COMMON,
  isSelected = false,
  isHovered: _isHovered = false,
  name: _name = 'Stone',
}: StoneSVGProps) {
  const uniqueId = useId()
  const gradientId = `stone-${uniqueId}`

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
      initial={{ scale: 0, y: 20 }}
      animate={{
        scale: 1,
        y: 0,
        filter: isSelected
          ? `drop-shadow(0 0 20px ${getRarityGlow()})`
          : 'none',
      }}
      whileHover={{
        scale: 1.05,
        y: -2,
      }}
      transition={{
        type: 'spring',
        stiffness: 400,
        damping: 25,
      }}
    >
      <motion.svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        className="overflow-visible"
      >
        <defs>
          {/* Main stone gradient */}
          <linearGradient
            id={`${gradientId}-main`}
            x1="0%"
            y1="0%"
            x2="100%"
            y2="100%"
          >
            <stop
              offset="0%"
              style={{ stopColor: '#9ca3af', stopOpacity: 1 }}
            />
            <stop offset="50%" style={{ stopColor: color, stopOpacity: 1 }} />
            <stop
              offset="100%"
              style={{ stopColor: '#4b5563', stopOpacity: 1 }}
            />
          </linearGradient>

          {/* Shadow gradient */}
          <radialGradient id={`${gradientId}-shadow`} cx="50%" cy="90%" r="60%">
            <stop
              offset="0%"
              style={{ stopColor: '#000000', stopOpacity: 0.3 }}
            />
            <stop
              offset="100%"
              style={{ stopColor: '#000000', stopOpacity: 0 }}
            />
          </radialGradient>

          {/* Rune glow */}
          <filter id={`${gradientId}-rune-glow`}>
            <feGaussianBlur stdDeviation="2" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Shadow */}
        <motion.ellipse
          cx="50"
          cy="85"
          rx="18"
          ry="4"
          fill={`url(#${gradientId}-shadow)`}
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        />

        {/* Main stone body */}
        <motion.path
          d="M35 70 Q30 50 40 35 Q50 30 60 35 Q70 50 65 70 Q60 80 50 82 Q40 80 35 70 Z"
          fill={`url(#${gradientId}-main)`}
          stroke="#4b5563"
          strokeWidth="1"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{
            duration: 1,
            delay: 0.3,
            type: 'spring',
            stiffness: 150,
          }}
        />

        {/* Stone texture - cracks and lines */}
        <motion.path
          d="M45 40 Q50 45 55 42"
          stroke="#374151"
          strokeWidth="1"
          fill="none"
          opacity="0.6"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1, delay: 1 }}
        />

        <motion.path
          d="M38 55 Q42 60 46 58"
          stroke="#374151"
          strokeWidth="1"
          fill="none"
          opacity="0.6"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1, delay: 1.2 }}
        />

        <motion.path
          d="M55 65 Q58 68 62 66"
          stroke="#374151"
          strokeWidth="1"
          fill="none"
          opacity="0.6"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1, delay: 1.4 }}
        />

        {/* Moss patches */}
        <motion.circle
          cx="42"
          cy="72"
          r="3"
          fill="#22c55e"
          opacity="0.7"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.6, delay: 1.6 }}
        />

        <motion.ellipse
          cx="58"
          cy="75"
          rx="4"
          ry="2"
          fill="#16a34a"
          opacity="0.6"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.6, delay: 1.8 }}
        />

        {/* Highlight */}
        <motion.ellipse
          cx="45"
          cy="45"
          rx="8"
          ry="6"
          fill="#ffffff"
          opacity="0.2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.2 }}
          transition={{ delay: 2 }}
        />

        {/* Magical runes for rare stones */}
        {(rarity === RarityLevel.RARE ||
          rarity === RarityLevel.EPIC ||
          rarity === RarityLevel.LEGENDARY) && (
          <motion.g filter={`url(#${gradientId}-rune-glow)`}>
            {/* Runic symbols */}
            <motion.path
              d="M48 45 L52 45 M50 43 L50 47 M49 44 L51 46"
              stroke={getRarityGlow()}
              strokeWidth="1.5"
              fill="none"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{
                pathLength: 1,
                opacity: [0, 1, 0.6],
              }}
              transition={{
                duration: 2,
                delay: 2.5,
                repeat: Infinity,
                repeatDelay: 3,
              }}
            />

            <motion.circle
              cx="50"
              cy="58"
              r="2"
              stroke={getRarityGlow()}
              strokeWidth="1"
              fill="none"
              initial={{ scale: 0, opacity: 0 }}
              animate={{
                scale: [0, 1, 0],
                opacity: [0, 1, 0],
              }}
              transition={{
                duration: 2,
                delay: 3,
                repeat: Infinity,
                repeatDelay: 3,
              }}
            />
          </motion.g>
        )}

        {/* Ancient power emanation for legendary */}
        {rarity === RarityLevel.LEGENDARY && (
          <motion.g>
            {Array.from({ length: 4 }, (_, i) => {
              const angle = i * 90
              const x = 50 + Math.cos((angle * Math.PI) / 180) * 25
              const y = 60 + Math.sin((angle * Math.PI) / 180) * 15

              return (
                <motion.circle
                  key={i}
                  cx={x}
                  cy={y}
                  r="1"
                  fill="#fbbf24"
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{
                    scale: [0, 1.5, 0],
                    opacity: [0, 1, 0],
                  }}
                  transition={{
                    duration: 3,
                    delay: 3 + i * 0.5,
                    repeat: Infinity,
                    repeatDelay: 2,
                  }}
                />
              )
            })}
          </motion.g>
        )}

        {/* Energy pulse for epic/legendary */}
        {(rarity === RarityLevel.EPIC || rarity === RarityLevel.LEGENDARY) && (
          <motion.circle
            cx="50"
            cy="60"
            r="30"
            fill="none"
            stroke={getRarityGlow()}
            strokeWidth="1"
            opacity="0.3"
            initial={{ scale: 0, opacity: 0 }}
            animate={{
              scale: [1, 1.3, 1],
              opacity: [0.3, 0, 0.3],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              delay: 3,
            }}
          />
        )}
      </motion.svg>

      {/* Magical aura */}
      {rarity !== RarityLevel.COMMON && (
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{
            background: `radial-gradient(circle, ${getRarityGlow()}10 0%, transparent 80%)`,
          }}
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.1, 0.3, 0.1],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      )}
    </motion.div>
  )
}
