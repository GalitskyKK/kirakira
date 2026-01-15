import { useEffect, useRef, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Clock, Sparkles, Palette } from 'lucide-react'
import { MoodSelector } from './MoodSelector'
import { PlantRenderer } from '@/components/garden/plants'
import { Card, LoadingSpinner } from '@/components/ui'
import { useMoodTracking } from '@/hooks/index.v2'
import { useGardenState } from '@/hooks/index.v2'
import { useQuestIntegration } from '@/hooks/useQuestIntegration'
import { useDailyQuests } from '@/hooks/queries/useDailyQuestQueries'
import { useTelegramId } from '@/hooks/useTelegramId'
import { useGardenClientStore } from '@/stores/gardenStore'
import { useAnimationConfig } from '@/hooks'
import { useTranslation } from '@/hooks/useTranslation'
import { GardenDisplayMode, RarityLevel } from '@/types'
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
  const [hasSyncedTodaysQuests, setHasSyncedTodaysQuests] = useState(false)
  const [hasAttemptedAutoUnlock, setHasAttemptedAutoUnlock] = useState(false)
  const successTimeoutRef = useRef<number | null>(null)
  const t = useTranslation()

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

  const { displayMode } = useGardenClientStore()
  const isPaletteMode = displayMode === GardenDisplayMode.PALETTE

  const telegramId = useTelegramId()
  const { data: questsData } = useDailyQuests(telegramId ?? 0)
  const { questActions, updateQuestsWithValidation } = useQuestIntegration({
    onQuestUpdated: () => undefined,
  })

  const [showSuccess, setShowSuccess] = useState(false)

  // Оптимизация анимаций
  const { transition, spring, enableComplexEffects } = useAnimationConfig()

  const scheduleHideSuccess = useCallback(() => {
    if (successTimeoutRef.current !== null) {
      window.clearTimeout(successTimeoutRef.current)
    }

    successTimeoutRef.current = window.setTimeout(() => {
      setShowSuccess(false)
      setUnlockedElement(null)
    }, 4500)
  }, [])

  useEffect(() => {
    return () => {
      if (successTimeoutRef.current !== null) {
        window.clearTimeout(successTimeoutRef.current)
      }
    }
  }, [])

  // 🔧 Catch-up: если настроение уже отмечено, но квесты не успели обновиться
  // (например, квесты/сад еще не были загружены в момент чек-ина) — синхронизируем по факту.
  useEffect(() => {
    if (telegramId === undefined || telegramId === null) return
    if (!todaysMood) return
    if (!questsData?.quests || questsData.quests.length === 0) return
    if (hasSyncedTodaysQuests) return

    setHasSyncedTodaysQuests(true)

    void updateQuestsWithValidation(
      {
        moodType: todaysMood.mood,
        hasNote: (todaysMood.note ?? '').length > 0,
        streakDays: 1,
      },
      questsData.quests
    ).catch(error => {
      // Не критично: квесты могут отсутствовать
      console.warn('⚠️ Failed to catch-up daily quests:', error)
    })
  }, [
    telegramId,
    todaysMood,
    questsData?.quests,
    hasSyncedTodaysQuests,
    updateQuestsWithValidation,
  ])

  // 🔧 Catch-up: если настроение уже отмечено, но растение за сегодня не было создано
  // (частый случай: сад не успел загрузиться в момент чек-ина) — попробуем вырастить растение позже.
  useEffect(() => {
    if (hasAttemptedAutoUnlock) return
    if (!todaysMood) return
    if (unlockedElement) return
    if (isSubmitting) return
    if (!canUnlockToday()) return

    setHasAttemptedAutoUnlock(true)
    setIsSubmitting(true)

    void (async () => {
      const element = await unlockElement(todaysMood.mood)
      if (element) {
        setUnlockedElement(element)
        setShowSuccess(true)
        scheduleHideSuccess()
      }
    })().finally(() => {
      setIsSubmitting(false)
    })
  }, [
    hasAttemptedAutoUnlock,
    todaysMood,
    unlockedElement,
    isSubmitting,
    canUnlockToday,
    unlockElement,
    scheduleHideSuccess,
  ])

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
                // Запись настроения всегда поддерживает стрик (первый чек-ин за день)
                streakDays: 1,
              },
              questsData.quests
            )
          } else {
            // Fallback к старому методу если квесты не загружены
            await questActions.recordMood(mood, !!note)
            await questActions.maintainStreak(1)
          }

          // 🔧 ИСПРАВЛЕНИЕ: Генерируем элемент если можно разблокировать сегодня
          // Важно: проверяем canUnlockToday() даже если todaysMood существует,
          // так как после заморозки может быть ситуация, когда настроение уже отмечено,
          // но элемент еще не создан
          if (canUnlockToday()) {
            // Unlock garden element
            const element = await unlockElement(mood)
            if (element) {
              setUnlockedElement(element)
              // Обновляем квесты сада
              await questActions.collectElement()
            }
          }

          setShowSuccess(true)

          // Hide success message after a short delay (smooth exit)
          scheduleHideSuccess()
        }
      } catch (error) {
        console.error('Failed to check in:', error)
      } finally {
        setIsSubmitting(false)
      }
    },
    [
      canCheckinToday,
      checkInToday,
      onMoodSubmit,
      canUnlockToday,
      unlockElement,
      updateQuestsWithValidation,
      questsData?.quests,
      questActions,
      scheduleHideSuccess,
    ]
  )

  const isLoading = moodLoading || gardenLoading || isSubmitting
  const error = moodError ?? gardenError

  return (
    <AnimatePresence mode="wait">
      {showSuccess ? (
        <motion.div
          key="success"
          className={className}
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.98, y: 10 }}
          transition={{ duration: 0.35 }}
        >
          <Card padding="lg" className="text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.15, type: 'spring', stiffness: 200 }}
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

            {/* Показываем информацию о палитре в режиме палитры */}
            {isPaletteMode ? (
              <motion.div
                className="relative mt-6 overflow-hidden rounded-2xl border border-purple-200 bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 p-6 dark:border-purple-700 dark:from-purple-900/20 dark:via-pink-900/20 dark:to-orange-900/20"
                initial={{ opacity: 0, scale: 0.98, y: 12 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={spring}
              >
              {/* Magical sparkle background - оптимизировано */}
              {enableComplexEffects && (
                <div className="pointer-events-none absolute inset-0">
                  {Array.from({ length: 4 }, (_, i) => (
                    <motion.div
                      key={i}
                      className="absolute"
                      style={{
                        left: `${20 + i * 20}%`,
                        top: `${20 + (i % 2) * 40}%`,
                        fontSize: '16px',
                      }}
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{
                        opacity: [0, 0.8, 0],
                        scale: [0, 1.2, 0],
                      }}
                      transition={{
                        duration: 2,
                        delay: 0.7 + i * 0.2,
                        ease: 'easeOut',
                      }}
                    >
                      🎨
                    </motion.div>
                  ))}
                </div>
              )}

              {/* Header with palette icon - упрощено */}
              <motion.div
                className="mb-4 flex items-center justify-center space-x-3"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={transition}
              >
                <Palette
                  size={24}
                  className="text-purple-600 dark:text-purple-400"
                />
                <motion.span
                  className="text-lg font-bold text-purple-800 dark:text-purple-200"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={transition}
                >
                  Палитра обновлена!
                </motion.span>
                <Palette
                  size={24}
                  className="text-purple-600 dark:text-purple-400"
                />
              </motion.div>

              {/* Gradient circle representing palette - упрощено */}
              <motion.div
                className="mb-3 flex justify-center"
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={spring}
              >
                <div className="relative h-20 w-20">
                  <div className="absolute inset-0 rounded-full bg-gradient-to-br from-purple-400 via-pink-400 to-orange-400" />
                  <div className="absolute inset-1 rounded-full bg-gradient-to-tr from-blue-400 via-green-400 to-yellow-400" />
                  <div className="absolute inset-2 rounded-full bg-gradient-to-bl from-red-400 via-purple-400 to-blue-400 opacity-80" />
                </div>
              </motion.div>

              {/* Palette info */}
              <motion.div
                className="text-center"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={transition}
              >
                <p className="mb-1 text-lg font-bold text-purple-800 dark:text-purple-200">
                  Цвета изменились
                </p>
                <p className="text-sm text-purple-600 dark:text-purple-300">
                  Ваше настроение добавило новые оттенки в палитру вашего сада
                </p>
              </motion.div>
            </motion.div>
          ) : (
            /* Показываем информацию об элементе в обычном режиме */
            unlockedElement && (
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
                {/* Magical sparkle background - оптимизировано */}
                {enableComplexEffects && (
                  <div className="pointer-events-none absolute inset-0">
                    {Array.from({ length: 4 }, (_, i) => (
                      <motion.div
                        key={i}
                        className="absolute text-yellow-300"
                        style={{
                          left: `${25 + i * 20}%`,
                          top: `${30 + (i % 2) * 30}%`,
                          fontSize: '12px',
                        }}
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{
                          opacity: [0, 0.8, 0],
                          scale: [0, 1.2, 0],
                        }}
                        transition={{
                          duration: 1.5,
                          delay: 0.7 + i * 0.15,
                          ease: 'easeOut',
                        }}
                      >
                        ✨
                      </motion.div>
                    ))}
                  </div>
                )}

                {/* Header with sparkles - упрощено */}
                <motion.div
                  className="mb-4 flex items-center justify-center space-x-3"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={transition}
                >
                  <Sparkles size={24} className="text-garden-600" />
                  <motion.span
                    className="text-lg font-bold text-garden-800 dark:text-garden-200"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={transition}
                  >
                    Новое растение!
                  </motion.span>
                  <Sparkles size={24} className="text-garden-600" />
                </motion.div>

                {/* Plant Renderer - упрощено */}
                <motion.div
                  className="mb-3 flex justify-center"
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={spring}
                >
                  <PlantRenderer
                    element={unlockedElement}
                    size={80}
                    isSelected={false}
                    isHovered={false}
                    showTooltip={false}
                  />
                </motion.div>

                {/* Plant info */}
                <motion.div
                  className="text-center"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={transition}
                >
                  <p className="mb-1 text-lg font-bold text-garden-800 dark:text-garden-200">
                    {unlockedElement.name}
                  </p>
                  <p className="text-sm text-garden-600 dark:text-garden-300">
                    {unlockedElement.description}
                  </p>

                  {/* Rarity indicator */}
                  {unlockedElement.rarity !== RarityLevel.COMMON && (
                    <motion.div
                      className="mt-3 inline-flex items-center rounded-full bg-gradient-to-r from-purple-100 to-pink-100 px-3 py-1 text-xs font-medium text-purple-700 dark:from-purple-900/50 dark:to-pink-900/50 dark:text-purple-300"
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={transition}
                    >
                      ⭐ {unlockedElement.rarity}
                    </motion.div>
                  )}
                </motion.div>
              </motion.div>
            )
          )}
        </Card>
      </motion.div>
      ) : (
        <motion.div
          key="main"
          className={className}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          {!canCheckinToday() && !todaysMood ? (
            <Card padding="lg">
              <div className="text-center">
                <Clock size={48} className="mx-auto mb-4 text-gray-400" />
                <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {t.mood.timeUntilNext}
                </h3>
                <p className="mb-4 text-gray-600 dark:text-gray-400">
                  {timeUntilNextCheckin.hours}
                  {t.mood.hours} {timeUntilNextCheckin.minutes}
                  {t.mood.minutes}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {t.mood.returnTomorrowToGrow}
                </p>
              </div>
            </Card>
          ) : (
            <div>
              <AnimatePresence>
                {error && (
                  <motion.div
                    className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-800 dark:bg-red-900/30"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                  >
                    <p className="text-sm text-red-700 dark:text-red-300">
                      {error}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>

              <AnimatePresence>
                {gardenLoading && (
                  <motion.div
                    className="mb-3 rounded-xl border border-kira-200 bg-kira-50 p-3 text-sm text-kira-800 dark:border-kira-800 dark:bg-kira-900/30 dark:text-kira-200"
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="flex items-start gap-3">
                      <Sparkles
                        size={18}
                        className="mt-0.5 shrink-0 text-kira-600 dark:text-kira-300"
                      />
                      <div>
                        <div className="font-medium">Сад загружается</div>
                        <div className="mt-0.5 text-xs text-kira-700/80 dark:text-kira-200/80">
                          Если отметка уже сделана, растение и квесты появятся
                          автоматически через пару секунд.
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <MoodSelector
                onMoodSelected={(mood, intensity, note) => {
                  void handleMoodSubmit(mood, intensity, note)
                }}
                isLoading={isLoading}
              />

              {isLoading && (
                <motion.div
                  className="flex items-center justify-center py-4"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <LoadingSpinner size="md" />
                  <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
                    {moodLoading || isSubmitting
                      ? t.mood.saving
                      : t.mood.growingPlant}
                  </span>
                </motion.div>
              )}
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
