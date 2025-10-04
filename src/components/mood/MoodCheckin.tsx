import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle, Clock, Sparkles } from 'lucide-react'
import { MoodSelector } from './MoodSelector'
import { PlantRenderer } from '@/components/garden/plants'
import { Card, LoadingSpinner } from '@/components/ui'
import { useMoodTracking, useGardenState } from '@/hooks'
import { useRecordMood } from '@/hooks/queries/useMoodQueries'
import {
  useAddGardenElement,
  useGardenHistory,
} from '@/hooks/queries/useGardenQueries'
import { useUserStore } from '@/stores'
import type { MoodType, MoodIntensity, GardenElement } from '@/types'

interface MoodCheckinProps {
  onElementUnlocked?: () => void
  className?: string
}

export function MoodCheckin({
  onElementUnlocked: _onElementUnlocked,
  className,
}: MoodCheckinProps) {
  const { currentUser } = useUserStore()
  const { canCheckinToday, todaysMood, timeUntilNextCheckin } =
    useMoodTracking()

  const { canUnlockToday, generateTodaysElement } = useGardenState()

  // React Query mutations
  const recordMood = useRecordMood(
    currentUser?.telegramId,
    currentUser?.id ?? ''
  )
  const addElement = useAddGardenElement(currentUser?.telegramId)
  const { data: gardenElements } = useGardenHistory(currentUser?.telegramId)

  // Helper to create telegram user data
  const getTelegramUserData = () => {
    if (!currentUser) return undefined

    return {
      userId: currentUser.id,
      firstName: currentUser.firstName,
      lastName: currentUser.lastName,
      username: currentUser.username,
      photoUrl: currentUser.photoUrl,
    } as const
  }

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [unlockedElement, setUnlockedElement] = useState<GardenElement | null>(
    null
  )

  const handleMoodSubmit = async (
    mood: MoodType,
    intensity: MoodIntensity,
    note?: string
  ) => {
    if (!currentUser) {
      console.error('No user found')
      return
    }

    setIsSubmitting(true)

    try {
      const telegramUserData = getTelegramUserData()
      if (!telegramUserData) return

      // Record mood using React Query
      await recordMood.mutateAsync({
        mood,
        intensity,
        ...(note && { note }),
        telegramUserData: telegramUserData as any,
      })

      // If can unlock today, generate and add garden element
      if (canUnlockToday()) {
        const existingPositions = (gardenElements ?? []).map(el => el.position)
        const newElement = generateTodaysElement(
          mood,
          currentUser.id,
          existingPositions
        )

        if (newElement) {
          await addElement.mutateAsync({
            element: {
              type: newElement.type,
              position: newElement.position,
              unlockDate: newElement.unlockDate.toISOString(),
              moodInfluence: newElement.moodInfluence,
              rarity: newElement.rarity,
            },
            telegramUserData: telegramUserData as any,
          })

          setUnlockedElement(newElement)
        }
      }

      setShowSuccess(true)

      // Hide success message after 3 seconds
      setTimeout(() => {
        setShowSuccess(false)
        setUnlockedElement(null)
      }, 3000)
    } catch (error) {
      console.error('Failed to check in:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const isLoading = recordMood.isPending || addElement.isPending || isSubmitting
  const error = recordMood.error ?? addElement.error

  if (showSuccess) {
    return (
      <motion.div
        className={className}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <Card padding="lg" className="text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
          >
            <CheckCircle size={48} className="mx-auto mb-4 text-green-500" />
          </motion.div>

          <h3 className="mb-2 text-xl font-semibold text-gray-900 dark:text-gray-100">
            Спасибо за отметку!
          </h3>

          <p className="mb-4 text-gray-600 dark:text-gray-400">
            Ваше настроение записано
          </p>

          {unlockedElement && (
            <motion.div
              className="relative mt-6 overflow-hidden rounded-2xl border border-garden-200 bg-gradient-to-br from-garden-50 to-emerald-50 p-6"
              initial={{ opacity: 0, scale: 0.8, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{
                delay: 0.5,
                type: 'spring',
                stiffness: 200,
                damping: 20,
              }}
            >
              {/* Magical sparkle background */}
              <div className="pointer-events-none absolute inset-0">
                {Array.from({ length: 8 }, (_, i) => (
                  <motion.div
                    key={i}
                    className="absolute text-yellow-300"
                    style={{
                      left: `${20 + Math.random() * 60}%`,
                      top: `${20 + Math.random() * 60}%`,
                      fontSize: '12px',
                    }}
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{
                      opacity: [0, 1, 0],
                      scale: [0, 1.5, 0],
                      rotate: [0, 180, 360],
                    }}
                    transition={{
                      duration: 2,
                      delay: 0.7 + i * 0.1,
                      ease: 'easeOut',
                    }}
                  >
                    ✨
                  </motion.div>
                ))}
              </div>

              {/* Header with animated sparkles */}
              <motion.div
                className="mb-4 flex items-center justify-center space-x-3"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
              >
                <motion.div
                  animate={{
                    rotate: [0, 15, -15, 0],
                    scale: [1, 1.2, 1],
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    repeatDelay: 2,
                  }}
                >
                  <Sparkles size={24} className="text-garden-600" />
                </motion.div>
                <motion.span
                  className="text-lg font-bold text-garden-800"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.9 }}
                >
                  Новое растение!
                </motion.span>
                <motion.div
                  animate={{
                    rotate: [0, -15, 15, 0],
                    scale: [1, 1.2, 1],
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    repeatDelay: 2,
                    delay: 0.3,
                  }}
                >
                  <Sparkles size={24} className="text-garden-600" />
                </motion.div>
              </motion.div>

              {/* Beautiful Plant Renderer */}
              <motion.div
                className="mb-3 flex justify-center"
                initial={{ opacity: 0, scale: 0, rotate: -180 }}
                animate={{
                  opacity: 1,
                  scale: [0, 1.3, 1],
                  rotate: 0,
                }}
                transition={{
                  delay: 1,
                  type: 'spring',
                  stiffness: 200,
                  damping: 15,
                }}
              >
                <PlantRenderer
                  element={unlockedElement}
                  size={80}
                  isSelected={false}
                  isHovered={false}
                  showTooltip={false}
                />
              </motion.div>

              {/* Plant info with staggered animation */}
              <motion.div
                className="text-center"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.2 }}
              >
                <p className="mb-1 text-lg font-bold text-garden-800 dark:text-garden-200">
                  {unlockedElement.name}
                </p>
                <p className="text-sm text-garden-600 dark:text-garden-300">
                  {unlockedElement.description}
                </p>

                {/* Rarity indicator */}
                {unlockedElement.rarity !== 'common' && (
                  <motion.div
                    className="mt-3 inline-flex items-center rounded-full bg-gradient-to-r from-purple-100 to-pink-100 px-3 py-1 text-xs font-medium text-purple-700 dark:from-purple-900/50 dark:to-pink-900/50 dark:text-purple-300"
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 1.4 }}
                  >
                    ⭐ {unlockedElement.rarity}
                  </motion.div>
                )}
              </motion.div>

              {/* Magical glow effect */}
              <motion.div
                className="absolute inset-0 rounded-2xl bg-gradient-to-r from-yellow-200/20 via-green-200/20 to-blue-200/20"
                initial={{ opacity: 0 }}
                animate={{
                  opacity: [0, 0.5, 0],
                }}
                transition={{
                  duration: 2,
                  delay: 1,
                  ease: 'easeInOut',
                }}
              />
            </motion.div>
          )}
        </Card>
      </motion.div>
    )
  }

  if (!canCheckinToday && !todaysMood) {
    return (
      <Card className={className} padding="lg">
        <div className="text-center">
          <Clock size={48} className="mx-auto mb-4 text-gray-400" />
          <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-gray-100">
            До следующей отметки
          </h3>
          <p className="mb-4 text-gray-600 dark:text-gray-400">
            {timeUntilNextCheckin ? (
              <>
                {new Date(timeUntilNextCheckin).getHours()}ч{' '}
                {new Date(timeUntilNextCheckin).getMinutes()}м
              </>
            ) : (
              'Скоро'
            )}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Возвращайтесь завтра, чтобы отметить настроение и вырастить новое
            растение
          </p>
        </div>
      </Card>
    )
  }

  return (
    <div className={className}>
      <AnimatePresence>
        {error && (
          <motion.div
            className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-800 dark:bg-red-900/30"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <p className="text-sm text-red-700 dark:text-red-300">
              {error instanceof Error ? error.message : String(error)}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      <MoodSelector onMoodSelected={handleMoodSubmit} isLoading={isLoading} />

      {!canUnlockToday && todaysMood && (
        <motion.div
          className="mt-4 rounded-lg border border-blue-200 bg-blue-50 p-3 dark:border-blue-800 dark:bg-blue-900/30"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="flex items-start space-x-2">
            <CheckCircle
              size={16}
              className="mt-0.5 flex-shrink-0 text-blue-600"
            />
            <div>
              <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
                Элемент уже разблокирован
              </p>
              <p className="text-xs text-blue-600 dark:text-blue-300">
                Вы можете обновить настроение, но новый элемент появится только
                завтра
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {isLoading && (
        <motion.div
          className="flex items-center justify-center py-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <LoadingSpinner size="md" />
          <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
            {recordMood.isPending || isSubmitting
              ? 'Сохранение...'
              : 'Выращивание растения...'}
          </span>
        </motion.div>
      )}
    </div>
  )
}
