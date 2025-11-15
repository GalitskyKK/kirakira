import { motion } from 'framer-motion'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { MoodEntry } from '@/types/mood'
import { formatDate } from '@/utils/dateHelpers'
import { endOfWeek } from 'date-fns'
import { MoodSticker } from './MoodSticker'

interface WeekPageProps {
  readonly weekStart: Date
  readonly entries: readonly MoodEntry[]
  readonly pageIndex: number
  readonly totalPages: number
  readonly onPrevious: () => void
  readonly onNext: () => void
  readonly canGoPrevious: boolean
  readonly canGoNext: boolean
}

export function WeekPage({
  weekStart,
  entries,
  pageIndex,
  totalPages,
  onPrevious,
  onNext,
  canGoPrevious,
  canGoNext,
}: WeekPageProps) {
  const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 })

  // Сортируем записи по дате (от старых к новым для недели)
  const sortedEntries = [...entries].sort(
    (a, b) => a.date.getTime() - b.date.getTime()
  )

  return (
    <motion.div
      key={`week-${weekStart.getTime()}`}
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.4 }}
      className="relative min-h-[400px] w-full max-w-full rounded-3xl bg-gradient-to-br from-white/90 via-white/80 to-white/70 p-4 pb-12 shadow-2xl dark:from-neutral-900/90 dark:via-neutral-800/80 dark:to-neutral-900/70 sm:min-h-[500px] sm:p-6 sm:pb-14"
      style={{
        boxShadow:
          '0 20px 60px rgba(0, 0, 0, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
      }}
    >
      {/* Кнопка "Предыдущая" слева */}
      {canGoPrevious && (
        <motion.button
          onClick={onPrevious}
          className="absolute left-1 top-1/2 z-10 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-white/95 shadow-md backdrop-blur-sm transition-all hover:scale-110 hover:bg-white dark:bg-neutral-800/95 dark:hover:bg-neutral-800 sm:left-2 sm:h-10 sm:w-10"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          aria-label="Предыдущая страница"
        >
          <ChevronLeft className="h-4 w-4 text-gray-700 dark:text-gray-200 sm:h-5 sm:w-5" />
        </motion.button>
      )}

      {/* Кнопка "Следующая" справа */}
      {canGoNext && (
        <motion.button
          onClick={onNext}
          className="absolute right-1 top-1/2 z-10 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-white/95 shadow-md backdrop-blur-sm transition-all hover:scale-110 hover:bg-white dark:bg-neutral-800/95 dark:hover:bg-neutral-800 sm:right-2 sm:h-10 sm:w-10"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          aria-label="Следующая страница"
        >
          <ChevronRight className="h-4 w-4 text-gray-700 dark:text-gray-200 sm:h-5 sm:w-5" />
        </motion.button>
      )}

      {/* Линия сгиба страницы (посередине) */}
      <div className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-gradient-to-b from-transparent via-gray-300/30 to-transparent dark:via-gray-600/30" />

      {/* Заголовок недели */}
      <div className="mb-4 text-center sm:mb-6">
        <h3 className="text-base font-semibold text-gray-800 dark:text-gray-200 sm:text-lg">
          {formatDate(weekStart, 'dd MMMM', 'ru')} —{' '}
          {formatDate(weekEnd, 'dd MMMM yyyy', 'ru')}
        </h3>
      </div>

      {/* Сетка наклеек настроений */}
      {sortedEntries.length === 0 ? (
        <div className="flex min-h-[300px] items-center justify-center">
          <p className="text-sm text-gray-400 dark:text-gray-500">
            Нет записей за эту неделю
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 lg:gap-6">
          {sortedEntries.map((entry, index) => (
            <MoodSticker key={entry.id} entry={entry} index={index} />
          ))}
        </div>
      )}

      {/* Номер страницы внизу */}
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-xs text-gray-400 dark:text-gray-500 sm:bottom-4">
        {pageIndex + 1} / {totalPages}
      </div>
    </motion.div>
  )
}

