import {
  format,
  isToday,
  isYesterday,
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  differenceInDays,
  differenceInWeeks,
  differenceInMonths,
  addDays,
  // subDays,
  parseISO,
  isValid,
} from 'date-fns'
import { ru } from 'date-fns/locale'

/**
 * 🔧 КРИТИЧЕСКАЯ ФУНКЦИЯ: Получает локальную дату в формате YYYY-MM-DD
 * БЕЗ конвертации в UTC (для корректной работы с часовыми поясами)
 *
 * Использует локальное время пользователя, не зависит от UTC
 */
export function getLocalDateString(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * 🔧 КРИТИЧЕСКАЯ ФУНКЦИЯ: Создает Date объект из строки YYYY-MM-DD
 * интерпретируя её как ЛОКАЛЬНУЮ дату, а не UTC
 *
 * Например:
 * - "2025-10-06" → Date объект на 6 октября 00:00:00 по ЛОКАЛЬНОМУ времени
 *
 * Если использовать new Date("2025-10-06"), то создается UTC полночь,
 * что для UTC+5 будет 05:00 утра, и getDate() вернет правильный день.
 * НО для отрицательных часовых поясов (например UTC-5) это будет предыдущий день!
 */
export function parseLocalDate(dateString: string): Date {
  // Добавляем T00:00:00 без Z в конце → интерпретируется как локальное время
  // Альтернатива: парсим вручную
  const parts = dateString.split('-').map(Number)
  const year = parts[0]
  const month = parts[1]
  const day = parts[2]

  if (
    year === undefined ||
    month === undefined ||
    day === undefined ||
    year === 0 ||
    month === 0 ||
    day === 0 ||
    Number.isNaN(year) ||
    Number.isNaN(month) ||
    Number.isNaN(day)
  ) {
    console.warn('Invalid date string:', dateString)
    return new Date(dateString) // Fallback к стандартному парсингу
  }

  // Создаем дату в локальном часовом поясе (месяц 0-indexed)
  return new Date(year, month - 1, day, 0, 0, 0, 0)
}

/**
 * Formats date for display in the app
 */
export function formatDate(
  date: Date | string,
  formatString: string = 'dd.MM.yyyy',
  locale: 'ru' | 'en' = 'ru'
): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : date

  if (!isValid(dateObj)) {
    return 'Неверная дата'
  }

  return format(
    dateObj,
    formatString,
    locale === 'ru'
      ? {
          locale: ru,
        }
      : {}
  )
}

/**
 * Returns a human-readable relative time string
 */
export function getRelativeTimeString(date: Date | string): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : date

  if (!isValid(dateObj)) {
    return 'Неверная дата'
  }

  if (isToday(dateObj)) {
    return 'Сегодня'
  }

  if (isYesterday(dateObj)) {
    return 'Вчера'
  }

  const daysAgo = differenceInDays(new Date(), dateObj)

  if (daysAgo < 7) {
    return `${daysAgo} дн. назад`
  }

  const weeksAgo = differenceInWeeks(new Date(), dateObj)
  if (weeksAgo < 4) {
    return `${weeksAgo} нед. назад`
  }

  const monthsAgo = differenceInMonths(new Date(), dateObj)
  if (monthsAgo < 12) {
    return `${monthsAgo} мес. назад`
  }

  return formatDate(dateObj, 'dd.MM.yyyy')
}

/**
 * Checks if it's time for daily check-in
 * Uses the same date comparison logic as todaysMood to ensure consistency
 *
 * 🔧 КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: Использует ЛОКАЛЬНУЮ дату пользователя,
 * а не UTC, чтобы корректно работать с часовыми поясами
 */
export function isTimeForCheckin(lastCheckin: Date | null): boolean {
  if (lastCheckin === null) return true

  // Используем ЛОКАЛЬНУЮ дату для корректной работы во всех часовых поясах
  const today = new Date()
  const entryDateStr = getLocalDateString(lastCheckin)
  const todayStr = getLocalDateString(today)

  console.log('🕐 isTimeForCheckin check:', {
    lastCheckin: lastCheckin.toISOString(),
    entryDateStr,
    todayStr,
    canCheckin: entryDateStr !== todayStr,
  })

  return entryDateStr !== todayStr // Можно отметить если даты разные
}

