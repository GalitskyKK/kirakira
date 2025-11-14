import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { useMoodTracking } from '@/hooks/useMoodTracking'
import { MOOD_CONFIG } from '@/types/mood'
import { MoodImage } from '@/components/mood/MoodImage'
import { formatDate } from '@/utils/dateHelpers'
import { Card } from '@/components/ui'
import { LoadingSpinner } from '@/components/ui'

export function MoodRoadmapPage() {
  const navigate = useNavigate()
  const { moodHistory, isLoading } = useMoodTracking()

  // Сортируем историю по дате (от новых к старым)
  const sortedHistory = [...moodHistory].sort(
    (a, b) => b.date.getTime() - a.date.getTime()
  )

  const intensityLabels = ['Слабо', 'Умеренно', 'Сильно']

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <motion.div
      className="min-h-screen space-y-6 p-4 pb-8"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
    >
      {/* Заголовок с кнопкой назад */}
      <div className="flex items-center space-x-4">
        <motion.button
          onClick={() => navigate('/profile')}
          className="flex items-center justify-center rounded-full bg-white p-2 shadow-sm transition-colors hover:bg-gray-50 dark:bg-gray-800 dark:hover:bg-gray-700"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <ArrowLeft size={20} className="text-gray-700 dark:text-gray-300" />
        </motion.button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Роадмап настроений
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Ваш путь эмоций
          </p>
        </div>
      </div>

      {/* Дорожка настроений */}
      {sortedHistory.length === 0 ? (
        <Card padding="lg" className="text-center">
          <div className="mb-4 text-6xl">🌱</div>
          <h2 className="mb-2 text-xl font-semibold text-gray-900 dark:text-gray-100">
            Пока нет записей
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Начните отмечать настроение, чтобы увидеть свой роадмап
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {sortedHistory.map((entry, index) => {
            const moodConfig = MOOD_CONFIG[entry.mood]
            const isLast = index === sortedHistory.length - 1

            return (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05, duration: 0.3 }}
                className="relative"
              >
                {/* Вертикальная линия дорожки */}
                {!isLast && (
                  <div
                    className="absolute left-6 top-16 h-full w-0.5"
                    style={{
                      background: `linear-gradient(to bottom, ${moodConfig.color}40, transparent)`,
                    }}
                  />
                )}

                {/* Карточка записи */}
                <Card
                  padding="md"
                  className="glass-card relative ml-0 border-l-4"
                  style={{
                    borderLeftColor: moodConfig.color,
                  }}
                >
                  <div className="flex items-start space-x-4">
                    {/* Иконка настроения */}
                    <div className="relative flex-shrink-0">
                      <div
                        className="flex h-12 w-12 items-center justify-center rounded-full"
                        style={{
                          backgroundColor: `${moodConfig.color}20`,
                        }}
                      >
                        <MoodImage mood={entry.mood} size={32} />
                      </div>
                    </div>

                    {/* Контент */}
                    <div className="flex-1 space-y-2">
                      {/* Дата и настроение */}
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                            {formatDate(entry.date, 'EEEE, dd MMMM yyyy', 'ru')}
                          </p>
                          <div className="mt-1 flex items-center space-x-2">
                            <span
                              className="text-sm font-medium"
                              style={{ color: moodConfig.color }}
                            >
                              {moodConfig.label}
                            </span>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              • {intensityLabels[entry.intensity - 1]}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Комментарий в кавычках и курсивом */}
                      {entry.note && entry.note.trim().length > 0 && (
                        <div className="rounded-lg bg-white/50 p-3 dark:bg-gray-800/50">
                          <p className="text-sm italic text-gray-700 dark:text-gray-300">
                            "{entry.note}"
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              </motion.div>
            )
          })}
        </div>
      )}

      {/* Статистика */}
      {sortedHistory.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card padding="md" className="glass-card">
            <div className="text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Всего записей: <span className="font-semibold">{sortedHistory.length}</span>
              </p>
            </div>
          </Card>
        </motion.div>
      )}
    </motion.div>
  )
}

