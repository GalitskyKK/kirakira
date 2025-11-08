import { useMemo } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
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
} from '@/types'

interface GardenCompanionProps {
  readonly className?: string
}

interface EyeRenderOptions {
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
        left: 'M36 76 Q 40 72 44 76',
        right: 'M76 76 Q 80 72 84 76',
        strokeWidth: 3,
      }
    case 'calm':
      return {
        left: 'M36 74 Q 40 70 44 74 Q 40 78 36 74',
        right: 'M76 74 Q 80 70 84 74 Q 80 78 76 74',
        strokeWidth: 2.2,
      }
    case 'wide':
      return {
        left: 'M38 72 Q 40 68 44 68 Q 46 72 44 76 Q 40 78 38 72',
        right: 'M78 72 Q 80 68 84 68 Q 86 72 84 76 Q 80 78 78 72',
        strokeWidth: 2.4,
      }
    case 'sad':
      return {
        left: 'M36 74 Q 40 78 44 74',
        right: 'M76 74 Q 80 78 84 74',
        strokeWidth: 3,
      }
    case 'focused':
      return {
        left: 'M36 72 Q 41 69 46 72',
        right: 'M74 72 Q 79 69 84 72',
        strokeWidth: 3.2,
      }
    default:
      return {
        left: 'M36 74 Q 40 70 44 74',
        right: 'M76 74 Q 80 70 84 74',
        strokeWidth: 2.4,
      }
  }
}

