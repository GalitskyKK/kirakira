import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Clock, Sparkles } from 'lucide-react'
import { MoodSelector } from './MoodSelector'
import { PlantRenderer } from '@/components/garden/plants'
import { Card, LoadingSpinner } from '@/components/ui'
import { useMoodTracking } from '@/hooks/index.v2'
import { useGardenState } from '@/hooks/index.v2'
import { useQuestIntegration } from '@/hooks/useQuestIntegration'
import { useDailyQuests } from '@/hooks/queries/useDailyQuestQueries'
import { useTelegramId } from '@/hooks/useTelegramId'
import type { MoodType, MoodIntensity, MoodEntry, GardenElement } from '@/types'

interface MoodCheckinProps {
  onMoodSubmit?: (moodEntry: MoodEntry) => void
  className?: string
}

export function MoodCheckin({ onMoodSubmit, className }: MoodCheckinProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [unlockedElement, setUnlockedElement] = useState<GardenElement | null>(
    null
  )

  const {
    canCheckinToday,
    todaysMood,
    timeUntilNextCheckin,
    checkInToday,
    isLoading: moodLoading,
    error: moodError,
  } = useMoodTracking()

  const {
    canUnlockToday,
    unlockElement,
    isLoading: gardenLoading,
    error: gardenError,
  } = useGardenState()

  const telegramId = useTelegramId()
  const { data: questsData } = useDailyQuests(telegramId ?? 0)
  const { questActions, updateQuestsWithValidation } = useQuestIntegration({
    onQuestUpdated: () => undefined,
  })

  const [showSuccess, setShowSuccess] = useState(false)

  const handleMoodSubmit = useCallback(
    async (mood: MoodType, intensity: MoodIntensity, note?: string) => {
      if (!canCheckinToday()) {
        console.warn('Cannot submit mood - already checked in today.')
        return
      }

      setIsSubmitting(true)
      setUnlockedElement(null)

      try {
        // Save mood entry using v2 hook
        const moodEntry = await checkInToday(mood, intensity, note)

        if (moodEntry) {
          onMoodSubmit?.(moodEntry)

          // Обновляем квесты настроения с умной валидацией
          if (questsData?.quests && questsData.quests.length > 0) {
            await updateQuestsWithValidation(
              {
                moodType: mood,
                hasNote: !!note,
              },
              questsData.quests
            )
          } else {
            // Fallback к старому методу если квесты не загружены
            await questActions.recordMood(mood, !!note)
          }

          if (!todaysMood && canUnlockToday()) {
            // Unlock garden element
            const element = await unlockElement(mood)
            if (element) {
              setUnlockedElement(element)
              // Обновляем квесты сада
              await questActions.collectElement()
            }
          }

          setShowSuccess(true)

          // Hide success message after 3 seconds
          setTimeout(() => {
            setShowSuccess(false)
            setUnlockedElement(null)
          }, 3000)
        }
      } catch (error) {
        console.error('Failed to check in:', error)
      } finally {
        setIsSubmitting(false)
      }
    },
    [
      canCheckinToday,
      todaysMood,
      checkInToday,
      onMoodSubmit,
      canUnlockToday,
      unlockElement,
      updateQuestsWithValidation,
      questsData?.quests,
      questActions,
    ]
  )

  const isLoading = moodLoading || gardenLoading || isSubmitting
  const error = moodError || gardenError

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
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-500">
              <span className="text-xl text-white">✓</span>
            </div>
          </motion.div>

          <h3 className="mb-2 text-xl font-semibold text-gray-900 dark:text-gray-100">
            Спасибо за отметку!
          </h3>

          <p className="mb-4 text-gray-600 dark:text-gray-400">
            Ваше настроение записано
          </p>

          {unlockedElement && (
            <motion.div
              className="relative mt-6 overflow-hidden rounded-2xl border border-garden-200 bg-gradient-to-br from-garden-50 to-emerald-50 p-6 dark:border-garden-700 dark:from-garden-900/20 dark:to-emerald-900/20"
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
                  className="text-lg font-bold text-garden-800 dark:text-garden-200"
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
            {timeUntilNextCheckin.hours}ч {timeUntilNextCheckin.minutes}м
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
            <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
          </motion.div>
        )}
      </AnimatePresence>

      <MoodSelector onMoodSelected={handleMoodSubmit} isLoading={isLoading} />

      {isLoading && (
        <motion.div
          className="flex items-center justify-center py-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <LoadingSpinner size="md" />
          <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
            {moodLoading || isSubmitting
              ? 'Сохранение...'
              : 'Выращивание растения...'}
          </span>
        </motion.div>
      )}
    </div>
  )
}
