import { motion } from 'framer-motion'
import type { MoodEntry } from '@/types/mood'
import { MOOD_CONFIG } from '@/types/mood'
import { MoodImage } from './MoodImage'
import { formatDate } from '@/utils/dateHelpers'

interface MoodStickerProps {
  readonly entry: MoodEntry
  readonly index: number
}

export function MoodSticker({ entry, index }: MoodStickerProps) {
  const moodConfig = MOOD_CONFIG[entry.mood]

  // Компактный размер наклейки
  const iconSize = 28

  // Небольшой угол поворота для эффекта наклейки (от -5 до 5 градусов)
  const rotation = (index * 5) % 10 - 5

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{
        delay: index * 0.05,
        type: 'spring',
        stiffness: 200,
        damping: 15,
      }}
      className="flex flex-col items-center space-y-2"
    >
      {/* Наклейка настроения */}
      <motion.div
        className="relative flex h-16 w-16 items-center justify-center rounded-xl shadow-md transition-all hover:scale-105"
        style={{
          background: `linear-gradient(135deg, ${moodConfig.color}15, ${moodConfig.color}25)`,
          border: `2px solid ${moodConfig.color}40`,
        }}
        animate={{ rotate: rotation }}
        transition={{ type: 'spring', stiffness: 200, damping: 15 }}
      >
        {/* Иконка настроения */}
        <div className="relative z-10">
          <MoodImage mood={entry.mood} size={iconSize} />
        </div>

        {/* Легкое свечение */}
        <div
          className="absolute inset-0 rounded-xl opacity-20 blur-sm"
          style={{ backgroundColor: moodConfig.color }}
        />
      </motion.div>

      {/* Дата (маленькая подпись) */}
      <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
        {formatDate(entry.date, 'dd MMM', 'ru')}
      </p>

      {/* Комментарий пользователя (подпись под наклейкой) */}
      {entry.note != null && entry.note.trim().length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 + 0.15 }}
          className="relative max-w-[120px] text-center"
        >
          <p className="relative inline-block text-xs leading-relaxed text-gray-700 dark:text-gray-300">
            <span className="font-medium">"{entry.note}"</span>
            {/* Рукописное подчеркивание - волнистая линия */}
            <svg
              className="absolute -bottom-1 left-0 h-2.5 w-full"
              viewBox="0 0 120 10"
              preserveAspectRatio="none"
              style={{ color: moodConfig.color }}
            >
              <path
                d="M 0,7 Q 8,5 15,6.5 T 30,6 Q 38,5.5 45,6.5 T 60,6 Q 68,5.5 75,6.5 T 90,6 Q 98,5.5 105,6.5 T 120,7"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                vectorEffect="non-scaling-stroke"
                style={{
                  filter: 'drop-shadow(0 0.5px 0.5px rgba(0,0,0,0.1))',
                }}
              />
            </svg>
          </p>
        </motion.div>
      )}
    </motion.div>
  )
}

