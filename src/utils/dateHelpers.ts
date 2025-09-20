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
  isSameDay,
  parseISO,
  isValid,
} from 'date-fns'
import { ru } from 'date-fns/locale'

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
 */
export function isTimeForCheckin(lastCheckin: Date | null): boolean {
  if (lastCheckin === null) return true

  const today = startOfDay(new Date())
  const lastCheckinDay = startOfDay(lastCheckin)

  return !isSameDay(today, lastCheckinDay)
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
