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

  // Размер наклейки зависит от интенсивности
  const sizeMap = {
    1: { size: 'w-20 h-20', iconSize: 32 }, // LOW
    2: { size: 'w-24 h-24', iconSize: 40 }, // MEDIUM
    3: { size: 'w-28 h-28', iconSize: 48 }, // HIGH
  }

  const { size, iconSize } = sizeMap[entry.intensity]

  // Случайный угол поворота для эффекта наклейки (от -8 до 8 градусов)
  const rotation = (index * 7.5) % 16 - 8

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8, rotate: rotation - 10 }}
      animate={{ opacity: 1, scale: 1, rotate: rotation }}
      transition={{
        delay: index * 0.1,
        type: 'spring',
        stiffness: 200,
        damping: 15,
      }}
      className="flex flex-col items-center space-y-2"
    >
      {/* Наклейка настроения */}
      <motion.div
        className={`${size} relative flex items-center justify-center rounded-2xl shadow-lg transition-all hover:scale-105`}
        style={{
          background: `linear-gradient(135deg, ${moodConfig.color}15, ${moodConfig.color}25)`,
          border: `2px solid ${moodConfig.color}40`,
        }}
        animate={{ rotate: rotation }}
        transition={{ type: 'spring', stiffness: 200, damping: 15 }}
      >
        {/* Декоративные уголки как у наклейки */}
        <div
          className="absolute -left-1 -top-1 h-4 w-4 rounded-full"
          style={{ backgroundColor: moodConfig.color }}
        />
        <div
          className="absolute -right-1 -top-1 h-4 w-4 rounded-full"
          style={{ backgroundColor: moodConfig.color }}
        />
        <div
          className="absolute -bottom-1 -left-1 h-4 w-4 rounded-full"
          style={{ backgroundColor: moodConfig.color }}
        />
        <div
          className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full"
          style={{ backgroundColor: moodConfig.color }}
        />

        {/* Иконка настроения */}
        <div className="relative z-10">
          <MoodImage mood={entry.mood} size={iconSize} />
        </div>

        {/* Легкое свечение */}
        <div
          className="absolute inset-0 rounded-2xl opacity-20 blur-sm"
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
          transition={{ delay: index * 0.1 + 0.2 }}
          className="max-w-[140px] text-center"
        >
          <p
            className="text-xs italic leading-relaxed"
            style={{ color: moodConfig.color }}
          >
            "{entry.note}"
          </p>
        </motion.div>
      )}
    </motion.div>
  )
}