function getMouthPath(shape: CompanionMouthShape): MouthRenderOptions {
  switch (shape) {
    case 'smile':
      return {
        path: 'M50 92 Q 60 100 70 92',
        strokeWidth: 3,
        isFilled: false,
      }
    case 'soft':
      return {
        path: 'M50 90 Q 60 94 70 90',
        strokeWidth: 2.4,
        isFilled: false,
      }
    case 'frown':
      return {
        path: 'M50 94 Q 60 88 70 94',
        strokeWidth: 3,
        isFilled: false,
      }
    case 'open':
      return {
        path: 'M52 90 Q 60 98 68 90 Q 60 102 52 90',
        strokeWidth: 2.4,
        isFilled: true,
      }
    case 'determined':
      return {
        path: 'M50 92 L70 90',
        strokeWidth: 3.2,
        isFilled: false,
      }
    default:
      return {
        path: 'M50 90 Q 60 94 70 90',
        strokeWidth: 2.4,
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
  const toggleInfo = useCompanionStore(state => state.toggleInfo)
  const isInfoOpen = useCompanionStore(state => state.isInfoOpen)
  const lastMood = useCompanionStore(state => state.lastMood)
  const visual = useCompanionVisual()

  const reduceMotion = useReducedMotion()

  const gradientId = useMemo(
    () => `companion-body-${activeCompanionId}-${visual?.emotion ?? 'neutral'}`,
    [activeCompanionId, visual?.emotion]
  )
  const coreGradientId = useMemo(
    () => `companion-core-${activeCompanionId}-${visual?.emotion ?? 'neutral'}`,
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
    () => getAmbientMotionConfig(activeAmbientAnimation, !!reduceMotion),
    [activeAmbientAnimation, reduceMotion]
  )

  const reactionEffect = useMemo(() => {
    if (!activeReaction || reduceMotion) {
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
              className="absolute left-[-210px] top-6 flex w-[220px] justify-end"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.25, ease: 'easeOut', delay: 0.1 }}
            >
              <span className="relative inline-flex min-h-[60px] w-[220px] items-center justify-center rounded-[28px] bg-white/95 px-6 py-4 text-left text-base font-medium leading-normal text-slate-600 shadow-xl backdrop-blur dark:bg-slate-900/95 dark:text-slate-200">
                {moodMessage}
                <span className="absolute right-[-12px] top-1/2 h-4 w-4 -translate-y-1/2 rotate-45 bg-white/95 shadow-sm dark:bg-slate-900/95" />
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
  }, [activeReaction, reduceMotion, visual?.accentColor, lastMood])

  if (!visual || !isVisible) {
    return null
  }

  const eyePaths = getEyePaths(visual.eyeShape)
  const mouthPath = getMouthPath(visual.mouthShape)
  const [scaleMin, scaleMax] = visual.scaleRange
  const scaleAnimation: number | number[] = reduceMotion
    ? 1
    : [scaleMin, scaleMax, scaleMin]

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          key="garden-companion"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 12 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
          className={clsx(
            'pointer-events-auto select-none',
            'relative flex h-48 w-44 items-center justify-center',
            'cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/70',
            className
          )}
          role="button"
          tabIndex={0}
          aria-label="Лумина, дух сада"
          aria-expanded={isInfoOpen}
          onClick={event => {
            event.stopPropagation()
            toggleInfo()
          }}
          onKeyDown={event => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault()
              toggleInfo()
            }
          }}
          whileTap={{ scale: reduceMotion ? 1 : 0.95 }}
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
                rotate: reduceMotion
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
                repeat: reduceMotion ? 0 : Infinity,
                repeatType: 'mirror',
                ease: 'easeInOut',
              }}
            >
              <motion.div
                animate={{
                  y: reduceMotion
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
                  repeat: reduceMotion ? 0 : Infinity,
                  ease: 'easeInOut',
                }}
              >
                <svg
                  width="160"
                  height="200"
                  viewBox="0 0 120 150"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <defs>
                    <linearGradient
                      id={gradientId}
                      x1="20"
                      y1="20"
                      x2="100"
                      y2="130"
                    >
                      <stop offset="0%" stopColor={visual.bodyGradient[0]} />
                      <stop offset="100%" stopColor={visual.bodyGradient[1]} />
                    </linearGradient>
                    <radialGradient
                      id={coreGradientId}
                      cx="50%"
                      cy="45%"
                      r="60%"
                    >
                      <stop offset="0%" stopColor={visual.coreGlow[0]} />
                      <stop
                        offset="100%"
                        stopColor={visual.coreGlow[1]}
                        stopOpacity="0"
                      />
                    </radialGradient>
                  </defs>

                  <g>
                    <path
                      d="M60 12C86 18 106 42 100 80C96 110 80 132 60 142C40 132 24 110 20 80C14 42 34 18 60 12Z"
                      fill={`url(#${gradientId})`}
                      stroke={visual.accentColor}
                      strokeOpacity="0.45"
                      strokeWidth="2"
                    />
                    <path
                      d="M60 24C78 30 90 48 86 72C83 92 72 108 60 114C48 108 37 92 34 72C30 48 42 30 60 24Z"
                      fill={`url(#${coreGradientId})`}
                      opacity="0.85"
                    />
                  </g>

                  {/* Tail */}
                  <path
                    d="M60 142C72 134 86 124 93 108C96 100 92 90 96 82"
                    stroke={visual.accentColor}
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeOpacity="0.58"
                  />

                  {/* Eyes */}
                  <path
                    d={eyePaths.left}
                    stroke="#1F2933"
                    strokeWidth={eyePaths.strokeWidth}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    fill="none"
                  />
                  <path
                    d={eyePaths.right}
                    stroke="#1F2933"
                    strokeWidth={eyePaths.strokeWidth}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    fill="none"
                  />

                  {/* Mouth */}
                  <path
                    d={mouthPath.path}
                    stroke="#1F2933"
                    strokeWidth={mouthPath.strokeWidth}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    fill={mouthPath.isFilled ? '#1F2933' : 'none'}
                  />

                  {/* Cheek glow */}
                  <ellipse
                    cx="36"
                    cy="88"
                    rx="6"
                    ry="4.5"
                    fill={visual.coreGlow[0]}
                    opacity="0.35"
                  />
                  <ellipse
                    cx="84"
                    cy="88"
                    rx="6"
                    ry="4.5"
                    fill={visual.coreGlow[0]}
                    opacity="0.35"
                  />
                </svg>
              </motion.div>

              {particles.length > 0 && particlePreset && (
                <div className="absolute inset-0">
                  {particles.map(index => {
                    const angle = (index / particles.length) * Math.PI * 2
                    const radius = 46 + (index % 2 === 0 ? 6 : 10)
                    const x = Math.cos(angle) * radius
                    const y = Math.sin(angle) * radius * 0.6

                    const motionProps = reduceMotion
                      ? { animate: false as const }
                      : {
                          animate: {
                            opacity: [
                              particlePreset.opacity[0],
                              particlePreset.opacity[1],
                              particlePreset.opacity[0],
                            ],
                            scale: [
                              0.8,
                              particlePreset.size[1] / particlePreset.size[0],
                              0.8,
                            ],
                            y: [0, -particlePreset.travel.amplitude, 0],
                          },
                          transition: {
                            duration: particlePreset.travel.duration,
                            repeat: Infinity,
                            delay: index * 0.3,
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
