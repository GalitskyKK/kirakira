import { motion } from 'framer-motion'
import type { MoodEntry } from '@/types/mood'
import { formatDate } from '@/utils/dateHelpers'
import { endOfWeek } from 'date-fns'
import { MoodSticker } from './MoodSticker'

interface WeekPageProps {
  readonly weekStart: Date
  readonly entries: readonly MoodEntry[]
  readonly pageIndex: number
}

export function WeekPage({ weekStart, entries, pageIndex }: WeekPageProps) {
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
      transition={{ duration: 0.4, delay: pageIndex * 0.1 }}
      className="relative min-h-[600px] rounded-3xl bg-gradient-to-br from-white/90 via-white/80 to-white/70 p-6 shadow-2xl dark:from-neutral-900/90 dark:via-neutral-800/80 dark:to-neutral-900/70"
      style={{
        // Эффект страницы книги с легкой тенью
        boxShadow:
          '0 20px 60px rgba(0, 0, 0, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
      }}
    >
      {/* Линия сгиба страницы (посередине) */}
      <div className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-gradient-to-b from-transparent via-gray-300/30 to-transparent dark:via-gray-600/30" />

      {/* Заголовок недели */}
      <div className="mb-6 text-center">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
          {formatDate(weekStart, 'dd MMMM', 'ru')} —{' '}
          {formatDate(weekEnd, 'dd MMMM yyyy', 'ru')}
        </h3>
      </div>

      {/* Сетка наклеек настроений */}
      {sortedEntries.length === 0 ? (
        <div className="flex min-h-[400px] items-center justify-center">
          <p className="text-sm text-gray-400 dark:text-gray-500">
            Нет записей за эту неделю
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-4">
          {sortedEntries.map((entry, index) => (
            <MoodSticker key={entry.id} entry={entry} index={index} />
          ))}
        </div>
      )}

      {/* Номер страницы внизу */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-xs text-gray-400 dark:text-gray-500">
        Неделя {pageIndex + 1}
      </div>
    </motion.div>
  )
}

