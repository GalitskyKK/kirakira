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
    return Math.abs(hash) % 4 // 0, 1, 2, 3 - разные стили рисунка
  }, [dominantMood])

  return (
    <div className="flex h-20 w-20 items-center justify-center sm:h-24 sm:w-24">
      {moodConfig && dominantMood && drawingStyle !== null ? (
        <svg
          className="h-full w-full"
          viewBox="0 0 80 80"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <g
            stroke={moodConfig.color}
            fill={moodConfig.color}
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{
              opacity: 0.7,
            }}
          >
            {drawingStyle === 0 ? (
              // Стиль 0: Ручкописный смайлик (радость)
              <>
                {/* Неровное лицо - не идеальный круг */}
                <path
                  d="M 25 40 Q 22 25 40 22 Q 58 25 55 40 Q 58 55 40 58 Q 22 55 25 40"
                  strokeWidth="2.5"
                  fill="none"
                />
                {/* Глаза - неровные овалы */}
                <path
                  d="M 30 32 Q 32 30 34 32 Q 32 34 30 32"
                  strokeWidth="2"
                  fill={moodConfig.color}
                />
                <path
                  d="M 46 32 Q 48 30 50 32 Q 48 34 46 32"
                  strokeWidth="2"
                  fill={moodConfig.color}
                />
                {/* Улыбка - неровная кривая */}
                <path
                  d="M 28 48 Q 35 52 40 51 Q 45 52 52 48"
                  strokeWidth="2.5"
                  fill="none"
                />
                {/* Каракули вокруг */}
                <path
                  d="M 12 18 Q 18 14 22 20 Q 20 24 18 22"
                  strokeWidth="1.5"
                  opacity="0.4"
                  fill="none"
                />
                <path
                  d="M 58 18 Q 62 14 66 20 Q 64 24 62 22"
                  strokeWidth="1.5"
                  opacity="0.4"
                  fill="none"
                />
                <path
                  d="M 15 58 Q 20 62 18 66 Q 16 64 15 60"
                  strokeWidth="1.5"
                  opacity="0.4"
                  fill="none"
                />
                <path
                  d="M 65 58 Q 60 62 62 66 Q 64 64 65 60"
                  strokeWidth="1.5"
                  opacity="0.4"
                  fill="none"
                />
              </>
            ) : drawingStyle === 1 ? (
              // Стиль 1: Нейтральный смайлик (спокойствие)
              <>
                {/* Простое лицо */}
                <path
                  d="M 25 40 Q 22 28 40 25 Q 58 28 55 40 Q 58 52 40 55 Q 22 52 25 40"
                  strokeWidth="2"
                  fill="none"
                />
                {/* Глаза - простые линии/петли */}
                <path d="M 30 32 Q 32 30 34 32" strokeWidth="2" fill="none" />
                <path d="M 46 32 Q 48 30 50 32" strokeWidth="2" fill="none" />
                {/* Нейтральный рот */}
                <path d="M 32 48 Q 40 50 48 48" strokeWidth="2" fill="none" />
                {/* Волнистые каракули */}
                <path
                  d="M 18 25 Q 20 20 25 22 Q 22 24 20 26"
                  strokeWidth="1.5"
                  opacity="0.4"
                  fill="none"
                />
                <path
                  d="M 62 25 Q 60 20 55 22 Q 58 24 60 26"
                  strokeWidth="1.5"
                  opacity="0.4"
                  fill="none"
                />
                <path
                  d="M 20 55 Q 22 58 18 60 Q 20 58 22 56"
                  strokeWidth="1.5"
                  opacity="0.4"
                  fill="none"
                />
                <path
                  d="M 60 55 Q 58 58 62 60 Q 60 58 58 56"
                  strokeWidth="1.5"
                  opacity="0.4"
                  fill="none"
                />
              </>
            ) : drawingStyle === 2 ? (
              // Стиль 2: Грустный смайлик (грусть/стресс)
              <>
                {/* Лицо с неровностями */}
                <path
                  d="M 25 40 Q 22 25 40 22 Q 58 25 55 40 Q 58 55 40 58 Q 22 55 25 40"
                  strokeWidth="2.5"
                  fill="none"
                />
                {/* Глаза - каракули/звездочки */}
                <path
                  d="M 30 32 Q 28 30 30 28 Q 32 30 30 32 Q 28 34 30 36 Q 32 34 30 32"
                  strokeWidth="2"
                  fill="none"
                />
                <path
                  d="M 50 32 Q 48 30 50 28 Q 52 30 50 32 Q 48 34 50 36 Q 52 34 50 32"
                  strokeWidth="2"
                  fill="none"
                />
                {/* Грустный рот - перевернутая кривая */}
                <path
                  d="M 28 52 Q 35 48 40 49 Q 45 48 52 52"
                  strokeWidth="2.5"
                  fill="none"
                />
                {/* Больше каракулей */}
                <path
                  d="M 10 20 Q 15 15 20 18 Q 18 22 16 20"
                  strokeWidth="1.5"
                  opacity="0.4"
                  fill="none"
                />
                <path
                  d="M 70 20 Q 65 15 60 18 Q 62 22 64 20"
                  strokeWidth="1.5"
                  opacity="0.4"
                  fill="none"
                />
                <path
                  d="M 12 60 Q 18 65 15 68 Q 13 66 14 62"
                  strokeWidth="1.5"
                  opacity="0.4"
                  fill="none"
                />
                <path
                  d="M 68 60 Q 62 65 65 68 Q 67 66 66 62"
                  strokeWidth="1.5"
                  opacity="0.4"
                  fill="none"
                />
              </>
            ) : (
              // Стиль 3: Абстрактные каракули и волнистые линии
              <>
                {/* Центральная спираль/каракули */}
                <path
                  d="M 40 35 Q 45 30 50 35 Q 48 40 45 38 Q 42 36 40 35 Q 38 33 35 35 Q 37 37 40 35"
                  strokeWidth="2"
                  fill="none"
                />
                {/* Волнистые линии */}
                <path
                  d="M 18 30 Q 25 25 30 30 Q 28 35 25 33 Q 22 31 20 30"
                  strokeWidth="1.8"
                  opacity="0.6"
                  fill="none"
                />
                <path
                  d="M 50 30 Q 55 25 62 30 Q 60 35 57 33 Q 54 31 52 30"
                  strokeWidth="1.8"
                  opacity="0.6"
                  fill="none"
                />
                <path
                  d="M 25 50 Q 30 55 35 50 Q 33 45 30 47 Q 27 49 25 50"
                  strokeWidth="1.8"
                  opacity="0.6"
                  fill="none"
                />
                <path
                  d="M 45 50 Q 50 55 55 50 Q 53 45 50 47 Q 47 49 45 50"
                  strokeWidth="1.8"
                  opacity="0.6"
                  fill="none"
                />
                {/* Маленькие каракули */}
                <path
                  d="M 15 15 Q 18 18 15 21"
                  strokeWidth="1.5"
                  opacity="0.4"
                  fill="none"
                />
                <path
                  d="M 65 15 Q 62 18 65 21"
                  strokeWidth="1.5"
                  opacity="0.4"
                  fill="none"
                />
                <path
                  d="M 15 65 Q 18 62 15 59"
                  strokeWidth="1.5"
                  opacity="0.4"
                  fill="none"
                />
                <path
                  d="M 65 65 Q 62 62 65 59"
                  strokeWidth="1.5"
                  opacity="0.4"
                  fill="none"
                />
              </>
            )}
          </g>
        </svg>
      ) : (
        // Если нет настроения - простые серые каракули
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
            <path d="M 20 30 Q 30 20 40 30 Q 50 40 60 30" />
            <path d="M 20 50 Q 30 40 40 50 Q 50 60 60 50" />
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
