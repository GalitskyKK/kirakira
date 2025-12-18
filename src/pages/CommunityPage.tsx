import { TelegramCommunity } from '@/components/telegram'
import { useGardenState, useMoodTracking } from '@/hooks/index.v2'
import { useTelegramId } from '@/hooks/useTelegramId'
import { Card } from '@/components/ui'
import { useTranslation } from '@/hooks/useTranslation'
import { motion } from 'framer-motion'

export function CommunityPage() {
  const t = useTranslation()
  const { garden } = useGardenState()
  const { moodHistory } = useMoodTracking()
  const telegramId = useTelegramId()

  if (!telegramId) {
    return (
      <div className="p-4">
        <Card className="glass-card text-center">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="space-y-3"
          >
            <div className="text-5xl">🔒</div>
            <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
              {t.pages.community.authRequired}
            </h2>
            <p className="text-neutral-600 dark:text-neutral-400">
              {t.pages.community.loginToView}
            </p>
            <button
              type="button"
              onClick={() => (window.location.href = '/auth')}
              className="mt-2 inline-flex items-center justify-center rounded-2xl bg-kira-500 px-4 py-2 text-white transition-colors hover:bg-kira-600"
            >
              {t.pages.community.login}
            </button>
          </motion.div>
        </Card>
      </div>
    )
  }

  return (
    <div>
      <TelegramCommunity
        garden={garden}
        recentMoods={moodHistory.slice(0, 7)}
      />
    </div>
  )
}
