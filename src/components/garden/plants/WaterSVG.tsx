import { motion } from 'framer-motion'
import { useId } from 'react'
import { RarityLevel, SeasonalVariant } from '@/types'

interface WaterSVGProps {
  size?: number
  color?: string
  rarity?: RarityLevel
  season?: SeasonalVariant | undefined
  isSelected?: boolean
  isHovered?: boolean
  name?: string
}

export function WaterSVG({
  size = 64,
  color = '#06b6d4',
  rarity = RarityLevel.COMMON,
  season,
  isSelected = false,
  isHovered: _isHovered = false,
  name = 'Water',
}: WaterSVGProps) {
  const uniqueId = useId()
  const gradientId = `water-${uniqueId}`
  const waveGradientId = `wave-${uniqueId}`

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
    const baseBlue = color
    switch (season) {
      case SeasonalVariant.SPRING:
        return {
          primary: '#0ea5e9', // Яркий весенний голубой
          secondary: '#0284c7',
          accent: '#38bdf8',
          surface: '#e0f2fe',
        }
      case SeasonalVariant.SUMMER:
        return {
          primary: '#0891b2', // Глубокий летний бирюзовый
          secondary: '#0e7490',
          accent: '#22d3ee',
          surface: '#cffafe',
        }
      case SeasonalVariant.AUTUMN:
        return {
          primary: '#0f766e', // Тёмный осенний бирюзовый
          secondary: '#134e4a',
          accent: '#5eead4',
          surface: '#f0fdfa',
        }
      case SeasonalVariant.WINTER:
        return {
          primary: '#475569', // Холодный зимний серо-голубой
          secondary: '#334155',
          accent: '#cbd5e1',
          surface: '#f8fafc',
        }
      default:
        return {
          primary: baseBlue,
          secondary: '#0284c7',
          accent: '#38bdf8',
          surface: '#e0f2fe',
        }
    }
  }

  const seasonalColors = getSeasonalColors()

  // Определяем тип водного элемента по имени
  const isDrop = name === 'Капля'
  const isPuddle = name === 'Лужа'
  const isSpring = name === 'Источник'

  const getSeasonalEffects = () => {
    switch (season) {
      case SeasonalVariant.SPRING:
        return (
          <>
            {/* Пузырьки жизни */}
            <motion.g
              animate={{
                y: [0, -3, 0],
                opacity: [0.6, 1, 0.6],
                transition: { duration: 2, repeat: Infinity },
              }}
            >
              <circle cx="25" cy="15" r="1" fill="#22d3ee" opacity="0.8" />
              <circle cx="15" cy="20" r="0.8" fill="#38bdf8" opacity="0.6" />
              <circle cx="18" cy="12" r="0.6" fill="#0ea5e9" opacity="0.7" />
            </motion.g>
          </>
        )
      case SeasonalVariant.SUMMER:
        return (
          <>
            {/* Солнечные блики на воде */}
            <motion.g
              animate={{
                opacity: [0.4, 0.9, 0.4],
                transition: { duration: 1.5, repeat: Infinity },
              }}
            >
              <ellipse
                cx="22"
                cy="18"
                rx="2"
                ry="1"
                fill="#fbbf24"
                opacity="0.6"
              />
              <ellipse
                cx="18"
                cy="25"
                rx="1.5"
                ry="0.8"
                fill="#f59e0b"
                opacity="0.5"
              />
            </motion.g>
          </>
        )
      case SeasonalVariant.AUTUMN:
        return (
          <>
            {/* Опавшие листья на воде */}
            <motion.g
              animate={{
                x: [0, 1, 0, -1, 0],
                transition: { duration: 4, repeat: Infinity },
              }}
            >
              <path
                d="M16,20 Q18,18 20,20 Q18,22 16,20"
                fill="#dc2626"
                opacity="0.7"
              />
              <path
                d="M24,26 Q25,24 26,26 Q25,27 24,26"
                fill="#ea580c"
                opacity="0.6"
              />
            </motion.g>
          </>
        )
      case SeasonalVariant.WINTER:
        return (
          <>
            {/* Ледяные кристаллы */}
            <g stroke="#e2e8f0" strokeWidth="0.5" fill="none" opacity="0.8">
              <path d="M15,15 L19,19 M19,15 L15,19 M17,13 L17,21 M13,17 L21,17" />
              <path d="M24,24 L26,26 M26,24 L24,26 M25,22 L25,28 M22,25 L28,25" />
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
      initial={{ scale: 0, opacity: 0 }}
      animate={{
        scale: 1,
        opacity: 1,
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
          <radialGradient id={gradientId} cx="50%" cy="30%" r="70%">
            <stop offset="0%" stopColor={seasonalColors.accent} />
            <stop offset="50%" stopColor={seasonalColors.primary} />
            <stop offset="100%" stopColor={seasonalColors.secondary} />
          </radialGradient>

          <linearGradient id={waveGradientId} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop
              offset="0%"
              stopColor={seasonalColors.primary}
              opacity="0.8"
            />
            <stop
              offset="50%"
              stopColor={seasonalColors.accent}
              opacity="0.6"
            />
            <stop
              offset="100%"
              stopColor={seasonalColors.primary}
              opacity="0.8"
            />
          </linearGradient>

          {rarity === RarityLevel.LEGENDARY && (
            <filter id={`glow-${uniqueId}`}>
              <feGaussianBlur stdDeviation="3" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          )}
        </defs>

        {/* Рендер в зависимости от типа водного элемента */}
        {isDrop ? (
          // КАПЛЯ - одиночная капля воды
          <motion.g
            animate={{
              y: [0, -2, 0],
              transition: {
                duration: 2.5,
                repeat: Infinity,
                ease: 'easeInOut',
              },
            }}
            filter={
              rarity === RarityLevel.LEGENDARY
                ? `url(#glow-${uniqueId})`
                : undefined
            }
          >
            <path
              d="M20 8 Q16 12 16 18 Q16 24 20 24 Q24 24 24 18 Q24 12 20 8 Z"
              fill={`url(#${gradientId})`}
              stroke={seasonalColors.accent}
              strokeWidth="0.5"
            />
            {/* Блик на капле */}
            <ellipse
              cx="18.5"
              cy="16"
              rx="1.5"
              ry="2"
              fill={seasonalColors.surface}
              opacity="0.8"
            />
            {/* Капельки рядом */}
            <circle
              cx="12"
              cy="30"
              r="1.5"
              fill={seasonalColors.primary}
              opacity="0.7"
            />
            <circle
              cx="28"
              cy="32"
              r="1"
              fill={seasonalColors.accent}
              opacity="0.6"
            />
          </motion.g>
        ) : isPuddle ? (
          // ЛУЖА - плоская поверхность воды
          <motion.g
            filter={
              rarity === RarityLevel.LEGENDARY
                ? `url(#glow-${uniqueId})`
                : undefined
            }
          >
            <motion.ellipse
              cx="20"
              cy="28"
              rx="16"
              ry="6"
              fill={`url(#${gradientId})`}
              animate={{
                ry: [6, 7, 6],
                transition: {
                  duration: 4,
                  repeat: Infinity,
                  ease: 'easeInOut',
                },
              }}
            />
            {/* Отражение */}
            <ellipse
              cx="20"
              cy="28"
              rx="12"
              ry="3"
              fill={seasonalColors.surface}
              opacity="0.4"
            />
            {/* Рябь */}
            <motion.g
              animate={{
                opacity: [0.3, 0.7, 0.3],
                transition: { duration: 3, repeat: Infinity },
              }}
            >
              <ellipse
                cx="20"
                cy="28"
                rx="14"
                ry="5"
                stroke={seasonalColors.accent}
                strokeWidth="0.3"
                fill="none"
              />
              <ellipse
                cx="20"
                cy="28"
                rx="10"
                ry="3"
                stroke={seasonalColors.accent}
                strokeWidth="0.2"
                fill="none"
              />
            </motion.g>
          </motion.g>
        ) : isSpring ? (
          // ИСТОЧНИК - вертикальный поток с пузырьками
          <motion.g
            filter={
              rarity === RarityLevel.LEGENDARY
                ? `url(#glow-${uniqueId})`
                : undefined
            }
          >
            {/* Основание источника */}
            <ellipse
              cx="20"
              cy="35"
              rx="8"
              ry="4"
              fill={seasonalColors.primary}
            />

            {/* Вертикальный поток */}
            <motion.path
              d="M20 35 Q18 25 19 15 Q20 10 20 5"
              stroke={`url(#${waveGradientId})`}
              strokeWidth="3"
              fill="none"
              strokeLinecap="round"
              animate={{
                d: [
                  'M20 35 Q18 25 19 15 Q20 10 20 5',
                  'M20 35 Q22 25 21 15 Q20 10 20 5',
                  'M20 35 Q18 25 19 15 Q20 10 20 5',
                ],
                transition: {
                  duration: 2,
                  repeat: Infinity,
                  ease: 'easeInOut',
                },
              }}
            />

            {/* Пузырьки */}
            {Array.from({ length: 8 }, (_, i) => (
              <motion.circle
                key={i}
                cx={18 + i * 0.5}
                cy={30 - i * 3}
                r={0.8 + Math.random() * 0.4}
                fill={seasonalColors.accent}
                opacity="0.7"
                animate={{
                  y: [0, -10, -20],
                  opacity: [0.7, 0.3, 0],
                  transition: {
                    duration: 2,
                    repeat: Infinity,
                    delay: i * 0.3,
                    ease: 'easeOut',
                  },
                }}
              />
            ))}
          </motion.g>
        ) : (
          // РУЧЕЕК - горизонтальный поток с волнами
          <motion.g
            animate={{
              x: [0, 2, 0, -2, 0],
              transition: { duration: 4, repeat: Infinity, ease: 'easeInOut' },
            }}
            filter={
              rarity === RarityLevel.LEGENDARY
                ? `url(#glow-${uniqueId})`
                : undefined
            }
          >
            {/* Основное русло */}
            <path
              d="M5 20 Q10 18 15 20 Q20 22 25 20 Q30 18 35 20 Q40 22 45 20"
              stroke={`url(#${waveGradientId})`}
              strokeWidth="4"
              fill="none"
              strokeLinecap="round"
            />

            {/* Волны потока */}
            <motion.path
              d="M8 22 Q12 20 16 22 Q20 24 24 22 Q28 20 32 22"
              stroke={seasonalColors.accent}
              strokeWidth="2"
              fill="none"
              strokeLinecap="round"
              animate={{
                d: [
                  'M8 22 Q12 20 16 22 Q20 24 24 22 Q28 20 32 22',
                  'M8 24 Q12 22 16 24 Q20 26 24 24 Q28 22 32 24',
                  'M8 22 Q12 20 16 22 Q20 24 24 22 Q28 20 32 22',
                ],
                transition: {
                  duration: 1.5,
                  repeat: Infinity,
                  ease: 'easeInOut',
                },
              }}
            />

            {/* Брызги */}
            {Array.from({ length: 4 }, (_, i) => (
              <motion.circle
                key={i}
                cx={10 + i * 8}
                cy={18 + Math.sin(i) * 2}
                r="0.5"
                fill={seasonalColors.accent}
                animate={{
                  scale: [0, 1, 0],
                  opacity: [0, 0.8, 0],
                  transition: {
                    duration: 1,
                    repeat: Infinity,
                    delay: i * 0.25,
                    ease: 'easeOut',
                  },
                }}
              />
            ))}
          </motion.g>
        )}

        {/* Сезонные эффекты */}
        {getSeasonalEffects()}

        {/* Премиум эффекты */}
        {rarity === RarityLevel.EPIC && (
          <motion.g
            animate={{
              rotate: [0, 360],
              transition: { duration: 6, repeat: Infinity, ease: 'linear' },
            }}
            style={{ transformOrigin: '20px 20px' }}
          >
            <circle cx="12" cy="15" r="1" fill="#a855f7" opacity="0.6" />
            <circle cx="28" cy="20" r="0.8" fill="#a855f7" opacity="0.5" />
            <circle cx="25" cy="30" r="1.2" fill="#a855f7" opacity="0.4" />
          </motion.g>
        )}

        {rarity === RarityLevel.LEGENDARY && (
          <motion.g
            animate={{
              scale: [1, 1.1, 1],
              opacity: [0.6, 1, 0.6],
              transition: { duration: 3, repeat: Infinity },
            }}
          >
            <circle cx="20" cy="16" r="2" fill="#f59e0b" opacity="0.3" />
            <circle cx="20" cy="16" r="1" fill="#fbbf24" opacity="0.8" />
          </motion.g>
        )}
      </svg>
    </motion.div>
  )
}
