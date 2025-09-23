import { motion } from 'framer-motion'
import { useId } from 'react'
import { RarityLevel, SeasonalVariant } from '@/types'

interface RainbowFlowerSVGProps {
  size?: number
  color?: string
  rarity?: RarityLevel
  season?: SeasonalVariant | undefined
  isSelected?: boolean
  isHovered?: boolean
  name?: string
}

export function RainbowFlowerSVG({
  size = 64,
  color: _color = '#ff69b4', // Базовый цвет не используется для радужного цветка
  rarity = RarityLevel.LEGENDARY,
  season: _season,
  isSelected = false,
  isHovered: _isHovered = false,
  name: _name = 'Rainbow Flower',
}: RainbowFlowerSVGProps) {
  const uniqueId = useId()

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
        return '#ff69b4'
    }
  }

  // TODO: Добавить сезонные модификации цветов
  // const getSeasonalColors = () => {
  //   // Базовые радужные цвета модифицируются по сезонам
  //   switch (season) {
  //     case SeasonalVariant.SPRING:
  //       return {
  //         primary: ['#ff69b4', '#00ffff', '#ffff00', '#00ff00', '#ff00ff'],
  //         accent: '#fce7f3',
  //         intensity: 0.9
  //       }
  //     case SeasonalVariant.SUMMER:
  //       return {
  //         primary: ['#ff1493', '#1e90ff', '#ffa500', '#32cd32', '#da70d6'],
  //         accent: '#fef3c7',
  //         intensity: 1.0
  //       }
  //     case SeasonalVariant.AUTUMN:
  //       return {
  //         primary: ['#dc2626', '#ea580c', '#f59e0b', '#eab308', '#f97316'],
  //         accent: '#fed7aa',
  //         intensity: 0.8
  //       }
  //     case SeasonalVariant.WINTER:
  //       return {
  //         primary: ['#e0e7ff', '#c7d2fe', '#cbd5e1', '#f1f5f9', '#e2e8f0'],
  //         accent: '#f8fafc',
  //         intensity: 0.6
  //       }
  //     default:
  //       return {
  //         primary: ['#ff69b4', '#00ffff', '#ffff00', '#00ff00', '#ff00ff'],
  //         accent: '#fce7f3',
  //         intensity: 0.9
  //       }
  //   }
  // }

  // const seasonalColors = getSeasonalColors() // TODO: использовать для сезонных модификаций цветов

  return (
    <motion.div
      className="relative flex items-center justify-center"
      style={{ width: size, height: size }}
      initial={{ scale: 0, rotate: -45 }}
      animate={{
        scale: 1,
        rotate: 0,
        filter: isSelected
          ? `drop-shadow(0 0 25px ${getRarityGlow()})`
          : 'none',
      }}
      transition={{
        type: 'spring',
        stiffness: 300,
        damping: 20,
        delay: Math.random() * 0.5,
      }}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{
          shapeRendering: 'geometricPrecision',
          textRendering: 'geometricPrecision',
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

        {/* Радужные лепестки с гладкими формами */}
        <motion.path
          d="M20 5 Q16 8 16 15 Q16 20 20 18 Q24 20 24 15 Q24 8 20 5 Z"
          fill={`url(#rainbow1-${uniqueId})`}
          filter={`url(#glow-${uniqueId})`}
          initial={{ scale: 0 }}
          animate={{
            scale: 1,
            rotate: [0, 5, -5, 0],
          }}
          transition={{
            scale: { delay: 1, duration: 0.3 },
            rotate: { duration: 3, repeat: Infinity, ease: 'easeInOut' },
          }}
          style={{ transformOrigin: '20px 15px' }}
        />

        <motion.path
          d="M28 8 Q31 12 28 18 Q25 22 20 18 Q25 14 28 8 Z"
          fill={`url(#rainbow2-${uniqueId})`}
          filter={`url(#glow-${uniqueId})`}
          initial={{ scale: 0 }}
          animate={{
            scale: 1,
            rotate: [0, 5, -5, 0],
          }}
          transition={{
            scale: { delay: 1.1, duration: 0.3 },
            rotate: { duration: 3.2, repeat: Infinity, ease: 'easeInOut' },
          }}
          style={{ transformOrigin: '20px 15px' }}
        />

        <motion.path
          d="M25 25 Q28 29 22 32 Q18 29 20 25 Q22 21 25 25 Z"
          fill={`url(#rainbow3-${uniqueId})`}
          filter={`url(#glow-${uniqueId})`}
          initial={{ scale: 0 }}
          animate={{
            scale: 1,
            rotate: [0, 5, -5, 0],
          }}
          transition={{
            scale: { delay: 1.2, duration: 0.3 },
            rotate: { duration: 2.8, repeat: Infinity, ease: 'easeInOut' },
          }}
          style={{ transformOrigin: '20px 15px' }}
        />

        <motion.path
          d="M15 25 Q12 29 18 32 Q22 29 20 25 Q18 21 15 25 Z"
          fill={`url(#rainbow4-${uniqueId})`}
          filter={`url(#glow-${uniqueId})`}
          initial={{ scale: 0 }}
          animate={{
            scale: 1,
            rotate: [0, 5, -5, 0],
          }}
          transition={{
            scale: { delay: 1.3, duration: 0.3 },
            rotate: { duration: 3.1, repeat: Infinity, ease: 'easeInOut' },
          }}
          style={{ transformOrigin: '20px 15px' }}
        />

        <motion.path
          d="M12 8 Q9 12 12 18 Q15 22 20 18 Q15 14 12 8 Z"
          fill={`url(#rainbow5-${uniqueId})`}
          filter={`url(#glow-${uniqueId})`}
          initial={{ scale: 0 }}
          animate={{
            scale: 1,
            rotate: [0, 5, -5, 0],
          }}
          transition={{
            scale: { delay: 1.4, duration: 0.3 },
            rotate: { duration: 2.9, repeat: Infinity, ease: 'easeInOut' },
          }}
          style={{ transformOrigin: '20px 15px' }}
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
      </svg>
    </motion.div>
  )
}
