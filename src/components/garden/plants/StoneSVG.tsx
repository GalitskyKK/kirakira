import { motion, useReducedMotion } from 'framer-motion'
import { memo, useMemo } from 'react'
import { RarityLevel, SeasonalVariant } from '@/types'
import { createPathFromRects } from './utils'

interface StoneSVGProps {
  size?: number
  color?: string
  rarity?: RarityLevel
  season?: SeasonalVariant | undefined
  isSelected?: boolean
  isHovered?: boolean
  name?: string
  isVisible?: boolean
  staticMode?: boolean
}

function StoneSVGComponent({
  size = 64,
  color = '#6b7280',
  rarity = RarityLevel.COMMON,
  season,
  isSelected = false,
  isHovered: _isHovered = false,
  name = 'Stone',
  isVisible = true,
  staticMode = false,
}: StoneSVGProps) {
  const getRarityGlow = useMemo(() => {
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
  }, [rarity, color])

  // Сезонные цвета для камней
  const getSeasonalColors = () => {
    const baseColor = '#9ca3af' // основной серый камня
    switch (season) {
      case SeasonalVariant.SPRING:
        return {
          main: '#a3a3a3', // Свежий весенний серый
          highlight: '#e5e7eb',
          shadow: '#4b5563',
          moss: '#22c55e', // Яркий весенний мох
          decoration: '#16a34a', // Молодые растения
        }
      case SeasonalVariant.SUMMER:
        return {
          main: '#78716c', // Теплый летний серый
          highlight: '#d6d3d1',
          shadow: '#44403c',
          moss: '#15803d', // Темный летний мох
          decoration: '#fbbf24', // Солнечные блики
        }
      case SeasonalVariant.AUTUMN:
        return {
          main: '#a8a29e', // Прохладный осенний серый
          highlight: '#f5f5f4',
          shadow: '#57534e',
          moss: '#84cc16', // Желто-зеленый осенний мох
          decoration: '#ea580c', // Осенние листья
        }
      case SeasonalVariant.WINTER:
        return {
          main: '#d1d5db', // Холодный зимний серый
          highlight: '#f9fafb',
          shadow: '#6b7280',
          moss: '#6b7280', // Замерзший мох
          decoration: '#e0e7ff', // Иней и снег
        }
      default:
        return {
          main: baseColor,
          highlight: '#d1d5db',
          shadow: '#4b5563',
          moss: '#22c55e',
          decoration: baseColor,
        }
    }
  }

  const seasonalColors = getSeasonalColors()
  const prefersReducedMotion = useReducedMotion()
  const repeatInf = isVisible && !prefersReducedMotion && !staticMode ? Infinity : 0

  // Объединенные path для камней
  const stonePaths = useMemo(() => {
    const regularStonePath = createPathFromRects([
      { x: 6, y: 15, w: 20, h: 12 },
      { x: 8, y: 12, w: 16, h: 3 },
      { x: 10, y: 9, w: 12, h: 3 },
    ])
    const gravelPath = createPathFromRects([
      { x: 10, y: 18, w: 12, h: 8 },
      { x: 12, y: 16, w: 8, h: 2 },
      { x: 14, y: 23, w: 4, h: 2 },
    ])
    const boulderPath = createPathFromRects([
      { x: 4, y: 12, w: 24, h: 14 },
      { x: 6, y: 8, w: 20, h: 4 },
      { x: 8, y: 6, w: 16, h: 2 },
    ])
    return { regularStonePath, gravelPath, boulderPath }
  }, [])

  // Определяем тип камня по имени
  const isGravel =
    name?.toLowerCase().includes('галька') ||
    name?.toLowerCase().includes('gravel')
  const isBoulder =
    name?.toLowerCase().includes('булыжник') ||
    name?.toLowerCase().includes('boulder')

  return (
    <motion.div
      className="pixel-container relative flex items-center justify-center"
      style={{ width: size, height: size, willChange: 'transform, opacity' }}
      initial={{ scale: 0, y: 20 }}
      animate={{
        scale: 1,
        y: 0,
        filter: isSelected
          ? `drop-shadow(0 0 20px ${getRarityGlow})`
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
        viewBox="0 0 32 32"
        className="pixel-svg overflow-visible"
        style={{
          imageRendering: 'pixelated',
          shapeRendering: 'crispEdges',
        }}
      >
        {/* Shadow */}
        <motion.ellipse
          cx="16"
          cy="29"
          rx="7"
          ry="1.5"
          fill="#000000"
          opacity="0.4"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        />

        {/* Stone base - варианты по типу */}
        <motion.g
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{
            duration: 1,
            delay: 0.3,
            type: 'spring',
            stiffness: 150,
          }}
        >
          {isGravel ? (
            // Галька - объединена в path
            <>
              <path
                d={createPathFromRects([
                  { x: 12, y: 16, w: 8, h: 6 },
                  { x: 11, y: 17, w: 2, h: 4 },
                  { x: 19, y: 17, w: 2, h: 4 },
                  { x: 8, y: 20, w: 4, h: 3 },
                  { x: 20, y: 20, w: 4, h: 3 },
                  { x: 14, y: 23, w: 4, h: 2 },
                ])}
                fill={seasonalColors.main}
              />
              <path
                d="M12,16h3v2h-3z M8,20h2v1h-2z M20,20h2v1h-2z"
                fill={seasonalColors.highlight}
              />
              <path
                d="M17,20h3v2h-3z M10,22h2v1h-2z M22,22h2v1h-2z"
                fill={seasonalColors.shadow}
              />
            </>
          ) : isBoulder ? (
            // Булыжник - объединен в path
            <>
              <path d={stonePaths.boulderPath} fill={seasonalColors.main} />
              <path
                d="M4,12h10v6h-10z M6,8h8v4h-8z M8,6h6v2h-6z"
                fill={seasonalColors.highlight}
              />
              <path
                d="M18,18h10v8h-10z M18,8h8v10h-8z M18,6h6v2h-6z"
                fill={seasonalColors.shadow}
              />
            </>
          ) : (
            // Обычный камень - объединен в path
            <>
              <path d={stonePaths.regularStonePath} fill={seasonalColors.main} />
              <rect
                x="12"
                y="7"
                width="8"
                height="2"
                fill={seasonalColors.main}
              />

              {/* Stone left side highlight */}
              <rect
                x="6"
                y="15"
                width="6"
                height="12"
                fill={seasonalColors.highlight}
              />
              <rect
                x="8"
                y="12"
                width="4"
                height="3"
                fill={seasonalColors.highlight}
              />
              <rect
                x="10"
                y="9"
                width="3"
                height="3"
                fill={seasonalColors.highlight}
              />
              <rect
                x="12"
                y="7"
                width="2"
                height="2"
                fill={seasonalColors.highlight}
              />

              {/* Stone right side shadow */}
              <rect
                x="20"
                y="15"
                width="6"
                height="12"
                fill={seasonalColors.shadow}
              />
              <rect
                x="20"
                y="12"
                width="4"
                height="3"
                fill={seasonalColors.shadow}
              />
              <rect
                x="19"
                y="9"
                width="3"
                height="3"
                fill={seasonalColors.shadow}
              />
              <rect
                x="18"
                y="7"
                width="2"
                height="2"
                fill={seasonalColors.shadow}
              />

              {/* Top highlight */}
              <rect x="12" y="7" width="4" height="1" fill="#f3f4f6" />
              <rect x="10" y="9" width="6" height="1" fill="#e5e7eb" />
              <rect x="8" y="12" width="8" height="1" fill="#e5e7eb" />
            </>
          )}
        </motion.g>

        {/* Stone texture and cracks */}
        <motion.g
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 1 }}
        >
          {/* Horizontal cracks */}
          <rect
            x="9"
            y="18"
            width="6"
            height="1"
            fill="#374151"
            opacity="0.6"
          />
          <rect
            x="17"
            y="21"
            width="5"
            height="1"
            fill="#374151"
            opacity="0.6"
          />
          <rect
            x="11"
            y="24"
            width="4"
            height="1"
            fill="#374151"
            opacity="0.6"
          />

          {/* Vertical cracks */}
          <rect
            x="14"
            y="13"
            width="1"
            height="4"
            fill="#374151"
            opacity="0.5"
          />
          <rect
            x="18"
            y="16"
            width="1"
            height="6"
            fill="#374151"
            opacity="0.5"
          />

          {/* Small texture details */}
          <rect x="11" y="16" width="1" height="1" fill="#6b7280" />
          <rect x="19" y="19" width="1" height="1" fill="#6b7280" />
          <rect x="13" y="22" width="1" height="1" fill="#6b7280" />
          <rect x="21" y="23" width="1" height="1" fill="#6b7280" />
        </motion.g>

        {/* Moss patches on stone */}
        <motion.g
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.6, delay: 1.6 }}
        >
          {/* Moss spots */}
          <rect
            x="7"
            y="25"
            width="3"
            height="2"
            fill={seasonalColors.moss}
            opacity="0.8"
          />
          <rect
            x="22"
            y="24"
            width="2"
            height="2"
            fill="#16a34a"
            opacity="0.7"
          />
          <rect
            x="12"
            y="26"
            width="2"
            height="1"
            fill={seasonalColors.moss}
            opacity="0.6"
          />

          {/* Small moss details */}
          <rect
            x="9"
            y="24"
            width="1"
            height="1"
            fill={seasonalColors.moss}
            opacity="0.9"
          />
          <rect
            x="21"
            y="26"
            width="1"
            height="1"
            fill="#16a34a"
            opacity="0.8"
          />
        </motion.g>

        {/* Special rune/crystal effects for rare stones */}
        {(rarity === RarityLevel.RARE ||
          rarity === RarityLevel.EPIC ||
          rarity === RarityLevel.LEGENDARY) && (
          <motion.g
            animate={{
              opacity: [0.5, 1, 0.5],
            }}
            transition={{
              duration: 2,
              repeat: repeatInf,
              delay: 2.5,
            }}
          >
            {/* Magical rune on stone */}
            <rect
              x="14"
              y="16"
              width="4"
              height="1"
              fill={getRarityGlow}
              opacity="0.8"
            />
            <rect
              x="15"
              y="15"
              width="2"
              height="3"
              fill={getRarityGlow}
              opacity="0.8"
            />
            <rect
              x="16"
              y="14"
              width="1"
              height="1"
              fill={getRarityGlow}
              opacity="0.8"
            />

            {/* Glowing crystal embedded in stone */}
            <rect
              x="19"
              y="18"
              width="2"
              height="2"
              fill={getRarityGlow}
              opacity="0.9"
            />
            <rect
              x="20"
              y="17"
              width="1"
              height="1"
              fill="#ffffff"
              opacity="0.8"
            />
          </motion.g>
        )}

        {/* Ancient power emanation for legendary */}
        {rarity === RarityLevel.LEGENDARY && (
          <motion.g>
            {Array.from({ length: 4 }, (_, i) => {
              const positions = [
                { x: 5, y: 20 },
                { x: 27, y: 22 },
                { x: 15, y: 6 },
                { x: 24, y: 14 },
              ]
              const pos = positions[i]
              if (!pos) return null

              return (
                <motion.rect
                  key={i}
                  x={pos.x}
                  y={pos.y}
                  width="1"
                  height="1"
                  fill="#fbbf24"
                  animate={{
                    opacity: [0, 1, 0],
                    scale: [0.5, 2, 0.5],
                  }}
                  transition={{
                    duration: 3,
                    delay: 3 + i * 0.5,
                    repeat: repeatInf,
                  }}
                />
              )
            })}

            {/* Pulsing energy core */}
            <motion.rect
              x="15"
              y="19"
              width="2"
              height="2"
              fill="#fbbf24"
              animate={{
                opacity: [0.3, 0.9, 0.3],
                scale: [1, 1.3, 1],
              }}
              transition={{
                duration: 2,
                repeat: repeatInf,
                delay: 3.5,
              }}
            />
          </motion.g>
        )}

        {/* Additional legendary sparkles */}
        {rarity === RarityLevel.LEGENDARY && (
          <motion.g>
            {Array.from({ length: 3 }, (_, i) => {
              const sparklePos = [
                { x: 10, y: 11 },
                { x: 23, y: 17 },
                { x: 17, y: 25 },
              ]
              const pos = sparklePos[i]
              if (!pos) return null

              return (
                <motion.rect
                  key={`sparkle-${i}`}
                  x={pos.x}
                  y={pos.y}
                  width="1"
                  height="1"
                  fill="#ffffff"
                  animate={{
                    opacity: [0, 1, 0],
                    scale: [0, 1, 0],
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: repeatInf,
                    delay: 4 + i * 0.4,
                  }}
                />
              )
            })}
          </motion.g>
        )}

        {/* Energy pulse for epic/legendary */}
        {(rarity === RarityLevel.EPIC || rarity === RarityLevel.LEGENDARY) && (
          <motion.rect
            x="8"
            y="10"
            width="16"
            height="16"
            fill="none"
            stroke={getRarityGlow}
            strokeWidth="1"
            opacity="0.3"
            strokeDasharray="2,2"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.1, 0.3],
            }}
            transition={{
              duration: 4,
              repeat: repeatInf,
              delay: 3,
            }}
          />
        )}

        {/* Сезонные декоративные элементы для камней */}
        {season && (
          <motion.g
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1.5, delay: 3 }}
          >
            {season === SeasonalVariant.SPRING && (
              // Весенние росточки и мох
              <>
                <motion.rect
                  x="6"
                  y="12"
                  width="1"
                  height="2"
                  fill={seasonalColors.decoration}
                  animate={{ scaleY: [0.5, 1, 0.5] }}
                  transition={{ duration: 3, repeat: Infinity }}
                />
                <rect
                  x="25"
                  y="18"
                  width="1"
                  height="1"
                  fill={seasonalColors.decoration}
                  opacity="0.8"
                />
                <rect
                  x="4"
                  y="20"
                  width="1"
                  height="1"
                  fill={seasonalColors.decoration}
                  opacity="0.7"
                />
                <rect
                  x="28"
                  y="24"
                  width="1"
                  height="1"
                  fill={seasonalColors.decoration}
                  opacity="0.6"
                />
              </>
            )}
            {season === SeasonalVariant.SUMMER && (
              // Летние блики и сухость
              <>
                <motion.rect
                  x="14"
                  y="6"
                  width="4"
                  height="1"
                  fill={seasonalColors.decoration}
                  animate={{ opacity: [0.4, 1, 0.4] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
                <rect
                  x="10"
                  y="5"
                  width="1"
                  height="1"
                  fill={seasonalColors.decoration}
                  opacity="0.8"
                />
                <rect
                  x="22"
                  y="7"
                  width="1"
                  height="1"
                  fill={seasonalColors.decoration}
                  opacity="0.7"
                />
                <rect
                  x="8"
                  y="8"
                  width="1"
                  height="1"
                  fill={seasonalColors.decoration}
                  opacity="0.6"
                />
              </>
            )}
            {season === SeasonalVariant.AUTUMN && (
              // Осенние листочки на камне
              <>
                <rect
                  x="8"
                  y="14"
                  width="2"
                  height="1"
                  fill={seasonalColors.decoration}
                  opacity="0.7"
                />
                <rect
                  x="22"
                  y="16"
                  width="2"
                  height="1"
                  fill={seasonalColors.decoration}
                  opacity="0.6"
                />
                <rect
                  x="12"
                  y="28"
                  width="1"
                  height="1"
                  fill="#dc2626"
                  opacity="0.5"
                />
                <rect
                  x="20"
                  y="29"
                  width="1"
                  height="1"
                  fill="#f59e0b"
                  opacity="0.5"
                />
                <rect
                  x="6"
                  y="26"
                  width="1"
                  height="1"
                  fill="#ea580c"
                  opacity="0.4"
                />
              </>
            )}
            {season === SeasonalVariant.WINTER && (
              // Зимний иней и снежинки
              <>
                <motion.rect
                  x="12"
                  y="8"
                  width="1"
                  height="1"
                  fill={seasonalColors.decoration}
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{ duration: 4, repeat: repeatInf, delay: 1 }}
                />
                <motion.rect
                  x="20"
                  y="10"
                  width="1"
                  height="1"
                  fill={seasonalColors.decoration}
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{ duration: 4, repeat: repeatInf, delay: 2 }}
                />
                <rect
                  x="10"
                  y="6"
                  width="1"
                  height="1"
                  fill="#f1f5f9"
                  opacity="0.9"
                />
                <rect
                  x="24"
                  y="12"
                  width="1"
                  height="1"
                  fill="#f1f5f9"
                  opacity="0.8"
                />
                <rect
                  x="16"
                  y="4"
                  width="1"
                  height="1"
                  fill="#ffffff"
                  opacity="0.7"
                />
                <rect
                  x="6"
                  y="28"
                  width="2"
                  height="1"
                  fill="#ddd6fe"
                  opacity="0.6"
                />
              </>
            )}
          </motion.g>
        )}
      </motion.svg>

      {/* Magical aura */}
      {rarity !== RarityLevel.COMMON && (
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{
            background: `radial-gradient(circle, ${getRarityGlow}10 0%, transparent 80%)`,
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

function areEqual(prev: Readonly<StoneSVGProps>, next: Readonly<StoneSVGProps>) {
  return (
    prev.size === next.size &&
    prev.color === next.color &&
    prev.rarity === next.rarity &&
    prev.season === next.season &&
    prev.isSelected === next.isSelected &&
    prev.isHovered === next.isHovered &&
    prev.name === next.name &&
    prev.isVisible === next.isVisible
  )
}

export const StoneSVG = memo(StoneSVGComponent, areEqual)
