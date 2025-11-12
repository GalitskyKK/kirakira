import { useMemo, useRef, useEffect } from 'react'
import {
  AnimatePresence,
  motion,
  useReducedMotion,
  PanInfo,
} from 'framer-motion'
import { clsx } from 'clsx'
import { useCompanionStore } from '@/stores/companionStore'
import {
  getCompanionDefinition,
  COMPANION_MOOD_MESSAGES,
} from '@/data/companions'
import { useCompanionController } from '@/hooks/useCompanionController'
import type {
  CompanionAmbientAnimation,
  CompanionEmotionVisual,
  CompanionEyeShape,
  CompanionMouthShape,
  CompanionSide,
} from '@/types'

interface GardenCompanionProps {
  readonly className?: string
}

interface EyeCircleOptions {
  readonly cx: number
  readonly cy: number
  readonly r: number
}

type EyeRenderOptions =
  | {
      readonly variant: 'circle'
      readonly left: EyeCircleOptions
      readonly right: EyeCircleOptions
    }
  | {
      readonly variant: 'path'
      readonly left: string
      readonly right: string
      readonly strokeWidth: number
    }

interface MouthRenderOptions {
  readonly path: string
  readonly strokeWidth: number
  readonly isFilled: boolean
}

function getEyePaths(shape: CompanionEyeShape): EyeRenderOptions {
  switch (shape) {
    case 'smile':
      return {
        variant: 'circle',
        left: { cx: 64, cy: 82, r: 6 },
        right: { cx: 96, cy: 82, r: 6 },
      }
    case 'calm':
      return {
        variant: 'path',
        left: 'M56 82 Q 64 76 72 82',
        right: 'M88 82 Q 96 76 104 82',
        strokeWidth: 4.4,
      }
    case 'wide':
      return {
        variant: 'circle',
        left: { cx: 64, cy: 80, r: 7.2 },
        right: { cx: 96, cy: 80, r: 7.2 },
      }
    case 'sad':
      return {
        variant: 'path',
        left: 'M56 80 Q 64 88 72 80',
        right: 'M88 80 Q 96 88 104 80',
        strokeWidth: 4.6,
      }
    case 'focused':
      return {
        variant: 'path',
        left: 'M56 78 Q 64 74 72 76',
        right: 'M88 76 Q 96 74 104 78',
        strokeWidth: 4.8,
      }
    default:
      return {
        variant: 'path',
        left: 'M56 82 Q 64 78 72 82',
        right: 'M88 82 Q 96 78 104 82',
        strokeWidth: 4.2,
      }
  }
}

function getMouthPath(shape: CompanionMouthShape): MouthRenderOptions {
  switch (shape) {
    case 'smile':
      return {
        path: 'M64 112 Q 80 124 96 112',
        strokeWidth: 4.4,
        isFilled: false,
      }
    case 'soft':
      return {
        path: 'M66 112 Q 80 118 94 112',
        strokeWidth: 3.4,
        isFilled: false,
      }
    case 'frown':
      return {
        path: 'M64 118 Q 80 104 96 118',
        strokeWidth: 4.4,
        isFilled: false,
      }
    case 'open':
      return {
        path: 'M72 108 Q 80 96 88 108 Q 80 128 72 108',
        strokeWidth: 3.4,
        isFilled: true,
      }
    case 'determined':
      return {
        path: 'M66 116 L94 114',
        strokeWidth: 4.4,
        isFilled: false,
      }
    default:
      return {
        path: 'M66 112 Q 80 118 94 112',
        strokeWidth: 3.8,
        isFilled: false,
      }
  }
}

interface AmbientMotionConfig {
  readonly animate: Record<string, unknown>
  readonly transition: Record<string, unknown>
}

