import { motion } from 'framer-motion'
import { useId } from 'react'
import { RarityLevel, SeasonalVariant } from '@/types'

interface DecorationSVGProps {
  size?: number
  color?: string
  rarity?: RarityLevel
  season?: SeasonalVariant | undefined
  isSelected?: boolean
  isHovered?: boolean
  name?: string
}

export function DecorationSVG({
  size = 64,
  color = '#f59e0b',
  rarity = RarityLevel.COMMON,
  season,
  isSelected = false,
  isHovered: _isHovered = false,
  name = 'Decoration',
}: DecorationSVGProps) {
  const uniqueId = useId()
  const gradientId = `decoration-${uniqueId}`
  const wingGradientId = `wing-${uniqueId}`

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
    const baseColor = color
    switch (season) {
      case SeasonalVariant.SPRING:
        return {
          primary: '#ec4899', // Розовый весенний
          secondary: '#f97316',
          accent: '#fbbf24',
          wing: '#fce7f3',
        }
      case SeasonalVariant.SUMMER:
        return {
          primary: '#f59e0b', // Яркий летний оранжевый
          secondary: '#dc2626',
          accent: '#fbbf24',
          wing: '#fef3c7',
        }
      case SeasonalVariant.AUTUMN:
        return {
          primary: '#dc2626', // Тёплый осенний красный
          secondary: '#ea580c',
          accent: '#f59e0b',
          wing: '#fed7aa',
        }
      case SeasonalVariant.WINTER:
        return {
          primary: '#6366f1', // Холодный зимний фиолетовый
          secondary: '#8b5cf6',
          accent: '#a855f7',
          wing: '#e0e7ff',
        }
      default:
        return {
          primary: baseColor,
          secondary: '#f97316',
          accent: '#fbbf24',
          wing: '#fef3c7',
        }
    }
  }

  const seasonalColors = getSeasonalColors()

  // Определяем тип украшения по имени
  const isFirefly = name === 'Светлячок'

  const getSeasonalPattern = () => {
    switch (season) {
      case SeasonalVariant.SPRING:
        return (
          <>
            {/* Цветочные узоры */}
            <circle cx="16" cy="14" r="1.5" fill="#ec4899" opacity="0.7" />
            <circle cx="24" cy="18" r="1.2" fill="#f97316" opacity="0.6" />
            <circle cx="20" cy="22" r="1" fill="#fbbf24" opacity="0.8" />
          </>
        )
      case SeasonalVariant.SUMMER:
        return (
          <>
            {/* Солнечные пятна */}
            <path d="M18,16 L22,16 L20,20 Z" fill="#fbbf24" opacity="0.7" />
            <circle cx="15" cy="20" r="1.5" fill="#f59e0b" opacity="0.6" />
            <circle cx="25" cy="15" r="1" fill="#dc2626" opacity="0.5" />
          </>
        )
      case SeasonalVariant.AUTUMN:
        return (
          <>
            {/* Листовые узоры */}
            <path
              d="M17,15 Q19,13 21,15 Q19,17 17,15"
              fill="#dc2626"
              opacity="0.8"
            />
            <path
              d="M22,20 Q23,18 24,20 Q23,21 22,20"
              fill="#ea580c"
              opacity="0.7"
            />
          </>
        )
      case SeasonalVariant.WINTER:
        return (
          <>
            {/* Снежные узоры */}
            <g stroke="#e0e7ff" strokeWidth="0.5" fill="none" opacity="0.8">
              <path d="M18,15 L22,19 M22,15 L18,19 M20,13 L20,21 M16,17 L24,17" />
            </g>
          </>
        )
      default:
        return null
    }
  }

  return (
    <motion.div
      className="relative flex items-center justify-center"
      style={{ width: size, height: size }}
      initial={{ scale: 0, rotate: -180 }}
      animate={{
        scale: 1,
        rotate: 0,
        filter: isSelected
          ? `drop-shadow(0 0 20px ${getRarityGlow()})`
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
        <defs>
          <radialGradient id={gradientId} cx="50%" cy="40%" r="60%">
            <stop offset="0%" stopColor={seasonalColors.accent} />
            <stop offset="50%" stopColor={seasonalColors.primary} />
            <stop offset="100%" stopColor={seasonalColors.secondary} />
          </radialGradient>

          <linearGradient
            id={wingGradientId}
            x1="0%"
            y1="0%"
            x2="100%"
            y2="100%"
          >
            <stop offset="0%" stopColor={seasonalColors.wing} opacity="0.9" />
            <stop
              offset="50%"
              stopColor={seasonalColors.primary}
              opacity="0.7"
            />
            <stop
              offset="100%"
              stopColor={seasonalColors.secondary}
              opacity="0.5"
            />
          </linearGradient>

          {rarity === RarityLevel.LEGENDARY && (
            <filter id={`glow-${uniqueId}`}>
              <feGaussianBlur stdDeviation="2" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          )}
        </defs>

        {/* Рендер в зависимости от типа украшения */}
        {isFirefly ? (
          // СВЕТЛЯЧОК - простое светящееся тело с мерцанием
          <motion.g filter={`url(#glow-${uniqueId})`}>
            {/* Основное тело светлячка */}
            <motion.ellipse
              cx="20"
              cy="20"
              rx="3"
              ry="6"
              fill={seasonalColors.primary}
              animate={{
                opacity: [0.7, 1, 0.7],
                scale: [1, 1.1, 1],
                transition: {
                  duration: 1.5,
                  repeat: Infinity,
                  ease: 'easeInOut',
                },
              }}
            />

            {/* Светящаяся аура */}
            <motion.circle
              cx="20"
              cy="20"
              r="8"
              fill={seasonalColors.accent}
              opacity="0.3"
              animate={{
                r: [8, 12, 8],
                opacity: [0.3, 0.1, 0.3],
                transition: {
                  duration: 2,
                  repeat: Infinity,
                  ease: 'easeInOut',
                },
              }}
            />

            {/* Мерцающие точки света */}
            {Array.from({ length: 6 }, (_, i) => (
              <motion.circle
                key={i}
                cx={20 + Math.cos((i * 60 * Math.PI) / 180) * 10}
                cy={20 + Math.sin((i * 60 * Math.PI) / 180) * 10}
                r="1"
                fill={seasonalColors.accent}
                animate={{
                  opacity: [0, 1, 0],
                  scale: [0, 1, 0],
                  transition: {
                    duration: 2,
                    repeat: Infinity,
                    delay: i * 0.3,
                    ease: 'easeInOut',
                  },
                }}
              />
            ))}

            {/* Световые лучи */}
            <motion.g
              animate={{
                rotate: [0, 360],
                transition: { duration: 8, repeat: Infinity, ease: 'linear' },
              }}
              style={{ transformOrigin: '20px 20px' }}
            >
              <path
                d="M20 12 L20 8"
                stroke={seasonalColors.accent}
                strokeWidth="1"
                opacity="0.6"
              />
              <path
                d="M20 32 L20 28"
                stroke={seasonalColors.accent}
                strokeWidth="1"
                opacity="0.6"
              />
              <path
                d="M12 20 L8 20"
                stroke={seasonalColors.accent}
                strokeWidth="1"
                opacity="0.6"
              />
              <path
                d="M32 20 L28 20"
                stroke={seasonalColors.accent}
                strokeWidth="1"
                opacity="0.6"
              />
            </motion.g>
          </motion.g>
        ) : (
          // БАБОЧКА - сложные крылья и тело
          <>
            {/* Тело бабочки */}
            <motion.ellipse
              cx="20"
              cy="20"
              rx="1.5"
              ry="8"
              fill={seasonalColors.secondary}
              animate={{
                ry: [8, 8.5, 8],
                transition: {
                  duration: 2,
                  repeat: Infinity,
                  ease: 'easeInOut',
                },
              }}
            />

            {/* Усики */}
            <motion.g
              animate={{
                rotate: [-2, 2, -2],
                transition: {
                  duration: 3,
                  repeat: Infinity,
                  ease: 'easeInOut',
                },
              }}
              style={{ transformOrigin: '20px 12px' }}
            >
              <path
                d="M18 12 Q16 8 14 10"
                stroke={seasonalColors.secondary}
                strokeWidth="1"
                fill="none"
                strokeLinecap="round"
              />
              <path
                d="M22 12 Q24 8 26 10"
                stroke={seasonalColors.secondary}
                strokeWidth="1"
                fill="none"
                strokeLinecap="round"
              />
              <circle cx="14" cy="10" r="0.5" fill={seasonalColors.accent} />
              <circle cx="26" cy="10" r="0.5" fill={seasonalColors.accent} />
            </motion.g>

            {/* Верхние крылья */}
            <motion.g
              animate={{
                rotate: [-5, 5, -5],
                transition: {
                  duration: 1.5,
                  repeat: Infinity,
                  ease: 'easeInOut',
                },
              }}
              style={{ transformOrigin: '20px 20px' }}
              filter={
                rarity === RarityLevel.LEGENDARY
                  ? `url(#glow-${uniqueId})`
                  : undefined
              }
            >
              {/* Левое верхнее крыло */}
              <path
                d="M18 16 Q8 10 6 18 Q8 24 14 22 Q18 20 18 16 Z"
                fill={`url(#${wingGradientId})`}
                stroke={seasonalColors.primary}
                strokeWidth="0.5"
              />

              {/* Правое верхнее крыло */}
              <path
                d="M22 16 Q32 10 34 18 Q32 24 26 22 Q22 20 22 16 Z"
                fill={`url(#${wingGradientId})`}
                stroke={seasonalColors.primary}
                strokeWidth="0.5"
              />

              {/* Нижние крылья */}
              {/* Левое нижнее крыло */}
              <path
                d="M18 22 Q10 26 8 30 Q10 34 16 32 Q18 28 18 22 Z"
                fill={`url(#${wingGradientId})`}
                stroke={seasonalColors.primary}
                strokeWidth="0.5"
                opacity="0.9"
              />

              {/* Правое нижнее крыло */}
              <path
                d="M22 22 Q30 26 32 30 Q30 34 24 32 Q22 28 22 22 Z"
                fill={`url(#${wingGradientId})`}
                stroke={seasonalColors.primary}
                strokeWidth="0.5"
                opacity="0.9"
              />
            </motion.g>

            {/* Узоры на крыльях */}
            <motion.g
              animate={{
                opacity: [0.6, 1, 0.6],
                transition: { duration: 2.5, repeat: Infinity },
              }}
            >
              {getSeasonalPattern()}
            </motion.g>
          </>
        )}

        {/* Премиум эффекты */}
        {rarity === RarityLevel.EPIC && (
          <motion.g
            animate={{
              rotate: [0, 360],
              transition: { duration: 8, repeat: Infinity, ease: 'linear' },
            }}
            style={{ transformOrigin: '20px 20px' }}
          >
            <circle cx="12" cy="18" r="1" fill="#a855f7" opacity="0.6" />
            <circle cx="28" cy="18" r="1" fill="#a855f7" opacity="0.6" />
            <circle cx="16" cy="26" r="0.8" fill="#a855f7" opacity="0.5" />
            <circle cx="24" cy="26" r="0.8" fill="#a855f7" opacity="0.5" />
          </motion.g>
        )}

        {rarity === RarityLevel.LEGENDARY && (
          <>
            <motion.g
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.5, 1, 0.5],
                transition: { duration: 2, repeat: Infinity },
              }}
            >
              <circle cx="20" cy="20" r="12" fill="#f59e0b" opacity="0.1" />
              <circle cx="20" cy="20" r="8" fill="#fbbf24" opacity="0.2" />
            </motion.g>

            {/* Искры вокруг */}
            <motion.g
              animate={{
                rotate: [0, 360],
                transition: { duration: 6, repeat: Infinity, ease: 'linear' },
              }}
              style={{ transformOrigin: '20px 20px' }}
            >
              <circle cx="8" cy="20" r="1" fill="#fbbf24" opacity="0.8" />
              <circle cx="32" cy="20" r="1" fill="#fbbf24" opacity="0.8" />
              <circle cx="20" cy="8" r="1" fill="#f59e0b" opacity="0.8" />
              <circle cx="20" cy="32" r="1" fill="#f59e0b" opacity="0.8" />
            </motion.g>
          </>
        )}
      </svg>
    </motion.div>
  )
}
