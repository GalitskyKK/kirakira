import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import type { MoodEntry } from '@/types/mood'
import { MOOD_CONFIG } from '@/types/mood'
import { MoodImage } from './MoodImage'
import { formatDate } from '@/utils/dateHelpers'

interface MoodStickerProps {
  readonly entry: MoodEntry
  readonly index: number
}

// Генерируем детерминированные случайные значения на основе ID
function generateStickerStyle(entryId: string) {
  // Используем хеш ID для детерминированных значений
  let hash = 0
  for (let i = 0; i < entryId.length; i++) {
    hash = entryId.charCodeAt(i) + ((hash << 5) - hash)
  }

  // Угол поворота (от -8 до 8 градусов)
  const rotation = (Math.abs(hash) % 17) - 8

  return { rotation }
}

export function MoodSticker({ entry, index }: MoodStickerProps) {
  const moodConfig = MOOD_CONFIG[entry.mood]
  const [isModalOpen, setIsModalOpen] = useState(false)

  // Компактный размер наклейки
  const iconSize = 32

  // Генерируем стиль наклейки на основе ID записи
  const stickerStyle = useMemo(() => generateStickerStyle(entry.id), [entry.id])

  // Форматируем дату - показываем день недели (Пн, Вт, и т.д.)
  const dayOfWeek = useMemo(() => {
    return formatDate(entry.date, 'EEE', 'ru')
  }, [entry.date])

  return (
    <>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{
          delay: index * 0.05,
          type: 'spring',
          stiffness: 200,
          damping: 15,
        }}
        className="flex cursor-pointer flex-col items-center justify-center rounded-lg p-2 transition-all hover:bg-gray-50 dark:hover:bg-neutral-800/50"
        onClick={() => setIsModalOpen(true)}
      >
        {/* Наклейка настроения */}
        <motion.div
          className="relative flex h-16 w-16 items-center justify-center rounded-lg shadow-sm sm:h-20 sm:w-20"
          style={{
            background: `linear-gradient(135deg, ${moodConfig.color}15, ${moodConfig.color}25)`,
            border: `2px solid ${moodConfig.color}40`,
          }}
          animate={{ rotate: stickerStyle.rotation }}
          transition={{ type: 'spring', stiffness: 200, damping: 15 }}
          onClick={e => e.stopPropagation()}
        >
          {/* Иконка настроения */}
          <div className="relative z-10">
            <MoodImage mood={entry.mood} size={iconSize} />
          </div>

          {/* Легкое свечение */}
          <div
            className="absolute inset-0 rounded-lg opacity-20 blur-sm"
            style={{ backgroundColor: moodConfig.color }}
          />
        </motion.div>

        {/* Дата - день недели */}
        <p className="mt-2 text-[10px] font-medium text-gray-500 dark:text-gray-400 sm:text-xs">
          {dayOfWeek}
        </p>
      </motion.div>

      {/* Модалка для просмотра полного текста */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            {/* Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              onClick={() => setIsModalOpen(false)}
            />

            {/* Modal */}
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="relative z-10 w-full max-w-md rounded-2xl bg-white shadow-2xl dark:bg-gray-800"
              onClick={e => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-gray-200 p-4 dark:border-gray-700">
                <div className="flex items-center space-x-3">
                  {/* Наклейка в модалке */}
                  <div
                    className="flex h-12 w-12 items-center justify-center rounded-lg"
                    style={{
                      background: `linear-gradient(135deg, ${moodConfig.color}15, ${moodConfig.color}25)`,
                      border: `2px solid ${moodConfig.color}40`,
                    }}
                  >
                    <MoodImage mood={entry.mood} size={28} />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      {moodConfig.label}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {formatDate(entry.date, 'EEEE, dd MMMM yyyy', 'ru')}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-lg p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:text-gray-500 dark:hover:bg-gray-700 dark:hover:text-gray-300"
                  aria-label="Закрыть"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Content */}
              <div className="max-h-[60vh] overflow-y-auto p-6">
                <div className="space-y-4">
                  {/* Дата */}
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Дата
                    </p>
                    <p className="mt-1 text-base text-gray-900 dark:text-gray-100">
                      {formatDate(entry.date, 'EEEE, dd MMMM yyyy', 'ru')}
                    </p>
                  </div>

                  {/* Настроение */}
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Настроение
                    </p>
                    <p className="mt-1 text-base text-gray-900 dark:text-gray-100">
                      {moodConfig.label}
                    </p>
                  </div>

                  {/* Комментарий */}
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Комментарий
                    </p>
                    {entry.note != null && entry.note.trim().length > 0 ? (
                      <p className="mt-1 text-base leading-relaxed text-gray-700 dark:text-gray-300">
                        "{entry.note}"
                      </p>
                    ) : (
                      <p className="mt-1 text-sm text-gray-400 dark:text-gray-500">
                        Нет комментария
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  )
}
