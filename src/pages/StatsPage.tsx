import { motion } from 'framer-motion'
import { ArrowLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { MoodStats } from '@/components/mood'

export function StatsPage() {
  const navigate = useNavigate()

  return (
    <motion.div
      className="from-kira-50 min-h-screen bg-gradient-to-br via-garden-50 to-neutral-50 dark:from-neutral-900 dark:via-neutral-800 dark:to-neutral-900"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Header */}
      <div className="glass-card border-b border-neutral-200/50 shadow-sm dark:border-neutral-700/50">
        <div className="flex items-center px-4 py-4">
          <button
            onClick={() => navigate(-1)}
            className="mr-3 flex items-center justify-center rounded-lg p-2 text-neutral-600 transition-colors hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-700"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-xl font-bold text-neutral-900 dark:text-neutral-100">
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
