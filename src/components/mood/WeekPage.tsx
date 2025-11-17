import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { MoodEntry } from '@/types/mood'
import type { MoodType } from '@/types'
import { formatDate } from '@/utils/dateHelpers'
import { endOfWeek, getDay } from 'date-fns'
import { MOOD_CONFIG } from '@/types/mood'
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

// Компонент для пустой зоны с рукописным рисунком обобщения недельного настроения
function WeekSummaryCell({
  entries,
}: {
  readonly entries: readonly MoodEntry[]
}) {
  const dominantMood = useMemo(() => getDominantMood(entries), [entries])
  const moodConfig = dominantMood ? MOOD_CONFIG[dominantMood] : null

  // Генерируем детерминированный стиль рисунка на основе доминирующего настроения
  const drawingStyle = useMemo(() => {
    if (!dominantMood) return null
    let hash = 0
    for (let i = 0; i < dominantMood.length; i++) {
      hash = dominantMood.charCodeAt(i) + ((hash << 5) - hash)
    }
    return Math.abs(hash) % 3 // 0, 1, 2 - разные стили рисунка
  }, [dominantMood])

  return (
    <div className="flex h-20 w-20 items-center justify-center sm:h-24 sm:w-24">
      {moodConfig && dominantMood && drawingStyle !== null ? (
        <svg
          className="h-full w-full"
          viewBox="0 0 80 80"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          style={{
            filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.1))',
          }}
        >
          {/* Ручкописный стиль - stroke-linecap: round, stroke-linejoin: round */}
          <g
            stroke={moodConfig.color}
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{
              opacity: 0.6,
            }}
          >
            {drawingStyle === 0 ? (
              // Стиль 0: Смайлик с каракулями
              <>
                {/* Лицо смайлика */}
                <circle cx="40" cy="40" r="18" strokeWidth="2.5" />
                {/* Глаза */}
                <circle cx="33" cy="35" r="3" fill={moodConfig.color} />
                <circle cx="47" cy="35" r="3" fill={moodConfig.color} />
                {/* Улыбка */}
                <path d="M 30 48 Q 40 55 50 48" strokeWidth="2" fill="none" />
                {/* Каракули вокруг */}
                <path
                  d="M 15 20 Q 25 15 30 25 T 40 20"
                  strokeWidth="1.5"
                  opacity="0.4"
                />
                <path
                  d="M 50 20 Q 55 15 60 25 T 65 20"
                  strokeWidth="1.5"
                  opacity="0.4"
                />
                <path
                  d="M 20 60 Q 25 65 30 60 T 35 65"
                  strokeWidth="1.5"
                  opacity="0.4"
                />
                <path
                  d="M 45 60 Q 50 65 55 60 T 60 65"
                  strokeWidth="1.5"
                  opacity="0.4"
                />
              </>
            ) : drawingStyle === 1 ? (
              // Стиль 1: Волнистые линии и спирали
              <>
                {/* Спираль в центре */}
                <path
                  d="M 40 40 Q 45 35 50 40 T 55 40 Q 50 45 45 40 T 40 40"
                  strokeWidth="2"
                />
                {/* Волнистые линии */}
                <path
                  d="M 20 30 Q 25 25 30 30 T 40 30 Q 45 25 50 30"
                  strokeWidth="1.5"
                  opacity="0.5"
                />
                <path
                  d="M 30 50 Q 35 55 40 50 T 50 50 Q 55 45 60 50"
                  strokeWidth="1.5"
                  opacity="0.5"
                />
                {/* Каракули */}
                <path
                  d="M 15 15 Q 20 20 15 25"
                  strokeWidth="1.5"
                  opacity="0.4"
                />
                <path
                  d="M 65 15 Q 70 20 65 25"
                  strokeWidth="1.5"
                  opacity="0.4"
                />
                <path
                  d="M 15 65 Q 20 60 15 55"
                  strokeWidth="1.5"
                  opacity="0.4"
                />
                <path
                  d="M 65 65 Q 70 60 65 55"
                  strokeWidth="1.5"
                  opacity="0.4"
                />
              </>
            ) : (
              // Стиль 2: Звездочки и каракули
              <>
                {/* Звездочка */}
                <path
                  d="M 40 25 L 42 32 L 49 32 L 43 37 L 45 44 L 40 39 L 35 44 L 37 37 L 31 32 L 38 32 Z"
                  fill={moodConfig.color}
                  opacity="0.5"
                />
                {/* Волнистые каракули */}
                <path
                  d="M 20 40 Q 25 35 30 40 T 40 40 Q 45 35 50 40"
                  strokeWidth="1.5"
                  opacity="0.4"
                />
                <path
                  d="M 30 20 Q 35 25 30 30"
                  strokeWidth="1.5"
                  opacity="0.4"
                />
                <path
                  d="M 50 20 Q 55 25 50 30"
                  strokeWidth="1.5"
                  opacity="0.4"
                />
                <path
                  d="M 25 55 Q 30 60 35 55 T 45 55 Q 50 60 55 55"
                  strokeWidth="1.5"
                  opacity="0.4"
                />
                {/* Маленькие точки */}
                <circle
                  cx="15"
                  cy="30"
                  r="2"
                  fill={moodConfig.color}
                  opacity="0.3"
                />
                <circle
                  cx="65"
                  cy="30"
                  r="2"
                  fill={moodConfig.color}
                  opacity="0.3"
                />
                <circle
                  cx="15"
                  cy="50"
                  r="2"
                  fill={moodConfig.color}
                  opacity="0.3"
                />
                <circle
                  cx="65"
                  cy="50"
                  r="2"
                  fill={moodConfig.color}
                  opacity="0.3"
                />
              </>
            )}
          </g>
        </svg>
      ) : (
        // Если нет настроения - простые каракули
        <svg
          className="h-full w-full"
          viewBox="0 0 80 80"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <g
            stroke="#9ca3af"
            strokeWidth="1.5"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity="0.3"
          >
            <path d="M 20 30 Q 30 20 40 30 T 60 30" />
            <path d="M 20 50 Q 30 40 40 50 T 60 50" />
            <path d="M 30 20 Q 40 30 30 40" />
            <path d="M 50 20 Q 60 30 50 40" />
          </g>
        </svg>
      )}
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
