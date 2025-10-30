import { motion } from 'framer-motion'
import { useMemo } from 'react'
import { RarityLevel, SeasonalVariant } from '@/types'

interface FlowerSVGProps {
  size?: number
  color?: string
  rarity?: RarityLevel
  season?: SeasonalVariant | undefined
  isSelected?: boolean
  isHovered?: boolean
  name?: string
  isVisible?: boolean
}

export function FlowerSVG({
  size = 64,
  color = '#ec4899',
  rarity = RarityLevel.COMMON,
  season,
  isSelected = false,
  isHovered: _isHovered = false,
  name = 'Flower',
  isVisible = true,
}: FlowerSVGProps) {
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

  // Сезонные цвета для разных типов цветов
  const getSeasonalColors = () => {
    const baseColor = color
    const flowerType = name?.toLowerCase() || 'flower'

    // Определяем тип цветка
    const isDaisy =
      flowerType.includes('ромашка') || flowerType.includes('daisy')
    const isTulip =
      flowerType.includes('тюльпан') || flowerType.includes('tulip')
    const isForgetMeNot =
      flowerType.includes('незабудка') || flowerType.includes('forget')
    const isSunflower =
      flowerType.includes('подсолнух') || flowerType.includes('sunflower')
    const isOrchid =
      flowerType.includes('орхидея') || flowerType.includes('orchid')

    // Цвета по типам цветов и сезонам
    if (isDaisy) {
      switch (season) {
        case SeasonalVariant.SPRING:
          return {
            petals: '#ffffff', // Белые лепестки ромашки
            center: '#fbbf24', // Желтый центр
            stem: '#22c55e',
            leaves: '#16a34a',
            accent: '#f9fafb',
            decoration: '#a3e635',
          }
        case SeasonalVariant.SUMMER:
          return {
            petals: '#f9fafb', // Кремово-белые
            center: '#f59e0b', // Насыщенный желтый
            stem: '#15803d',
            leaves: '#166534',
            accent: '#ffffff',
            decoration: '#eab308',
          }
        case SeasonalVariant.AUTUMN:
          return {
            petals: '#fef3c7', // Кремовые с желтизной
            center: '#d97706', // Оранжевый центр
            stem: '#a3a3a3',
            leaves: '#78716c',
            accent: '#fde68a',
            decoration: '#f59e0b',
          }
        case SeasonalVariant.WINTER:
          return {
            petals: '#f1f5f9', // Бледные
            center: '#e5e7eb', // Серый центр
            stem: '#6b7280',
            leaves: '#9ca3af',
            accent: '#ffffff',
            decoration: '#ddd6fe',
          }
      }
    } else if (isTulip) {
      switch (season) {
        case SeasonalVariant.SPRING:
          return {
            petals: '#ec4899', // Розовые лепестки тюльпана
            center: '#be185d',
            stem: '#22c55e',
            leaves: '#16a34a',
            accent: '#f9a8d4',
            decoration: '#a3e635',
          }
        case SeasonalVariant.SUMMER:
          return {
            petals: '#dc2626', // Красные
            center: '#991b1b',
            stem: '#15803d',
            leaves: '#166534',
            accent: '#f87171',
            decoration: '#fbbf24',
          }
        case SeasonalVariant.AUTUMN:
          return {
            petals: '#ea580c', // Оранжевые
            center: '#c2410c',
            stem: '#a3a3a3',
            leaves: '#78716c',
            accent: '#fb923c',
            decoration: '#dc2626',
          }
        case SeasonalVariant.WINTER:
          return {
            petals: '#a855f7', // Фиолетовые
            center: '#7c3aed',
            stem: '#6b7280',
            leaves: '#9ca3af',
            accent: '#c084fc',
            decoration: '#e0e7ff',
          }
      }
    } else if (isForgetMeNot) {
      switch (season) {
        case SeasonalVariant.SPRING:
          return {
            petals: '#3b82f6', // Голубые лепестки незабудки
            center: '#fbbf24', // Желтый центр
            stem: '#22c55e',
            leaves: '#16a34a',
            accent: '#93c5fd',
            decoration: '#a3e635',
          }
        case SeasonalVariant.SUMMER:
          return {
            petals: '#1d4ed8', // Темно-синие
            center: '#f59e0b',
            stem: '#15803d',
            leaves: '#166534',
            accent: '#60a5fa',
            decoration: '#eab308',
          }
        case SeasonalVariant.AUTUMN:
          return {
            petals: '#6366f1', // Фиолетово-синие
            center: '#d97706',
            stem: '#a3a3a3',
            leaves: '#78716c',
            accent: '#a5b4fc',
            decoration: '#f59e0b',
          }
        case SeasonalVariant.WINTER:
          return {
            petals: '#e0e7ff', // Очень бледно-голубые
            center: '#e5e7eb',
            stem: '#6b7280',
            leaves: '#9ca3af',
            accent: '#f1f5f9',
            decoration: '#ddd6fe',
          }
      }
    } else if (isSunflower) {
      switch (season) {
        case SeasonalVariant.SPRING:
          return {
            petals: '#fde047', // Светло-желтые лепестки подсолнуха
            center: '#a16207', // Коричневый центр
            stem: '#22c55e',
            leaves: '#16a34a',
            accent: '#fef08a',
            decoration: '#a3e635',
          }
        case SeasonalVariant.SUMMER:
          return {
            petals: '#eab308', // Насыщенно-желтые
            center: '#78350f',
            stem: '#15803d',
            leaves: '#166534',
            accent: '#fde047',
            decoration: '#f59e0b',
          }
        case SeasonalVariant.AUTUMN:
          return {
            petals: '#f59e0b', // Золотые
            center: '#92400e',
            stem: '#a3a3a3',
            leaves: '#78716c',
            accent: '#fbbf24',
            decoration: '#ea580c',
          }
        case SeasonalVariant.WINTER:
          return {
            petals: '#fde68a', // Бледно-желтые
            center: '#6b7280',
            stem: '#6b7280',
            leaves: '#9ca3af',
            accent: '#fef3c7',
            decoration: '#e0e7ff',
          }
      }
    } else if (isOrchid) {
      switch (season) {
        case SeasonalVariant.SPRING:
          return {
            petals: '#d946ef', // Яркие фиолетовые лепестки орхидеи
            center: '#a21caf',
            stem: '#22c55e',
            leaves: '#16a34a',
            accent: '#e879f9',
            decoration: '#a3e635',
          }
        case SeasonalVariant.SUMMER:
          return {
            petals: '#c026d3', // Пурпурные
            center: '#86198f',
            stem: '#15803d',
            leaves: '#166534',
            accent: '#d946ef',
            decoration: '#fbbf24',
          }
        case SeasonalVariant.AUTUMN:
          return {
            petals: '#a855f7', // Сиреневые
            center: '#7c3aed',
            stem: '#a3a3a3',
            leaves: '#78716c',
            accent: '#c084fc',
            decoration: '#ea580c',
          }
        case SeasonalVariant.WINTER:
          return {
            petals: '#e0e7ff', // Очень светлые сиреневые
            center: '#c7d2fe',
            stem: '#6b7280',
            leaves: '#9ca3af',
            accent: '#ede9fe',
            decoration: '#ddd6fe',
          }
      }
    }

    // Базовая схема для неопределенных цветов
    switch (season) {
      case SeasonalVariant.SPRING:
        return {
          petals: baseColor,
          center: '#fbbf24',
          stem: '#22c55e',
          leaves: '#16a34a',
          accent: '#ec4899',
          decoration: '#a3e635',
        }
      case SeasonalVariant.SUMMER:
        return {
          petals: baseColor,
          center: '#f59e0b',
          stem: '#15803d',
          leaves: '#166534',
          accent: '#ef4444',
          decoration: '#fbbf24',
        }
      case SeasonalVariant.AUTUMN:
        return {
          petals: baseColor,
          center: '#d97706',
          stem: '#a3a3a3',
          leaves: '#78716c',
          accent: '#fb923c',
          decoration: '#ea580c',
        }
      case SeasonalVariant.WINTER:
        return {
          petals: baseColor,
          center: '#e5e7eb',
          stem: '#6b7280',
          leaves: '#9ca3af',
          accent: '#f1f5f9',
          decoration: '#ddd6fe',
        }
      default:
        return {
          petals: baseColor,
          center: '#fbbf24',
          stem: '#22c55e',
          leaves: '#16a34a',
          accent: '#ec4899',
          decoration: baseColor,
        }
    }
  }

  const seasonalColors = getSeasonalColors()
  const repeatInf = isVisible ? Infinity : 0
  const pseudoRandom = (seed: number): number => {
    const x = Math.sin(seed) * 10000
    return x - Math.floor(x)
  }
  const legendaryParticles = useMemo(() => {
    const count = 6
    const items = [] as Array<{ key: number; left: string; top: string }>
    for (let i = 0; i < count; i++) {
      const left = 20 + pseudoRandom(300 + i) * 60
      const top = 20 + pseudoRandom(400 + i) * 60
      items.push({ key: i, left: `${left}%`, top: `${top}%` })
    }
    return items
  }, [])

  return (
    <motion.div
      className="pixel-container relative flex items-center justify-center"
      style={{ width: size, height: size }}
      initial={{ scale: 0, rotate: -45 }}
      animate={{
        scale: 1,
        rotate: 0,
        filter: isSelected
          ? `drop-shadow(0 0 20px ${getRarityGlow()})`
          : 'none',
      }}
      whileHover={{
        scale: 1.1,
        y: -5,
        filter: `drop-shadow(0 8px 25px ${color}50)`,
      }}
      transition={{
        type: 'spring',
        stiffness: 200,
        damping: 15,
      }}
    >
      {/* Particles for legendary */}
      {(rarity === RarityLevel.LEGENDARY || rarity === RarityLevel.EPIC) && (
        <div className="pointer-events-none absolute inset-0">
          {legendaryParticles.map((p, i) => (
            <motion.div
              key={p.key}
              className="absolute h-1 w-1 rounded-full bg-yellow-300"
              style={{ left: p.left, top: p.top }}
              animate={{ scale: [0, 1, 0], opacity: [0, 1, 0], rotate: [0, 360] }}
              transition={{ duration: 2, repeat: repeatInf, delay: i * 0.3, ease: 'easeInOut' }}
            />
          ))}
        </div>
      )}

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
          cy="30"
          rx="4"
          ry="1"
          fill="#000000"
          opacity="0.3"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        />

        {/* Stem - pixelated style */}
        <motion.rect
          x="15"
          y="20"
          width="2"
          height="8"
          fill={seasonalColors.stem}
          initial={{ scaleY: 0 }}
          animate={{ scaleY: 1 }}
          transition={{ duration: 0.8, delay: 0.3 }}
        />

        {/* Stem highlight */}
        <motion.rect
          x="15"
          y="20"
          width="1"
          height="8"
          fill={seasonalColors.accent}
          opacity="0.7"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.5 }}
        />

        {/* Leaves - pixelated */}
        <motion.g
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.6, delay: 0.7 }}
        >
          {/* Left leaf */}
          <rect
            x="12"
            y="24"
            width="3"
            height="2"
            fill={seasonalColors.leaves}
          />
          <rect
            x="11"
            y="25"
            width="2"
            height="1"
            fill={seasonalColors.leaves}
          />
          <rect
            x="12"
            y="24"
            width="1"
            height="2"
            fill={seasonalColors.accent}
            opacity="0.5"
          />

          {/* Right leaf */}
          <rect
            x="17"
            y="26"
            width="3"
            height="2"
            fill={seasonalColors.leaves}
          />
          <rect
            x="19"
            y="27"
            width="2"
            height="1"
            fill={seasonalColors.leaves}
          />
          <rect
            x="19"
            y="26"
            width="1"
            height="2"
            fill={seasonalColors.accent}
            opacity="0.5"
          />
        </motion.g>

        {/* Flower petals - detailed pixel art */}
        <motion.g
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.8, delay: 0.9 }}
        >
          {/* Bottom petal */}
          <rect
            x="14"
            y="14"
            width="4"
            height="3"
            fill={seasonalColors.petals}
          />
          <rect
            x="15"
            y="17"
            width="2"
            height="1"
            fill={seasonalColors.petals}
          />
          <rect
            x="14"
            y="14"
            width="1"
            height="3"
            fill="#ffffff"
            opacity="0.5"
          />

          {/* Top petal */}
          <rect
            x="14"
            y="8"
            width="4"
            height="3"
            fill={seasonalColors.petals}
          />
          <rect
            x="15"
            y="7"
            width="2"
            height="1"
            fill={seasonalColors.petals}
          />
          <rect
            x="17"
            y="8"
            width="1"
            height="3"
            fill="#000000"
            opacity="0.2"
          />

          {/* Left petal */}
          <rect
            x="10"
            y="10"
            width="3"
            height="4"
            fill={seasonalColors.petals}
          />
          <rect
            x="9"
            y="11"
            width="1"
            height="2"
            fill={seasonalColors.petals}
          />
          <rect
            x="10"
            y="10"
            width="3"
            height="1"
            fill="#ffffff"
            opacity="0.5"
          />

          {/* Right petal */}
          <rect
            x="19"
            y="10"
            width="3"
            height="4"
            fill={seasonalColors.petals}
          />
          <rect
            x="22"
            y="11"
            width="1"
            height="2"
            fill={seasonalColors.petals}
          />
          <rect
            x="19"
            y="13"
            width="3"
            height="1"
            fill="#000000"
            opacity="0.2"
          />
        </motion.g>

        {/* Flower center - pixelated with depth */}
        <motion.g
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.6, delay: 1.2 }}
        >
          {/* Center base */}
          <rect
            x="14"
            y="10"
            width="4"
            height="4"
            fill={seasonalColors.center}
          />

          {/* Center highlight */}
          <rect
            x="14"
            y="10"
            width="2"
            height="2"
            fill="#ffffff"
            opacity="0.8"
          />

          {/* Center shadow */}
          <rect x="16" y="12" width="2" height="2" fill="#f59e0b" />

          {/* Inner details */}
          <rect x="15" y="11" width="1" height="1" fill="#f59e0b" />
          <rect
            x="16"
            y="12"
            width="1"
            height="1"
            fill="#ffffff"
            opacity="0.6"
          />
        </motion.g>

        {/* Petal details and shading */}
        <motion.g
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 1.5 }}
        >
          {/* Petal shadows */}
          <rect
            x="16"
            y="15"
            width="2"
            height="2"
            fill="#000000"
            opacity="0.15"
          />
          <rect
            x="16"
            y="9"
            width="1"
            height="2"
            fill="#000000"
            opacity="0.15"
          />
          <rect
            x="20"
            y="12"
            width="1"
            height="2"
            fill="#000000"
            opacity="0.15"
          />
          <rect
            x="12"
            y="12"
            width="1"
            height="2"
            fill="#000000"
            opacity="0.15"
          />

          {/* Petal highlights */}
          <rect
            x="14"
            y="9"
            width="1"
            height="1"
            fill="#ffffff"
            opacity="0.7"
          />
          <rect
            x="10"
            y="11"
            width="1"
            height="1"
            fill="#ffffff"
            opacity="0.7"
          />
          <rect
            x="21"
            y="11"
            width="1"
            height="1"
            fill="#ffffff"
            opacity="0.7"
          />
          <rect
            x="15"
            y="15"
            width="1"
            height="1"
            fill="#ffffff"
            opacity="0.7"
          />
        </motion.g>

        {/* Special effects for rare flowers */}
        {rarity !== RarityLevel.COMMON && (
          <motion.g
            animate={{
              opacity: [0.5, 1, 0.5],
            }}
            transition={{
              duration: 2,
              repeat: repeatInf,
              delay: 2,
            }}
          >
            {/* Glow pixels around center */}
            <rect
              x="13"
              y="9"
              width="1"
              height="1"
              fill={getRarityGlow()}
              opacity="0.8"
            />
            <rect
              x="18"
              y="9"
              width="1"
              height="1"
              fill={getRarityGlow()}
              opacity="0.8"
            />
            <rect
              x="13"
              y="14"
              width="1"
              height="1"
              fill={getRarityGlow()}
              opacity="0.8"
            />
            <rect
              x="18"
              y="14"
              width="1"
              height="1"
              fill={getRarityGlow()}
              opacity="0.8"
            />
          </motion.g>
        )}

        {/* Legendary sparkles */}
        {rarity === RarityLevel.LEGENDARY && (
          <motion.g>
            {Array.from({ length: 4 }, (_, i) => {
              const positions = [
                { x: 12, y: 8 },
                { x: 20, y: 8 },
                { x: 8, y: 12 },
                { x: 24, y: 12 },
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
                  fill="#ffffff"
                  animate={{
                    opacity: [0, 1, 0],
                    scale: [0, 1, 0],
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    delay: 2.5 + i * 0.3,
                  }}
                />
              )
            })}
          </motion.g>
        )}

        {/* Сезонные декоративные элементы */}
        {season && (
          <motion.g
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 2 }}
          >
            {season === SeasonalVariant.SPRING && (
              // Молодые побеги и бутоны
              <>
                <rect
                  x="10"
                  y="12"
                  width="1"
                  height="1"
                  fill={seasonalColors.decoration}
                  opacity="0.8"
                />
                <rect
                  x="22"
                  y="14"
                  width="1"
                  height="1"
                  fill={seasonalColors.decoration}
                  opacity="0.8"
                />
                <rect
                  x="8"
                  y="18"
                  width="1"
                  height="1"
                  fill={seasonalColors.decoration}
                  opacity="0.6"
                />
              </>
            )}
            {season === SeasonalVariant.SUMMER && (
              // Солнечные блики
              <>
                <motion.rect
                  x="16"
                  y="4"
                  width="1"
                  height="2"
                  fill={seasonalColors.decoration}
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 2, repeat: repeatInf }}
                />
                <rect
                  x="12"
                  y="6"
                  width="1"
                  height="1"
                  fill={seasonalColors.decoration}
                  opacity="0.7"
                />
                <rect
                  x="20"
                  y="8"
                  width="1"
                  height="1"
                  fill={seasonalColors.decoration}
                  opacity="0.7"
                />
              </>
            )}
            {season === SeasonalVariant.AUTUMN && (
              // Опавшие листочки
              <>
                <rect
                  x="8"
                  y="28"
                  width="2"
                  height="1"
                  fill={seasonalColors.decoration}
                  opacity="0.6"
                />
                <rect
                  x="22"
                  y="29"
                  width="2"
                  height="1"
                  fill={seasonalColors.decoration}
                  opacity="0.6"
                />
                <rect
                  x="6"
                  y="26"
                  width="1"
                  height="1"
                  fill="#ea580c"
                  opacity="0.5"
                />
                <rect
                  x="25"
                  y="27"
                  width="1"
                  height="1"
                  fill="#ea580c"
                  opacity="0.5"
                />
              </>
            )}
            {season === SeasonalVariant.WINTER && (
              // Кристаллы льда и иней
              <>
                <motion.rect
                  x="11"
                  y="7"
                  width="1"
                  height="1"
                  fill={seasonalColors.decoration}
                  animate={{ opacity: [0.4, 1, 0.4] }}
                  transition={{ duration: 3, repeat: repeatInf, delay: 0.5 }}
                />
                <motion.rect
                  x="21"
                  y="9"
                  width="1"
                  height="1"
                  fill={seasonalColors.decoration}
                  animate={{ opacity: [0.4, 1, 0.4] }}
                  transition={{ duration: 3, repeat: repeatInf, delay: 1.5 }}
                />
                <rect
                  x="13"
                  y="5"
                  width="1"
                  height="1"
                  fill="#f1f5f9"
                  opacity="0.8"
                />
                <rect
                  x="19"
                  y="6"
                  width="1"
                  height="1"
                  fill="#f1f5f9"
                  opacity="0.8"
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
            background: `radial-gradient(circle, ${getRarityGlow()}20 0%, transparent 70%)`,
          }}
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      )}
    </motion.div>
  )
}
