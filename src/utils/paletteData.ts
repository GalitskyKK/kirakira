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
  readonly moodType: MoodType
  readonly intensity: number
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
 * Генерирует мета-шары для палитры на основе истории настроений
 */
export function generatePaletteBalls(
  moodHistory: readonly MoodEntry[],
  options: PaletteGenerationOptions
): readonly PaletteMetaBall[] {
  const { width, height, period, maxBalls, minRadius, maxRadius } = options

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
        moodType: 'calm',
        intensity: 1,
      },
    ]
  }

  // Вычисляем общее количество настроений для нормализации
  const totalCount = stats.reduce((sum, stat) => sum + stat.count, 0)
  if (totalCount === 0) {
    return []
  }

  // Генерируем шары пропорционально количеству настроений
  const balls: PaletteMetaBall[] = []
  const usedPositions = new Set<string>()

  // Ограничиваем количество шаров по типам настроений
  const ballsPerMood = Math.max(1, Math.floor(maxBalls / stats.length))

  for (const stat of stats) {
    const moodConfig = MOOD_CONFIG[stat.mood]

    // Количество шаров для этого настроения (пропорционально частоте)
    const moodBallCount = Math.min(
      ballsPerMood,
      Math.max(1, Math.round((stat.count / totalCount) * maxBalls))
    )

    for (let i = 0; i < moodBallCount; i++) {
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

      // Радиус зависит от количества настроений и интенсивности
      const countFactor = stat.count / totalCount
      const intensityFactor = stat.averageIntensity / 3 // Нормализуем интенсивность (1-3)
      const sizeFactor = countFactor * 0.7 + intensityFactor * 0.3
      const radius = minRadius + (maxRadius - minRadius) * sizeFactor

      // Скорость зависит от интенсивности (более интенсивные - быстрее)
      const speed = 0.3 + intensityFactor * 0.2
      const angle = Math.random() * Math.PI * 2

      balls.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        radius,
        color: moodConfig.color,
        moodType: stat.mood,
        intensity: stat.averageIntensity,
      })
    }
  }

  return balls.slice(0, maxBalls)
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

