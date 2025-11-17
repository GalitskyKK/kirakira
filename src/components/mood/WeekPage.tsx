import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { MoodEntry } from '@/types/mood'
import type { MoodType } from '@/types'
import { formatDate } from '@/utils/dateHelpers'
import { endOfWeek, getDay } from 'date-fns'
import { MOOD_CONFIG } from '@/types/mood'
import { MoodSticker } from './MoodSticker'
import { MoodImage } from './MoodImage'

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

// Вычисляет доминирующее настроение за неделю
function getDominantMood(entries: readonly MoodEntry[]): MoodType | null {
  if (entries.length === 0) return null

  const moodCounts: Record<MoodType, number> = {
    joy: 0,
    calm: 0,
    stress: 0,
    sadness: 0,
    anger: 0,
    anxiety: 0,
  }

  entries.forEach(entry => {
    moodCounts[entry.mood]++
  })

  let dominantMood: MoodType | null = null
  let maxCount = 0

  Object.entries(moodCounts).forEach(([mood, count]) => {
    if (count > maxCount) {
      maxCount = count
      dominantMood = mood as MoodType
    }
  })

  return dominantMood
}

// Компонент для пустой зоны с визуализацией обобщения недельного настроения
function WeekSummaryCell({
  entries,
}: {
  readonly entries: readonly MoodEntry[]
}) {
  const dominantMood = useMemo(() => getDominantMood(entries), [entries])
  const moodConfig = dominantMood ? MOOD_CONFIG[dominantMood] : null

  return (
    <div className="flex cursor-pointer flex-row items-center justify-start rounded-lg p-2 transition-all hover:bg-gray-50 dark:hover:bg-neutral-800/50">
      {/* День недели слева (Вс) */}
      <p
        className="mr-3 flex items-center justify-center text-[10px] font-medium text-gray-500 dark:text-gray-400 sm:text-xs"
        style={{
          writingMode: 'vertical-rl',
          textOrientation: 'upright',
          transform: 'rotate(180deg)',
        }}
      >
        Вс
      </p>

      {/* Визуализация обобщения */}
      <div
        className="relative flex h-16 w-16 items-center justify-center rounded-lg shadow-sm sm:h-20 sm:w-20"
        style={{
          background: moodConfig
            ? `linear-gradient(135deg, ${moodConfig.color}20, ${moodConfig.color}30)`
            : 'linear-gradient(135deg, #e5e7eb20, #e5e7eb30)',
          border: moodConfig
            ? `2px solid ${moodConfig.color}30`
            : '2px solid #e5e7eb40',
        }}
      >
        {moodConfig ? (
          <>
            {/* Подложка */}
            <div
              className="absolute inset-0 rounded-lg opacity-20"
              style={{ backgroundColor: moodConfig.color }}
            />
            {/* Иконка настроения */}
            {dominantMood && (
              <div className="relative z-10">
                <MoodImage mood={dominantMood} size={32} />
              </div>
            )}
            {/* Легкое свечение */}
            <div
              className="absolute inset-0 rounded-lg opacity-15 blur-sm"
              style={{ backgroundColor: moodConfig.color }}
            />
          </>
        ) : (
          <div className="text-2xl text-gray-300 dark:text-gray-600">📊</div>
        )}
      </div>
    </div>
  )
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

  // Группируем записи по дням недели (1 = понедельник, 7 = воскресенье)
  const entriesByDay = useMemo(() => {
    const grouped: Record<number, MoodEntry> = {}
    entries.forEach(entry => {
      // getDay возвращает 0-6 (0 = воскресенье), но нам нужно 1-7 (1 = понедельник)
      let dayOfWeek: number = getDay(entry.date)
      if (dayOfWeek === 0) {
        dayOfWeek = 7 // Воскресенье = 7
      }
      grouped[dayOfWeek] = entry
    })
    return grouped
  }, [entries])

  // Создаем массив для отображения: [пн-чт, вт-пт, ср-сб, пустая-вс]
  const weekLayout = useMemo(() => {
    return [
      { left: entriesByDay[1], right: entriesByDay[4] }, // Пн - Чт
      { left: entriesByDay[2], right: entriesByDay[5] }, // Вт - Пт
      { left: entriesByDay[3], right: entriesByDay[6] }, // Ср - Сб
      { left: null, right: entriesByDay[7] }, // Пустая - Вс
    ]
  }, [entriesByDay])

  return (
    <motion.div
      key={`week-${weekStart.getTime()}`}
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.4 }}
      className="relative flex h-[calc(100vh-180px)] max-h-[700px] w-full max-w-full flex-col overflow-hidden rounded-3xl bg-gradient-to-br from-white/90 via-white/80 to-white/70 shadow-2xl dark:from-neutral-900/90 dark:via-neutral-800/80 dark:to-neutral-900/70 sm:h-[calc(100vh-200px)] sm:max-h-[750px]"
      style={{
        boxShadow:
          '0 20px 60px rgba(0, 0, 0, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
      }}
    >
      {/* Кнопка "Предыдущая" слева - на всю высоту */}
      {canGoPrevious && (
        <motion.button
          onClick={onPrevious}
          className="absolute left-0 top-0 z-10 flex h-full w-12 items-center justify-center transition-colors hover:bg-black/5 dark:hover:bg-white/5 sm:w-16"
          whileHover={{ scale: 1 }}
          whileTap={{ scale: 0.98 }}
          aria-label="Предыдущая страница"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/95 shadow-md backdrop-blur-sm dark:bg-neutral-800/95 sm:h-10 sm:w-10">
            <ChevronLeft className="h-4 w-4 text-gray-700 dark:text-gray-200 sm:h-5 sm:w-5" />
          </div>
        </motion.button>
      )}

      {/* Кнопка "Следующая" справа - на всю высоту */}
      {canGoNext && (
        <motion.button
          onClick={onNext}
          className="absolute right-0 top-0 z-10 flex h-full w-12 items-center justify-center transition-colors hover:bg-black/5 dark:hover:bg-white/5 sm:w-16"
          whileHover={{ scale: 1 }}
          whileTap={{ scale: 0.98 }}
          aria-label="Следующая страница"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/95 shadow-md backdrop-blur-sm dark:bg-neutral-800/95 sm:h-10 sm:w-10">
            <ChevronRight className="h-4 w-4 text-gray-700 dark:text-gray-200 sm:h-5 sm:w-5" />
          </div>
        </motion.button>
      )}

      {/* Линия сгиба страницы (посередине) */}
      <div className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-gradient-to-b from-transparent via-gray-300/30 to-transparent dark:via-gray-600/30" />

      {/* Заголовок недели */}
      <div className="mb-3 flex-shrink-0 px-4 pt-4 text-center sm:mb-4 sm:px-6 sm:pt-6">
        <h3 className="text-base font-semibold text-gray-800 dark:text-gray-200 sm:text-lg">
          {formatDate(weekStart, 'dd MMMM', 'ru')} —{' '}
          {formatDate(weekEnd, 'dd MMMM yyyy', 'ru')}
        </h3>
      </div>

      {/* Контент с прокруткой */}
      <div className="flex-1 overflow-y-auto px-4 pb-12 sm:px-6 sm:pb-14">
        {/* Сетка наклеек настроений в две колонки */}
        {entries.length === 0 ? (
          <div className="flex min-h-[300px] items-center justify-center">
            <p className="text-sm text-gray-400 dark:text-gray-500">
              Нет записей за эту неделю
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            {weekLayout.map((row, rowIndex) => (
              <div key={rowIndex} className="contents">
                {/* Левая колонка */}
                <div className="flex justify-center">
                  {row.left ? (
                    <MoodSticker
                      key={row.left.id}
                      entry={row.left}
                      index={rowIndex * 2}
                    />
                  ) : rowIndex === 3 ? (
                    <WeekSummaryCell entries={entries} />
                  ) : (
                    <div className="h-20 w-20" /> // Пустое место
                  )}
                </div>
                {/* Правая колонка */}
                <div className="flex justify-center">
                  {row.right ? (
                    <MoodSticker
                      key={row.right.id}
                      entry={row.right}
                      index={rowIndex * 2 + 1}
                    />
                  ) : (
                    <div className="h-20 w-20" /> // Пустое место
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Номер страницы внизу */}
      <div className="absolute bottom-2 left-1/2 z-10 -translate-x-1/2 rounded-full bg-white/80 px-3 py-1 text-xs text-gray-400 backdrop-blur-sm dark:bg-neutral-800/80 dark:text-gray-500 sm:bottom-4">
        {pageIndex + 1} / {totalPages}
      </div>
    </motion.div>
  )
}
