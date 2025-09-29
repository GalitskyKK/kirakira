import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { clsx } from 'clsx'
import { useMoodTracking } from '@/hooks'
import { Button, Card } from '@/components/ui'
import { MOOD_CONFIG } from '@/types/mood'
import type { MoodType, MoodIntensity } from '@/types'

interface MoodSelectorProps {
  onMoodSelected?: (
    mood: MoodType,
    intensity: MoodIntensity,
    note?: string
  ) => void
  isLoading?: boolean
  className?: string
}

export function MoodSelector({
  onMoodSelected,
  isLoading = false,
  className,
}: MoodSelectorProps) {
  const { canCheckinToday, todaysMood } = useMoodTracking()
  const [selectedMood, setSelectedMood] = useState<MoodType | null>(
    todaysMood?.mood ?? null
  )
  const [selectedIntensity, setSelectedIntensity] = useState<MoodIntensity>(
    todaysMood?.intensity ?? 2
  )
  const [note, setNote] = useState(todaysMood?.note ?? '')
  const [step, setStep] = useState<'mood' | 'intensity' | 'note'>('mood')

  const moods = Object.entries(MOOD_CONFIG) as [
    MoodType,
    (typeof MOOD_CONFIG)[MoodType],
  ][]

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
      onMoodSelected?.(
        selectedMood,
        selectedIntensity,
        note.trim() || undefined
      )
    }
  }

  const handleBack = () => {
    if (step === 'intensity') {
      setStep('mood')
    } else if (step === 'note') {
      setStep('intensity')
    }
  }

  const isAlreadyCheckedIn = !canCheckinToday()

  return (
    <Card className={clsx('mx-auto w-full max-w-md', className)} padding="lg">
      <div className="mb-6 text-center">
        <h2 className="mb-2 text-xl font-semibold text-gray-900 dark:text-gray-100">
          {isAlreadyCheckedIn ? 'Сегодняшнее настроение' : 'Как дела?'}
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {isAlreadyCheckedIn
            ? 'Вы уже отметили настроение сегодня'
            : 'Выберите, что лучше всего описывает ваше настроение'}
        </p>
      </div>

      <AnimatePresence mode="wait">
        {step === 'mood' && (
          <motion.div
            key="mood"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <div className="grid grid-cols-2 gap-3">
              {moods.map(([moodKey, moodConfig]) => (
                <motion.button
                  key={moodKey}
                  className={clsx(
                    'rounded-2xl border-2 p-4 transition-all duration-200',
                    'focus:outline-none focus:ring-2 focus:ring-offset-2',
                    selectedMood === moodKey
                      ? 'scale-105 border-current shadow-md'
                      : 'hover:scale-102 border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600',
                    isAlreadyCheckedIn && 'cursor-not-allowed opacity-50'
                  )}
                  style={{
                    color:
                      selectedMood === moodKey ? moodConfig.color : undefined,
                    backgroundColor:
                      selectedMood === moodKey
                        ? `${moodConfig.color}10`
                        : undefined,
                  }}
                  onClick={() =>
                    !isAlreadyCheckedIn && handleMoodSelect(moodKey)
                  }
                  disabled={isAlreadyCheckedIn}
                  {...(!isAlreadyCheckedIn && {
                    whileHover: { scale: 1.02 },
                    whileTap: { scale: 0.98 },
                  })}
                >
                  <div className="mb-2 text-3xl">{moodConfig.emoji}</div>
                  <div className="text-sm font-medium">{moodConfig.label}</div>
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}

        {step === 'intensity' && selectedMood && (
          <motion.div
            key="intensity"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <div className="mb-6 text-center">
              <div className="mb-2 text-4xl">
                {MOOD_CONFIG[selectedMood].emoji}
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                {MOOD_CONFIG[selectedMood].label}
              </h3>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                Насколько сильно вы это чувствуете?
              </p>
            </div>

            <div className="space-y-3">
              {[1, 2, 3].map(intensity => {
                const labels = ['Слабо', 'Умеренно', 'Сильно']
                const isSelected = selectedIntensity === intensity

                return (
                  <motion.button
                    key={intensity}
                    className={clsx(
                      'w-full rounded-xl border-2 p-4 text-left transition-all duration-200',
                      'focus:outline-none focus:ring-2 focus:ring-offset-2',
                      isSelected
                        ? 'border-current shadow-md'
                        : 'border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600'
                    )}
                    style={{
                      color: isSelected
                        ? MOOD_CONFIG[selectedMood].color
                        : undefined,
                      backgroundColor: isSelected
                        ? `${MOOD_CONFIG[selectedMood].color}10`
                        : undefined,
                    }}
                    onClick={() =>
                      handleIntensitySelect(intensity as MoodIntensity)
                    }
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">
                        {labels[intensity - 1]}
                      </span>
                      <div className="flex space-x-1">
                        {Array.from({ length: 3 }, (_, i) => (
                          <div
                            key={i}
                            className={clsx(
                              'h-2 w-2 rounded-full',
                              i < intensity
                                ? 'bg-current'
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

            <div className="mt-6 flex space-x-3">
              <Button variant="outline" onClick={handleBack} fullWidth>
                Назад
              </Button>
              <Button onClick={() => setStep('note')} fullWidth>
                Далее
              </Button>
            </div>
          </motion.div>
        )}

        {step === 'note' && selectedMood && (
          <motion.div
            key="note"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <div className="mb-6 text-center">
              <div className="mb-2 text-4xl">
                {MOOD_CONFIG[selectedMood].emoji}
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                Добавить заметку
              </h3>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                Что происходит в вашей жизни? (необязательно)
              </p>
            </div>

            <textarea
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="Расскажите о своем дне..."
              className={clsx(
                'w-full rounded-xl border border-gray-300 p-4 dark:border-gray-600',
                'bg-white text-gray-900 dark:bg-gray-800 dark:text-gray-100',
                'focus:border-transparent focus:outline-none focus:ring-2 focus:ring-garden-500',
                'resize-none text-sm'
              )}
              rows={4}
              maxLength={200}
            />

            <div className="mt-1 text-right text-xs text-gray-500 dark:text-gray-400">
              {note.length}/200
            </div>

            <div className="mt-6 flex space-x-3">
              <Button variant="outline" onClick={handleBack} fullWidth>
                Назад
              </Button>
              <Button onClick={handleSubmit} isLoading={isLoading} fullWidth>
                {isAlreadyCheckedIn ? 'Обновить' : 'Сохранить'}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {isAlreadyCheckedIn && todaysMood && (
        <motion.div
          className="mt-6 rounded-xl border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-900/30"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="flex items-center space-x-3">
            <div className="text-2xl">{MOOD_CONFIG[todaysMood.mood].emoji}</div>
            <div>
              <p className="text-sm font-medium text-green-800 dark:text-green-200">
                {MOOD_CONFIG[todaysMood.mood].label}
              </p>
              <p className="text-xs text-green-600 dark:text-green-300">
                Интенсивность:{' '}
                {['Слабо', 'Умеренно', 'Сильно'][todaysMood.intensity - 1]}
              </p>
              {todaysMood.note && (
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
