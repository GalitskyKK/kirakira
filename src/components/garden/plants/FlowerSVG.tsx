import { motion, useReducedMotion } from 'framer-motion'
import { memo, useMemo } from 'react'
import { RarityLevel, SeasonalVariant } from '@/types'
import { createPathFromRects } from './utils'

interface FlowerSVGProps {
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

function FlowerSVGComponent({
  size = 64,
  color = '#ec4899',
  rarity = RarityLevel.COMMON,
  season,
  isSelected = false,
  isHovered: _isHovered = false,
  name = 'Flower',
  isVisible = true,
  staticMode = false,
}: FlowerSVGProps) {
  const prefersReducedMotion = useReducedMotion()
  const repeatInf =
    isVisible && !prefersReducedMotion && !staticMode ? Infinity : 0

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

  // Сезонные цвета для разных типов цветов - мемоизировано
  const seasonalColors = useMemo(() => {
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
  }, [season, color, name])

  // Объединенные path для основных элементов цветка
  const flowerPaths = useMemo(() => {
    const stemPath = createPathFromRects([{ x: 15, y: 20, w: 2, h: 8 }])
    const stemHighlightPath = createPathFromRects([
      { x: 15, y: 20, w: 1, h: 8 },
    ])
    const leavesPath = createPathFromRects([
      { x: 12, y: 24, w: 3, h: 2 },
      { x: 11, y: 25, w: 2, h: 1 },
      { x: 17, y: 26, w: 3, h: 2 },
      { x: 19, y: 27, w: 2, h: 1 },
    ])
    const petalsPath = createPathFromRects([
      { x: 14, y: 14, w: 4, h: 3 },
      { x: 15, y: 17, w: 2, h: 1 },
      { x: 14, y: 8, w: 4, h: 3 },
      { x: 15, y: 7, w: 2, h: 1 },
      { x: 10, y: 10, w: 3, h: 4 },
      { x: 9, y: 11, w: 1, h: 2 },
      { x: 19, y: 10, w: 3, h: 4 },
      { x: 22, y: 11, w: 1, h: 2 },
    ])
    const centerPath = createPathFromRects([{ x: 14, y: 10, w: 4, h: 4 }])
    return { stemPath, stemHighlightPath, leavesPath, petalsPath, centerPath }
  }, [])

  // Позиции для легендарных искр (вынесено из условного рендеринга)
  const legendarySparklePositions = useMemo(
    () => [
      { x: 12, y: 8 },
      { x: 20, y: 8 },
      { x: 8, y: 12 },
      { x: 24, y: 12 },
    ],
    []
  )

  const legendaryParticles = useMemo(() => {
    if (rarity !== RarityLevel.LEGENDARY && rarity !== RarityLevel.EPIC)
      return []
    const count = 4 // Уменьшено с 6 до 4
    const items = [] as Array<{ key: number; left: string; top: string }>
    const pseudoRandom = (seed: number): number => {
      const x = Math.sin(seed) * 10000
      return x - Math.floor(x)
    }
    for (let i = 0; i < count; i++) {
      const left = 20 + pseudoRandom(300 + i) * 60
      const top = 20 + pseudoRandom(400 + i) * 60
      items.push({ key: i, left: `${left}%`, top: `${top}%` })
    }
    return items
  }, [rarity])

  return (
    <motion.div
      className="pixel-container relative flex items-center justify-center"
      style={{ width: size, height: size, willChange: 'transform, opacity' }}
      initial={{ scale: 0, rotate: -45 }}
      animate={{
        scale: 1,
        rotate: 0,
        filter: isSelected ? `drop-shadow(0 0 20px ${getRarityGlow})` : 'none',
      }}
      whileHover={
        prefersReducedMotion
          ? {}
          : {
              scale: 1.1,
              y: -5,
              filter: `drop-shadow(0 8px 25px ${color}50)`,
            }
      }
      transition={{
        type: 'spring',
        stiffness: 200,
        damping: 15,
      }}
    >
      {/* Particles for legendary - оптимизировано */}
      {!staticMode && legendaryParticles.length > 0 && (
        <div className="pointer-events-none absolute inset-0">
          {legendaryParticles.map((p, i) => (
            <motion.div
              key={p.key}
              className="absolute h-1 w-1 rounded-full bg-yellow-300"
              style={{
                left: p.left,
                top: p.top,
                willChange: 'transform, opacity',
              }}
              animate={{
                scale: [0, 1, 0],
                opacity: [0, 1, 0],
                rotate: [0, 360],
              }}
              transition={{
                duration: 2,
                repeat: repeatInf,
                delay: i * 0.3,
                ease: 'easeInOut',
              }}
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

        {/* Stem - объединен в один path */}
        <motion.path
          d={flowerPaths.stemPath}
          fill={seasonalColors.stem}
          initial={{ scaleY: 0 }}
          animate={{ scaleY: 1 }}
          transition={{ duration: 0.8, delay: 0.3 }}
        />

        {/* Stem highlight - объединен */}
        <motion.path
          d={flowerPaths.stemHighlightPath}
          fill={seasonalColors.accent}
          opacity="0.7"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.5 }}
        />

        {/* Leaves - объединены в один path */}
        <motion.g
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.6, delay: 0.7 }}
        >
          <path d={flowerPaths.leavesPath} fill={seasonalColors.leaves} />
          <path
            d="M12,24h1v2h-1z M19,26h1v2h-1z"
            fill={seasonalColors.accent}
            opacity="0.5"
          />
        </motion.g>

        {/* Flower petals - объединены в один path */}
        <motion.g
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.8, delay: 0.9 }}
        >
          <path d={flowerPaths.petalsPath} fill={seasonalColors.petals} />
          {/* Highlights and shadows */}
          <path
            d="M14,14h1v3h-1z M10,10h3v1h-3z"
            fill="#ffffff"
            opacity="0.5"
          />
          <path d="M17,8h1v3h-1z M19,13h3v1h-3z" fill="#000000" opacity="0.2" />
        </motion.g>

        {/* Flower center - объединен в один path */}
        <motion.g
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.6, delay: 1.2 }}
        >
          <path d={flowerPaths.centerPath} fill={seasonalColors.center} />
          <path
            d="M14,10h2v2h-2z M16,12h2v2h-2z M15,11h1v1h-1z M16,12h1v1h-1z"
            fill="#ffffff"
            opacity="0.8"
          />
          <path d="M16,12h2v2h-2z" fill="#f59e0b" />
          <path d="M16,12h1v1h-1z" fill="#ffffff" opacity="0.6" />
        </motion.g>

        {/* Petal details and shading - объединены */}
        <motion.g
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 1.5 }}
        >
          <path
            d="M16,15h2v2h-2z M16,9h1v2h-1z M20,12h1v2h-1z M12,12h1v2h-1z"
            fill="#000000"
            opacity="0.15"
          />
          <path
            d="M14,9h1v1h-1z M10,11h1v1h-1z M21,11h1v1h-1z M15,15h1v1h-1z"
            fill="#ffffff"
            opacity="0.7"
          />
        </motion.g>

        {/* Special effects for rare flowers - оптимизировано */}
        {rarity !== RarityLevel.COMMON && !staticMode && (
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
            {/* Glow pixels around center - объединено */}
            <g fill={getRarityGlow} opacity="0.8">
              <rect x="13" y="9" width="1" height="1" />
              <rect x="18" y="9" width="1" height="1" />
              <rect x="13" y="14" width="1" height="1" />
              <rect x="18" y="14" width="1" height="1" />
            </g>
          </motion.g>
        )}

        {/* Legendary sparkles - оптимизировано */}
        {rarity === RarityLevel.LEGENDARY && !staticMode && (
          <motion.g>
            {legendarySparklePositions.map((pos, i) => (
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
                  repeat: repeatInf,
                  delay: 2.5 + i * 0.3,
                }}
              />
            ))}
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
              <path
                d="M10,12h1v1h-1z M22,14h1v1h-1z M8,18h1v1h-1z"
                fill={seasonalColors.decoration}
                opacity="0.8"
              />
            )}
            {season === SeasonalVariant.SUMMER && (
              <>
                <motion.path
                  d="M16,4h1v2h-1z"
                  fill={seasonalColors.decoration}
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 2, repeat: repeatInf }}
                />
                <path
                  d="M12,6h1v1h-1z M20,8h1v1h-1z"
                  fill={seasonalColors.decoration}
                  opacity="0.7"
                />
              </>
            )}
            {season === SeasonalVariant.AUTUMN && (
              <path
                d="M8,28h2v1h-2z M22,29h2v1h-2z M6,26h1v1h-1z M25,27h1v1h-1z"
                fill={seasonalColors.decoration}
                opacity="0.6"
              />
            )}
            {season === SeasonalVariant.WINTER && (
              <>
                <motion.path
                  d="M11,7h1v1h-1z"
                  fill={seasonalColors.decoration}
                  animate={{ opacity: [0.4, 1, 0.4] }}
                  transition={{ duration: 3, repeat: repeatInf, delay: 0.5 }}
                />
                <motion.path
                  d="M21,9h1v1h-1z"
                  fill={seasonalColors.decoration}
                  animate={{ opacity: [0.4, 1, 0.4] }}
                  transition={{ duration: 3, repeat: repeatInf, delay: 1.5 }}
                />
                <path
                  d="M13,5h1v1h-1z M19,6h1v1h-1z"
                  fill="#f1f5f9"
                  opacity="0.8"
                />
              </>
            )}
          </motion.g>
        )}
      </motion.svg>

      {/* Magical aura - оптимизировано */}
      {rarity !== RarityLevel.COMMON && !staticMode && (
        <motion.div
          className="pointer-events-none absolute inset-0 rounded-full"
          style={{
            background: `radial-gradient(circle, ${getRarityGlow}20 0%, transparent 70%)`,
            willChange: 'transform, opacity',
          }}
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{
            duration: 3,
            repeat: repeatInf,
            ease: 'easeInOut',
          }}
        />
      )}
    </motion.div>
  )
}

function areEqual(
  prev: Readonly<FlowerSVGProps>,
  next: Readonly<FlowerSVGProps>
) {
  return (
    prev.size === next.size &&
    prev.color === next.color &&
    prev.rarity === next.rarity &&
    prev.season === next.season &&
    prev.isSelected === next.isSelected &&
    prev.isHovered === next.isHovered &&
    prev.name === next.name &&
    prev.isVisible === next.isVisible &&
    prev.staticMode === next.staticMode
  )
}

export const FlowerSVG = memo(FlowerSVGComponent, areEqual)
