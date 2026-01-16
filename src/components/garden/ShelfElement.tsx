import { memo, useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { clsx } from 'clsx'
import { PlantRenderer } from './plants'
import type { GardenElement as GardenElementType } from '@/types'
import { RarityLevel, SeasonalVariant, ViewMode } from '@/types'
import { MOOD_CONFIG } from '@/types/mood'

interface ShelfElementProps {
  element: GardenElementType
  shelfIndex: number
  position: number
  absoluteX?: number // НОВЫЙ: точные абсолютные координаты
  isSelected?: boolean
  isDragged?: boolean
  isBeingMoved?: boolean // Элемент выбран для перемещения
  isHighlighted?: boolean
  viewMode: ViewMode
  elementWidth: number
  elementSpacing: number
  onClick?: (element: GardenElementType) => void
  onLongPress?: (element: GardenElementType) => void // Долгое нажатие
}

export const ShelfElement = memo(function ShelfElement({
  element,
  shelfIndex: _shelfIndex,
  position,
  absoluteX, // НОВЫЙ параметр для точного позиционирования
  isSelected = false,
  isDragged = false,
  isBeingMoved = false,
  isHighlighted = false,
  viewMode,
  elementWidth,
  elementSpacing,
  onClick,
  onLongPress,
}: ShelfElementProps) {
  const constraintsRef = useRef<HTMLDivElement>(null)
  const [showTooltip, setShowTooltip] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null)
  const [wasLongPress, setWasLongPress] = useState(false) // Флаг для предотвращения клика после долгого нажатия
  const touchStartTimeRef = useRef<number>(0) // Время начала touch

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current)
      }
    }
  }, [])

  const moodConfig =
    element.moodInfluence in MOOD_CONFIG
      ? MOOD_CONFIG[element.moodInfluence]
      : MOOD_CONFIG.joy // Fallback to joy if invalid mood

  // Локализация редкости
  const rarityLabels: Record<string, string> = {
    common: 'Обычный',
    uncommon: 'Необычный',
    rare: 'Редкий',
    epic: 'Эпический',
    legendary: 'Легендарный',
  }

  // Responsive design hook
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024) // lg breakpoint
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Calculate object size based on rarity and screen size (увеличенные размеры)
  const baseSize = isMobile ? 50 : 65 // Увеличенный базовый размер
  const rarityBonus =
    element.rarity === RarityLevel.RARE
      ? isMobile
        ? 12
        : 15
      : element.rarity === RarityLevel.EPIC
        ? isMobile
          ? 20
          : 25
        : element.rarity === RarityLevel.LEGENDARY
          ? isMobile
            ? 25
            : 35
          : 0

  const objectSize = baseSize + rarityBonus

  // Note: getIsometricTransform removed as it conflicts with drag

  const handleMouseEnter = () => {
    setIsHovered(true)
    setShowTooltip(true)
  }

  const handleMouseLeave = () => {
    setIsHovered(false)
    setShowTooltip(false)
    // НЕ отменяем долгое нажатие при уходе курсора - позволяем ему завершиться
    // handleLongPressEnd()
    // Сбрасываем флаг долгого нажатия через некоторое время
    setTimeout(() => {
      setWasLongPress(false)
    }, 200)
  }

  const handleLongPressStart = () => {
    // Предотвращаем множественные срабатывания
    if (longPressTimerRef.current) {
      return
    }

    // Сбрасываем флаг долгого нажатия в начале
    setWasLongPress(false)
    // Сохраняем время начала для touch событий
    touchStartTimeRef.current = Date.now()

    // Долгое нажатие работает в любом режиме (кроме детального просмотра)
    if (onLongPress && viewMode !== ViewMode.DETAIL) {
      longPressTimerRef.current = setTimeout(() => {
        // Проверяем, что таймер не был отменен
        if (longPressTimerRef.current) {
          setWasLongPress(true) // Устанавливаем флаг ПЕРЕД вызовом onLongPress
          onLongPress(element)
        }
        // Очищаем таймер после выполнения
        longPressTimerRef.current = null
      }, 1000) // 500ms долгое нажатие
    }
  }

  // Отмена долгого нажатия
  const handleLongPressCancel = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current)
      longPressTimerRef.current = null
    }
  }

  // Умная обработка touchEnd - отменяем ТОЛЬКО если касание очень короткое
  const handleTouchEnd = () => {
    const touchDuration = Date.now() - touchStartTimeRef.current

    // Отменяем ТОЛЬКО если касание очень короткое (возможная ошибка)
    if (touchDuration < 50) {
      handleLongPressCancel()
    }
  }

  const handleClick = () => {
    const touchDuration = Date.now() - touchStartTimeRef.current

    // Предотвращаем обычный клик если уже было долгое нажатие
    if (wasLongPress) {
      // Сбрасываем флаг через короткое время
      setTimeout(() => setWasLongPress(false), 100)
      return
    }

    // Если есть активный таймер долгого нажатия - это ОБЫЧНЫЙ клик, отменяем long press
    if (longPressTimerRef.current) {
      handleLongPressCancel()

      // Продолжаем с обычным кликом только если это действительно быстрый клик
      if (touchDuration < 300) {
        // Быстрый клик
        if (onClick) {
          onClick(element)
        }
      }
      return
    }

    // Обычный клик без активного таймера
    if (onClick && touchDuration < 300) {
      onClick(element)
    }
  }

  return (
    <motion.div
      ref={constraintsRef}
      className={clsx(
        'shelf-object flex select-none flex-col items-center justify-end',
        'transition-all duration-200',
        'cursor-pointer', // Всегда интерактивный курсор
        isSelected && 'z-20',
        isDragged && 'z-30',
        isBeingMoved &&
          'pointer-events-none z-40 scale-110 ring-2 ring-blue-400 ring-opacity-60',
        isHighlighted &&
          !isSelected &&
          !isBeingMoved &&
          'z-30 scale-[1.06] ring-2 ring-blue-400/80 bg-blue-50/20 dark:bg-blue-900/10',
        absoluteX !== undefined ? 'absolute' : 'relative' // АБСОЛЮТНОЕ или ОТНОСИТЕЛЬНОЕ позиционирование
      )}
      style={{
        width: elementWidth,
        height: objectSize + 20, // Extra space for 3D effect
        transformStyle: 'preserve-3d',
        touchAction: 'none', // Отключаем стандартные жесты браузера
        contain: 'layout style paint', // CSS containment для изоляции
        willChange: 'transform, opacity', // GPU ускорение
        // ТОЧНОЕ позиционирование: либо абсолютное, либо старое с marginLeft
        ...(absoluteX !== undefined
          ? {
              left: absoluteX,
              bottom: 0,
            }
          : {
              marginLeft: position === 0 ? 0 : elementSpacing,
            }),
      }}
      // Новая система взаимодействия вместо drag-and-drop
      onClick={handleClick}
      onMouseDown={handleLongPressStart}
      onMouseUp={handleLongPressCancel} // Отменяем долгое нажатие при отпускании мыши
      onTouchStart={handleLongPressStart}
      onTouchEnd={handleTouchEnd} // Умная обработка touchEnd
      onContextMenu={e => {
        // Предотвращаем контекстное меню на долгое нажатие
        if (onLongPress && viewMode !== ViewMode.DETAIL) {
          e.preventDefault()
        }
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      initial={{
        opacity: 0,
      }}
      animate={{
        opacity: 1,
        filter: isSelected
          ? `brightness(1.15) drop-shadow(0 6px 20px ${moodConfig.color}35)`
          : isHighlighted
            ? `brightness(1.12) saturate(1.15) drop-shadow(0 0 26px ${moodConfig.color}88) drop-shadow(0 3px 10px rgba(0,0,0,0.12))`
            : 'brightness(1) drop-shadow(0 3px 10px rgba(0,0,0,0.12))',
      }}
      whileHover={{
        scale: 1.01,
        y: -1,
      }}
      whileTap={{ scale: 0.99 }}
      transition={{
        type: 'spring',
        stiffness: 500,
        damping: 35,
        delay: position * 0.02, // Уменьшена задержка
      }}
    >
      {/* Highlight aura (NEW element) */}
      {isHighlighted && !isSelected && !isBeingMoved && (
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            borderRadius: 18,
            boxShadow:
              '0 0 0 2px rgba(59,130,246,0.55), 0 0 34px rgba(59,130,246,0.40)',
            background:
              'radial-gradient(circle at 50% 40%, rgba(59,130,246,0.18) 0%, transparent 62%)',
          }}
        />
      )}

      {/* Main object container - centered in flex container */}
      <motion.div
        className="object-container relative flex items-center justify-center"
        style={{
          width: objectSize,
          height: objectSize,
          transformStyle: 'preserve-3d',
          willChange: 'transform',
        }}
        animate={{
          y: isHovered ? -1 : 0,
        }}
        transition={{ duration: 0.15, ease: 'easeOut' }}
      >
        {/* PlantRenderer for the actual object */}
        <PlantRenderer
          element={element}
          size={objectSize}
          isSelected={isSelected}
          isHovered={isHovered}
          showTooltip={false} // We'll handle tooltip separately
          onClick={() => {}} // Handled by parent container
        />

        {/* Enhanced isometric base platform for object */}
        <motion.div
          className="object-base absolute -z-10"
          style={{
            width: objectSize * 0.7, // Более широкая платформа
            height: objectSize * 0.18, // Более высокая платформа
            background: `linear-gradient(135deg, 
              rgba(139, 69, 19, 0.4) 0%,
              rgba(160, 82, 45, 0.3) 50%,
              rgba(101, 67, 33, 0.4) 100%
            )`,
            borderRadius: '50%',
            transform: 'perspective(120px) rotateX(75deg)',
            boxShadow: '0 1px 3px rgba(0,0,0,0.2)', // Дополнительная тень для платформы
            bottom: 0,
            left: '50%',
            marginLeft: -(objectSize * 0.7) / 2, // Center the platform
          }}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.3, delay: position * 0.05 }}
        />
      </motion.div>

      {/* Enhanced object shadow on shelf - now BELOW the object */}
      <motion.div
        className="object-shadow relative"
        style={{
          width: objectSize * 0.9, // Более широкая тень
          height: objectSize * 0.25, // Более высокая тень
          background:
            'radial-gradient(ellipse, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0.2) 40%, transparent 70%)',
          borderRadius: '50%',
          marginTop: -objectSize * 0.15, // Overlap with object from below
          willChange: 'transform, opacity',
        }}
        initial={{ scaleX: 0, opacity: 0 }}
        animate={{
          scaleX: 1,
          opacity: isHovered ? 0.4 : 0.3,
        }}
        transition={{ duration: 0.15, delay: position * 0.03 }}
      />

      {/* Enhanced selection aura */}
      {isSelected && (
        <motion.div
          className="selection-aura absolute"
          style={{
            width: objectSize + 30, // Более широкая аура
            height: objectSize + 30,
            background: `conic-gradient(from 0deg, ${moodConfig.color}50, transparent, ${moodConfig.color}50)`,
            borderRadius: '50%',
            bottom: '-15px', // Небольшое смещение вниз для объемности
            left: '50%',
            marginLeft: -(objectSize + 30) / 2, // Center the aura
          }}
          initial={{ opacity: 0 }}
          animate={{
            opacity: [0.25, 0.5, 0.25],
          }}
          transition={{
            opacity: { repeat: Infinity, duration: 4, ease: 'easeInOut' }, // Упрощено и замедлено
          }}
        />
      )}

      {/* Magical effects for rare items */}
      {(element.rarity === RarityLevel.EPIC ||
        element.rarity === RarityLevel.LEGENDARY) && (
        <motion.div
          className="magical-effects pointer-events-none absolute inset-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.8 }}
          transition={{ delay: 0.8 }}
        >
          {/* Floating sparkles around object */}
          {Array.from(
            { length: element.rarity === RarityLevel.LEGENDARY ? 6 : 3 },
            (_, i) => {
              const divisor =
                element.rarity === RarityLevel.LEGENDARY ? 6 : 3
              const safeAngle = (i * 360) / divisor
              const radius = objectSize * 0.6
              return (
                <motion.div
                  key={`sparkle-${i}`}
                  className="absolute"
                  style={{
                    left: '50%',
                    top: '50%',
                    width: '4px',
                    height: '4px',
                  }}
                  animate={{
                    x: Math.cos((safeAngle * Math.PI) / 180) * radius,
                    y: Math.sin((safeAngle * Math.PI) / 180) * radius * 0.5,
                    opacity: [0.2, 0.6, 0.2],
                  }}
                  transition={{
                    duration: 4 + i * 0.4, // Замедлено для производительности
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                >
                  <div className="h-full w-full rounded-full bg-gradient-to-r from-yellow-300 to-amber-400" />
                </motion.div>
              )
            }
          )}
        </motion.div>
      )}

      {/* Seasonal decorations */}
      {element.seasonalVariant === SeasonalVariant.WINTER && (
        <motion.div
          className="seasonal-decoration pointer-events-none absolute -top-4 left-1/2 -translate-x-1/2 text-sm"
          animate={{
            y: [0, -6, 0],
            x: [0, 2, -2, 0],
            opacity: [0.6, 1, 0.6],
          }}
          transition={{ repeat: Infinity, duration: 3 }}
        >
          ❄️
        </motion.div>
      )}

      {element.seasonalVariant === SeasonalVariant.AUTUMN && (
        <motion.div
          className="seasonal-decoration pointer-events-none absolute -top-3 right-2 text-sm"
          animate={{
            rotate: [0, 15, -15, 0],
            y: [0, 3, 0],
          }}
          transition={{ repeat: Infinity, duration: 4 }}
        >
          🍂
        </motion.div>
      )}

      {/* Tooltip */}
      {showTooltip && !isDragged && (
        <motion.div
          className="tooltip pointer-events-none absolute z-50"
          style={{
            top: '-64px', // -16 * 4px
            left: '50%',
            marginLeft: '-80px', // Approximate half width for centering
          }}
          initial={{ opacity: 0, y: 10, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.8 }}
          transition={{ duration: 0.2 }}
        >
          <div className="rounded-lg bg-gray-900 px-3 py-2 text-xs text-white shadow-lg backdrop-blur-sm">
            <div className="font-semibold">{element.name}</div>
            <div className="text-gray-300">{moodConfig.label}</div>
            {element.rarity !== RarityLevel.COMMON && (
              <div className="text-yellow-300">
                ⭐ {rarityLabels[element.rarity] ?? element.rarity}
              </div>
            )}

            {/* Tooltip arrow */}
            <div className="absolute left-1/2 top-full -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
          </div>
        </motion.div>
      )}

      {/* Enhanced click ripple effect */}
      <motion.div
        className="click-ripple absolute rounded-full border-2 border-white/60"
        style={{
          width: objectSize + 15, // Более широкий ripple
          height: objectSize + 15,
          bottom: 0,
          left: '50%',
          marginLeft: -(objectSize + 15) / 2, // Center the ripple
        }}
        initial={{ scale: 1, opacity: 0 }}
        whileTap={{
          scale: 1.6, // Более выраженный эффект
          opacity: [0, 0.8, 0],
        }}
        transition={{ duration: 0.5 }}
      />
    </motion.div>
  )
})