function getAmbientMotionConfig(
  animation: CompanionAmbientAnimation | null,
  reduceMotion: boolean
): AmbientMotionConfig {
  if (reduceMotion || animation === null) {
    return {
      animate: { rotate: 0, scale: 1, x: 0, y: 0, opacity: 1 },
      transition: { duration: 0.4 },
    }
  }

  switch (animation) {
    case 'twirl':
      return {
        animate: {
          rotate: [0, 12, -8, 4, 0],
          scale: [1, 1.05, 0.95, 1.02, 1],
        },
        transition: {
          duration: 2.2,
          ease: 'easeInOut',
        },
      }
    case 'peek':
      return {
        animate: {
          y: [0, -10, -4, 0],
          rotate: [0, -4, 2, 0],
        },
        transition: {
          duration: 1.8,
          ease: 'easeInOut',
        },
      }
    case 'pulse':
      return {
        animate: {
          scale: [1, 1.12, 0.96, 1.06, 1],
          opacity: [1, 0.92, 0.98, 1],
        },
        transition: {
          duration: 1.6,
          ease: 'easeInOut',
        },
      }
    case 'orbit':
      return {
        animate: {
          x: [0, 6, 0, -6, 0],
          y: [0, -4, 0, 4, 0],
          rotate: [0, 4, -2, 2, 0],
        },
        transition: {
          duration: 3,
          ease: 'easeInOut',
        },
      }
    case 'drift':
      return {
        animate: {
          x: [0, 3, -2, 4, 0],
          y: [0, -2, 3, -4, 0],
          scale: [1, 1.04, 0.98, 1.02, 1],
        },
        transition: {
          duration: 2.6,
          ease: 'easeInOut',
        },
      }
    default:
      return {
        animate: { rotate: 0, scale: 1, x: 0, y: 0, opacity: 1 },
        transition: { duration: 0.4 },
      }
  }
}

function useCompanionVisual(): CompanionEmotionVisual | null {
  const activeCompanionId = useCompanionStore(state => state.activeCompanionId)
  const currentEmotion = useCompanionStore(state => state.currentEmotion)

  return useMemo(() => {
    const definition = getCompanionDefinition(activeCompanionId)
    return definition.emotions[currentEmotion]
  }, [activeCompanionId, currentEmotion])
}

