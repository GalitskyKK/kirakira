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

  // Позиция наклейки (0 = сверху слева, 1 = снизу слева, 2 = сверху справа, 3 = снизу справа)
  const position = Math.abs(hash) % 4

  // Стиль подчеркивания (0 = волна, 1 = пунктир, 2 = двойная волна)
  const underlineStyle = Math.abs(hash * 3) % 3

  return { rotation, position, underlineStyle }
}

export function MoodSticker({ entry, index }: MoodStickerProps) {
  const moodConfig = MOOD_CONFIG[entry.mood]
  const [isModalOpen, setIsModalOpen] = useState(false)

  // Компактный размер наклейки
  const iconSize = 24

  // Генерируем стиль наклейки на основе ID записи
  const stickerStyle = useMemo(() => generateStickerStyle(entry.id), [entry.id])

  // Определяем классы для позиционирования
  const getPositionClasses = () => {
    switch (stickerStyle.position) {
      case 0: // Сверху слева - текст начинается с середины (после наклейки)
        return {
          container: 'flex-row items-start',
          sticker: 'mr-2 flex-shrink-0',
          text: 'flex-1 min-w-0',
          textStart: 'ml-0',
          textIndent: '',
        }
      case 1: // Снизу слева - текст начинается слева, но на следующих строках не накладывается
        return {
          container: 'flex-row items-start',
          sticker: 'mr-2 flex-shrink-0 self-end',
          text: 'flex-1 min-w-0',
          textStart: 'ml-0',
          textIndent: '',
        }
      case 2: // Сверху справа
        return {
          container: 'flex-row-reverse items-start',
          sticker: 'ml-2 flex-shrink-0',
          text: 'flex-1 min-w-0',
          textStart: 'mr-0',
          textIndent: '',
        }
      case 3: // Снизу справа
        return {
          container: 'flex-row-reverse items-start',
          sticker: 'ml-2 flex-shrink-0 self-end',
          text: 'flex-1 min-w-0',
          textStart: 'mr-0',
          textIndent: '',
        }
      default:
        return {
          container: 'flex-row items-start',
          sticker: 'mr-2 flex-shrink-0',
          text: 'flex-1 min-w-0',
          textStart: 'ml-0',
          textIndent: '',
        }
    }
  }

  const positionClasses = getPositionClasses()

  // Ограничиваем текст до 3 строк с многоточием
  const truncatedText = useMemo(() => {
    if (entry.note == null || entry.note.trim().length === 0) return ''
    return entry.note
  }, [entry.note])

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
        className={`flex ${positionClasses.container} cursor-pointer self-start rounded-lg p-2 transition-all hover:bg-gray-50 dark:hover:bg-neutral-800/50`}
        onClick={() => setIsModalOpen(true)}
      >
        {/* Наклейка настроения */}
        <motion.div
          className={`${positionClasses.sticker} relative flex h-12 w-12 items-center justify-center rounded-lg shadow-sm sm:h-14 sm:w-14`}
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

        {/* Текст и дата */}
        <div className={`${positionClasses.text} flex flex-col`}>
          {/* Дата */}
          <p className="mb-1 text-[10px] font-medium text-gray-500 dark:text-gray-400 sm:text-xs">
            {formatDate(entry.date, 'dd MMM', 'ru')}
          </p>

          {/* Комментарий пользователя */}
          {entry.note != null && entry.note.trim().length > 0 && (
            <div className={`${positionClasses.textStart} relative w-full`}>
              <p
                className="text-[10px] leading-tight text-gray-700 dark:text-gray-300 sm:text-xs sm:leading-relaxed"
                style={{
                  display: '-webkit-box',
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  wordBreak: 'break-word',
                }}
              >
                <span className="font-medium">"{truncatedText}"</span>
              </p>
              {/* Подчеркивание только для первой строки */}
              {stickerStyle.underlineStyle === 0 ? (
                // Волна
                <svg
                  className="absolute -bottom-0.5 left-0 h-2 w-20"
                  viewBox="0 0 80 8"
                  preserveAspectRatio="none"
                  style={{ color: moodConfig.color }}
                >
                  <path
                    d="M 0,6 Q 6,4 12,5.5 T 24,5 Q 30,4.5 36,5.5 T 48,5 Q 54,4.5 60,5.5 T 72,5 Q 78,4.5 80,6"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    vectorEffect="non-scaling-stroke"
                  />
                </svg>
              ) : stickerStyle.underlineStyle === 1 ? (
                // Пунктир
                <svg
                  className="absolute -bottom-0.5 left-0 h-2 w-20"
                  viewBox="0 0 80 8"
                  preserveAspectRatio="none"
                  style={{ color: moodConfig.color }}
                >
                  <path
                    d="M 0,6 L 80,6"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.2"
                    strokeDasharray="2 2"
                    vectorEffect="non-scaling-stroke"
                    opacity="0.6"
                  />
                </svg>
              ) : (
                // Двойная волна
                <svg
                  className="absolute -bottom-0.5 left-0 h-2.5 w-20"
                  viewBox="0 0 80 10"
                  preserveAspectRatio="none"
                  style={{ color: moodConfig.color }}
                >
                  <path
                    d="M 0,5 Q 6,3 12,4.5 T 24,4 Q 30,3.5 36,4.5 T 48,4 Q 54,3.5 60,4.5 T 72,4 Q 78,3.5 80,5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.2"
                    strokeLinecap="round"
                    vectorEffect="non-scaling-stroke"
                    opacity="0.7"
                  />
                  <path
                    d="M 0,7 Q 6,5 12,6.5 T 24,6 Q 30,5.5 36,6.5 T 48,6 Q 54,5.5 60,6.5 T 72,6 Q 78,5.5 80,7"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.2"
                    strokeLinecap="round"
                    vectorEffect="non-scaling-stroke"
                    opacity="0.7"
                  />
                </svg>
              )}
            </div>
          )}
        </div>
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
                {entry.note != null && entry.note.trim().length > 0 ? (
                  <p className="text-base leading-relaxed text-gray-700 dark:text-gray-300">
                    <span className="font-medium">"{entry.note}"</span>
                  </p>
                ) : (
                  <p className="text-sm text-gray-400 dark:text-gray-500">
                    Нет комментария
                  </p>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  )
}
