import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Trophy, Calendar } from 'lucide-react'
import { useTelegramId } from '@/hooks/useTelegramId'
import { DailyQuestList } from '@/components/quests'
import { ChallengeList } from '@/components/challenges/ChallengeList'
import { useGardenState } from '@/hooks/index.v2'
import { useTranslation } from '@/hooks/useTranslation'

export function TasksPage() {
  const t = useTranslation()
  const [activeTab, setActiveTab] = useState<'daily' | 'challenges'>('daily')
  const telegramId = useTelegramId()
  const { garden } = useGardenState()

  if (!telegramId) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="glass-card rounded-3xl p-6 text-center">
          <div className="mb-4 text-6xl">🔒</div>
          <h2 className="mb-2 text-xl font-bold text-neutral-900 dark:text-neutral-100">
            {t.quests.authRequired}
          </h2>
          <p className="text-neutral-600 dark:text-neutral-400">
            {t.quests.loginToView}
          </p>
          <button
            type="button"
            onClick={() => (window.location.href = '/auth')}
            className="mt-4 inline-flex items-center justify-center rounded-2xl bg-kira-500 px-4 py-2 text-white transition-colors hover:bg-kira-600"
          >
            {t.quests.login}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Табы */}
      <div className="glass-card flex min-h-[56px] items-center space-x-1 rounded-2xl p-1.5">
        {[
          { id: 'daily', label: t.quests.daily, icon: Calendar },
          { id: 'challenges', label: t.quests.challenges, icon: Trophy },
        ].map(tab => {
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as 'daily' | 'challenges')}
              className={`flex flex-1 items-center justify-center space-x-2 rounded-xl px-3 py-2 text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-white text-kira-600 shadow-md dark:bg-neutral-800 dark:text-kira-400'
                  : 'text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100'
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{tab.label}</span>
            </button>
          )
        })}
      </div>

      {/* Контент табов */}
      <AnimatePresence mode="wait">
        {activeTab === 'daily' && (
          <motion.div
            key="daily"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-4"
          >
            <DailyQuestList telegramId={telegramId} />
          </motion.div>
        )}

        {activeTab === 'challenges' && (
          <motion.div
            key="challenges"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-4"
          >
            <ChallengeList garden={garden} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
