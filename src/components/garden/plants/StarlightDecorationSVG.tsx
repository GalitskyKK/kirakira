import { motion } from 'framer-motion'
import { useId } from 'react'
import { RarityLevel, SeasonalVariant } from '@/types'

interface StarlightDecorationSVGProps {
  size?: number
  color?: string
  rarity?: RarityLevel
  season?: SeasonalVariant | undefined
  isSelected?: boolean
  isHovered?: boolean
  name?: string
}

export function StarlightDecorationSVG({
  size = 64,
  color = '#fbbf24',
  rarity = RarityLevel.LEGENDARY,
  season,
  isSelected = false,
  isHovered: _isHovered = false,
  name: _name = 'Starlight Decoration',
}: StarlightDecorationSVGProps) {
  const uniqueId = useId()
  const gradientId = `starlight-${uniqueId}`
  const rayGradientId = `ray-${uniqueId}`

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
    const baseGold = color
    switch (season) {
      case SeasonalVariant.SPRING:
        return {
          primary: '#22d3ee', // Весенний голубой
          secondary: '#06b6d4',
          accent: '#67e8f9',
          core: '#f0f9ff',
        }
      case SeasonalVariant.SUMMER:
        return {
          primary: '#fbbf24', // Летний золотой
          secondary: '#f59e0b',
          accent: '#fde047',
          core: '#fffbeb',
        }
      case SeasonalVariant.AUTUMN:
        return {
          primary: '#f97316', // Осенний оранжевый
          secondary: '#ea580c',
          accent: '#fb923c',
          core: '#fff7ed',
        }
      case SeasonalVariant.WINTER:
        return {
          primary: '#e0e7ff', // Зимний серебристый
          secondary: '#c7d2fe',
          accent: '#f1f5f9',
          core: '#ffffff',
        }
      default:
        return {
          primary: baseGold,
          secondary: '#f59e0b',
          accent: '#fde047',
          core: '#fffbeb',
        }
    }
  }

  const seasonalColors = getSeasonalColors()

  const getSeasonalAura = () => {
    switch (season) {
      case SeasonalVariant.SPRING:
        return (
          <motion.g
            animate={{
              opacity: [0.3, 0.8, 0.3],
              scale: [1, 1.1, 1],
              transition: { duration: 3, repeat: Infinity },
            }}
          >
            <circle cx="20" cy="20" r="18" fill="#22d3ee" opacity="0.1" />
            <circle cx="20" cy="20" r="14" fill="#67e8f9" opacity="0.15" />
          </motion.g>
        )
      case SeasonalVariant.SUMMER:
        return (
          <motion.g
            animate={{
              opacity: [0.4, 1, 0.4],
              scale: [1, 1.2, 1],
              transition: { duration: 2, repeat: Infinity },
            }}
          >
            <circle cx="20" cy="20" r="18" fill="#fbbf24" opacity="0.15" />
            <circle cx="20" cy="20" r="14" fill="#fde047" opacity="0.2" />
          </motion.g>
        )
      case SeasonalVariant.AUTUMN:
        return (
          <motion.g
            animate={{
              opacity: [0.3, 0.9, 0.3],
              rotate: [0, 360],
              transition: {
                opacity: { duration: 2.5, repeat: Infinity },
                rotate: { duration: 8, repeat: Infinity, ease: 'linear' },
              },
            }}
            style={{ transformOrigin: '20px 20px' }}
          >
            <circle cx="20" cy="20" r="18" fill="#f97316" opacity="0.12" />
            <circle cx="20" cy="20" r="14" fill="#fb923c" opacity="0.18" />
          </motion.g>
        )
      case SeasonalVariant.WINTER:
        return (
          <motion.g
            animate={{
              opacity: [0.2, 0.6, 0.2],
              scale: [1, 1.15, 1],
              transition: { duration: 4, repeat: Infinity },
            }}
          >
            <circle cx="20" cy="20" r="18" fill="#e0e7ff" opacity="0.2" />
            <circle cx="20" cy="20" r="14" fill="#f1f5f9" opacity="0.3" />
          </motion.g>
        )
      default:
        return null
    }
  }

  return (
    <motion.div
      className="relative flex items-center justify-center"
      style={{ width: size, height: size }}
      initial={{ scale: 0, opacity: 0, rotate: -90 }}
      animate={{
        scale: 1,
        opacity: 1,
        rotate: 0,
        filter: isSelected
          ? `drop-shadow(0 0 25px ${getRarityGlow()})`
          : 'none',
      }}
      transition={{
        type: 'spring',
        stiffness: 200,
        damping: 15,
        delay: Math.random() * 0.7,
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
        <defs>
          <radialGradient id={gradientId} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={seasonalColors.core} />
            <stop offset="40%" stopColor={seasonalColors.accent} />
            <stop offset="70%" stopColor={seasonalColors.primary} />
            <stop offset="100%" stopColor={seasonalColors.secondary} />
          </radialGradient>

          <linearGradient
            id={rayGradientId}
            x1="50%"
            y1="0%"
            x2="50%"
            y2="100%"
          >
            <stop offset="0%" stopColor={seasonalColors.accent} opacity="0.9" />
            <stop
              offset="50%"
              stopColor={seasonalColors.primary}
              opacity="0.7"
            />
            <stop
              offset="100%"
              stopColor={seasonalColors.secondary}
              opacity="0.3"
            />
          </linearGradient>

          <filter id={`glow-${uniqueId}`}>
            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <filter id={`intense-glow-${uniqueId}`}>
            <feGaussianBlur stdDeviation="4" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Сезонная аура */}
        {getSeasonalAura()}

        {/* Внешние лучи */}
        <motion.g
          animate={{
            rotate: [0, 360],
            transition: { duration: 12, repeat: Infinity, ease: 'linear' },
          }}
          style={{ transformOrigin: '20px 20px' }}
          filter={`url(#glow-${uniqueId})`}
        >
          {/* Длинные лучи */}
          <path
            d="M20 2 L21 10 L20 18 L19 10 Z"
            fill={`url(#${rayGradientId})`}
            opacity="0.8"
          />
          <path
            d="M38 20 L30 21 L22 20 L30 19 Z"
            fill={`url(#${rayGradientId})`}
            opacity="0.8"
          />
          <path
            d="M20 38 L19 30 L20 22 L21 30 Z"
            fill={`url(#${rayGradientId})`}
            opacity="0.8"
          />
          <path
            d="M2 20 L10 19 L18 20 L10 21 Z"
            fill={`url(#${rayGradientId})`}
            opacity="0.8"
          />

          {/* Диагональные лучи */}
          <path
            d="M33 7 L28 12 L23 17 L28 12 Z"
            fill={`url(#${rayGradientId})`}
            opacity="0.7"
          />
          <path
            d="M33 33 L28 28 L23 23 L28 28 Z"
            fill={`url(#${rayGradientId})`}
            opacity="0.7"
          />
          <path
            d="M7 33 L12 28 L17 23 L12 28 Z"
            fill={`url(#${rayGradientId})`}
            opacity="0.7"
          />
          <path
            d="M7 7 L12 12 L17 17 L12 12 Z"
            fill={`url(#${rayGradientId})`}
            opacity="0.7"
          />
        </motion.g>

        {/* Внутренние лучи */}
        <motion.g
          animate={{
            rotate: [0, -360],
            transition: { duration: 8, repeat: Infinity, ease: 'linear' },
          }}
          style={{ transformOrigin: '20px 20px' }}
          filter={`url(#glow-${uniqueId})`}
        >
          <path
            d="M20 8 L20.5 14 L20 20 L19.5 14 Z"
            fill={seasonalColors.accent}
            opacity="0.9"
          />
          <path
            d="M32 20 L26 20.5 L20 20 L26 19.5 Z"
            fill={seasonalColors.accent}
            opacity="0.9"
          />
          <path
            d="M20 32 L19.5 26 L20 20 L20.5 26 Z"
            fill={seasonalColors.accent}
            opacity="0.9"
          />
          <path
            d="M8 20 L14 19.5 L20 20 L14 20.5 Z"
            fill={seasonalColors.accent}
            opacity="0.9"
          />
        </motion.g>

        {/* Центральная звезда */}
        <motion.g
          animate={{
            scale: [1, 1.1, 1],
            rotate: [0, 180, 360],
            transition: {
              scale: { duration: 2, repeat: Infinity },
              rotate: { duration: 6, repeat: Infinity, ease: 'linear' },
            },
          }}
          style={{ transformOrigin: '20px 20px' }}
          filter={`url(#intense-glow-${uniqueId})`}
        >
          <path
            d="M20 12 L22 18 L28 18 L23 22 L25 28 L20 24 L15 28 L17 22 L12 18 L18 18 Z"
            fill={`url(#${gradientId})`}
            stroke={seasonalColors.accent}
            strokeWidth="0.5"
          />
        </motion.g>

        {/* Центральное ядро */}
        <motion.circle
          cx="20"
          cy="20"
          r="3"
          fill={seasonalColors.core}
          animate={{
            r: [3, 4, 3],
            opacity: [0.9, 1, 0.9],
            transition: { duration: 1.5, repeat: Infinity },
          }}
          filter={`url(#intense-glow-${uniqueId})`}
        />

        {/* Орбитальные частицы */}
        <motion.g
          animate={{
            rotate: [0, 360],
            transition: { duration: 10, repeat: Infinity, ease: 'linear' },
          }}
          style={{ transformOrigin: '20px 20px' }}
        >
          <circle
            cx="28"
            cy="20"
            r="1"
            fill={seasonalColors.accent}
            opacity="0.8"
          />
          <circle
            cx="12"
            cy="20"
            r="0.8"
            fill={seasonalColors.primary}
            opacity="0.7"
          />
        </motion.g>

        <motion.g
          animate={{
            rotate: [0, -360],
            transition: { duration: 15, repeat: Infinity, ease: 'linear' },
          }}
          style={{ transformOrigin: '20px 20px' }}
        >
          <circle
            cx="20"
            cy="12"
            r="0.8"
            fill={seasonalColors.accent}
            opacity="0.6"
          />
          <circle
            cx="20"
            cy="28"
            r="1"
            fill={seasonalColors.primary}
            opacity="0.8"
          />
          <circle
            cx="26"
            cy="14"
            r="0.6"
            fill={seasonalColors.core}
            opacity="0.9"
          />
          <circle
            cx="14"
            cy="26"
            r="0.7"
            fill={seasonalColors.core}
            opacity="0.7"
          />
        </motion.g>

        {/* Легендарные эффекты */}
        {rarity === RarityLevel.LEGENDARY && (
          <>
            <motion.g
              animate={{
                scale: [1, 1.3, 1],
                opacity: [0.3, 0.8, 0.3],
                transition: { duration: 3, repeat: Infinity },
              }}
            >
              <circle cx="20" cy="20" r="25" fill="#f59e0b" opacity="0.05" />
              <circle cx="20" cy="20" r="20" fill="#fbbf24" opacity="0.1" />
            </motion.g>

            {/* Дополнительные искры */}
            <motion.g
              animate={{
                rotate: [0, 360],
                transition: { duration: 4, repeat: Infinity, ease: 'linear' },
              }}
              style={{ transformOrigin: '20px 20px' }}
            >
              <circle cx="32" cy="12" r="0.8" fill="#fbbf24" opacity="0.9" />
              <circle cx="8" cy="28" r="1" fill="#f59e0b" opacity="0.8" />
              <circle cx="32" cy="28" r="0.6" fill="#fde047" opacity="0.7" />
              <circle cx="8" cy="12" r="0.9" fill="#fbbf24" opacity="0.8" />
            </motion.g>
          </>
        )}
      </svg>
    </motion.div>
  )
}
