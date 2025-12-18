import { useState, memo, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { clsx } from 'clsx'
import { useMoodTracking } from '@/hooks/index.v2'
import { Button, Card } from '@/components/ui'
import { MOOD_CONFIG } from '@/types/mood'
import { MoodImage } from './MoodImage'
import { useAnimationConfig } from '@/hooks'
import { useTranslation } from '@/hooks/useTranslation'
import { getLocalizedMoodConfig } from '@/utils/moodLocalization'
import type { MoodType, MoodIntensity } from '@/types'

interface MoodSelectorProps {
  onMoodSelected?: (
    mood: MoodType,
    intensity: MoodIntensity,
    note?: string
  ) => void
  initialMood?: MoodType
  isLoading?: boolean
  className?: string
}

// Мемоизированный компонент для лучшей производительности
export const MoodSelector = memo(function MoodSelector({
  onMoodSelected,
  initialMood,
  isLoading,
  className,
}: MoodSelectorProps) {
  const { canCheckinToday, todaysMood } = useMoodTracking()
  const { transition } = useAnimationConfig()
  const t = useTranslation()

  const [selectedMood, setSelectedMood] = useState<MoodType | null>(
    initialMood ?? todaysMood?.mood ?? null
  )
  const [selectedIntensity, setSelectedIntensity] = useState<MoodIntensity>(
    todaysMood?.intensity ?? 2
  )
  const [note, setNote] = useState(todaysMood?.note ?? '')
  const [step, setStep] = useState<'mood' | 'intensity' | 'note'>('mood')

  const handleMoodSelect = useCallback((mood: MoodType) => {
    setSelectedMood(mood)
    setStep('intensity')
  }, [])

  const handleIntensitySelect = useCallback((intensity: MoodIntensity) => {
    setSelectedIntensity(intensity)
    setStep('note')
  }, [])

  const handleSubmit = useCallback(() => {
    if (selectedMood) {
      onMoodSelected?.(selectedMood, selectedIntensity, note || undefined)
    }
  }, [selectedMood, selectedIntensity, note, onMoodSelected])

  const handleBack = useCallback(() => {
    if (step === 'note') setStep('intensity')
    else if (step === 'intensity') setStep('mood')
  }, [step])

  const isAlreadyCheckedIn = useMemo(
    () => !canCheckinToday(),
    [canCheckinToday]
  )

  // Если уже отметили настроение, показываем информацию о нём
  if (
    isAlreadyCheckedIn &&
    todaysMood?.mood &&
    todaysMood.mood in MOOD_CONFIG
  ) {
    const moodConfig = getLocalizedMoodConfig(todaysMood.mood, t)
    const intensityLabels = [
      t.mood.intensity.low,
      t.mood.intensity.medium,
      t.mood.intensity.high,
    ]

    return (
      <Card className={className} padding="lg">
        <div className="text-center">
          <div className="mb-4">
            <MoodImage mood={todaysMood.mood} size={96} className="mb-3" />
            <h3 className="mb-2 text-xl font-semibold text-gray-900 dark:text-gray-100">
              {t.mood.alreadyCheckedIn}
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              {t.mood.alreadyCheckedIn}
            </p>
          </div>

          <div className="mb-4 rounded-xl border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-900/30">
            <div className="mb-3 flex items-center justify-center space-x-3">
              <MoodImage mood={todaysMood.mood} size={48} />
              <div className="text-left">
                <p className="font-semibold text-green-800 dark:text-green-200">
                  {moodConfig.label}
                </p>
                <p className="text-sm text-green-600 dark:text-green-300">
                  {intensityLabels[todaysMood.intensity - 1]}
                </p>
              </div>
            </div>

            {(todaysMood.note ?? '').length > 0 && (
              <div className="mt-3 rounded-lg bg-white p-3 dark:bg-gray-800">
                <p className="text-sm italic text-gray-700 dark:text-gray-300">
                  "{todaysMood.note}"
                </p>
              </div>
            )}
          </div>

          <p className="text-sm text-gray-500 dark:text-gray-400">
            {t.mood.returnTomorrowToGrow}
          </p>
        </div>
      </Card>
    )
  }

  return (
    <Card className={className} padding="lg" variant="glass">
      {/* Минимальный индикатор прогресса */}
      <div className="mb-3">
        <div className="flex items-center justify-center space-x-1">
          {(['mood', 'intensity', 'note'] as const).map((s, index) => (
            <div key={s} className="flex items-center">
              <div
                className={clsx(
                  'h-1.5 w-1.5 rounded-full transition-colors',
                  step === s
                    ? 'bg-kira-500'
                    : index <
                        (['mood', 'intensity', 'note'] as const).indexOf(step)
                      ? 'bg-kira-300'
                      : 'bg-neutral-300 dark:bg-neutral-600'
                )}
              />
              {index < 2 && (
                <div className="mx-1 h-0.5 w-2 rounded-full bg-neutral-200 dark:bg-neutral-700" />
              )}
            </div>
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {step === 'mood' && (
          <motion.div
            key="mood"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={transition}
          >
            <h3 className="mb-4 text-center text-lg font-semibold text-gray-900 dark:text-gray-100">
              {t.mood.howAreYouToday}
            </h3>
            <p className="mb-4 text-center text-sm text-gray-600 dark:text-gray-400">
              {t.commonPhrases.selectMoodDescription}
            </p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {(Object.keys(MOOD_CONFIG) as MoodType[]).map(mood => {
                if (!(mood in MOOD_CONFIG)) return null
                const config = getLocalizedMoodConfig(mood, t)

                return (
                  <motion.button
                    key={mood}
                    onClick={() => handleMoodSelect(mood)}
                    className={clsx(
                      'relative flex flex-col items-center justify-center overflow-hidden rounded-xl border-2 p-4 transition-all duration-300',
                      selectedMood === mood
                        ? 'border-kira-500 bg-white/90 shadow-lg backdrop-blur-sm dark:bg-neutral-800/90'
                        : 'border-neutral-200 bg-white active:scale-95 dark:border-neutral-700 dark:bg-neutral-800'
                    )}
                    whileTap={{ scale: 0.95 }}
                    style={{
                      boxShadow:
                        selectedMood === mood
                          ? '0 8px 25px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.2)'
                          : '0 2px 8px rgba(0, 0, 0, 0.05), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
                    }}
                  >
                    {/* Переливающийся фон с анимацией - более видимый */}
                    <div
                      className={clsx(
                        'absolute inset-0 rounded-xl opacity-40 dark:opacity-50',
                        mood === 'joy' && 'mood-gradient-joy',
                        mood === 'calm' && 'mood-gradient-calm',
                        mood === 'stress' && 'mood-gradient-stress',
                        mood === 'sadness' && 'mood-gradient-sadness',
                        mood === 'anger' && 'mood-gradient-anger',
                        mood === 'anxiety' && 'mood-gradient-anxiety'
                      )}
                    />

                    {/* Контент поверх фона с лучшим контрастом */}
                    <div className="relative z-10 flex flex-col items-center">
                      <div className="mb-2 rounded-full bg-white/90 p-3 shadow-md backdrop-blur-sm dark:bg-neutral-600/90 dark:shadow-lg">
                        <MoodImage mood={mood} size={48} />
                      </div>
                      <span
                        className={clsx(
                          'text-sm font-medium drop-shadow-sm',
                          selectedMood === mood
                            ? 'text-kira-800 dark:text-kira-200'
                            : 'text-neutral-800 dark:text-neutral-200'
                        )}
                      >
                        {config.label}
                      </span>
                    </div>
                  </motion.button>
                )
              })}
            </div>
          </motion.div>
        )}

        {step === 'intensity' && selectedMood && (
          <motion.div
            key="intensity"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={transition}
          >
            <h3 className="mb-4 text-center text-lg font-semibold text-gray-900 dark:text-gray-100">
              {t.mood.howStrong}
            </h3>
            <div className="space-y-3">
              {([1, 2, 3] as MoodIntensity[]).map(intensity => {
                const labels = [
                  t.mood.intensity.low,
                  t.mood.intensity.medium,
                  t.mood.intensity.high,
                ]
                return (
                  <motion.button
                    key={intensity}
                    onClick={() => handleIntensitySelect(intensity)}
                    className={clsx(
                      'w-full rounded-xl border-2 p-4 text-left transition-all',
                      selectedIntensity === intensity
                        ? 'border-kira-500 bg-kira-50/50 shadow-md dark:bg-kira-900/30'
                        : 'border-neutral-200 bg-white active:scale-95 dark:border-neutral-700 dark:bg-neutral-800'
                    )}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p
                          className={clsx(
                            'font-medium',
                            selectedIntensity === intensity
                              ? 'text-kira-700 dark:text-kira-300'
                              : 'text-neutral-900 dark:text-neutral-100'
                          )}
                        >
                          {labels[intensity - 1]}
                        </p>
                        <p className="text-xs text-neutral-500 dark:text-neutral-400">
                          Интенсивность: {intensity}/3
                        </p>
                      </div>
                      <div className="flex space-x-1">
                        {Array.from({ length: 3 }, (_, i) => (
                          <div
                            key={i}
                            className={clsx(
                              'h-2 w-2 rounded-full',
                              i < (intensity as number)
                                ? 'bg-kira-500'
                                : 'bg-neutral-300 dark:bg-neutral-600'
                            )}
                          />
                        ))}
                      </div>
                    </div>
                  </motion.button>
                )
              })}
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleBack}
              className="mt-4 w-full"
            >
              Назад
            </Button>
          </motion.div>
        )}

        {step === 'note' && (
          <motion.div
            key="note"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={transition}
          >
            <h3 className="mb-4 text-center text-lg font-semibold text-neutral-900 dark:text-neutral-100">
              Добавить заметку? (необязательно)
            </h3>
            <textarea
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="Что вы чувствуете сегодня?"
              className="w-full rounded-xl border-2 border-neutral-200 bg-white p-4 text-neutral-900 placeholder-neutral-400 transition-colors focus:border-kira-500 focus:outline-none dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100 dark:placeholder-neutral-500"
              rows={4}
              maxLength={200}
            />
            <p className="mb-4 mt-1 text-right text-xs text-neutral-500">
              {note.length}/200
            </p>
            <div className="flex space-x-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={handleBack}
                className="flex-1"
              >
                Назад
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleSubmit}
                isLoading={isLoading ?? false}
                disabled={isLoading ?? false}
                className="flex-1"
              >
                {todaysMood ? 'Обновить' : 'Сохранить'}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {isAlreadyCheckedIn &&
        todaysMood?.mood &&
        todaysMood.mood in MOOD_CONFIG && (
          <motion.div
            className="glass-card mt-6 rounded-xl border border-garden-200/50 bg-garden-50/50 p-4 dark:border-garden-700/50 dark:bg-garden-900/20"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex items-center space-x-3">
              <MoodImage mood={todaysMood.mood} size={32} />
              <div>
                <p className="text-sm font-medium text-garden-800 dark:text-garden-200">
                  {MOOD_CONFIG[todaysMood.mood].label}
                </p>
                <p className="text-xs text-garden-600 dark:text-garden-300">
                  Интенсивность:{' '}
                  {['Слабо', 'Умеренно', 'Сильно'][todaysMood.intensity - 1]}
                </p>
                {(todaysMood.note ?? '').length > 0 && (
                  <p className="mt-1 text-xs text-garden-700 dark:text-garden-300">
                    "{todaysMood.note}"
                  </p>
                )}
              </div>
            </div>
          </motion.div>
        )}
    </Card>
  )
})

// Мемоизированный компонент MoodIcon для производительности
export const MoodIcon = memo(function MoodIcon({
  mood,
  size = 24,
}: {
  mood: MoodType
  size?: number
}) {
  if (!(mood in MOOD_CONFIG)) return null
  const config = MOOD_CONFIG[mood]

  return (
    <div
      className="flex items-center justify-center rounded-full"
      style={{
        width: size,
        height: size,
        backgroundColor: `${config.color}20`,
      }}
    >
      <MoodImage mood={mood} size={size * 0.6} />
    </div>
  )
})
