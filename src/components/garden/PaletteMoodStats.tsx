/**
 * 🎨 Статистика настроений для режима палитры
 * Показывает только количество вхождений по каждому настроению
 */

import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { useMoodTracking } from '@/hooks/useMoodTracking'
import { MOOD_CONFIG } from '@/types/mood'
import type { MoodType } from '@/types'
import { Card } from '@/components/ui'

export function PaletteMoodStats() {
  const { moodHistory } = useMoodTracking()

  // Подсчитываем количество вхождений по каждому настроению
  const moodCounts = useMemo(() => {
    const counts: Record<MoodType, number> = {
      joy: 0,
      calm: 0,
      stress: 0,
      sadness: 0,
      anger: 0,
      anxiety: 0,
    }

    moodHistory.forEach(entry => {
      counts[entry.mood]++
    })

    return counts
  }, [moodHistory])

  // Сортируем по количеству (от большего к меньшему)
  const sortedMoods = useMemo(() => {
    return (Object.entries(moodCounts) as [MoodType, number][])
      .filter(([, count]) => count > 0)
      .sort(([, a], [, b]) => b - a)
  }, [moodCounts])

  if (moodHistory.length === 0) {
    return (
      <Card padding="sm">
        <div className="text-center py-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Отметьте настроение, чтобы увидеть статистику
          </p>
        </div>
      </Card>
    )
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between px-1">
        <h3 className="text-xs font-semibold text-gray-900 dark:text-gray-100">
          Настроения
        </h3>
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {moodHistory.length}
        </span>
      </div>

      <Card padding="sm" className="space-y-1.5">
        {sortedMoods.map(([mood, count], index) => {
          const config = MOOD_CONFIG[mood]
          const percentage = Math.round((count / moodHistory.length) * 100)

          return (
            <motion.div
              key={mood}
              className="flex items-center justify-between rounded-md px-2 py-1.5 transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-800/50"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.03 }}
            >
              <div className="flex items-center gap-2">
                <img
                  src={config.imagePath}
                  alt={config.label}
                  className="h-5 w-5 flex-shrink-0 object-contain"
                />
                <span className="text-xs text-gray-700 dark:text-gray-300">
                  {config.label}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {percentage}%
                </span>
                <span
                  className="text-xs font-semibold"
                  style={{ color: config.color }}
                >
                  {count}
                </span>
              </div>
            </motion.div>
          )
        })}
      </Card>
    </div>
  )
}

