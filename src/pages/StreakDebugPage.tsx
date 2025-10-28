import { motion } from 'framer-motion'
import { ArrowLeft, Bug } from 'lucide-react'
import { StreakDebugger } from '@/components/dev'

interface StreakDebugPageProps {
  onBack?: () => void
}

function StreakDebugPage({ onBack }: StreakDebugPageProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50">
      <div className="container mx-auto max-w-6xl px-4 py-6">
        {/* Header */}
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {onBack && (
                <button
                  onClick={onBack}
                  className="rounded-lg p-2 transition-colors hover:bg-white/50"
                >
                  <ArrowLeft className="h-6 w-6 text-gray-600 dark:text-gray-400" />
                </button>
              )}
              <div className="flex items-center space-x-3">
                <Bug className="h-8 w-8 text-red-500" />
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                    Отладка стриков
                  </h1>
                  <p className="text-gray-600 dark:text-gray-400">
                    Диагностика проблем с подсчетом стриков настроений
                  </p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Debug Tool */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          <StreakDebugger />
        </motion.div>

        {/* Instructions */}
        <motion.div
          className="mt-8 rounded-lg bg-blue-50 p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <h3 className="mb-3 font-semibold text-blue-900">Как использовать</h3>
          <div className="space-y-2 text-sm text-blue-800">
            <p>
              • <strong>Frontend</strong> - подсчет на клиенте через
              calculateMoodStats()
            </p>
            <p>
              • <strong>Backend</strong> - подсчет на сервере через API /user
              stats
            </p>
            <p>
              • <strong>Database</strong> - прямой подсчет из данных
              mood_entries
            </p>
            <p className="mt-3 font-medium">
              Все три значения должны совпадать. Если нет - есть проблема
              синхронизации.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

// Экспорт по умолчанию для динамического импорта
export default StreakDebugPage
