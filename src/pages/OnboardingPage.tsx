import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ChevronRight,
  ChevronLeft,
  Sparkles,
  Heart,
  Sprout,
} from 'lucide-react'
import { Button, Card } from '@/components/ui'
import { useUserClientStore } from '@/hooks/index.v2'
import { MOOD_CONFIG } from '@/types'
import { useTranslation } from '@/hooks/useTranslation'
import { getLocalizedMoodConfig } from '@/utils/moodLocalization'

interface OnboardingPageProps {
  onComplete: () => void
}

// Функция для получения шагов онбординга с переводами
function getOnboardingSteps(t: ReturnType<typeof useTranslation>) {
  return [
    {
      id: 'welcome',
      title: t.onboarding.welcome.title,
      description: t.onboarding.welcome.description,
      icon: '🌸',
      content: (
        <div className="space-y-4 text-center">
          <div className="mb-4 text-4xl sm:text-6xl">🌸</div>
          <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-300 sm:text-base">
            {t.onboarding.welcome.content1}
          </p>
          <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-300 sm:text-base">
            {t.onboarding.welcome.content2}
          </p>
        </div>
      ),
    },
    {
      id: 'mood-tracking',
      title: t.onboarding.moodTracking.title,
      description: t.onboarding.moodTracking.description,
      icon: '💭',
      content: (
        <div className="space-y-4">
          <div className="mb-4 flex justify-center">
            <Heart size={48} className="text-red-400" />
          </div>
          <p className="text-center text-sm leading-relaxed text-gray-600 dark:text-gray-300 sm:text-base">
            {t.onboarding.moodTracking.content}
          </p>
          <div className="mt-6 grid grid-cols-3 gap-3 sm:grid-cols-6">
            {Object.keys(MOOD_CONFIG).map((moodKey, index) => {
              const mood = MOOD_CONFIG[moodKey as keyof typeof MOOD_CONFIG]
              const localizedMood = getLocalizedMoodConfig(
                moodKey as keyof typeof MOOD_CONFIG,
                t
              )
              return (
                <motion.div
                  key={moodKey}
                  className="rounded-xl bg-gray-50 p-3 text-center text-2xl dark:bg-gray-800"
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                  title={localizedMood.label}
                >
                  {mood.emoji}
                </motion.div>
              )
            })}
          </div>
          <p className="text-center text-sm text-gray-500 dark:text-gray-400">
            {t.onboarding.moodTracking.emotionsNote}
          </p>
        </div>
      ),
    },
    {
      id: 'garden-growth',
      title: t.onboarding.gardenGrowth.title,
      description: t.onboarding.gardenGrowth.description,
      icon: '🌱',
      content: (
        <div className="space-y-4">
          <div className="mb-4 flex justify-center">
            <Sprout size={48} className="text-green-500" />
          </div>
          <p className="text-center text-sm leading-relaxed text-gray-600 dark:text-gray-300 sm:text-base">
            {t.onboarding.gardenGrowth.content}
          </p>
          <div className="rounded-xl bg-garden-50 p-4 dark:bg-gray-800">
            <div className="grid grid-cols-2 gap-4 text-center sm:grid-cols-4">
              <div>
                <div className="mb-1 text-2xl">🌼</div>
                <div className="text-xs text-gray-600 dark:text-gray-300">
                  {t.moodLabels.joy}
                </div>
              </div>
              <div>
                <div className="mb-1 text-2xl">💧</div>
                <div className="text-xs text-gray-600 dark:text-gray-300">
                  {t.moodLabels.calm}
                </div>
              </div>
              <div>
                <div className="mb-1 text-2xl">🌵</div>
                <div className="text-xs text-gray-600 dark:text-gray-300">
                  {t.moodLabels.stress}
                </div>
              </div>
              <div>
                <div className="mb-1 text-2xl">🍄</div>
                <div className="text-xs text-gray-600 dark:text-gray-300">
                  {t.moodLabels.sadness}
                </div>
              </div>
            </div>
          </div>
          <p className="text-center text-xs text-gray-500 dark:text-gray-400 sm:text-sm">
            {t.onboarding.gardenGrowth.overTime}
          </p>
        </div>
      ),
    },
    {
      id: 'ready',
      title: t.onboarding.ready.title,
      description: t.onboarding.ready.description,
      icon: '🌟',
      content: (
        <div className="space-y-4 text-center">
          <div className="mb-4 flex justify-center">
            <Sparkles size={48} className="text-yellow-500" />
          </div>
          <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-300 sm:text-base">
            {t.onboarding.ready.content}
          </p>
          <div className="rounded-xl bg-gradient-to-r from-garden-50 to-blue-50 p-4 dark:from-gray-800 dark:to-gray-700">
            <p className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-200">
              {t.onboarding.ready.tipTitle}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              {t.onboarding.ready.tipContent}
            </p>
          </div>
        </div>
      ),
    },
  ]
}

