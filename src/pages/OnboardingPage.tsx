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

interface OnboardingPageProps {
  onComplete: () => void
}

const ONBOARDING_STEPS = [
  {
    id: 'welcome',
    title: 'Добро пожаловать в KiraKira',
    description: 'Ваш персональный цифровой сад эмоций',
    icon: '🌸',
    content: (
      <div className="space-y-4 text-center">
        <div className="mb-4 text-4xl sm:text-6xl">🌸</div>
        <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-300 sm:text-base">
          KiraKira — это медитативное приложение, где ваши ежедневные эмоции
          превращаются в красивый цифровой сад.
        </p>
        <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-300 sm:text-base">
          Каждый день, отмечая свое настроение, вы выращиваете уникальные
          растения, создавая персональное пространство для размышлений.
        </p>
      </div>
    ),
  },
  {
    id: 'mood-tracking',
    title: 'Отслеживание настроения',
    description: 'Ежедневная практика осознанности',
    icon: '💭',
    content: (
      <div className="space-y-4">
        <div className="mb-4 flex justify-center">
          <Heart size={48} className="text-red-400" />
        </div>
        <p className="text-center text-sm leading-relaxed text-gray-600 dark:text-gray-300 sm:text-base">
          Каждый день вы будете отмечать свое настроение — от радости до грусти,
          от спокойствия до тревоги.
        </p>
        <div className="mt-6 grid grid-cols-3 gap-3 sm:grid-cols-6">
          {Object.values(MOOD_CONFIG).map((mood, index) => (
            <motion.div
              key={mood.label}
              className="rounded-xl bg-gray-50 p-3 text-center text-2xl dark:bg-gray-800"
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
              title={mood.label}
            >
              {mood.emoji}
            </motion.div>
          ))}
        </div>
        <p className="text-center text-sm text-gray-500 dark:text-gray-400">
          Ваши эмоции — это не хорошо или плохо, это просто часть человеческого
          опыта
        </p>
      </div>
    ),
  },
  {
    id: 'garden-growth',
    title: 'Рост сада',
    description: 'Ваши эмоции становятся растениями',
    icon: '🌱',
    content: (
      <div className="space-y-4">
        <div className="mb-4 flex justify-center">
          <Sprout size={48} className="text-green-500" />
        </div>
        <p className="text-center text-sm leading-relaxed text-gray-600 dark:text-gray-300 sm:text-base">
          Каждое настроение влияет на то, какое растение появится в вашем саду.
          Радость приносит яркие цветы, спокойствие — водные элементы.
        </p>
        <div className="rounded-xl bg-garden-50 p-4 dark:bg-gray-800">
          <div className="grid grid-cols-2 gap-4 text-center sm:grid-cols-4">
            <div>
              <div className="mb-1 text-2xl">🌼</div>
              <div className="text-xs text-gray-600 dark:text-gray-300">
                Радость
              </div>
            </div>
            <div>
              <div className="mb-1 text-2xl">💧</div>
              <div className="text-xs text-gray-600 dark:text-gray-300">
                Спокойствие
              </div>
            </div>
            <div>
              <div className="mb-1 text-2xl">🌵</div>
              <div className="text-xs text-gray-600 dark:text-gray-300">
                Стресс
              </div>
            </div>
            <div>
              <div className="mb-1 text-2xl">🍄</div>
              <div className="text-xs text-gray-600 dark:text-gray-300">
                Грусть
              </div>
            </div>
          </div>
        </div>
        <p className="text-center text-xs text-gray-500 dark:text-gray-400 sm:text-sm">
          Со временем ваш сад станет уникальным отражением вашего эмоционального
          путешествия
        </p>
      </div>
    ),
  },
  // {
  //   id: 'privacy',
  //   title: 'Конфиденциальность',
  //   description: 'Ваши данные остаются при вас',
  //   icon: '🔒',
  //   content: (
  //     <div className="space-y-4">
  //       <div className="flex justify-center mb-4">
  //         <div className="p-3 bg-blue-100 rounded-full">
  //           <div className="text-3xl">🔒</div>
  //         </div>
  //       </div>
  //       <div className="space-y-3">
  //         <div className="flex items-start space-x-3">
  //           <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
  //             <div className="w-2 h-2 bg-green-500 rounded-full"></div>
  //           </div>
  //           <div>
  //             <p className="font-medium text-gray-900">Локальное хранение</p>
  //             <p className="text-sm text-gray-600">
  //               Все ваши данные хранятся только на вашем устройстве
  //             </p>
  //           </div>
  //         </div>
  //         <div className="flex items-start space-x-3">
  //           <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
  //             <div className="w-2 h-2 bg-green-500 rounded-full"></div>
  //           </div>
  //           <div>
  //             <p className="font-medium text-gray-900">Никакой аналитики</p>
  //             <p className="text-sm text-gray-600">
  //               Мы не отслеживаем ваше поведение и не собираем персональные данные
  //             </p>
  //           </div>
  //         </div>
  //         <div className="flex items-start space-x-3">
  //           <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
  //             <div className="w-2 h-2 bg-green-500 rounded-full"></div>
  //           </div>
  //           <div>
  //             <p className="font-medium text-gray-900">Анонимность</p>
  //             <p className="text-sm text-gray-600">
  //               Регистрация не требуется — начните пользоваться прямо сейчас
  //             </p>
  //           </div>
  //         </div>
  //       </div>
  //     </div>
  //   ),
  // },
  {
    id: 'ready',
    title: 'Готовы начать?',
    description: 'Ваш сад ждет первое растение',
    icon: '🌟',
    content: (
      <div className="space-y-4 text-center">
        <div className="mb-4 flex justify-center">
          <Sparkles size={48} className="text-yellow-500" />
        </div>
        <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-300 sm:text-base">
          Отметьте свое текущее настроение, чтобы вырастить первое растение в
          вашем персональном саду эмоций.
        </p>
        <div className="rounded-xl bg-gradient-to-r from-garden-50 to-blue-50 p-4 dark:from-gray-800 dark:to-gray-700">
          <p className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-200">
            💡 Совет для начинающих
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Старайтесь отмечать настроение каждый день в одно и то же время. Это
            поможет создать привычку и получить более точную картину ваших
            эмоций.
          </p>
        </div>
      </div>
    ),
  },
]

export function OnboardingPage({ onComplete }: OnboardingPageProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const { completeOnboarding } = useUserClientStore()

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
    <div className="from-kira-50 flex min-h-screen items-center justify-center bg-gradient-to-br via-garden-50 to-neutral-50 p-2 dark:from-neutral-900 dark:via-neutral-800 dark:to-neutral-900 sm:p-4">
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
              Назад
            </Button>

            <div className="w-full text-center text-sm text-gray-500 dark:text-gray-400 sm:w-auto">
              {currentStep + 1} из {ONBOARDING_STEPS.length}
            </div>

            <Button
              onClick={handleNext}
              rightIcon={
                isLastStep ? <Sparkles size={16} /> : <ChevronRight size={16} />
              }
              className="w-full sm:w-auto"
            >
              {isLastStep ? 'Начать!' : 'Далее'}
            </Button>
          </div>
        </Card>
      </div>
    </div>
  )
}
