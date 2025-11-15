import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { BookOpen, ChevronLeft, ChevronRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useMoodTracking } from '@/hooks/useMoodTracking'
import { Card } from '@/components/ui'
import { LoadingSpinner } from '@/components/ui'
import { PageHeader } from '@/components/layout'
import { WeekPage } from '@/components/mood/WeekPage'
import { groupMoodEntriesByWeek } from '@/utils/weekGrouping'

export function MoodRoadmapPage() {
  const navigate = useNavigate()
  const { moodHistory, isLoading } = useMoodTracking()

  // Группируем записи по неделям
  const weekGroups = groupMoodEntriesByWeek(moodHistory)

  // Текущая страница (неделя)
  const [currentPage, setCurrentPage] = useState(0)

  // Навигация по страницам
  const goToPreviousPage = () => {
    setCurrentPage(prev => Math.max(0, prev - 1))
  }

  const goToNextPage = () => {
    setCurrentPage(prev => Math.min(weekGroups.length - 1, prev + 1))
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  const currentWeek = weekGroups[currentPage]

  // Если нет недель, показываем пустое состояние
  if (weekGroups.length === 0) {
    return (
      <motion.div
        className="min-h-screen bg-gradient-to-br from-kira-50 via-garden-50 to-neutral-50 dark:from-neutral-900 dark:via-neutral-800 dark:to-neutral-900"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3 }}
      >
        <PageHeader
          title="Дневник настроений"
          icon={<BookOpen className="h-5 w-5" />}
          onBack={() => navigate('/mobile/profile')}
        />
        <div className="p-4 pb-24">
          <Card padding="lg" className="text-center">
            <div className="mb-4 text-6xl">🌱</div>
            <h2 className="mb-2 text-xl font-semibold text-gray-900 dark:text-gray-100">
              Пока нет записей
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Начните отмечать настроение, чтобы увидеть свой дневник
            </p>
          </Card>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div
      className="min-h-screen bg-gradient-to-br from-kira-50 via-garden-50 to-neutral-50 dark:from-neutral-900 dark:via-neutral-800 dark:to-neutral-900"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
    >
      <PageHeader
        title="Дневник настроений"
        icon={<BookOpen className="h-5 w-5" />}
        onBack={() => navigate('/mobile/profile')}
      />

      <div className="p-4 pb-24">
        <div className="space-y-4">
          {/* Контейнер для страниц книги */}
          <div className="relative">
            <AnimatePresence mode="wait">
              {currentWeek && (
                <WeekPage
                  key={currentWeek.weekStart.getTime()}
                  weekStart={currentWeek.weekStart}
                  entries={currentWeek.entries}
                  pageIndex={currentPage}
                />
              )}
            </AnimatePresence>

            {/* Кнопки навигации */}
            <div className="mt-6 flex items-center justify-between">
              <motion.button
                onClick={goToPreviousPage}
                disabled={currentPage === 0}
                className="flex items-center space-x-2 rounded-xl bg-white/80 px-4 py-2 text-sm font-medium text-gray-700 shadow-lg backdrop-blur-sm transition-all disabled:cursor-not-allowed disabled:opacity-40 dark:bg-neutral-800/80 dark:text-gray-200"
                whileHover={currentPage > 0 ? { scale: 1.05 } : {}}
                whileTap={currentPage > 0 ? { scale: 0.95 } : {}}
              >
                <ChevronLeft className="h-4 w-4" />
                <span>Предыдущая</span>
              </motion.button>

              {/* Индикатор страниц */}
              <div className="flex items-center space-x-2">
                {weekGroups.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentPage(index)}
                    className={`h-2 rounded-full transition-all ${
                      index === currentPage
                        ? 'w-8 bg-kira-500'
                        : 'w-2 bg-gray-300 dark:bg-gray-600'
                    }`}
                    aria-label={`Перейти на страницу ${index + 1}`}
                  />
                ))}
              </div>

              <motion.button
                onClick={goToNextPage}
                disabled={currentPage === weekGroups.length - 1}
                className="flex items-center space-x-2 rounded-xl bg-white/80 px-4 py-2 text-sm font-medium text-gray-700 shadow-lg backdrop-blur-sm transition-all disabled:cursor-not-allowed disabled:opacity-40 dark:bg-neutral-800/80 dark:text-gray-200"
                whileHover={
                  currentPage < weekGroups.length - 1 ? { scale: 1.05 } : {}
                }
                whileTap={
                  currentPage < weekGroups.length - 1 ? { scale: 0.95 } : {}
                }
              >
                <span>Следующая</span>
                <ChevronRight className="h-4 w-4" />
              </motion.button>
            </div>
          </div>

          {/* Статистика */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card padding="md" className="glass-card">
              <div className="text-center">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Всего недель:{' '}
                  <span className="font-semibold">{weekGroups.length}</span>
                  {' • '}
                  Всего записей:{' '}
                  <span className="font-semibold">{moodHistory.length}</span>
                </p>
              </div>
            </Card>
          </motion.div>
        </div>
      </div>
    </motion.div>
  )
}
