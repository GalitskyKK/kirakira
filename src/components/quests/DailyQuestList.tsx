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
import { QuestCompletionSummary } from './QuestCompletionSummary'
import { QuestRewardModal } from './QuestRewardModal'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { ErrorMessage } from '@/components/ui/ErrorMessage'
import { getQuestCategoryInfo, type DailyQuest } from '@/types/dailyQuests'

interface DailyQuestListProps {
  readonly telegramId: number
  readonly className?: string
}

export function DailyQuestList({
  telegramId,
  className = '',
}: DailyQuestListProps) {
  const {
    data: questsData,
    isLoading,
    error,
    refetch,
  } = useDailyQuests(telegramId)
  const { completed, total, percentage } = useTodayCompletionRate(telegramId)
  const { lastClaimedRewards } = useQuestUI()

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
        <ErrorMessage
          message="Ошибка загрузки заданий"
          onRetry={() => refetch()}
        />
      </div>
    )
  }

  if (!questsData?.quests || questsData.quests.length === 0) {
    return (
      <div className={`p-4 ${className}`}>
        <Card className="p-8 text-center">
          <div className="mb-4 text-6xl">🎯</div>
          <h3 className="mb-2 text-xl font-semibold">Нет заданий на сегодня</h3>
          <p className="mb-4 text-gray-600">Задания появятся завтра в 00:00</p>
          <Button onClick={() => refetch()} variant="outline">
            Обновить
          </Button>
        </Card>
      </div>
    )
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Заголовок и статистика */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">
            Ежедневные задания
          </h2>
          <div className="text-sm text-gray-600">
            {completed} из {total} выполнено
          </div>
        </div>

        {/* Общий прогресс */}
        <Card className="p-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Общий прогресс</span>
              <span className="font-medium">{overallPercentage}%</span>
            </div>
            <div className="h-2 w-full rounded-full bg-gray-200">
              <motion.div
                className="h-2 rounded-full bg-gradient-to-r from-blue-500 to-purple-500"
                initial={{ width: 0 }}
                animate={{ width: `${overallPercentage}%` }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
              />
            </div>
            <div className="text-xs text-gray-500">
              {overallProgress.completed} из {overallProgress.target} заданий
            </div>
          </div>
        </Card>

        {/* Сводка выполнения */}
        <QuestCompletionSummary
          completedCount={completed}
          totalCount={total}
          percentage={percentage}
          quests={questsData.quests}
        />
      </div>

      {/* Список заданий по категориям */}
      <div className="space-y-6">
        {Object.entries(questsByCategory).map(([category, quests]) => {
          const categoryInfo = getQuestCategoryInfo(category as any)

          return (
            <div key={category} className="space-y-3">
              <div className="flex items-center space-x-2">
                <span className="text-2xl">{categoryInfo.emoji}</span>
                <h3 className="text-lg font-semibold text-gray-900">
                  {categoryInfo.name}
                </h3>
                <span className="text-sm text-gray-500">({quests.length})</span>
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
          <QuestRewardModal rewards={lastClaimedRewards} onClose={() => {}} />
        )}
      </AnimatePresence>

      {/* Кнопка обновления */}
      <div className="flex justify-center pt-4">
        <Button onClick={() => refetch()} variant="outline" size="sm">
          Обновить задания
        </Button>
      </div>
    </div>
  )
}
