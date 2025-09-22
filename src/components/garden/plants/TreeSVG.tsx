import { motion } from 'framer-motion'
import { useId } from 'react'
import { RarityLevel } from '@/types'

interface TreeSVGProps {
  size?: number
  color?: string
  rarity?: RarityLevel
  isSelected?: boolean
  isHovered?: boolean
  name?: string
}

export function TreeSVG({
  size = 64,
  color = '#22c55e',
  rarity = RarityLevel.COMMON,
  isSelected = false,
  isHovered: _isHovered = false,
  name: _name = 'Tree',
}: TreeSVGProps) {
  const uniqueId = useId()
  const gradientId = `tree-${uniqueId}`

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
        y: -3,
      }}
      transition={{
        type: 'spring',
        stiffness: 200,
        damping: 20,
      }}
    >
      {/* Wind particles for legendary trees */}
      {(rarity === RarityLevel.LEGENDARY || rarity === RarityLevel.EPIC) && (
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          {Array.from({ length: 8 }, (_, i) => (
            <motion.div
              key={i}
              className="absolute h-1 w-1 rounded-full bg-green-300"
              style={{
                left: `${10 + Math.random() * 80}%`,
                top: `${10 + Math.random() * 30}%`,
              }}
              animate={{
                x: [0, 50, -20, 0],
                y: [0, -20, 10, 0],
                opacity: [0, 1, 0.5, 0],
                scale: [0.5, 1, 0.8, 0.5],
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
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
        viewBox="0 0 100 100"
        className="overflow-visible"
      >
        <defs>
          {/* Trunk gradient */}
          <linearGradient
            id={`${gradientId}-trunk`}
            x1="0%"
            y1="0%"
            x2="100%"
            y2="0%"
          >
            <stop
              offset="0%"
              style={{ stopColor: '#92400e', stopOpacity: 1 }}
            />
            <stop
              offset="50%"
              style={{ stopColor: '#a16207', stopOpacity: 1 }}
            />
            <stop
              offset="100%"
              style={{ stopColor: '#78350f', stopOpacity: 1 }}
            />
          </linearGradient>

          {/* Leaves gradient */}
          <radialGradient id={`${gradientId}-leaves`} cx="50%" cy="50%" r="60%">
            <stop
              offset="0%"
              style={{ stopColor: '#22c55e', stopOpacity: 1 }}
            />
            <stop
              offset="60%"
              style={{ stopColor: '#16a34a', stopOpacity: 0.9 }}
            />
            <stop
              offset="100%"
              style={{ stopColor: '#15803d', stopOpacity: 0.8 }}
            />
          </radialGradient>

          {/* Shadow filter */}
          <filter id={`${gradientId}-shadow`}>
            <feDropShadow
              dx="0"
              dy="4"
              stdDeviation="4"
              floodColor="#000"
              floodOpacity="0.2"
            />
          </filter>
        </defs>

        {/* Trunk - extended up to connect with crown */}
        <motion.rect
          x="45"
          y="45"
          width="10"
          height="45"
          fill={`url(#${gradientId}-trunk)`}
          rx="2"
          filter={`url(#${gradientId}-shadow)`}
          initial={{ scaleY: 0, y: 50 }}
          animate={{ scaleY: 1, y: 5 }}
          transition={{ duration: 1, delay: 0.3 }}
        />

        {/* Trunk texture lines */}
        {Array.from({ length: 6 }, (_, i) => (
          <motion.line
            key={i}
            x1="46"
            y1={65 + i * 6}
            x2="54"
            y2={65 + i * 6}
            stroke="#78350f"
            strokeWidth="0.5"
            opacity="0.6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.6 }}
            transition={{ delay: 1 + i * 0.1 }}
          />
        ))}

        {/* Main crown */}
        <motion.circle
          cx="50"
          cy="45"
          r="25"
          fill={`url(#${gradientId}-leaves)`}
          filter={`url(#${gradientId}-shadow)`}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{
            duration: 0.8,
            delay: 0.6,
            type: 'spring',
            stiffness: 150,
          }}
        />

        {/* Additional leaf clusters */}
        <motion.circle
          cx="35"
          cy="35"
          r="15"
          fill={`url(#${gradientId}-leaves)`}
          opacity="0.8"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.6, delay: 0.8 }}
        />

        <motion.circle
          cx="65"
          cy="40"
          r="12"
          fill={`url(#${gradientId}-leaves)`}
          opacity="0.7"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.6, delay: 1.0 }}
        />

        {/* Swaying leaves animation */}
        <motion.g
          animate={{
            rotate: [-1, 1, -1],
            transformOrigin: '50 60',
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        >
          {/* Individual leaves */}
          {Array.from({ length: 12 }, (_, i) => {
            const angle = i * 30
            const radius = 20 + Math.random() * 10
            const x = 50 + Math.cos((angle * Math.PI) / 180) * radius
            const y = 45 + Math.sin((angle * Math.PI) / 180) * radius

            return (
              <motion.ellipse
                key={i}
                cx={x}
                cy={y}
                rx="3"
                ry="6"
                fill="#22c55e"
                opacity="0.7"
                transform={`rotate(${angle} ${x} ${y})`}
                initial={{ scale: 0, rotate: angle - 90 }}
                animate={{
                  scale: 1,
                  rotate: angle,
                }}
                transition={{
                  duration: 0.4,
                  delay: 1.2 + i * 0.05,
                }}
              />
            )
          })}
        </motion.g>

        {/* Fruits for rare trees */}
        {(rarity === RarityLevel.RARE ||
          rarity === RarityLevel.EPIC ||
          rarity === RarityLevel.LEGENDARY) && (
          <motion.g>
            {Array.from({ length: 3 }, (_, i) => {
              const positions = [
                { x: 40, y: 35 },
                { x: 60, y: 50 },
                { x: 45, y: 30 },
              ]
              const pos = positions[i]
              if (!pos) return null

              return (
                <motion.circle
                  key={i}
                  cx={pos.x}
                  cy={pos.y}
                  r="2.5"
                  fill="#dc2626"
                  initial={{ scale: 0 }}
                  animate={{
                    scale: [0, 1.2, 1],
                  }}
                  transition={{
                    duration: 0.6,
                    delay: 1.5 + i * 0.2,
                    type: 'spring',
                  }}
                />
              )
            })}
          </motion.g>
        )}

        {/* Magical energy for legendary */}
        {rarity === RarityLevel.LEGENDARY && (
          <motion.circle
            cx="50"
            cy="45"
            r="30"
            fill="none"
            stroke="#fbbf24"
            strokeWidth="1"
            opacity="0.4"
            initial={{ scale: 0, opacity: 0 }}
            animate={{
              scale: [1, 1.1, 1],
              opacity: [0.4, 0.1, 0.4],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              delay: 2,
            }}
          />
        )}
      </motion.svg>

      {/* Magical aura */}
      {rarity !== RarityLevel.COMMON && (
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{
            background: `radial-gradient(circle, ${getRarityGlow()}15 0%, transparent 80%)`,
          }}
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.2, 0.4, 0.2],
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
