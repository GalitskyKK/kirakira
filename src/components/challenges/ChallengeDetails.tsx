/**
 * Компонент деталей челленджа с лидербордом и управлением
 */

import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Users,
  Target,
  Clock,
  CheckCircle,
  TrendingUp,
  Sparkles,
  Gem,
  ArrowRight,
  Gift,
  Leaf,
} from 'lucide-react'
import { Button, Card } from '@/components/ui'
import { useTelegram } from '@/hooks'
import { useUserSync, useJoinChallenge } from '@/hooks/index.v2'
import { useTelegramId } from '@/hooks/useTelegramId'
import {
  useChallengeDetails,
  useClaimChallengeReward,
} from '@/hooks/queries/useChallengeQueries'
import { useChallengeRewardStore } from '@/stores/challengeRewardStore'
import { ChallengeLeaderboard } from './ChallengeLeaderboard'
import { ChallengeRewardModal } from './ChallengeRewardModal'

interface ChallengeDetailsProps {
  readonly challengeId: string
  readonly onBack?: () => void
}

export function ChallengeDetails({
  challengeId,
  onBack,
}: ChallengeDetailsProps) {
  const { hapticFeedback, showAlert } = useTelegram()

  // Получаем данные пользователя через React Query
  const telegramId = useTelegramId()
  const { data: userData } = useUserSync(telegramId, !!telegramId)
  const currentUser = userData?.user

  // Получаем данные челленджа через React Query
  const {
    data: challengeData,
    isLoading,
    error,
  } = useChallengeDetails(
    challengeId,
    currentUser?.telegramId,
    !!currentUser?.telegramId && !!challengeId
  )

  const currentChallenge = challengeData?.challenge
  const currentLeaderboard = challengeData?.leaderboard ?? []
  const currentProgress = challengeData?.progress
  const currentParticipation = challengeData?.participation

  const [isJoining, setIsJoining] = useState(false)
  const [timeRemaining, setTimeRemaining] = useState<string>('')

  // Мутация для присоединения к челленджу
  const joinChallengeMutation = useJoinChallenge()

  // Хук для получения награды
  const claimRewardMutation = useClaimChallengeReward()

  // Управление модалкой награды
  const { isShowingReward, lastRewards, challengeTitle, hideReward } =
    useChallengeRewardStore()

  // Обновляем таймер
  useEffect(() => {
    if (!currentChallenge) return

    const updateTimer = () => {
      const now = new Date()
      const endDate = new Date(currentChallenge.endDate)
      const diff = endDate.getTime() - now.getTime()

      if (diff <= 0) {
        setTimeRemaining('Завершен')
        return
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24))
      const hours = Math.floor(
        (diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
      )
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))

      if (days > 0) {
        setTimeRemaining(`${days} дн. ${hours} ч.`)
      } else if (hours > 0) {
        setTimeRemaining(`${hours} ч. ${minutes} мин.`)
      } else {
        setTimeRemaining(`${minutes} мин.`)
      }
    }

    updateTimer()
    const interval = setInterval(updateTimer, 60000) // Обновляем каждую минуту

    return () => clearInterval(interval)
  }, [currentChallenge])

  // Присоединение к челленджу
  const handleJoinChallenge = useCallback(async () => {
    if (!currentUser?.telegramId || !currentChallenge) return

    setIsJoining(true)
    hapticFeedback('light')

    try {
      await joinChallengeMutation.mutateAsync({
        telegramId: currentUser.telegramId,
        challengeId: currentChallenge.id,
      })

      showAlert(
        `Отлично! Вы присоединились к челленджу "${currentChallenge.title}"!`
      )
    } catch (error) {
      console.error('Failed to join challenge:', error)
      showAlert('Не удалось присоединиться к челленджу')
    } finally {
      setIsJoining(false)
    }
  }, [
    currentUser,
    currentChallenge,
    showAlert,
    hapticFeedback,
    joinChallengeMutation,
  ])

  // Обновление лидерборда
  const handleRefreshLeaderboard = useCallback(async () => {
    if (!currentUser?.telegramId || !challengeId) return

    hapticFeedback('light')
    // React Query автоматически обновит данные при необходимости
  }, [currentUser?.telegramId, challengeId, hapticFeedback])

  // Получить награду за челлендж
  const handleClaimReward = useCallback(async () => {
    if (!currentUser?.telegramId || !challengeId) return

    hapticFeedback('light')
    try {
      await claimRewardMutation.mutateAsync({
        challengeId,
        telegramId: currentUser.telegramId,
      })
    } catch (error) {
      console.error('Failed to claim challenge reward:', error)
      hapticFeedback('error')
      showAlert('Не удалось получить награду')
    }
  }, [
    currentUser?.telegramId,
    challengeId,
    claimRewardMutation,
    hapticFeedback,
    showAlert,
  ])

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card className="p-6">
          <div className="space-y-4">
            <div className="h-8 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
            <div className="h-4 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
            <div className="h-4 w-2/3 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
          </div>
        </Card>
        <Card className="p-6">
          <div className="h-64 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <Card className="p-6 text-center">
        <div className="space-y-4">
          <div className="text-lg text-red-500">❌</div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
            Ошибка загрузки
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            {error?.message || 'Произошла ошибка'}
          </p>
          {onBack && (
            <Button onClick={onBack} variant="secondary">
              Назад
            </Button>
          )}
        </div>
      </Card>
    )
  }

  if (!currentChallenge) {
    return (
      <Card className="p-6 text-center">
        <div className="space-y-4">
          <div className="text-lg text-gray-400">🔍</div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
            Челлендж не найден
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Запрашиваемый челлендж не существует или был удален.
          </p>
          {onBack && (
            <Button onClick={onBack} variant="secondary">
              Назад
            </Button>
          )}
        </div>
      </Card>
    )
  }

  const isParticipating = !!currentProgress
  const canJoin =
    currentChallenge && currentUser?.telegramId
      ? {
          canJoin:
            !isParticipating && new Date(currentChallenge.endDate) > new Date(),
          reason: isParticipating
            ? 'Вы уже участвуете в этом челлендже'
            : new Date(currentChallenge.endDate) <= new Date()
              ? 'Челлендж завершен'
              : undefined,
        }
      : { canJoin: false, reason: 'Необходима авторизация' }

  return (
    <div className="space-y-6">
      {/* Заголовок челленджа */}
      <Card className="p-6">
        <div className="space-y-4">
          {/* Основная информация */}
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="mb-2 flex items-center space-x-3">
                <span className="text-2xl">{currentChallenge.emoji}</span>
                <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                  {currentChallenge.title}
                </h1>
              </div>
              <p className="text-gray-600 dark:text-gray-400">
                {currentChallenge.description}
              </p>
            </div>
          </div>

          {/* Метрики */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center space-x-2 text-sm">
              <Clock className="h-4 w-4 text-blue-500" />
              <span className="text-gray-600 dark:text-gray-400">
                Осталось:
              </span>
              <span className="font-medium text-gray-900 dark:text-gray-100">
                {timeRemaining}
              </span>
            </div>

            <div className="flex items-center space-x-2 text-sm">
              <Users className="h-4 w-4 text-green-500" />
              <span className="text-gray-600 dark:text-gray-400">
                Участников:
              </span>
              <span className="font-medium text-gray-900 dark:text-gray-100">
                {currentChallenge.participant_count || 0}
              </span>
            </div>

            <div className="flex items-center space-x-2 text-sm">
              <Target className="h-4 w-4 text-purple-500" />
              <span className="text-gray-600 dark:text-gray-400">Цель:</span>
              <span className="font-medium text-gray-900 dark:text-gray-100">
                {currentChallenge.requirements.targetValue}
              </span>
            </div>

            <div className="flex items-center space-x-2 text-sm">
              <Sparkles className="h-4 w-4 text-yellow-500" />
              <span className="text-gray-600 dark:text-gray-400">Тип:</span>
              <span className="font-medium capitalize text-gray-900 dark:text-gray-100">
                {currentChallenge.type === 'competitive'
                  ? 'Соревнование'
                  : currentChallenge.type === 'cooperative'
                    ? 'Сотрудничество'
                    : 'Личный'}
              </span>
            </div>
          </div>

          {/* Награды */}
          {currentChallenge.rewards && (
            <div className="rounded-lg bg-gradient-to-r from-yellow-50 to-amber-50 p-4 dark:from-yellow-900/20 dark:to-amber-900/20">
              <div className="mb-2 flex items-center space-x-2">
                <Gift className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  Награды за выполнение:
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                {typeof currentChallenge.rewards.sprouts === 'number' &&
                  currentChallenge.rewards.sprouts > 0 && (
                    <span className="flex items-center space-x-1 rounded-full bg-white/60 px-3 py-1 text-sm dark:bg-gray-800/60">
                      <Leaf size={16} className="text-green-500" />
                      <span className="font-medium text-gray-900 dark:text-gray-100">
                        {currentChallenge.rewards.sprouts}
                      </span>
                    </span>
                  )}
                {typeof currentChallenge.rewards.gems === 'number' &&
                  currentChallenge.rewards.gems > 0 && (
                    <span className="flex items-center space-x-1 rounded-full bg-white/60 px-3 py-1 text-sm dark:bg-gray-800/60">
                      <Gem size={16} className="text-purple-500" />
                      <span className="font-medium text-gray-900 dark:text-gray-100">
                        {currentChallenge.rewards.gems}
                      </span>
                    </span>
                  )}
                {typeof currentChallenge.rewards.experience === 'number' &&
                  currentChallenge.rewards.experience > 0 && (
                    <span className="flex items-center space-x-1 rounded-full bg-white/60 px-3 py-1 text-sm dark:bg-gray-800/60">
                      <span>⭐</span>
                      <span className="font-medium text-gray-900 dark:text-gray-100">
                        {currentChallenge.rewards.experience}
                      </span>
                    </span>
                  )}
                {currentChallenge.rewards.achievements &&
                  Array.isArray(currentChallenge.rewards.achievements) &&
                  currentChallenge.rewards.achievements.length > 0 && (
                    <span className="flex items-center space-x-1 rounded-full bg-white/60 px-3 py-1 text-sm dark:bg-gray-800/60">
                      <span>🏆</span>
                      <span className="font-medium text-gray-900 dark:text-gray-100">
                        {currentChallenge.rewards.achievements.length}{' '}
                        достижений
                      </span>
                    </span>
                  )}
              </div>
            </div>
          )}

          {/* Прогресс пользователя */}
          {isParticipating && currentProgress && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-lg bg-gradient-to-r from-garden-50 to-green-50 p-4 dark:from-garden-900/20 dark:to-green-900/20"
            >
              {/* Для групповых челленджей показываем общий прогресс команды */}
              {currentChallenge.type === 'cooperative' &&
                currentLeaderboard.length > 0 && (
                  <>
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-sm font-medium text-garden-700 dark:text-garden-300">
                        Прогресс команды
                      </span>
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {currentLeaderboard[0]?.teamProgress || 0} /{' '}
                        {currentChallenge.requirements.targetValue}
                      </span>
                    </div>
                    <div className="mb-2 h-2 w-full rounded-full bg-gray-200 dark:bg-gray-700">
                      <motion.div
                        className="h-2 rounded-full bg-gradient-to-r from-garden-500 to-green-500"
                        initial={{ width: 0 }}
                        animate={{
                          width: `${Math.min(currentLeaderboard[0]?.progressPercentage || 0, 100)}%`,
                        }}
                        transition={{ duration: 1, ease: 'easeOut' }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-garden-600 dark:text-garden-400">
                        {Math.round(
                          currentLeaderboard[0]?.progressPercentage || 0
                        )}
                        % выполнено
                      </span>
                      {currentProgress.isCompleted && (
                        <div className="flex items-center space-x-1 text-green-600 dark:text-green-400">
                          <CheckCircle className="h-3 w-3" />
                          <span>Завершено!</span>
                        </div>
                      )}
                    </div>

                    {/* Ваш вклад в команду */}
                    <div className="mt-3 rounded-lg bg-white/50 p-3 dark:bg-gray-800/50">
                      <div className="mb-1 flex items-center justify-between">
                        <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                          Ваш вклад
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-500">
                          {currentProgress.progress} /{' '}
                          {currentChallenge.requirements.targetValue}
                        </span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-gray-200 dark:bg-gray-700">
                        <motion.div
                          className="h-1.5 rounded-full bg-gradient-to-r from-blue-500 to-purple-500"
                          initial={{ width: 0 }}
                          animate={{
                            width: `${Math.min(currentProgress.progressPercentage, 100)}%`,
                          }}
                          transition={{
                            duration: 1,
                            ease: 'easeOut',
                            delay: 0.5,
                          }}
                        />
                      </div>
                      <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        {Math.round(currentProgress.progressPercentage)}% от
                        цели
                      </div>
                    </div>
                  </>
                )}

              {/* Для личных челленджей показываем обычный прогресс */}
              {currentChallenge.type !== 'cooperative' && (
                <>
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-sm font-medium text-garden-700 dark:text-garden-300">
                      Ваш прогресс
                    </span>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {currentProgress.progress} /{' '}
                      {currentChallenge.requirements.targetValue}
                    </span>
                  </div>
                  <div className="mb-2 h-2 w-full rounded-full bg-gray-200 dark:bg-gray-700">
                    <motion.div
                      className="h-2 rounded-full bg-gradient-to-r from-garden-500 to-green-500"
                      initial={{ width: 0 }}
                      animate={{
                        width: `${Math.min(currentProgress.progressPercentage, 100)}%`,
                      }}
                      transition={{ duration: 1, ease: 'easeOut' }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-garden-600 dark:text-garden-400">
                      {Math.round(currentProgress.progressPercentage)}%
                      выполнено
                    </span>
                    {currentProgress.isCompleted && (
                      <div className="flex items-center space-x-1 text-green-600 dark:text-green-400">
                        <CheckCircle className="h-3 w-3" />
                        <span>Завершено!</span>
                      </div>
                    )}
                  </div>
                </>
              )}
            </motion.div>
          )}

          {/* Кнопки действий */}
          <div className="flex space-x-3">
            {currentParticipation?.canClaimReward && (
              <Button
                onClick={handleClaimReward}
                disabled={claimRewardMutation.isPending}
                className="flex-1 bg-green-500 hover:bg-green-600 dark:bg-green-600 dark:hover:bg-green-700"
              >
                {claimRewardMutation.isPending ? (
                  <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-b-2 border-white" />
                    Получение...
                  </>
                ) : (
                  <>
                    <Gift className="mr-2 h-4 w-4" />
                    Получить награду
                  </>
                )}
              </Button>
            )}

            {!isParticipating &&
              canJoin.canJoin &&
              !currentParticipation?.canClaimReward && (
                <Button
                  onClick={handleJoinChallenge}
                  disabled={isJoining}
                  className="flex-1"
                >
                  {isJoining ? (
                    <>
                      <div className="mr-2 h-4 w-4 animate-spin rounded-full border-b-2 border-white" />
                      Присоединяемся...
                    </>
                  ) : (
                    <>
                      <ArrowRight className="mr-2 h-4 w-4" />
                      Присоединиться
                    </>
                  )}
                </Button>
              )}

            {!isParticipating &&
              !canJoin.canJoin &&
              !currentParticipation?.canClaimReward && (
                <Button disabled className="flex-1">
                  {canJoin.reason || 'Недоступно'}
                </Button>
              )}

            <Button
              onClick={handleRefreshLeaderboard}
              variant="secondary"
              size="sm"
            >
              <TrendingUp className="h-4 w-4" />
            </Button>

            {onBack && (
              <Button onClick={onBack} variant="outline" size="sm">
                Назад
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* Лидерборд */}
      <AnimatePresence mode="wait">
        <motion.div
          key="leaderboard"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
        >
          <ChallengeLeaderboard
            challenge={currentChallenge}
            leaderboard={currentLeaderboard}
            currentUserTelegramId={currentUser?.telegramId || 0}
            isLoading={isLoading}
          />
        </motion.div>
      </AnimatePresence>

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
    </div>
  )
}
