import type { MoodEntry } from '@/types/mood'
import { startOfWeek, endOfWeek, isWithinInterval, addWeeks } from 'date-fns'

export interface WeekGroup {
  readonly weekStart: Date
  readonly weekEnd: Date
  readonly entries: readonly MoodEntry[]
}

/**
 * Группирует записи настроений по неделям
 */
export function groupMoodEntriesByWeek(
  entries: readonly MoodEntry[]
): readonly WeekGroup[] {
  if (entries.length === 0) {
    return []
  }

  // Сортируем записи по дате
  const sortedEntries = [...entries].sort(
    (a, b) => a.date.getTime() - b.date.getTime()
  )

  // Находим первую и последнюю недели
  const firstEntry = sortedEntries[0]
  const lastEntry = sortedEntries[sortedEntries.length - 1]

  // TypeScript guard: проверяем что записи существуют
  if (firstEntry === undefined || lastEntry === undefined) {
    return []
  }

  const firstWeekStart = startOfWeek(firstEntry.date, { weekStartsOn: 1 })
  const lastWeekStart = startOfWeek(lastEntry.date, { weekStartsOn: 1 })

  // Создаем массив всех недель от первой до последней
  const weeks: WeekGroup[] = []
  let currentWeekStart = new Date(firstWeekStart)

  while (currentWeekStart <= lastWeekStart) {
    const weekEnd = endOfWeek(currentWeekStart, { weekStartsOn: 1 })

    // Находим все записи для этой недели
    const weekEntries = sortedEntries.filter(entry =>
      isWithinInterval(entry.date, {
        start: currentWeekStart,
        end: weekEnd,
      })
    )

    weeks.push({
      weekStart: new Date(currentWeekStart),
      weekEnd: new Date(weekEnd),
      entries: weekEntries,
    })

    // Переходим к следующей неделе
    currentWeekStart = addWeeks(currentWeekStart, 1)
  }

  // Возвращаем в обратном порядке (от новых к старым)
  return weeks.reverse()
}

