/**
 * 🎨 Утилиты для работы с палитрой настроений
 * Конвертирует историю настроений в данные для Canvas-визуализации
 */

import type { MoodEntry, MoodType } from '@/types'
import { MOOD_CONFIG } from '@/types/mood'
import { subDays, startOfDay, isAfter, isBefore } from 'date-fns'

/**
 * Интерфейс для мета-шара в палитре
 */
export interface PaletteMetaBall {
  readonly x: number
  readonly y: number
  readonly vx: number
  readonly vy: number
  readonly radius: number
  readonly color: string
  readonly colorHsl: { h: number; s: number; l: number }
  readonly moodType: MoodType
  readonly intensity: number
  readonly count: number // Количество отметок этого настроения
}

/**
 * Параметры для генерации палитры
 */
export interface PaletteGenerationOptions {
  readonly width: number
  readonly height: number
  readonly period: 'week' | 'month' // Период для подсчета настроений
  readonly maxBalls: number // Максимальное количество шаров
  readonly minRadius: number
  readonly maxRadius: number
}

/**
 * Статистика настроений за период
 */
interface MoodPeriodStats {
  readonly mood: MoodType
  readonly count: number
  readonly totalIntensity: number
  readonly averageIntensity: number
}

/**
 * Подсчитывает статистику настроений за период
 */
function calculateMoodStats(
  moodHistory: readonly MoodEntry[],
  period: 'week' | 'month'
): readonly MoodPeriodStats[] {
  const now = new Date()
  const startDate =
    period === 'week'
      ? subDays(now, 7)
      : subDays(now, 30)

  const start = startOfDay(startDate)
  const end = startOfDay(now)

  // Фильтруем записи за период
  const periodMoods = moodHistory.filter(entry => {
    const entryDate = startOfDay(entry.date)
    return (
      (isAfter(entryDate, start) || entryDate.getTime() === start.getTime()) &&
      isBefore(entryDate, end)
    )
  })

  // Группируем по типу настроения
  const moodGroups = new Map<MoodType, { count: number; totalIntensity: number }>()

  for (const entry of periodMoods) {
    const existing = moodGroups.get(entry.mood) ?? { count: 0, totalIntensity: 0 }
    moodGroups.set(entry.mood, {
      count: existing.count + 1,
      totalIntensity: existing.totalIntensity + entry.intensity,
    })
  }

  // Преобразуем в массив статистики
  const stats: MoodPeriodStats[] = []
  for (const [mood, data] of moodGroups.entries()) {
    stats.push({
      mood,
      count: data.count,
      totalIntensity: data.totalIntensity,
      averageIntensity: data.count > 0 ? data.totalIntensity / data.count : 0,
    })
  }

  return stats.sort((a, b) => b.count - a.count)
}

/**
 * Конвертирует HEX в HSL
 */
function hexToHsl(hex: string): { h: number; s: number; l: number } {
  const r = parseInt(hex.slice(1, 3), 16) / 255
  const g = parseInt(hex.slice(3, 5), 16) / 255
  const b = parseInt(hex.slice(5, 7), 16) / 255

  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  let h = 0
  let s = 0
  const l = (max + min) / 2

  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6
        break
      case g:
        h = ((b - r) / d + 2) / 6
        break
      case b:
        h = ((r - g) / d + 4) / 6
        break
    }
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  }
}

/**
 * Генерирует мета-шары для палитры на основе истории настроений
 * Создает один шар на каждое настроение (максимум 6 шаров)
 */
export function generatePaletteBalls(
  moodHistory: readonly MoodEntry[],
  options: PaletteGenerationOptions
): readonly PaletteMetaBall[] {
  const { width, height, period, minRadius, maxRadius } = options

  // Получаем статистику за период
  const stats = calculateMoodStats(moodHistory, period)

  if (stats.length === 0) {
    // Если нет данных, создаем один нейтральный шар
    return [
      {
        x: width / 2,
        y: height / 2,
        vx: 0,
        vy: 0,
        radius: (minRadius + maxRadius) / 2,
        color: '#94a3b8',
        colorHsl: { h: 210, s: 20, l: 60 },
        moodType: 'calm',
        intensity: 1,
        count: 0,
      },
    ]
  }

  // Находим минимальное и максимальное количество отметок для нормализации радиуса
  const counts = stats.map(stat => stat.count)
  const minCount = Math.min(...counts, 1) // Минимум 1, чтобы избежать деления на 0
  const maxCount = Math.max(...counts, 1)

  // Генерируем один шар на каждое настроение
  const balls: PaletteMetaBall[] = []
  const usedPositions = new Set<string>()

  for (const stat of stats) {
    const moodConfig = MOOD_CONFIG[stat.mood]
    const colorHsl = hexToHsl(moodConfig.color)

    // Генерируем уникальную позицию
    let x = 0
    let y = 0
    let attempts = 0
    let positionKey = ''

    do {
      x = Math.random() * width
      y = Math.random() * height
      positionKey = `${Math.floor(x / 50)}_${Math.floor(y / 50)}`
      attempts++
    } while (usedPositions.has(positionKey) && attempts < 100)

    usedPositions.add(positionKey)

    // Радиус зависит от количества отметок: от minRadius (minCount) до maxRadius (maxCount)
    // Аналогично HTML: radius = minRadius + ((count - minCount) / (maxCount - minCount)) * (maxRadius - minRadius)
    const radius =
      maxCount > minCount
        ? minRadius +
          ((stat.count - minCount) / (maxCount - minCount)) *
            (maxRadius - minRadius)
        : (minRadius + maxRadius) / 2

    // Скорость зависит от интенсивности
    const intensityFactor = stat.averageIntensity / 3
    const speed = 0.3 + intensityFactor * 0.2
    const angle = Math.random() * Math.PI * 2

    balls.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      radius,
      color: moodConfig.color,
      colorHsl,
      moodType: stat.mood,
      intensity: stat.averageIntensity,
      count: stat.count,
    })
  }

  return balls
}

/**
 * Конвертирует всю историю настроений в данные для палитры
 * Использует агрегацию для оптимизации больших объемов данных
 */
export function convertMoodHistoryToPalette(
  moodHistory: readonly MoodEntry[],
  options: PaletteGenerationOptions
): readonly PaletteMetaBall[] {
  // Если данных слишком много, используем выборку
  const maxHistoryEntries = 1000
  let processedHistory = moodHistory

  if (moodHistory.length > maxHistoryEntries) {
    // Берем последние записи и случайную выборку из старых
    const recent = moodHistory.slice(0, maxHistoryEntries * 0.7)
    const old = moodHistory.slice(maxHistoryEntries * 0.7)
    const sampledOld = old.filter(() => Math.random() < 0.1) // 10% выборка
    processedHistory = [...recent, ...sampledOld]
  }

  return generatePaletteBalls(processedHistory, options)
}