export function GardenCompanion({ className }: GardenCompanionProps) {
  useCompanionController()

  const isVisible = useCompanionStore(state => state.isVisible)
  const isCelebrating = useCompanionStore(state => state.isCelebrating)
  const activeCompanionId = useCompanionStore(state => state.activeCompanionId)
  const activeAmbientAnimation = useCompanionStore(
    state => state.activeAmbientAnimation
  )
  const activeReaction = useCompanionStore(state => state.activeReaction)
  const lastMood = useCompanionStore(state => state.lastMood)

  /* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-return */
  const position: { yPosition: number; side: CompanionSide } =
    useCompanionStore(state => state.position)
  const isDragging = Boolean(useCompanionStore(state => state.isDragging))

  // Явно типизируем функции из store
  const toggleInfo: () => void = useCompanionStore(state => state.toggleInfo)
  const isInfoOpen = useCompanionStore(state => state.isInfoOpen)
  const setPosition: (yPosition: number, side: CompanionSide) => void =
    useCompanionStore(state => state.setPosition)
  const setIsDragging: (isDragging: boolean) => void = useCompanionStore(
    state => state.setIsDragging
  )
  /* eslint-enable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-return */
  const visual = useCompanionVisual()

  const shouldReduceMotion = !!useReducedMotion()

  const gradientId = useMemo(
    () => `companion-body-${activeCompanionId}-${visual?.emotion ?? 'neutral'}`,
    [activeCompanionId, visual?.emotion]
  )
  const coreGradientId = useMemo(
    () => `companion-core-${activeCompanionId}-${visual?.emotion ?? 'neutral'}`,
    [activeCompanionId, visual?.emotion]
  )
  const shineGradientId = useMemo(
    () =>
      `companion-shine-${activeCompanionId}-${visual?.emotion ?? 'neutral'}`,
    [activeCompanionId, visual?.emotion]
  )

  const particlePreset = visual?.particlePreset ?? null

  const particles = useMemo(() => {
    if (!particlePreset) {
      return []
    }

    const { count } = particlePreset
    return Array.from({ length: count }, (_, index) => index)
  }, [particlePreset])

  const ambientMotion = useMemo(
    () => getAmbientMotionConfig(activeAmbientAnimation, shouldReduceMotion),
    [activeAmbientAnimation, shouldReduceMotion]
  )

  const reactionEffect = useMemo(() => {
    if (!activeReaction || shouldReduceMotion) {
      return null
    }

    const moodMessage = (() => {
      if (!lastMood) {
        return 'Спасибо, что поделился!'
      }
      const options = COMPANION_MOOD_MESSAGES[lastMood] ?? []
      if (options.length === 0) {
        return 'Спасибо, что поделился!'
      }
      const randomIndex = Math.floor(Math.random() * options.length)
      return options[randomIndex] ?? options[0]
    })()

    // Определяем позиционирование пузыря в зависимости от стороны компаньона
    const isOnLeft = position.side === 'left'
    const bubblePositionClass = isOnLeft
      ? 'right-[-10rem] sm:right-[-12rem] justify-start' // Компаньон слева - пузырь справа
      : 'left-[-10rem] sm:left-[-12rem] justify-end' // Компаньон справа - пузырь слева
    const tailPositionClass = isOnLeft
      ? 'left-[-0.65rem] sm:left-[-0.8rem]' // Хвостик слева
      : 'right-[-0.65rem] sm:right-[-0.8rem]' // Хвостик справа

    switch (activeReaction) {
      case 'mood-checkin':
        return (
          <motion.div
            key="reaction-hearts"
            className="pointer-events-none absolute inset-0 flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
          >
            {[0, 1, 2].map(index => (
              <motion.span
                key={index}
                className="mx-1 text-lg"
                style={{ color: visual?.accentColor ?? '#FF6B6B' }}
                initial={{ y: 6, scale: 0, opacity: 0 }}
                animate={{
                  y: -36 - index * 10,
                  scale: 1,
                  opacity: 0,
                }}
                transition={{
                  duration: 1.4 + index * 0.1,
                  ease: 'easeInOut',
                  delay: index * 0.05,
                }}
              >
                ♥
              </motion.span>
            ))}
            <motion.div
              className={`absolute -top-20 flex w-[14rem] sm:-top-24 sm:w-[16rem] ${bubblePositionClass}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.25, ease: 'easeOut', delay: 0.1 }}
            >
              <span className="relative inline-flex min-h-[3.5rem] w-full items-center justify-center rounded-[1.8rem] bg-white/95 px-4 py-3 text-left text-sm font-medium leading-relaxed text-slate-600 shadow-xl backdrop-blur dark:bg-slate-900/95 dark:text-slate-200 sm:min-h-[4rem] sm:px-5 sm:py-4 sm:text-base">
                {moodMessage}
                <span
                  className={`absolute top-1/2 h-3.5 w-3.5 -translate-y-1/2 rotate-45 bg-white/95 shadow-sm dark:bg-slate-900/95 ${tailPositionClass}`}
                />
              </span>
            </motion.div>
          </motion.div>
        )
      case 'reward-earned':
        return (
          <motion.div
            key="reaction-reward"
            className="pointer-events-none absolute inset-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {[0, 1, 2, 3].map(index => (
              <motion.span
                key={index}
                className="absolute rounded-full bg-amber-300 shadow"
                style={{
                  width: '10px',
                  height: '10px',
                  left: `${40 + index * 12}px`,
                  top: `${70 + (index % 2) * 10}px`,
                }}
                initial={{ scale: 0, opacity: 0.4 }}
                animate={{
                  scale: [0, 1.2, 0.9, 1],
                  opacity: [0.4, 1, 0.7, 0],
                  y: [-4, -18],
                }}
                transition={{
                  duration: 1.6,
                  ease: 'easeOut',
                  delay: index * 0.08,
                }}
              />
            ))}
            <motion.div
              className="absolute right-6 top-8 rounded-full bg-amber-50/90 px-3 py-1 text-xs font-medium text-amber-700 shadow-sm backdrop-blur"
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.25, ease: 'easeOut', delay: 0.1 }}
            >
              Награда получена!
            </motion.div>
          </motion.div>
        )
      case 'quest-progress':
        return (
          <motion.div
            key="reaction-quest"
            className="pointer-events-none absolute inset-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            {[0, 1, 2].map(index => (
              <motion.span
                key={index}
                className="absolute text-sm"
                style={{
                  left: `${30 + index * 20}px`,
                  top: `${40 + index * 14}px`,
                }}
                initial={{ rotate: -12, scale: 0.6, opacity: 0 }}
                animate={{
                  rotate: [-12, 6, -4],
                  scale: [0.6, 1, 0.8],
                  opacity: [0, 1, 0],
                  y: [-4, -18],
                }}
                transition={{
                  duration: 1.8,
                  ease: 'easeInOut',
                  delay: index * 0.1,
                }}
              >
                🍃
              </motion.span>
            ))}
            <motion.div
              className="absolute bottom-8 left-6 rounded-full bg-emerald-50/90 px-3 py-1 text-xs font-medium text-emerald-700 shadow-sm backdrop-blur"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.25, ease: 'easeOut', delay: 0.1 }}
            >
              Прогресс по заданиям!
            </motion.div>
          </motion.div>
        )
      case 'garden-celebration':
        return (
          <motion.div
            key="reaction-celebration"
            className="pointer-events-none absolute inset-0"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: [0.3, 0.6, 0], scale: [0.8, 1.25, 1.4] }}
            exit={{ opacity: 0, scale: 1.4 }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
            style={{
              background:
                'radial-gradient(circle, rgba(255,255,255,0.5) 0%, transparent 70%)',
            }}
          >
            <motion.div
              className="absolute left-1/2 top-8 -translate-x-1/2 rounded-full bg-fuchsia-100/90 px-3 py-1 text-xs font-semibold text-fuchsia-700 shadow-sm backdrop-blur"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.3, ease: 'easeOut', delay: 0.1 }}
            >
              Магия редкого открытия!
            </motion.div>
          </motion.div>
        )
      default:
        return null
    }
  }, [
    activeReaction,
    shouldReduceMotion,
    visual?.accentColor,
    lastMood,
    position,
  ])

  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isDragging && containerRef.current) {
      const timer = setTimeout(() => {
        if (containerRef.current) {
          containerRef.current.style.transform = 'none'
        }
      }, 50)
      return () => clearTimeout(timer)
    }
    return undefined
  }, [isDragging])

  const dragStartPosRef = useRef({ x: 0, y: 0 })

  const handleDragStart = (
    _event: MouseEvent | TouchEvent | PointerEvent,
    info: PanInfo
  ) => {
    dragStartPosRef.current = info.point
    setIsDragging(true)
  }

  const handleDragEnd = (
    _event: MouseEvent | TouchEvent | PointerEvent,
    info: PanInfo
  ) => {
    setIsDragging(false)

    const dragDistance = Math.sqrt(
      (info.point.x - dragStartPosRef.current.x) ** 2 +
        (info.point.y - dragStartPosRef.current.y) ** 2
    )

    if (dragDistance < 10) {
      toggleInfo()
      return
    }

    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight
    const { x, y } = info.point
    const side: CompanionSide = x < viewportWidth / 2 ? 'left' : 'right'
    const distanceFromBottom = viewportHeight - y
    const isMobileScreen = viewportWidth < 640

    if (isMobileScreen) {
      const minDistanceFromBottom = 80
      const maxDistanceFromBottom = viewportHeight - 150
      const constrainedDistance = Math.max(
        minDistanceFromBottom,
        Math.min(maxDistanceFromBottom, distanceFromBottom)
      )
      setPosition(constrainedDistance, side)
    } else {
      setPosition(position.yPosition, side)
    }
  }

  if (!visual || !isVisible) {
    return null
  }

  const eyePaths = getEyePaths(visual.eyeShape)
  const mouthPath = getMouthPath(visual.mouthShape)
  const [scaleMin, scaleMax] = visual.scaleRange
  const scaleAnimation: number | number[] = shouldReduceMotion
    ? 1
    : [scaleMin, scaleMax, scaleMin]

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          ref={containerRef}
          key="garden-companion"
          data-companion-container
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className={clsx(
            'pointer-events-auto select-none',
            'relative flex h-16 w-12 items-center justify-center sm:h-24 sm:w-20',
            'cursor-grab focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/70 active:cursor-grabbing',
            isDragging && 'cursor-grabbing',
            className
          )}
          role="button"
          tabIndex={0}
          aria-label="Лумина, дух сада"
          aria-expanded={isInfoOpen}
          drag
          dragMomentum={false}
          dragElastic={0.05}
          dragSnapToOrigin
          dragConstraints={false}
          dragDirectionLock={false}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onKeyDown={event => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault()
              toggleInfo()
            }
          }}
          whileTap={{ scale: shouldReduceMotion ? 1 : 0.95 }}
        >
          <motion.div
            className="absolute inset-0"
            style={{ filter: 'blur(28px)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: visual.auraOpacity }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          >
            <div
              className="h-full w-full rounded-full"
              style={{
                background: `radial-gradient(circle, ${visual.auraColor} 0%, transparent 70%)`,
              }}
            />
          </motion.div>

          <motion.div
            className="relative"
            animate={ambientMotion.animate}
            transition={ambientMotion.transition}
          >
            <motion.div
              animate={{
                scale: scaleAnimation,
                rotate: shouldReduceMotion
                  ? 0
                  : [
                      0,
                      visual.sway.amplitude * 0.2,
                      0,
                      -visual.sway.amplitude * 0.2,
                      0,
                    ],
              }}
              transition={{
                duration: visual.sway.duration,
                repeat: shouldReduceMotion ? 0 : Infinity,
                repeatType: 'mirror',
                ease: 'easeInOut',
              }}
            >
              <motion.div
                animate={{
                  y: shouldReduceMotion
                    ? 0
                    : [
                        0,
                        -visual.float.amplitude,
                        0,
                        visual.float.amplitude * 0.35,
                        0,
                      ],
                }}
                transition={{
                  duration: visual.float.duration,
                  repeat: shouldReduceMotion ? 0 : Infinity,
                  ease: 'easeInOut',
                }}
              >
                <svg
                  width="96"
                  height="108"
                  viewBox="0 0 160 160"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <defs>
                    <radialGradient id={gradientId} cx="50%" cy="42%" r="64%">
                      <stop offset="0%" stopColor={visual.bodyGradient[0]} />
                      <stop offset="60%" stopColor={visual.bodyGradient[0]} />
                      <stop offset="100%" stopColor={visual.bodyGradient[1]} />
                    </radialGradient>
                    <radialGradient
                      id={coreGradientId}
                      cx="50%"
                      cy="40%"
                      r="52%"
                    >
                      <stop offset="0%" stopColor={visual.coreGlow[0]} />
                      <stop
                        offset="100%"
                        stopColor={visual.coreGlow[1]}
                        stopOpacity="0"
                      />
                    </radialGradient>
                    <linearGradient
                      id={`${gradientId}-arms`}
                      x1="0%"
                      y1="0%"
                      x2="100%"
                      y2="100%"
                    >
                      <stop
                        offset="0%"
                        stopColor={visual.bodyGradient[0]}
                        stopOpacity="0.9"
                      />
                      <stop
                        offset="100%"
                        stopColor={visual.bodyGradient[1]}
                        stopOpacity="0.85"
                      />
                    </linearGradient>
                    <linearGradient
                      id={shineGradientId}
                      x1="24%"
                      y1="18%"
                      x2="76%"
                      y2="0%"
                    >
                      <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.8" />
                      <stop
                        offset="50%"
                        stopColor="#FFFFFF"
                        stopOpacity="0.42"
                      />
                      <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
                    </linearGradient>
                    <radialGradient
                      id={`${gradientId}-blush`}
                      cx="50%"
                      cy="50%"
                      r="50%"
                    >
                      <stop
                        offset="0%"
                        stopColor="#FFC2D6"
                        stopOpacity="0.85"
                      />
                      <stop offset="100%" stopColor="#FFC2D6" stopOpacity="0" />
                    </radialGradient>
                    <filter
                      id="companion-soft-shadow"
                      x="-20%"
                      y="-20%"
                      width="140%"
                      height="160%"
                    >
                      <feGaussianBlur in="SourceGraphic" stdDeviation="6" />
                    </filter>
                  </defs>

                  <g filter="url(#companion-soft-shadow)" opacity="0.55">
                    <ellipse
                      cx="80"
                      cy="136"
                      rx="42"
                      ry="12"
                      fill={visual.coreGlow[1]}
                    />
                  </g>

                  <g>
                    <path
                      d="M40 88C24 80 12 90 10 108C8 126 20 136 34 134C48 132 62 118 60 104C58 96 52 92 40 88Z"
                      fill={`url(#${gradientId}-arms)`}
                    />
                    <path
                      d="M120 88C136 80 148 90 150 108C152 126 140 136 126 134C112 132 98 118 100 104C102 96 108 92 120 88Z"
                      fill={`url(#${gradientId}-arms)`}
                    />
                  </g>

                  <g>
                    <path
                      d="M80 24C116 24 140 52 140 90C140 126 114 148 80 148C46 148 20 126 20 90C20 52 44 24 80 24Z"
                      fill={`url(#${gradientId})`}
                    />
                    <path
                      d="M80 36C108 36 128 60 128 90C128 120 108 134 80 134C52 134 32 120 32 90C32 60 52 36 80 36Z"
                      fill={`url(#${coreGradientId})`}
                      opacity="0.72"
                    />
                  </g>

                  <path
                    d="M50 60C60 46 78 36 100 36C116 36 130 42 138 52"
                    stroke="#FFFFFF"
                    strokeOpacity="0.16"
                    strokeWidth="6"
                    strokeLinecap="round"
                  />

                  <path
                    d="M56 54C66 46 90 38 110 48"
                    stroke="#FFFFFF"
                    strokeOpacity="0.26"
                    strokeWidth="4"
                    strokeLinecap="round"
                  />

                  <path
                    d="M48 76C50 66 60 58 72 56C102 52 126 64 134 78"
                    fill={`url(#${shineGradientId})`}
                    opacity="0.7"
                  />

                  <g>
                    <circle
                      cx="56"
                      cy="110"
                      r="9.5"
                      fill={`url(#${gradientId}-blush)`}
                      opacity="0.9"
                    />
                    <circle
                      cx="104"
                      cy="110"
                      r="9.5"
                      fill={`url(#${gradientId}-blush)`}
                      opacity="0.9"
                    />
                  </g>

                  {eyePaths.variant === 'circle' ? (
                    <>
                      <circle
                        cx={eyePaths.left.cx}
                        cy={eyePaths.left.cy}
                        r={eyePaths.left.r}
                        fill="#121217"
                      />
                      <circle
                        cx={eyePaths.right.cx}
                        cy={eyePaths.right.cy}
                        r={eyePaths.right.r}
                        fill="#121217"
                      />
                    </>
                  ) : (
                    <>
                      <path
                        d={eyePaths.left}
                        stroke="#121217"
                        strokeWidth={eyePaths.strokeWidth}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        fill="none"
                      />
                      <path
                        d={eyePaths.right}
                        stroke="#121217"
                        strokeWidth={eyePaths.strokeWidth}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        fill="none"
                      />
                    </>
                  )}

                  <path
                    d={mouthPath.path}
                    stroke="#121217"
                    strokeWidth={mouthPath.strokeWidth}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    fill={mouthPath.isFilled ? '#121217' : 'none'}
                  />

                  <g opacity="0.55">
                    <circle cx="92" cy="62" r="4" fill="white" />
                    <circle cx="66" cy="50" r="3.2" fill="white" />
                    <circle cx="120" cy="76" r="2.8" fill="white" />
                  </g>
                </svg>
              </motion.div>

              {particles.length > 0 && particlePreset && (
                <div className="absolute inset-0">
                  {particles.map(index => {
                    const angle = (index / particles.length) * Math.PI * 2
                    const radius = 56 + (index % 3) * 8
                    const x = Math.cos(angle) * radius
                    const y = Math.sin(angle) * radius * 0.68

                    const motionProps = shouldReduceMotion
                      ? { animate: false as const }
                      : {
                          animate: {
                            opacity: [
                              particlePreset.opacity[0],
                              particlePreset.opacity[1],
                              particlePreset.opacity[0],
                            ],
                            scale: [
                              0.82,
                              particlePreset.size[1] / particlePreset.size[0],
                              0.82,
                            ],
                            y: [0, -particlePreset.travel.amplitude, 0],
                          },
                          transition: {
                            duration: particlePreset.travel.duration,
                            repeat: Infinity,
                            delay: index * 0.22,
                            ease: 'easeInOut' as const,
                          },
                        }

                    return (
                      <motion.span
                        key={`particle-${visual.emotion}-${index}`}
                        className="absolute rounded-full"
                        style={{
                          left: `calc(50% + ${x}px)`,
                          top: `calc(50% + ${y}px)`,
                          width: `${particlePreset.size[0]}px`,
                          height: `${particlePreset.size[0]}px`,
                          background: particlePreset.color,
                          opacity: particlePreset.opacity[0],
                          filter: 'blur(0.4px)',
                        }}
                        {...motionProps}
                      />
                    )
                  })}
                </div>
              )}
            </motion.div>
          </motion.div>

          <AnimatePresence>{reactionEffect}</AnimatePresence>

          {isCelebrating && (
            <motion.div
              className="absolute inset-0"
              initial={{ opacity: 0 }}
              animate={{ opacity: [0.25, 0.5, 0], scale: [1, 1.2, 1.4] }}
              transition={{ duration: 1.4, ease: 'easeOut' }}
              style={{
                background:
                  'radial-gradient(circle, rgba(255,255,255,0.45) 0%, transparent 65%)',
              }}
            />
          )}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
