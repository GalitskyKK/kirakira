import { motion } from 'framer-motion'
import { useId } from 'react'
import type { SVGProps } from 'react'

interface RainbowFlowerSVGProps extends SVGProps<SVGSVGElement> {
  size?: number
}

export function RainbowFlowerSVG({
  size = 40,
  className,
  onClick,
}: RainbowFlowerSVGProps) {
  const uniqueId = useId()

  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      onClick={onClick}
      style={{
        shapeRendering: 'geometricPrecision',
        textRendering: 'geometricPrecision',
      }}
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{
        type: 'spring',
        stiffness: 300,
        damping: 20,
        delay: Math.random() * 0.5,
      }}
    >
      {/* Градиенты для радужных лепестков */}
      <defs>
        <linearGradient
          id={`rainbow1-${uniqueId}`}
          x1="0%"
          y1="0%"
          x2="100%"
          y2="100%"
        >
          <stop offset="0%" stopColor="#ff69b4" stopOpacity="0.9" />
          <stop offset="30%" stopColor="#ff1493" stopOpacity="0.8" />
          <stop offset="70%" stopColor="#ff69b4" stopOpacity="0.7" />
          <stop offset="100%" stopColor="#c71585" stopOpacity="0.6" />
        </linearGradient>
        <linearGradient
          id={`rainbow2-${uniqueId}`}
          x1="100%"
          y1="0%"
          x2="0%"
          y2="100%"
        >
          <stop offset="0%" stopColor="#00ffff" stopOpacity="0.9" />
          <stop offset="30%" stopColor="#1e90ff" stopOpacity="0.8" />
          <stop offset="70%" stopColor="#00bfff" stopOpacity="0.7" />
          <stop offset="100%" stopColor="#0080ff" stopOpacity="0.6" />
        </linearGradient>
        <linearGradient
          id={`rainbow3-${uniqueId}`}
          x1="0%"
          y1="100%"
          x2="100%"
          y2="0%"
        >
          <stop offset="0%" stopColor="#ffff00" stopOpacity="0.9" />
          <stop offset="30%" stopColor="#ffa500" stopOpacity="0.8" />
          <stop offset="70%" stopColor="#ff8c00" stopOpacity="0.7" />
          <stop offset="100%" stopColor="#ff6347" stopOpacity="0.6" />
        </linearGradient>
        <linearGradient
          id={`rainbow4-${uniqueId}`}
          x1="100%"
          y1="100%"
          x2="0%"
          y2="0%"
        >
          <stop offset="0%" stopColor="#00ff00" stopOpacity="0.9" />
          <stop offset="30%" stopColor="#32cd32" stopOpacity="0.8" />
          <stop offset="70%" stopColor="#00ff7f" stopOpacity="0.7" />
          <stop offset="100%" stopColor="#228b22" stopOpacity="0.6" />
        </linearGradient>
        <linearGradient
          id={`rainbow5-${uniqueId}`}
          x1="50%"
          y1="0%"
          x2="50%"
          y2="100%"
        >
          <stop offset="0%" stopColor="#ff00ff" stopOpacity="0.9" />
          <stop offset="30%" stopColor="#da70d6" stopOpacity="0.8" />
          <stop offset="70%" stopColor="#dda0dd" stopOpacity="0.7" />
          <stop offset="100%" stopColor="#ba55d3" stopOpacity="0.6" />
        </linearGradient>
        <radialGradient id={`center-${uniqueId}`} cx="50%" cy="50%" r="70%">
          <stop offset="0%" stopColor="#ffd700" stopOpacity="1" />
          <stop offset="40%" stopColor="#ffb347" stopOpacity="0.9" />
          <stop offset="70%" stopColor="#ff8c00" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#ff6347" stopOpacity="0.6" />
        </radialGradient>
        <filter id={`glow-${uniqueId}`}>
          <feGaussianBlur stdDeviation="3" result="coloredBlur" />
          <feColorMatrix
            type="matrix"
            values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 0.7 0"
            result="softenedBlur"
          />
          <feMerge>
            <feMergeNode in="softenedBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Стебель */}
      <motion.path
        d="M20 35 Q18 30 20 25 Q22 20 20 15"
        stroke="#4ade80"
        strokeWidth="2"
        fill="none"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1, delay: 0.5 }}
      />

      {/* Листья */}
      <motion.ellipse
        cx="15"
        cy="25"
        rx="3"
        ry="5"
        fill="#22c55e"
        transform="rotate(-30 15 25)"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.8 }}
      />
      <motion.ellipse
        cx="25"
        cy="22"
        rx="3"
        ry="5"
        fill="#22c55e"
        transform="rotate(30 25 22)"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.9 }}
      />

      {/* Радужные лепестки с анимацией */}
      <motion.ellipse
        cx="20"
        cy="8"
        rx="4"
        ry="8"
        fill={`url(#rainbow1-${uniqueId})`}
        filter={`url(#glow-${uniqueId})`}
        initial={{ scale: 0, rotate: 0 }}
        animate={{
          scale: 1,
          rotate: [0, 5, -5, 0],
        }}
        transition={{
          scale: { delay: 1, duration: 0.3 },
          rotate: { duration: 3, repeat: Infinity, ease: 'easeInOut' },
        }}
      />

      <motion.ellipse
        cx="26"
        cy="12"
        rx="4"
        ry="8"
        fill={`url(#rainbow2-${uniqueId})`}
        filter={`url(#glow-${uniqueId})`}
        transform="rotate(72 20 15)"
        initial={{ scale: 0 }}
        animate={{
          scale: 1,
          rotate: [72, 77, 67, 72],
        }}
        transition={{
          scale: { delay: 1.1, duration: 0.3 },
          rotate: { duration: 3.2, repeat: Infinity, ease: 'easeInOut' },
        }}
      />

      <motion.ellipse
        cx="24"
        cy="22"
        rx="4"
        ry="8"
        fill={`url(#rainbow3-${uniqueId})`}
        filter={`url(#glow-${uniqueId})`}
        transform="rotate(144 20 15)"
        initial={{ scale: 0 }}
        animate={{
          scale: 1,
          rotate: [144, 149, 139, 144],
        }}
        transition={{
          scale: { delay: 1.2, duration: 0.3 },
          rotate: { duration: 2.8, repeat: Infinity, ease: 'easeInOut' },
        }}
      />

      <motion.ellipse
        cx="16"
        cy="22"
        rx="4"
        ry="8"
        fill={`url(#rainbow4-${uniqueId})`}
        filter={`url(#glow-${uniqueId})`}
        transform="rotate(216 20 15)"
        initial={{ scale: 0 }}
        animate={{
          scale: 1,
          rotate: [216, 221, 211, 216],
        }}
        transition={{
          scale: { delay: 1.3, duration: 0.3 },
          rotate: { duration: 3.1, repeat: Infinity, ease: 'easeInOut' },
        }}
      />

      <motion.ellipse
        cx="14"
        cy="12"
        rx="4"
        ry="8"
        fill={`url(#rainbow5-${uniqueId})`}
        filter={`url(#glow-${uniqueId})`}
        transform="rotate(288 20 15)"
        initial={{ scale: 0 }}
        animate={{
          scale: 1,
          rotate: [288, 293, 283, 288],
        }}
        transition={{
          scale: { delay: 1.4, duration: 0.3 },
          rotate: { duration: 2.9, repeat: Infinity, ease: 'easeInOut' },
        }}
      />

      {/* Сверкающий центр */}
      <motion.circle
        cx="20"
        cy="15"
        r="3"
        fill={`url(#center-${uniqueId})`}
        filter={`url(#glow-${uniqueId})`}
        initial={{ scale: 0 }}
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.8, 1, 0.8],
        }}
        transition={{
          scale: { delay: 1.5, duration: 0.3 },
          opacity: { duration: 2, repeat: Infinity, ease: 'easeInOut' },
        }}
      />

      {/* Блестящие частицы */}
      {[...Array(6)].map((_, i) => (
        <motion.circle
          key={i}
          cx={20 + Math.cos((i * 60 * Math.PI) / 180) * 12}
          cy={15 + Math.sin((i * 60 * Math.PI) / 180) * 12}
          r="0.5"
          fill="#ffffff"
          initial={{ scale: 0, opacity: 0 }}
          animate={{
            scale: [0, 1, 0],
            opacity: [0, 1, 0],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            delay: 2 + i * 0.2,
            ease: 'easeInOut',
          }}
        />
      ))}
    </motion.svg>
  )
}
