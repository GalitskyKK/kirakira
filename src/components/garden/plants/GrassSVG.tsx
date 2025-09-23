import { motion } from 'framer-motion'
import { useId } from 'react'
import { RarityLevel, SeasonalVariant } from '@/types'

interface GrassSVGProps {
  size?: number
  color?: string
  rarity?: RarityLevel
  season?: SeasonalVariant | undefined
  isSelected?: boolean
  isHovered?: boolean
  name?: string
}

export function GrassSVG({
  size = 64,
  color = '#22c55e',
  rarity = RarityLevel.COMMON,
  season,
  isSelected = false,
  isHovered: _isHovered = false,
  name = 'Grass',
}: GrassSVGProps) {
  const uniqueId = useId()
  const gradientId = `grass-${uniqueId}`

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
    const baseGreen = color
    switch (season) {
      case SeasonalVariant.SPRING:
        return {
          primary: '#65a30d', // Свежий зеленый
          secondary: '#84cc16',
          accent: '#a3e635',
        }
      case SeasonalVariant.SUMMER:
        return {
          primary: '#16a34a', // Насыщенный зеленый
          secondary: '#22c55e',
          accent: '#4ade80',
        }
      case SeasonalVariant.AUTUMN:
        return {
          primary: '#a16207', // Желто-коричневый
          secondary: '#ca8a04',
          accent: '#eab308',
        }
      case SeasonalVariant.WINTER:
        return {
          primary: '#64748b', // Серо-зеленый
          secondary: '#94a3b8',
          accent: '#cbd5e1',
        }
      default:
        return {
          primary: baseGreen,
          secondary: '#16a34a',
          accent: '#4ade80',
        }
    }
  }

  const seasonalColors = getSeasonalColors()

  // Определяем тип элемента по имени
  const isMoss = name === 'Мох'

  const getSeasonalDecorations = () => {
    switch (season) {
      case SeasonalVariant.SPRING:
        return (
          <>
            {/* Капли росы */}
            <circle cx="12" cy="25" r="1" fill="#06b6d4" opacity="0.6" />
            <circle cx="28" cy="30" r="0.8" fill="#06b6d4" opacity="0.5" />
          </>
        )
      case SeasonalVariant.SUMMER:
        return (
          <>
            {/* Солнечные блики */}
            <circle cx="15" cy="20" r="1.5" fill="#fbbf24" opacity="0.7" />
            <circle cx="25" cy="25" r="1" fill="#fbbf24" opacity="0.5" />
          </>
        )
      case SeasonalVariant.AUTUMN:
        return (
          <>
            {/* Опавшие листья */}
            <ellipse
              cx="10"
              cy="35"
              rx="3"
              ry="1.5"
              fill="#dc2626"
              opacity="0.6"
            />
            <ellipse
              cx="30"
              cy="38"
              rx="2"
              ry="1"
              fill="#ea580c"
              opacity="0.7"
            />
          </>
        )
      case SeasonalVariant.WINTER:
        return (
          <>
            {/* Снежинки */}
            <g stroke="#f1f5f9" strokeWidth="0.5" fill="none" opacity="0.8">
              <path d="M18,15 L18,21 M15,18 L21,18 M16,16 L20,20 M20,16 L16,20" />
              <path d="M26,28 L26,32 M24,30 L28,30 M25,29 L27,31 M27,29 L25,31" />
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
      initial={{ scale: 0 }}
      animate={{
        scale: 1,
        filter: isSelected
          ? `drop-shadow(0 0 20px ${getRarityGlow()})`
          : 'none',
      }}
      transition={{
        type: 'spring',
        stiffness: 300,
        damping: 20,
        delay: Math.random() * 0.3,
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
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={seasonalColors.accent} />
            <stop offset="50%" stopColor={seasonalColors.primary} />
            <stop offset="100%" stopColor={seasonalColors.secondary} />
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

        {/* Основание травы */}
        <ellipse
          cx="20"
          cy="38"
          rx="8"
          ry="2"
          fill={seasonalColors.secondary}
          opacity="0.3"
        />

        {/* Рендер травы vs мха */}
        {isMoss ? (
          // МОХ - низкий, густой, мягкий
          <motion.g
            animate={{
              scale: [1, 1.02, 1],
              transition: { duration: 4, repeat: Infinity, ease: 'easeInOut' },
            }}
            filter={
              rarity === RarityLevel.LEGENDARY
                ? `url(#glow-${uniqueId})`
                : undefined
            }
          >
            {/* Основные мшистые комки */}
            <ellipse
              cx="15"
              cy="35"
              rx="6"
              ry="4"
              fill={seasonalColors.primary}
              opacity="0.9"
            />
            <ellipse
              cx="25"
              cy="36"
              rx="7"
              ry="3"
              fill={seasonalColors.secondary}
              opacity="0.8"
            />
            <ellipse
              cx="20"
              cy="33"
              rx="5"
              ry="5"
              fill={seasonalColors.accent}
              opacity="0.7"
            />

            {/* Мелкие мшистые точки */}
            {Array.from({ length: 12 }, (_, i) => (
              <circle
                key={i}
                cx={12 + i * 1.5 + Math.sin(i) * 2}
                cy={32 + Math.cos(i * 0.5) * 3}
                r={0.8 + Math.random() * 0.4}
                fill={seasonalColors.primary}
                opacity={0.6 + Math.random() * 0.3}
              />
            ))}

            {/* Текстурные линии для мягкости */}
            <path
              d="M10 35 Q15 33 20 35 Q25 37 30 35"
              stroke={seasonalColors.accent}
              strokeWidth="0.5"
              fill="none"
              opacity="0.4"
            />
            <path
              d="M12 33 Q17 31 22 33 Q27 35 32 33"
              stroke={seasonalColors.secondary}
              strokeWidth="0.3"
              fill="none"
              opacity="0.3"
            />
          </motion.g>
        ) : (
          // ТРАВА - высокая, стройная
          <motion.g
            animate={
              season === SeasonalVariant.SUMMER
                ? {
                    x: [0, 1, 0, -1, 0],
                    transition: {
                      duration: 3,
                      repeat: Infinity,
                      ease: 'easeInOut',
                    },
                  }
                : {}
            }
            filter={
              rarity === RarityLevel.LEGENDARY
                ? `url(#glow-${uniqueId})`
                : undefined
            }
          >
            {/* Длинные стебли по краям */}
            <path
              d="M8 38 Q10 28 12 18 Q14 15 16 12"
              stroke={`url(#${gradientId})`}
              strokeWidth="2"
              fill="none"
              strokeLinecap="round"
            />
            <path
              d="M32 38 Q30 30 28 20 Q26 17 24 14"
              stroke={`url(#${gradientId})`}
              strokeWidth="2"
              fill="none"
              strokeLinecap="round"
            />

            {/* Средние стебли */}
            <path
              d="M14 38 Q16 25 18 15 Q19 13 20 10"
              stroke={`url(#${gradientId})`}
              strokeWidth="2.5"
              fill="none"
              strokeLinecap="round"
            />
            <path
              d="M26 38 Q24 28 22 18 Q21 15 20 12"
              stroke={`url(#${gradientId})`}
              strokeWidth="2.5"
              fill="none"
              strokeLinecap="round"
            />

            {/* Центральные высокие стебли */}
            <path
              d="M20 38 Q18 22 17 8"
              stroke={`url(#${gradientId})`}
              strokeWidth="3"
              fill="none"
              strokeLinecap="round"
            />
            <path
              d="M20 38 Q22 25 23 12"
              stroke={`url(#${gradientId})`}
              strokeWidth="2.5"
              fill="none"
              strokeLinecap="round"
            />

            {/* Короткие стебли */}
            <path
              d="M11 38 Q12 32 13 28"
              stroke={`url(#${gradientId})`}
              strokeWidth="1.5"
              fill="none"
              strokeLinecap="round"
            />
            <path
              d="M29 38 Q28 34 27 30"
              stroke={`url(#${gradientId})`}
              strokeWidth="1.5"
              fill="none"
              strokeLinecap="round"
            />
          </motion.g>
        )}

        {/* Сезонные декорации */}
        {getSeasonalDecorations()}

        {/* Премиум эффекты */}
        {rarity === RarityLevel.EPIC && (
          <motion.g
            animate={{
              opacity: [0.5, 1, 0.5],
              transition: { duration: 2, repeat: Infinity },
            }}
          >
            <circle cx="17" cy="8" r="1" fill="#a855f7" opacity="0.6" />
            <circle cx="23" cy="12" r="0.8" fill="#a855f7" opacity="0.4" />
          </motion.g>
        )}

        {rarity === RarityLevel.LEGENDARY && (
          <motion.g
            animate={{
              rotate: [0, 360],
              transition: { duration: 8, repeat: Infinity, ease: 'linear' },
            }}
            style={{ transformOrigin: '20px 20px' }}
          >
            <circle cx="15" cy="10" r="1.5" fill="#f59e0b" opacity="0.8" />
            <circle cx="25" cy="15" r="1" fill="#f59e0b" opacity="0.6" />
            <circle cx="20" cy="8" r="1.2" fill="#fbbf24" opacity="0.7" />
          </motion.g>
        )}
      </svg>
    </motion.div>
  )
}
