import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { ChevronDown } from 'lucide-react'
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

  // Позиция наклейки (0 = центр, 1 = влево, 2 = вправо, 3 = сверху)
  const position = Math.abs(hash) % 4

  // Стиль подчеркивания (0 = волна, 1 = выделение вокруг, 2 = двойная волна)
  const underlineStyle = Math.abs(hash * 3) % 3

  return { rotation, position, underlineStyle }
}

export function MoodSticker({ entry, index }: MoodStickerProps) {
  const moodConfig = MOOD_CONFIG[entry.mood]
  const [isExpanded, setIsExpanded] = useState(false)

  // Компактный размер наклейки
  const iconSize = 24

  // Генерируем стиль наклейки на основе ID записи
  const stickerStyle = useMemo(() => generateStickerStyle(entry.id), [entry.id])

  // Разбиваем текст на строки
  const textLines = useMemo(() => {
    if (entry.note == null || entry.note.trim().length === 0) return []
    const words = entry.note.split(/\s+/)
    const lines: string[] = []
    let currentLine = ''

    words.forEach((word, i) => {
      const testLine = currentLine + (currentLine ? ' ' : '') + word
      // Примерно 10-12 символов на строку для компактности
      if (testLine.length > 12 && currentLine.length > 0) {
        lines.push(currentLine)
        currentLine = word
      } else {
        currentLine = testLine
      }
      if (i === words.length - 1) {
        lines.push(currentLine)
      }
    })

    return lines
  }, [entry.note])

  // Максимальное количество строк для свернутого состояния
  const MAX_LINES = 2
  const hasMoreLines = textLines.length > MAX_LINES
  const visibleLines = isExpanded ? textLines : textLines.slice(0, MAX_LINES)

  // Определяем выравнивание на основе позиции
  const alignmentClass =
    stickerStyle.position === 1
      ? 'items-start'
      : stickerStyle.position === 2
        ? 'items-end'
        : stickerStyle.position === 3
          ? 'items-start self-start'
          : 'items-center'

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
      className={`flex flex-col space-y-1 ${alignmentClass} self-start`}
    >
      {/* Наклейка настроения */}
      <motion.div
        className="relative flex h-12 w-12 items-center justify-center rounded-lg shadow-sm transition-all hover:scale-105 sm:h-14 sm:w-14"
        style={{
          background: `linear-gradient(135deg, ${moodConfig.color}15, ${moodConfig.color}25)`,
          border: `2px solid ${moodConfig.color}40`,
        }}
        animate={{ rotate: stickerStyle.rotation }}
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
      <p className="text-[10px] font-medium text-gray-500 dark:text-gray-400 sm:text-xs">
        {formatDate(entry.date, 'dd MMM', 'ru')}
      </p>

      {/* Комментарий пользователя (подпись под наклейкой) */}
      {entry.note != null && entry.note.trim().length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 + 0.15 }}
          className="relative w-full max-w-[100px] sm:max-w-[110px]"
          style={{
            textAlign:
              stickerStyle.position === 1
                ? 'left'
                : stickerStyle.position === 2
                  ? 'right'
                  : 'center',
          }}
        >
          {/* Показываем видимые строки */}
          {visibleLines.map((line, lineIndex) => (
            <div
              key={lineIndex}
              className="relative mb-0.5 inline-block text-[10px] leading-tight text-gray-700 dark:text-gray-300 sm:text-xs sm:leading-relaxed"
            >
              <span className="font-medium">
                {lineIndex === 0 ? '"' : ''}
                {line}
                {lineIndex === visibleLines.length - 1 && !hasMoreLines
                  ? '"'
                  : ''}
              </span>
              {/* Разные стили подчеркивания для каждой строки */}
              {stickerStyle.underlineStyle === 0 ? (
                // Волна
                <svg
                  className="absolute -bottom-0.5 left-0 h-2 w-full"
                  viewBox="0 0 120 8"
                  preserveAspectRatio="none"
                  style={{ color: moodConfig.color }}
                >
                  <path
                    d="M 0,6 Q 8,4 15,5.5 T 30,5 Q 38,4.5 45,5.5 T 60,5 Q 68,4.5 75,5.5 T 90,5 Q 98,4.5 105,5.5 T 120,6"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    vectorEffect="non-scaling-stroke"
                  />
                </svg>
              ) : stickerStyle.underlineStyle === 1 ? (
                // Выделение вокруг (пунктирная рамка)
                <svg
                  className="absolute -bottom-0.5 left-0 h-2.5 w-full"
                  viewBox="0 0 120 10"
                  preserveAspectRatio="none"
                  style={{ color: moodConfig.color }}
                >
                  <path
                    d="M 2,2 Q 5,1 8,2 T 14,2 Q 17,1 20,2 T 26,2 Q 29,1 32,2 T 38,2 Q 41,1 44,2 T 50,2 Q 53,1 56,2 T 62,2 Q 65,1 68,2 T 74,2 Q 77,1 80,2 T 86,2 Q 89,1 92,2 T 98,2 Q 101,1 104,2 T 110,2 Q 113,1 116,2"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.2"
                    strokeLinecap="round"
                    strokeDasharray="2 2"
                    vectorEffect="non-scaling-stroke"
                    opacity="0.6"
                  />
                </svg>
              ) : (
                // Двойная волна
                <svg
                  className="absolute -bottom-0.5 left-0 h-2.5 w-full"
                  viewBox="0 0 120 10"
                  preserveAspectRatio="none"
                  style={{ color: moodConfig.color }}
                >
                  <path
                    d="M 0,5 Q 8,3 15,4.5 T 30,4 Q 38,3.5 45,4.5 T 60,4 Q 68,3.5 75,4.5 T 90,4 Q 98,3.5 105,4.5 T 120,5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.2"
                    strokeLinecap="round"
                    vectorEffect="non-scaling-stroke"
                    opacity="0.7"
                  />
                  <path
                    d="M 0,7 Q 8,5 15,6.5 T 30,6 Q 38,5.5 45,6.5 T 60,6 Q 68,5.5 75,6.5 T 90,6 Q 98,5.5 105,6.5 T 120,7"
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
          ))}

          {/* Кнопка "развернуть" если есть еще строки */}
          {hasMoreLines && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="mt-1 flex w-full items-center justify-center text-[9px] text-gray-500 transition-colors hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 sm:text-[10px]"
              style={{ color: moodConfig.color }}
            >
              <ChevronDown
                className={`h-3 w-3 transition-transform ${
                  isExpanded ? 'rotate-180' : ''
                }`}
              />
            </button>
          )}

          {/* Показываем скрытые строки при развернутом состоянии */}
          {isExpanded && hasMoreLines && (
            <motion.div
              initial={{ opacity: 0, maxHeight: 0 }}
              animate={{ opacity: 1, maxHeight: 500 }}
              exit={{ opacity: 0, maxHeight: 0 }}
              transition={{ duration: 0.2, ease: 'easeInOut' }}
              className="overflow-hidden"
            >
              {textLines.slice(MAX_LINES).map((line, lineIndex) => (
                <div
                  key={lineIndex + MAX_LINES}
                  className="relative mb-0.5 inline-block text-[10px] leading-tight text-gray-700 dark:text-gray-300 sm:text-xs sm:leading-relaxed"
                >
                  <span className="font-medium">
                    {line}
                    {lineIndex === textLines.slice(MAX_LINES).length - 1
                      ? '"'
                      : ''}
                  </span>
                  {/* Подчеркивание для дополнительных строк */}
                  {stickerStyle.underlineStyle === 0 ? (
                    <svg
                      className="absolute -bottom-0.5 left-0 h-2 w-full"
                      viewBox="0 0 120 8"
                      preserveAspectRatio="none"
                      style={{ color: moodConfig.color }}
                    >
                      <path
                        d="M 0,6 Q 8,4 15,5.5 T 30,5 Q 38,4.5 45,5.5 T 60,5 Q 68,4.5 75,5.5 T 90,5 Q 98,4.5 105,5.5 T 120,6"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        vectorEffect="non-scaling-stroke"
                      />
                    </svg>
                  ) : stickerStyle.underlineStyle === 1 ? (
                    <svg
                      className="absolute -bottom-0.5 left-0 h-2.5 w-full"
                      viewBox="0 0 120 10"
                      preserveAspectRatio="none"
                      style={{ color: moodConfig.color }}
                    >
                      <path
                        d="M 2,2 Q 5,1 8,2 T 14,2 Q 17,1 20,2 T 26,2 Q 29,1 32,2 T 38,2 Q 41,1 44,2 T 50,2 Q 53,1 56,2 T 62,2 Q 65,1 68,2 T 74,2 Q 77,1 80,2 T 86,2 Q 89,1 92,2 T 98,2 Q 101,1 104,2 T 110,2 Q 113,1 116,2"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.2"
                        strokeLinecap="round"
                        strokeDasharray="2 2"
                        vectorEffect="non-scaling-stroke"
                        opacity="0.6"
                      />
                    </svg>
                  ) : (
                    <svg
                      className="absolute -bottom-0.5 left-0 h-2.5 w-full"
                      viewBox="0 0 120 10"
                      preserveAspectRatio="none"
                      style={{ color: moodConfig.color }}
                    >
                      <path
                        d="M 0,5 Q 8,3 15,4.5 T 30,4 Q 38,3.5 45,4.5 T 60,4 Q 68,3.5 75,4.5 T 90,4 Q 98,3.5 105,4.5 T 120,5"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.2"
                        strokeLinecap="round"
                        vectorEffect="non-scaling-stroke"
                        opacity="0.7"
                      />
                      <path
                        d="M 0,7 Q 8,5 15,6.5 T 30,6 Q 38,5.5 45,6.5 T 60,6 Q 68,5.5 75,6.5 T 90,6 Q 98,5.5 105,6.5 T 120,7"
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
              ))}
            </motion.div>
          )}
        </motion.div>
      )}
    </motion.div>
  )
}
