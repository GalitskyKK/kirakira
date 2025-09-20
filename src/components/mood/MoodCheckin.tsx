import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle, Clock, Sparkles } from 'lucide-react'
import { MoodSelector } from './MoodSelector'
import { Button, Card, LoadingSpinner } from '@/components/ui'
import { useMoodTracking, useGardenState } from '@/hooks'
import { getTimeUntilNextCheckin } from '@/utils/dateHelpers'
import type { MoodType, MoodIntensity } from '@/types'

interface MoodCheckinProps {
  onElementUnlocked?: () => void
  className?: string
}

export function MoodCheckin({ onElementUnlocked, className }: MoodCheckinProps) {
  const {
    canCheckinToday,
    todaysMood,
    timeUntilNextCheckin,
    checkInToday,
    updateTodaysMoodEntry,
    isLoading: moodLoading,
    error: moodError,
  } = useMoodTracking()

  const {
    unlockElement,
    canUnlockToday,
    isLoading: gardenLoading,
    error: gardenError,
  } = useGardenState()

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [unlockedElement, setUnlockedElement] = useState<any>(null)

  const handleMoodSubmit = async (
    mood: MoodType,
    intensity: MoodIntensity,
    note?: string
  ) => {
    setIsSubmitting(true)
    
    try {
      // Save mood entry
      const moodEntry = todaysMood
        ? await updateTodaysMoodEntry(mood, intensity, note)
        : await checkInToday(mood, intensity, note)

      if (moodEntry && canUnlockToday) {
        // Unlock garden element
        const element = await unlockElement(mood)
        if (element) {
          setUnlockedElement(element)
          onElementUnlocked?.()
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
            <CheckCircle size={48} className="text-green-500 mx-auto mb-4" />
          </motion.div>
          
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Спасибо за отметку!
          </h3>
          
          <p className="text-gray-600 mb-4">
            Ваше настроение записано
          </p>

          {unlockedElement && (
            <motion.div
              className="mt-6 p-4 bg-garden-50 rounded-xl border border-garden-200"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <div className="flex items-center justify-center space-x-3 mb-3">
                <Sparkles size={20} className="text-garden-600" />
                <span className="text-sm font-medium text-garden-800">
                  Новое растение!
                </span>
                <Sparkles size={20} className="text-garden-600" />
              </div>
              
              <div className="text-4xl mb-2">{unlockedElement.emoji}</div>
              <p className="text-sm font-medium text-garden-800">
                {unlockedElement.name}
              </p>
              <p className="text-xs text-garden-600 mt-1">
                {unlockedElement.description}
              </p>
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
          <Clock size={48} className="text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            До следующей отметки
          </h3>
          <p className="text-gray-600 mb-4">
            {timeUntilNextCheckin.hours}ч {timeUntilNextCheckin.minutes}м
          </p>
          <p className="text-sm text-gray-500">
            Возвращайтесь завтра, чтобы отметить настроение и вырастить новое растение
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
            className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <p className="text-sm text-red-700">{error}</p>
          </motion.div>
        )}
      </AnimatePresence>

      <MoodSelector
        onMoodSelected={handleMoodSubmit}
        isLoading={isLoading}
      />

      {!canUnlockToday && todaysMood && (
        <motion.div
          className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="flex items-start space-x-2">
            <CheckCircle size={16} className="text-blue-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm text-blue-800 font-medium">
                Элемент уже разблокирован
              </p>
              <p className="text-xs text-blue-600">
                Вы можете обновить настроение, но новый элемент появится только завтра
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
          <span className="ml-2 text-sm text-gray-600">
            {moodLoading || isSubmitting ? 'Сохранение...' : 'Выращивание растения...'}
          </span>
        </motion.div>
      )}
    </div>
  )
}
