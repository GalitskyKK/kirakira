import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { clsx } from 'clsx'
import { useMoodTracking } from '@/hooks/index.v2'
import { Button, Card } from '@/components/ui'
import { MOOD_CONFIG } from '@/types/mood'
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

export function MoodSelector({
  onMoodSelected,
  initialMood,
  isLoading,
  className,
}: MoodSelectorProps) {
  const { canCheckinToday, todaysMood } = useMoodTracking()
  const [selectedMood, setSelectedMood] = useState<MoodType | null>(
    initialMood ?? todaysMood?.mood ?? null
  )
  const [selectedIntensity, setSelectedIntensity] = useState<MoodIntensity>(
    todaysMood?.intensity ?? 2
  )
  const [note, setNote] = useState(todaysMood?.note ?? '')
  const [step, setStep] = useState<'mood' | 'intensity' | 'note'>('mood')

  const handleMoodSelect = (mood: MoodType) => {
    setSelectedMood(mood)
    setStep('intensity')
  }

  const handleIntensitySelect = (intensity: MoodIntensity) => {
    setSelectedIntensity(intensity)
    setStep('note')
  }

  const handleSubmit = () => {
    if (selectedMood) {
      onMoodSelected?.(selectedMood, selectedIntensity, note || undefined)
    }
  }

  const handleBack = () => {
    if (step === 'note') setStep('intensity')
    else if (step === 'intensity') setStep('mood')
  }

  const isAlreadyCheckedIn = !canCheckinToday()

  // Если уже отметили настроение, показываем информацию о нём
  if (isAlreadyCheckedIn && todaysMood) {
    const moodConfig = MOOD_CONFIG[todaysMood.mood]
    const intensityLabels = ['Слабо', 'Умеренно', 'Сильно']

    return (
      <Card className={className} padding="lg">
        <div className="text-center">
          <div className="mb-4">
            <div className="mb-3 text-6xl">{moodConfig.emoji}</div>
            <h3 className="mb-2 text-xl font-semibold text-gray-900 dark:text-gray-100">
              Настроение отмечено
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Сегодня вы уже отметили своё настроение
            </p>
          </div>

          <div className="mb-4 rounded-xl border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-900/30">
            <div className="mb-3 flex items-center justify-center space-x-3">
              <span className="text-3xl">{moodConfig.emoji}</span>
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
            Возвращайтесь завтра и вырасти новое растение !
          </p>
        </div>
      </Card>
    )
  }

  return (
    <Card className={className} padding="lg">
      {/* Минимальный индикатор прогресса */}
      <div className="mb-3">
        <div className="flex items-center justify-center space-x-1">
          {(['mood', 'intensity', 'note'] as const).map((s, index) => (
            <div key={s} className="flex items-center">
              <div
                className={clsx(
                  'h-1.5 w-1.5 rounded-full transition-colors',
                  step === s
                    ? 'bg-garden-500'
                    : index <
                        (['mood', 'intensity', 'note'] as const).indexOf(step)
                      ? 'bg-garden-300'
                      : 'bg-gray-300'
                )}
              />
              {index < 2 && (
                <div className="mx-1 h-0.5 w-2 rounded-full bg-gray-200" />
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
            transition={{ duration: 0.2 }}
          >
            <h3 className="mb-4 text-center text-lg font-semibold text-gray-900 dark:text-gray-100">
              Как дела?
            </h3>
            <p className="mb-4 text-center text-sm text-gray-600 dark:text-gray-400">
              Выберите, что лучше всего описывает ваше настроение
            </p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {(Object.keys(MOOD_CONFIG) as MoodType[]).map(mood => {
                const config = MOOD_CONFIG[mood]
                return (
                  <motion.button
                    key={mood}
                    onClick={() => handleMoodSelect(mood)}
                    className={clsx(
                      'flex flex-col items-center justify-center rounded-xl border-2 p-4 transition-all hover:scale-105',
                      selectedMood === mood
                        ? 'border-garden-500 bg-garden-50 shadow-md dark:bg-garden-900/30'
                        : 'border-gray-200 bg-white hover:border-gray-300 dark:border-gray-700 dark:bg-gray-800'
                    )}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <span className="mb-2 text-4xl">{config.emoji}</span>
                    <span
                      className={clsx(
                        'text-sm font-medium',
                        selectedMood === mood
                          ? 'text-garden-700 dark:text-garden-300'
                          : 'text-gray-700 dark:text-gray-300'
                      )}
                    >
                      {config.label}
                    </span>
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
            transition={{ duration: 0.2 }}
          >
            <h3 className="mb-4 text-center text-lg font-semibold text-gray-900 dark:text-gray-100">
              Насколько сильно?
            </h3>
            <div className="space-y-3">
              {([1, 2, 3] as MoodIntensity[]).map(intensity => {
                const labels = ['Слабо', 'Умеренно', 'Сильно']
                return (
                  <motion.button
                    key={intensity}
                    onClick={() => handleIntensitySelect(intensity)}
                    className={clsx(
                      'w-full rounded-xl border-2 p-4 text-left transition-all hover:scale-[1.02]',
                      selectedIntensity === intensity
                        ? 'border-garden-500 bg-garden-50 shadow-md dark:bg-garden-900/30'
                        : 'border-gray-200 bg-white hover:border-gray-300 dark:border-gray-700 dark:bg-gray-800'
                    )}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p
                          className={clsx(
                            'font-medium',
                            selectedIntensity === intensity
                              ? 'text-garden-700 dark:text-garden-300'
                              : 'text-gray-900 dark:text-gray-100'
                          )}
                        >
                          {labels[intensity - 1]}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
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
                                ? 'bg-garden-500'
                                : 'bg-gray-300 dark:bg-gray-600'
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
            transition={{ duration: 0.2 }}
          >
            <h3 className="mb-4 text-center text-lg font-semibold text-gray-900 dark:text-gray-100">
              Добавить заметку? (необязательно)
            </h3>
            <textarea
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="Что вы чувствуете сегодня?"
              className="w-full rounded-xl border-2 border-gray-200 bg-white p-4 text-gray-900 placeholder-gray-400 transition-colors focus:border-garden-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-500"
              rows={4}
              maxLength={200}
            />
            <p className="mb-4 mt-1 text-right text-xs text-gray-500">
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
            className="mt-6 rounded-xl border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-900/30"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex items-center space-x-3">
              <div className="text-2xl">
                {MOOD_CONFIG[todaysMood.mood].emoji}
              </div>
              <div>
                <p className="text-sm font-medium text-green-800 dark:text-green-200">
                  {MOOD_CONFIG[todaysMood.mood].label}
                </p>
                <p className="text-xs text-green-600 dark:text-green-300">
                  Интенсивность:{' '}
                  {['Слабо', 'Умеренно', 'Сильно'][todaysMood.intensity - 1]}
                </p>
                {(todaysMood.note ?? '').length > 0 && (
                  <p className="mt-1 text-xs text-green-700 dark:text-green-300">
                    "{todaysMood.note}"
                  </p>
                )}
              </div>
            </div>
          </motion.div>
        )}
    </Card>
  )
}

export function MoodIcon({
  mood,
  size = 24,
}: {
  mood: MoodType
  size?: number
}) {
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
      <span style={{ fontSize: size * 0.6 }}>{config.emoji}</span>
    </div>
  )
}
