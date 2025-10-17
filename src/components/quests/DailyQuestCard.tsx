/**
 * 🎯 DAILY QUEST CARD COMPONENT
 * Компонент карточки ежедневного задания
 */

import { motion } from 'framer-motion'
import {
  useClaimDailyQuest,
  useUpdateQuestProgress,
} from '@/hooks/queries/useDailyQuestQueries'
import { useDailyQuestStore } from '@/stores/dailyQuestStore'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { ProgressBar } from '@/components/ui/ProgressBar'
import {
  getQuestProgress,
  isQuestCompleted,
  canClaimQuest,
  getQuestDescription,
  getQuestStatusInfo,
  getQuestTimeRemaining,
  formatTimeRemaining,
  formatQuestRewards,
} from '@/types/dailyQuests'
import type { DailyQuest } from '@/types/dailyQuests'

interface DailyQuestCardProps {
  readonly quest: DailyQuest
  readonly telegramId: number
  readonly className?: string
}

export function DailyQuestCard({
  quest,
  telegramId,
  className = '',
}: DailyQuestCardProps) {
  const { selectQuest, openQuestModal, showRewardAnimation } =
    useDailyQuestStore()
  const claimMutation = useClaimDailyQuest()
  const updateMutation = useUpdateQuestProgress()

  // Вычисляем данные квеста
  const progress = getQuestProgress(quest)
  const isCompleted = isQuestCompleted(quest)
  const canClaim = canClaimQuest(quest)
  const description = getQuestDescription(quest)
  const statusInfo = getQuestStatusInfo(quest.status)
  const timeRemaining = getQuestTimeRemaining(quest)
  const timeRemainingText = formatTimeRemaining(quest.expiresAt)
  const rewardsText = formatQuestRewards(quest.rewards)

  // Обработчики
  const handleClaimReward = async () => {
    try {
      const result = await claimMutation.mutateAsync({
        telegramId,
        questId: quest.id,
      })

      // Показываем анимацию награды
      showRewardAnimation(result.rewards)

      // Закрываем модалку через 3 секунды
      setTimeout(() => {
        // hideRewardAnimation будет вызван автоматически
      }, 3000)
    } catch (error) {
      console.error('Claim reward error:', error)
    }
  }

  const handleQuestClick = () => {
    selectQuest(quest.id)
    openQuestModal()
  }

  const handleUpdateProgress = async () => {
    try {
      await updateMutation.mutateAsync({
        telegramId,
        questId: quest.id,
        increment: 1,
      })
    } catch (error) {
      console.error('Update progress error:', error)
    }
  }

  // Определяем цвет карточки на основе статуса
  const getCardColor = () => {
    switch (quest.status) {
      case 'completed':
        return 'border-green-200 bg-green-50'
      case 'claimed':
        return 'border-purple-200 bg-purple-50'
      case 'expired':
        return 'border-red-200 bg-red-50'
      default:
        return 'border-gray-200 bg-white'
    }
  }

  // Определяем цвет прогресс-бара
  const getProgressColor = () => {
    if (quest.status === 'expired') return 'bg-red-500'
    if (quest.status === 'claimed') return 'bg-purple-500'
    if (isCompleted) return 'bg-green-500'
    return 'bg-blue-500'
  }

  return (
    <motion.div
      className={`${className}`}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.2 }}
    >
      <Card
        className={`cursor-pointer p-4 transition-all duration-200 ${getCardColor()}`}
        onClick={handleQuestClick}
      >
        <div className="space-y-3">
          {/* Заголовок и статус */}
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              <div className="text-2xl">{quest.metadata?.emoji || '🎯'}</div>
              <div>
                <h3 className="font-semibold text-gray-900">
                  {quest.metadata?.name || 'Задание'}
                </h3>
                <p className="text-sm text-gray-600">{description}</p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <span
                className={`rounded-full px-2 py-1 text-sm ${statusInfo.color} bg-opacity-20`}
              >
                {statusInfo.emoji} {statusInfo.name}
              </span>
            </div>
          </div>

          {/* Прогресс */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Прогресс</span>
              <span className="font-medium">
                {quest.currentProgress} / {quest.targetValue}
              </span>
            </div>

            <ProgressBar
              value={progress}
              max={100}
              className="h-2"
              color={getProgressColor()}
            />

            <div className="text-xs text-gray-500">{progress}% выполнено</div>
          </div>

          {/* Награды */}
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              <span className="font-medium">Награда:</span> {rewardsText}
            </div>

            {timeRemaining > 0 && (
              <div className="text-xs text-gray-500">
                Осталось: {timeRemainingText}
              </div>
            )}
          </div>

          {/* Действия */}
          <div className="flex items-center justify-between pt-2">
            <div className="flex space-x-2">
              {quest.status === 'active' &&
                quest.currentProgress < quest.targetValue && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={e => {
                      e.stopPropagation()
                      handleUpdateProgress()
                    }}
                    disabled={updateMutation.isPending}
                  >
                    {updateMutation.isPending ? 'Обновление...' : 'Обновить'}
                  </Button>
                )}
            </div>

            {canClaim && (
              <Button
                size="sm"
                onClick={e => {
                  e.stopPropagation()
                  handleClaimReward()
                }}
                disabled={claimMutation.isPending}
                className="bg-green-500 hover:bg-green-600"
              >
                {claimMutation.isPending ? 'Получение...' : 'Получить награду'}
              </Button>
            )}

            {quest.status === 'claimed' && (
              <div className="text-sm font-medium text-green-600">
                ✅ Награда получена
              </div>
            )}

            {quest.status === 'expired' && (
              <div className="text-sm font-medium text-red-600">
                ⏰ Время истекло
              </div>
            )}
          </div>
        </div>
      </Card>
    </motion.div>
  )
}
