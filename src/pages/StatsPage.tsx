import { motion } from 'framer-motion'
import { BarChart3 } from 'lucide-react'
import { MoodStats } from '@/components/mood'
import { PageHeader } from '@/components/layout'
import { useTranslation } from '@/hooks/useTranslation'
import { PageHint } from '@/components/ui'
import { PAGE_HINT_IDS } from '@/utils/storage'

export function StatsPage() {
  const t = useTranslation()
  return (
    <motion.div
      className="min-h-screen bg-gradient-to-br from-kira-50 via-garden-50 to-neutral-50 dark:from-neutral-900 dark:via-neutral-800 dark:to-neutral-900"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <PageHeader
        title={t.profile.statistics}
        icon={<BarChart3 className="h-5 w-5" />}
      />

      <div className="p-4 pb-24">
        <PageHint
          id={PAGE_HINT_IDS.stats}
          title={t.hints.stats.title}
          description={t.hints.stats.description}
          actionLabel={t.hints.dismiss}
          targetSelector='[data-hint-target="stats-content"]'
          className="mb-4"
        />
        <div data-hint-target="stats-content">
          <MoodStats />
        </div>
      </div>
    </motion.div>
  )
}
