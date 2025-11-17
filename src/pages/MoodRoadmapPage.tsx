import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { BookOpen } from 'lucide-react'
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

  // Группируем записи по неделям (уже в обратном порядке - от новых к старым)
  const weekGroups = groupMoodEntriesByWeek(moodHistory)

  // Текущая страница (неделя) - начинаем с последней (текущей недели, индекс 0)
  const [currentPage, setCurrentPage] = useState(0)

  // Навигация по страницам
  // "Назад" = идем в прошлое (увеличиваем индекс, т.к. недели отсортированы от новых к старым)
  const goToPreviousPage = () => {
    setCurrentPage(prev => Math.min(weekGroups.length - 1, prev + 1))
  }

  // "Вперед" = идем к более новым неделям (уменьшаем индекс)
  const goToNextPage = () => {
    setCurrentPage(prev => Math.max(0, prev - 1))
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

      <div className="p-2 pb-24 sm:p-4">
        <div className="space-y-4">
          {/* Контейнер для страниц книги */}
          <div className="relative w-full">
            <AnimatePresence mode="wait">
              {currentWeek && (
                <WeekPage
                  key={currentWeek.weekStart.getTime()}
                  weekStart={currentWeek.weekStart}
                  entries={currentWeek.entries}
                  pageIndex={currentPage}
                  totalPages={weekGroups.length}
                  onPrevious={goToPreviousPage}
                  onNext={goToNextPage}
                  canGoPrevious={currentPage < weekGroups.length - 1}
                  canGoNext={currentPage > 0}
                />
              )}
            </AnimatePresence>
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