/**
 * Gets the time until next check-in is available
 */
export function getTimeUntilNextCheckin(lastCheckin: Date | null): {
  hours: number
  minutes: number
  canCheckin: boolean
} {
  if (lastCheckin === null) {
    return { hours: 0, minutes: 0, canCheckin: true }
  }

  const now = new Date()
  const lastCheckinDay = startOfDay(lastCheckin)
  const nextCheckinTime = startOfDay(addDays(lastCheckinDay, 1))

  if (now >= nextCheckinTime) {
    return { hours: 0, minutes: 0, canCheckin: true }
  }

  const timeDiff = nextCheckinTime.getTime() - now.getTime()
  const hours = Math.floor(timeDiff / (1000 * 60 * 60))
  const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60))

  return { hours, minutes, canCheckin: false }
}

/**
 * Generates date range for statistics
 */
export function getDateRange(period: 'week' | 'month' | 'year'): {
  start: Date
  end: Date
} {
  const now = new Date()

  switch (period) {
    case 'week':
      return {
        start: startOfWeek(now, { weekStartsOn: 1 }), // Monday
        end: endOfWeek(now, { weekStartsOn: 1 }),
      }

    case 'month':
      return {
        start: startOfMonth(now),
        end: endOfMonth(now),
      }

    case 'year':
      return {
        start: new Date(now.getFullYear(), 0, 1),
        end: new Date(now.getFullYear(), 11, 31),
      }

    default:
      return {
        start: startOfDay(now),
        end: endOfDay(now),
      }
  }
}

/**
 * Creates an array of dates for a given range
 */
export function createDateArray(
  startDate: Date,
  endDate: Date,
  step: 'day' | 'week' | 'month' = 'day'
): Date[] {
  const dates: Date[] = []
  let currentDate = new Date(startDate)

  while (currentDate <= endDate) {
    dates.push(new Date(currentDate))

    switch (step) {
      case 'day':
        currentDate = addDays(currentDate, 1)
        break
      case 'week':
        currentDate = addDays(currentDate, 7)
        break
      case 'month':
        currentDate = new Date(
          currentDate.getFullYear(),
          currentDate.getMonth() + 1,
          1
        )
        break
    }
  }

  return dates
}

/**
 * Checks if a date is within a specific range
 */
export function isDateInRange(
  date: Date,
  startDate: Date,
  endDate: Date
): boolean {
  const checkDate = startOfDay(date)
  const rangeStart = startOfDay(startDate)
  const rangeEnd = startOfDay(endDate)

  return checkDate >= rangeStart && checkDate <= rangeEnd
}

/**
 * Gets reminder time as Date object for today
 */
export function getReminderTime(timeString: string): Date {
  const [hours, minutes] = timeString.split(':').map(Number)

  if (
    hours === undefined ||
    minutes === undefined ||
    hours < 0 ||
    hours > 23 ||
    minutes < 0 ||
    minutes > 59
  ) {
    throw new Error('Invalid time format. Expected HH:MM')
  }

  const reminderTime = new Date()
  reminderTime.setHours(hours, minutes, 0, 0)

  return reminderTime
}

/**
 * Formats time string for input elements
 */
export function formatTimeForInput(date: Date): string {
  return format(date, 'HH:mm')
}

/**
 * Validates if a date string is valid
 */
export function isValidDateString(dateString: string): boolean {
  const date = parseISO(dateString)
  return isValid(date)
}

/**
 * Gets the number of days since registration
 */
export function getDaysSinceRegistration(registrationDate: Date): number {
  return differenceInDays(new Date(), registrationDate)
}

/**
 * Calculates the progress percentage for the current day
 */
export function getDailyProgress(): number {
  const now = new Date()
  const startOfToday = startOfDay(now)
  const endOfToday = endOfDay(now)

  const totalMinutes = differenceInMinutes(endOfToday, startOfToday)
  const currentMinutes = differenceInMinutes(now, startOfToday)

  return Math.round((currentMinutes / totalMinutes) * 100)
}

/**
 * Helper function to calculate difference in minutes
 */
function differenceInMinutes(laterDate: Date, earlierDate: Date): number {
  return Math.floor((laterDate.getTime() - earlierDate.getTime()) / (1000 * 60))
}
