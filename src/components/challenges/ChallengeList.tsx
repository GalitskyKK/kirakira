import { useCallback, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Trophy, Clock, CheckCircle, Gift } from 'lucide-react'
import { useTelegram } from '@/hooks'
import { useUserSync } from '@/hooks/index.v2'
import { useTelegramId } from '@/hooks/useTelegramId'
import { useChallengeRewardStore } from '@/stores/challengeRewardStore'
import { useClaimChallengeReward } from '@/hooks/queries/useChallengeQueries'
import { Button, Card } from '@/components/ui'
import { ChallengeDetails } from './ChallengeDetails'
import { ChallengeRewardModal } from './ChallengeRewardModal'
import { useChallengeList } from '@/hooks/queries/useChallengeQueries'
import type { Garden, Challenge } from '@/types'
import type { ChallengeParticipant } from '@/types/challenges'

interface ChallengeListProps {
  readonly garden: Garden | null
}

export function ChallengeList({ garden: _garden }: ChallengeListProps) {
  const { hapticFeedback } = useTelegram()
  const telegramId = useTelegramId()
  const { data: userData } = useUserSync(telegramId, !!telegramId)
  const currentUser = userData?.user

  // Загружаем активные челленджи через React Query
  const {
    data: challengesData,
    isLoading,
    error,
  } = useChallengeList(currentUser?.telegramId, !!currentUser?.telegramId)

  // Извлекаем челленджи из результата и фильтруем только активные
  const activeChallenges = (challengesData?.challenges ?? []).filter(
    (c: Challenge) => c.status === 'active'
  )

  const [selectedChallengeId, setSelectedChallengeId] = useState<string | null>(
    null
  )

  // Управление модалкой награды
  const { isShowingReward, lastRewards, challengeTitle, hideReward } =
    useChallengeRewardStore()

  // Хук для получения награды
  const claimRewardMutation = useClaimChallengeReward()

  // Открыть детали челленджа
  const handleViewChallenge = useCallback(
    (challengeId: string) => {
      hapticFeedback('light')
      setSelectedChallengeId(challengeId)
    },
    [hapticFeedback]
  )

  // Получить награду за челлендж
  const handleClaimReward = useCallback(
    async (challengeId: string) => {
      if (!currentUser?.telegramId) return

      hapticFeedback('light')
      try {
        await claimRewardMutation.mutateAsync({
          challengeId,
          telegramId: currentUser.telegramId,
        })
      } catch (error) {
        console.error('Failed to claim challenge reward:', error)
        hapticFeedback('error')
      }
    },
    [currentUser?.telegramId, claimRewardMutation, hapticFeedback]
  )

  // Если выбран конкретный челлендж, показываем его детали
  if (selectedChallengeId) {
    return (
      <ChallengeDetails
        challengeId={selectedChallengeId}
        onBack={() => setSelectedChallengeId(null)}
      />
    )
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i} className="p-4">
            <div className="space-y-3">
              <div className="h-6 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
              <div className="h-4 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
              <div className="h-4 w-2/3 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
            </div>
          </Card>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <Card className="p-4 text-center">
        <div className="text-sm text-red-500">
          ❌ {error.message || 'Произошла ошибка'}
        </div>
      </Card>
    )
  }

  if (activeChallenges.length === 0) {
    return (
      <Card className="p-6 text-center">
        <Trophy className="mx-auto mb-4 h-12 w-12 text-gray-400" />
        <h3 className="mb-2 text-lg font-medium text-gray-900 dark:text-gray-100">
          Нет активных челленджей
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          Новые вызовы появятся скоро. Следите за обновлениями!
        </p>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {activeChallenges.map((challenge: Challenge, index: number) => {
        const isParticipating = challengesData?.userParticipations.some(
          (p: ChallengeParticipant) => p.challengeId === challenge.id
        )
        const participation = challengesData?.userParticipations.find(
          (p: ChallengeParticipant) => p.challengeId === challenge.id
        )

        // Подсчитываем время до окончания
        const timeRemaining =
          new Date(challenge.endDate).getTime() - new Date().getTime()
        const daysLeft = Math.max(
          0,
          Math.floor(timeRemaining / (1000 * 60 * 60 * 24))
        )
        const hoursLeft = Math.max(
          0,
          Math.floor((timeRemaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
        )

        return (
          <motion.div
            key={challenge.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card
              className="cursor-pointer p-3 transition-all hover:shadow-lg sm:p-4"
              onClick={() => handleViewChallenge(challenge.id)}
            >
              <div className="space-y-3">
                {/* Верхняя часть: иконка, заголовок и тип */}
                <div className="flex items-start space-x-3">
                  <div className="text-2xl sm:text-3xl">{challenge.emoji}</div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center space-x-2">
                      <h4 className="truncate text-sm font-semibold sm:text-base">
                        {challenge.title}
                      </h4>
                      <span
                        className={`shrink-0 rounded-full px-2 py-1 text-xs ${
                          challenge.type === 'competitive'
                            ? 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400'
                            : challenge.type === 'cooperative'
                              ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400'
                              : 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400'
                        }`}
                      >
                        {challenge.type === 'competitive'
                          ? 'Соревн.'
                          : challenge.type === 'cooperative'
                            ? 'Группа'
                            : 'Личный'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Описание */}
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {challenge.description}
                </p>

                {/* Прогресс пользователя */}
                {isParticipating && participation && (
                  <div className="rounded-lg bg-gradient-to-r from-garden-50 to-green-50 p-3 dark:from-garden-900/20 dark:to-green-900/20">
                    {/* Для групповых челленджей показываем общий прогресс команды */}
                    {challenge.type === 'cooperative' &&
                    participation.teamProgress !== undefined ? (
                      <>
                        <div className="mb-2 flex items-center justify-between">
                          <span className="text-sm font-medium text-garden-700 dark:text-garden-300">
                            Прогресс команды
                          </span>
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            {participation.teamProgress} /{' '}
                            {challenge.requirements.targetValue}
                          </span>
                        </div>
                        <div className="mb-1 h-2 w-full rounded-full bg-gray-200 dark:bg-gray-700">
                          <div
                            className="h-2 rounded-full bg-gradient-to-r from-garden-500 to-green-500 transition-all duration-500"
                            style={{
                              width: `${Math.min(
                                (participation.teamProgress /
                                  challenge.requirements.targetValue) *
                                  100,
                                100
                              )}%`,
                            }}
                          />
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-garden-600 dark:text-garden-400">
                            {Math.round(
                              (participation.teamProgress /
                                challenge.requirements.targetValue) *
                                100
                            )}
                            % выполнено
                          </span>
                          {participation.status === 'completed' && (
                            <div className="flex items-center space-x-1 text-green-600 dark:text-green-400">
                              <CheckCircle className="h-3 w-3" />
                              <span>Завершено!</span>
                            </div>
                          )}
                        </div>
                      </>
                    ) : (
                      /* Для личных челленджей показываем обычный прогресс */
                      <>
                        <div className="mb-2 flex items-center justify-between">
                          <span className="text-sm font-medium text-garden-700 dark:text-garden-300">
                            Ваш прогресс
                          </span>
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            {participation.currentProgress} /{' '}
                            {challenge.requirements.targetValue}
                          </span>
                        </div>
                        <div className="mb-1 h-2 w-full rounded-full bg-gray-200 dark:bg-gray-700">
                          <div
                            className="h-2 rounded-full bg-gradient-to-r from-garden-500 to-green-500 transition-all duration-500"
                            style={{
                              width: `${Math.min(
                                (participation.currentProgress /
                                  challenge.requirements.targetValue) *
                                  100,
                                100
                              )}%`,
                            }}
                          />
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-garden-600 dark:text-garden-400">
                            {Math.round(
                              (participation.currentProgress /
                                challenge.requirements.targetValue) *
                                100
                            )}
                            % выполнено
                          </span>
                          {participation.status === 'completed' && (
                            <div className="flex items-center space-x-1 text-green-600 dark:text-green-400">
                              <CheckCircle className="h-3 w-3" />
                              <span>Завершено!</span>
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                )}

                {/* Статистика */}
                <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                  <span className="flex items-center space-x-1">
                    <Clock className="h-3 w-3" />
                    <span>
                      {daysLeft > 0 ? `${daysLeft} дн.` : `${hoursLeft} ч.`}
                    </span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <Trophy className="h-3 w-3" />
                    <span>Цель: {challenge.requirements.targetValue}</span>
                  </span>
                  {/* {challenge.rewards && (
                    <span className="flex items-center space-x-1">
                      <Gift className="h-3 w-3" />
                      <span className="truncate">
                        {challenge.rewards.sprouts
                          ? `🌱 ${challenge.rewards.sprouts}`
                          : challenge.rewards.gems
                            ? `💎 ${challenge.rewards.gems}`
                            : challenge.rewards.experience
                              ? `⭐ ${challenge.rewards.experience} опыта`
                              : 'Награда'}
                      </span>
                    </span>
                  )} */}
                </div>

                {/* Кнопка получения награды (если завершено) */}
                {isParticipating && participation?.canClaimReward && (
                  <div className="flex justify-end border-t border-gray-100 pt-2 dark:border-gray-700">
                    <Button
                      size="sm"
                      onClick={e => {
                        e.stopPropagation()
                        handleClaimReward(challenge.id)
                      }}
                      disabled={claimRewardMutation.isPending}
                      className="bg-green-500 hover:bg-green-600 dark:bg-green-600 dark:hover:bg-green-700"
                    >
                      <Gift className="mr-1 h-3 w-3" />
                      <span className="text-xs">
                        {claimRewardMutation.isPending
                          ? 'Получение...'
                          : 'Получить награду'}
                      </span>
                    </Button>
                  </div>
                )}
              </div>
            </Card>
          </motion.div>
        )
      })}

      {/* Модалка награды за челлендж */}
      <AnimatePresence>
        {isShowingReward && lastRewards && challengeTitle && (
          <ChallengeRewardModal
            rewards={lastRewards}
            challengeTitle={challengeTitle}
            isOpen={isShowingReward}
            onClose={hideReward}
          />
        )}
      </AnimatePresence>

      {/* Детали челленджа */}
      {selectedChallengeId && (
        <ChallengeDetails
          challengeId={selectedChallengeId}
          onBack={() => setSelectedChallengeId(null)}
        />
      )}
    </div>
  )
}
