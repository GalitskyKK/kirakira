import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Trophy, Calendar } from 'lucide-react'
import { useTelegramId } from '@/hooks/useTelegramId'
import { DailyQuestList } from '@/components/quests'
import { ChallengeList } from '@/components/challenges/ChallengeList'
import { StreakGemQuests } from '@/components/ui'
import { useGardenState } from '@/hooks/index.v2'

export function TasksPage() {
  const [activeTab, setActiveTab] = useState<'daily' | 'challenges'>('daily')
  const telegramId = useTelegramId()
  const { garden } = useGardenState()

  if (!telegramId) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="glass-card rounded-3xl p-6 text-center">
          <div className="mb-4 text-6xl">🔒</div>
          <h2 className="mb-2 text-xl font-bold text-neutral-900 dark:text-neutral-100">
            Требуется авторизация
          </h2>
          <p className="text-neutral-600 dark:text-neutral-400">
            Войдите в аккаунт для просмотра заданий
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Табы */}
      <div className="glass-card flex space-x-1 rounded-2xl p-1.5">
        {[
          { id: 'daily', label: 'Ежедневные', icon: Calendar },
          { id: 'challenges', label: 'Челленджи', icon: Trophy },
        ].map(tab => {
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as 'daily' | 'challenges')}
              className={`flex flex-1 items-center justify-center space-x-2 rounded-xl px-3 py-2 text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? 'text-kira-600 dark:text-kira-400 bg-white shadow-md dark:bg-neutral-800'
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
            
            {/* Стрик-квесты за гемы */}
            <StreakGemQuests />
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
