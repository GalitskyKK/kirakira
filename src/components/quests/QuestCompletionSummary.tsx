/**
 * 🎯 QUEST COMPLETION SUMMARY COMPONENT
 * Компонент сводки выполнения заданий
 */

import { motion } from 'framer-motion'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { useClaimAllRewards } from '@/hooks/queries/useDailyQuestQueries'
import { useDailyQuestStore } from '@/stores/dailyQuestStore'
import { calculateBonusRewards, formatQuestRewards } from '@/types/dailyQuests'
import type { DailyQuest } from '@/types/dailyQuests'

interface QuestCompletionSummaryProps {
  readonly completedCount: number
  readonly totalCount: number
  readonly percentage: number
  readonly quests: readonly DailyQuest[]
  readonly telegramId: number
  readonly className?: string
}

export function QuestCompletionSummary({
  completedCount,
  totalCount,
  percentage,
  quests,
  telegramId,
  className = '',
}: QuestCompletionSummaryProps) {
  // Вычисляем бонусные награды
  const bonusRewards = calculateBonusRewards(completedCount, totalCount)

  // Хуки для получения всех наград
  const claimAllMutation = useClaimAllRewards()
  const { showRewardAnimation } = useDailyQuestStore()

  // Группируем квесты по статусу
  const questsByStatus = quests.reduce(
    (acc, quest) => {
      if (!acc[quest.status]) {
        acc[quest.status] = []
      }
      const existing = acc[quest.status]
      if (existing) {
        acc[quest.status] = [...existing, quest]
      } else {
        acc[quest.status] = [quest]
      }
      return acc
    },
    {} as Record<string, DailyQuest[]>
  )

  const expiredQuests = questsByStatus['expired'] ?? []
  const unclaimedQuests = questsByStatus['completed'] ?? []

  // Обработчик получения всех наград
  const handleClaimAllRewards = async () => {
    if (unclaimedQuests.length === 0) return

    try {
      const questIds = unclaimedQuests.map(quest => quest.id)
      const results = await claimAllMutation.mutateAsync({
        telegramId,
        questIds,
      })

      // Показываем анимацию с суммарными наградами
      if (results.length > 0) {
        const totalRewards = results.reduce(
          (total, result) => ({
            sprouts: total.sprouts + result.rewards.sprouts,
            gems: total.gems + (result.rewards.gems || 0),
            experience: total.experience + result.rewards.experience,
          }),
          { sprouts: 0, gems: 0, experience: 0 }
        )

        // Показываем анимацию награды
        showRewardAnimation({
          ...totalRewards,
          description: `Получены награды за ${results.length} заданий!`,
        })
      }
    } catch (error) {
      console.error('Claim all rewards error:', error)
    }
  }

  // Определяем цвет на основе прогресса
  const getProgressColor = () => {
    if (percentage >= 100) return 'text-green-600'
    if (percentage >= 80) return 'text-blue-600'
    if (percentage >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getProgressBarColor = () => {
    if (percentage >= 100) return 'bg-green-500'
    if (percentage >= 80) return 'bg-blue-500'
    if (percentage >= 60) return 'bg-yellow-500'
    return 'bg-red-500'
  }

  return (
    <Card className={`p-4 dark:bg-gray-800 ${className}`}>
      <div className="space-y-4">
        {/* Основная статистика */}
        <div className="text-center">
          <div className={`text-3xl font-bold ${getProgressColor()}`}>
            {completedCount} / {totalCount}
          </div>
          <div className="mb-2 text-sm text-gray-600 dark:text-gray-400">
            заданий выполнено
          </div>

          {/* Прогресс-бар */}
          <div className="mb-2 h-3 w-full rounded-full bg-gray-200 dark:bg-gray-700">
            <motion.div
              className={`h-3 rounded-full ${getProgressBarColor()}`}
              initial={{ width: 0 }}
              animate={{ width: `${percentage}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
            />
          </div>

          <div className={`text-sm font-medium ${getProgressColor()}`}>
            {percentage}% выполнено
          </div>
        </div>

        {/* Бонусные награды */}
        {bonusRewards && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className="rounded-lg border border-purple-200 bg-gradient-to-r from-purple-50 to-pink-50 p-3 dark:border-purple-700 dark:from-purple-900/30 dark:to-pink-900/30"
          >
            <div className="text-center">
              <div className="mb-1 text-2xl">🎁</div>
              <div className="mb-1 text-sm font-semibold text-purple-700 dark:text-purple-300">
                Бонусная награда!
              </div>
              <div className="text-xs text-purple-600 dark:text-purple-400">
                {formatQuestRewards(bonusRewards)}
              </div>
            </div>
          </motion.div>
        )}

        {/* Детальная статистика */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="text-center">
            <div className="text-lg font-semibold text-green-600">
              {completedCount}
            </div>
            <div className="text-gray-600">Выполнено</div>
          </div>

          <div className="text-center">
            <div className="text-lg font-semibold text-blue-600">
              {unclaimedQuests.length}
            </div>
            <div className="text-gray-600">Готово к получению</div>
          </div>
        </div>

        {/* Истекшие задания */}
        {expiredQuests.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="rounded-lg border border-red-200 bg-red-50 p-3"
          >
            <div className="text-center">
              <div className="mb-1 text-sm font-semibold text-red-700">
                Не успели выполнить ({expiredQuests.length})
              </div>
              <div className="text-xs text-red-600">
                {expiredQuests
                  .map(quest => quest.metadata?.name || 'Задание')
                  .join(', ')}
              </div>
            </div>
          </motion.div>
        )}

        {/* Мотивационные сообщения */}
        <div className="text-center">
          {percentage >= 100 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
              className="font-semibold text-green-600"
            >
              🎉 Идеальный день! Все задания выполнены!
            </motion.div>
          ) : percentage >= 80 ? (
            <div className="font-medium text-blue-600">
              🔥 Отличная работа! Почти все готово!
            </div>
          ) : percentage >= 60 ? (
            <div className="font-medium text-yellow-600">
              💪 Хороший прогресс! Продолжайте в том же духе!
            </div>
          ) : percentage >= 40 ? (
            <div className="font-medium text-orange-600">
              🌱 Неплохо! Еще немного усилий!
            </div>
          ) : (
            <div className="font-medium text-red-600">
              🚀 Время начать! У вас есть все шансы!
            </div>
          )}
        </div>

        {/* Кнопка действий */}
        {unclaimedQuests.length > 0 && (
          <div className="text-center">
            <Button
              size="sm"
              className="bg-green-500 hover:bg-green-600"
              onClick={handleClaimAllRewards}
              disabled={claimAllMutation.isPending}
            >
              {claimAllMutation.isPending
                ? 'Получение...'
                : `Получить все награды (${unclaimedQuests.length})`}
            </Button>
          </div>
        )}
      </div>
    </Card>
  )
}
