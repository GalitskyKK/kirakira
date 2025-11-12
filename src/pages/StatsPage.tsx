import { motion } from 'framer-motion'
import { BarChart3 } from 'lucide-react'
import { MoodStats } from '@/components/mood'
import { PageHeader } from '@/components/layout'

export function StatsPage() {
  return (
    <motion.div
      className="from-kira-50 min-h-screen bg-gradient-to-br via-garden-50 to-neutral-50 dark:from-neutral-900 dark:via-neutral-800 dark:to-neutral-900"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <PageHeader
        title="Статистика"
        subtitle="Ваша история настроений и активности"
        icon={<BarChart3 className="h-5 w-5" />}
      />

      <div className="p-4">
        <MoodStats />
      </div>
    </motion.div>
  )
}