export function OnboardingPage({ onComplete }: OnboardingPageProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const { completeOnboarding } = useUserClientStore()
  const t = useTranslation()

  const ONBOARDING_STEPS = getOnboardingSteps(t)

  const handleNext = () => {
    if (currentStep < ONBOARDING_STEPS.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      completeOnboarding()
      onComplete()
    }
  }

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const currentStepData = ONBOARDING_STEPS[currentStep] ?? ONBOARDING_STEPS[0]
  const isLastStep = currentStep === ONBOARDING_STEPS.length - 1

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-kira-50 via-garden-50 to-neutral-50 p-2 dark:from-neutral-900 dark:via-neutral-800 dark:to-neutral-900 sm:p-4">
      <div className="mx-auto w-full max-w-2xl">
        {/* Progress indicators */}
        <div className="mb-8 flex justify-center px-3">
          <div className="flex space-x-1.5">
            {ONBOARDING_STEPS.map((_, index) => (
              <motion.div
                key={index}
                className={`h-2.5 w-2.5 rounded-full transition-colors duration-300 sm:h-3 sm:w-3 ${
                  index <= currentStep
                    ? 'bg-garden-500'
                    : 'bg-gray-300 dark:bg-gray-600'
                }`}
                initial={{ scale: 0.8 }}
                animate={{
                  scale: index === currentStep ? 1.2 : 1,
                  backgroundColor: index <= currentStep ? '#22c55e' : '#d1d5db',
                }}
                transition={{ duration: 0.3 }}
              />
            ))}
          </div>
        </div>

        {/* Step content */}
        <Card className="min-h-[400px] sm:min-h-[500px]" padding="lg">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              {/* Header */}
              <div className="mb-6 text-center sm:mb-8">
                <motion.div
                  className="mb-4 text-4xl sm:text-6xl"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                >
                  {currentStepData?.icon}
                </motion.div>

                <h1 className="mb-2 text-xl font-bold text-gray-900 dark:text-gray-100 sm:text-2xl">
                  {currentStepData?.title}
                </h1>

                <p className="text-sm text-gray-600 dark:text-gray-300 sm:text-base">
                  {currentStepData?.description}
                </p>
              </div>

              {/* Content */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                {currentStepData?.content}
              </motion.div>
            </motion.div>
          </AnimatePresence>

          {/* Navigation */}
          <div className="mt-6 flex flex-col items-center justify-between gap-3 border-t border-gray-200 pt-6 dark:border-gray-700 sm:mt-8 sm:flex-row sm:gap-4">
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={currentStep === 0}
              leftIcon={<ChevronLeft size={16} />}
              className="w-full sm:w-auto"
            >
              {t.common.back}
            </Button>

            <div className="w-full text-center text-sm text-gray-500 dark:text-gray-400 sm:w-auto">
              {currentStep + 1} {t.onboarding.of} {ONBOARDING_STEPS.length}
            </div>

            <Button
              onClick={handleNext}
              rightIcon={
                isLastStep ? <Sparkles size={16} /> : <ChevronRight size={16} />
              }
              className="w-full sm:w-auto"
            >
              {isLastStep ? t.onboarding.start : t.common.next}
            </Button>
          </div>
        </Card>
      </div>
    </div>
  )
}
