import { motion } from 'framer-motion'
import { ArrowLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { MoodStats } from '@/components/mood'

export function StatsPage() {
  const navigate = useNavigate()

  return (
    <motion.div
      className="min-h-screen bg-gray-50 dark:bg-gray-900"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Header */}
      <div className="border-b bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <div className="flex items-center px-4 py-4">
          <button
            onClick={() => navigate(-1)}
            className="mr-3 flex items-center justify-center rounded-lg p-2 text-gray-600 transition-colors hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">
            Статистика
          </h1>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <MoodStats />
      </div>
    </motion.div>
  )
}
