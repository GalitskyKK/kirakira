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
    <div className="space-y-3">
      <div>
        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
          Статистика настроений
        </h3>
        <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">
          Всего отметок: {moodHistory.length}
        </p>
      </div>

      <Card padding="sm">
        <div className="space-y-2">
          {sortedMoods.map(([mood, count], index) => {
            const config = MOOD_CONFIG[mood]
            const percentage = Math.round((count / moodHistory.length) * 100)

            return (
              <motion.div
                key={mood}
                className="flex items-center justify-between rounded-lg px-3 py-2 transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-800/50"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <div className="flex items-center gap-2">
                  <span className="text-lg">{config.emoji}</span>
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    {config.label}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {percentage}%
                  </span>
                  <span
                    className="text-sm font-semibold"
                    style={{ color: config.color }}
                  >
                    {count}
                  </span>
                </div>
              </motion.div>
            )
          })}
        </div>
      </Card>
    </div>
  )
}

