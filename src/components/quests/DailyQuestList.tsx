/**
 * 🎯 DAILY QUEST LIST COMPONENT
 * Компонент для отображения списка ежедневных заданий
 */

import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  useDailyQuests,
  useTodayCompletionRate,
} from '@/hooks/queries/useDailyQuestQueries'
import { useQuestUI } from '@/stores/dailyQuestStore'
import { DailyQuestCard } from './DailyQuestCard'
import { QuestRewardModal } from './QuestRewardModal'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { ErrorMessage } from '@/components/ui/ErrorMessage'
import { useTranslation } from '@/hooks/useTranslation'
import {
  getQuestCategoryInfo,
  type DailyQuest,
  type QuestCategory,
} from '@/types/dailyQuests'

interface DailyQuestListProps {
  readonly telegramId: number
  readonly className?: string
}

export function DailyQuestList({
  telegramId,
  className = '',
}: DailyQuestListProps) {
  const t = useTranslation()
  const {
    data: questsData,
    isLoading,
    error,
    refetch,
  } = useDailyQuests(telegramId)
  const { completed, total } = useTodayCompletionRate(telegramId)
  const { lastClaimedRewards, isShowingRewardAnimation, hideRewardAnimation } =
    useQuestUI()

  // 🔧 ИСПРАВЛЕНИЕ: Используем React Query данные вместо Zustand
  const overallProgress = React.useMemo(() => {
    if (!questsData?.quests) return { completed: 0, target: 0 }

    const completed = questsData.quests.reduce(
      (sum, quest) => sum + quest.currentProgress,
      0
    )
    const target = questsData.quests.reduce(
      (sum, quest) => sum + quest.targetValue,
      0
    )

    return { completed, target }
  }, [questsData?.quests])

  const overallPercentage = React.useMemo(() => {
    if (overallProgress.target === 0) return 0
    return Math.round(
      (overallProgress.completed / overallProgress.target) * 100
    )
  }, [overallProgress])

  // Группируем квесты по категориям
  const questsByCategory = React.useMemo(() => {
    if (!questsData?.quests) return {}

    return questsData.quests.reduce(
      (acc, quest) => {
        const category = quest.questCategory
        if (!acc[category]) {
          acc[category] = []
        }
        acc[category] = [...acc[category], quest]
        return acc
      },
      {} as Record<string, DailyQuest[]>
    )
  }, [questsData?.quests])

  if (isLoading) {
    return (
      <div className={`flex items-center justify-center p-8 ${className}`}>
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (error) {
    return (
      <div className={`p-4 ${className}`}>
        <ErrorMessage message={t.quests.error} onRetry={() => refetch()} />
      </div>
    )
  }

  if (!questsData?.quests || questsData.quests.length === 0) {
    return (
      <div className={`p-4 ${className}`}>
        <Card className="p-8 text-center dark:bg-gray-800">
          <div className="mb-4 text-6xl">🏆</div>
          <h3 className="mb-2 text-xl font-semibold text-gray-900 dark:text-gray-100">
            {t.quests.noQuests}
          </h3>
          <p className="mb-4 text-gray-600 dark:text-gray-400">
            {t.quests.comingSoon}
          </p>
          <Button onClick={() => refetch()} variant="outline">
            {t.common.refresh}
          </Button>
        </Card>
      </div>
    )
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Заголовок и компактная статистика */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
            {t.pages.quests.title}
          </h2>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {completed}/{total}
          </div>
        </div>

        {/* Компактный прогресс */}
        <Card className="p-3 dark:bg-gray-800">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {t.quests.progress}
            </span>
            <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
              {overallPercentage}%
            </span>
          </div>
          <div className="mt-2 h-1.5 w-full rounded-full bg-gray-200 dark:bg-gray-700">
            <motion.div
              className="h-1.5 rounded-full bg-gradient-to-r from-blue-500 to-purple-500"
              initial={{ width: 0 }}
              animate={{ width: `${overallPercentage}%` }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            />
          </div>
        </Card>
      </div>

      {/* Список заданий по категориям */}
      <div className="space-y-6">
        {Object.entries(questsByCategory).map(([category, quests]) => {
          const categoryInfo = getQuestCategoryInfo(category as QuestCategory)

          return (
            <div key={category} className="space-y-3">
              <div className="flex items-center space-x-2">
                <span className="text-xl">{categoryInfo.emoji}</span>
                <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">
                  {t.quests.categories[
                    category as keyof typeof t.quests.categories
                  ] || categoryInfo.name}
                </h3>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  ({quests.length})
                </span>
              </div>

              <div className="grid gap-3">
                <AnimatePresence>
                  {quests.map((quest, index) => (
                    <motion.div
                      key={quest.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{
                        duration: 0.3,
                        delay: index * 0.1,
                        ease: 'easeOut',
                      }}
                    >
                      <DailyQuestCard quest={quest} telegramId={telegramId} />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          )
        })}
      </div>

      {/* Модалка награды */}
      <AnimatePresence>
        {lastClaimedRewards && (
          <QuestRewardModal
            rewards={lastClaimedRewards}
            isOpen={isShowingRewardAnimation}
            onClose={hideRewardAnimation}
          />
        )}
      </AnimatePresence>

      {/* Кнопка обновления */}
      {/* <div className="flex justify-center pt-4">
        <Button onClick={() => refetch()} variant="outline" size="sm">
          Обновить задания
        </Button>
      </div> */}
    </div>
  )
}
