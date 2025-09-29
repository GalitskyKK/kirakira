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
  ArrowRight,
} from 'lucide-react'
import { Button, Card } from '@/components/ui'
import { useTelegram } from '@/hooks'
import { useChallengeStore } from '@/stores/challengeStore'
import { useUserStore } from '@/stores'
import { ChallengeLeaderboard } from './ChallengeLeaderboard'

interface ChallengeDetailsProps {
  readonly challengeId: string
  readonly onBack?: () => void
}

export function ChallengeDetails({
  challengeId,
  onBack,
}: ChallengeDetailsProps) {
  const { hapticFeedback, showAlert } = useTelegram()
  const { currentUser } = useUserStore()
  const {
    currentChallenge,
    currentLeaderboard,
    currentProgress,
    isLoading,
    error,
    loadChallengeDetails,
    joinChallenge,
    refreshLeaderboard,
    isUserParticipating,
    canJoinChallenge,
  } = useChallengeStore()

  const [isJoining, setIsJoining] = useState(false)
  const [timeRemaining, setTimeRemaining] = useState<string>('')

  // Загружаем детали челленджа
  useEffect(() => {
    if (currentUser?.telegramId && challengeId) {
      void loadChallengeDetails(challengeId, currentUser.telegramId)
    }
  }, [challengeId, currentUser?.telegramId, loadChallengeDetails])

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

    const { canJoin, reason } = canJoinChallenge(
      currentChallenge,
      currentUser.telegramId
    )
    if (!canJoin) {
      showAlert(reason || 'Невозможно присоединиться к челленджу')
      return
    }

    setIsJoining(true)
    hapticFeedback('light')

    try {
      const success = await joinChallenge(
        currentChallenge.id,
        currentUser.telegramId
      )
      if (success) {
        showAlert(
          `Отлично! Вы присоединились к челленджу "${currentChallenge.title}"!`
        )
        // Перезагружаем детали для получения актуального лидерборда
        await loadChallengeDetails(currentChallenge.id, currentUser.telegramId)
      }
    } catch (error) {
      console.error('Failed to join challenge:', error)
    } finally {
      setIsJoining(false)
    }
  }, [
    currentUser,
    currentChallenge,
    canJoinChallenge,
    showAlert,
    hapticFeedback,
    joinChallenge,
    loadChallengeDetails,
  ])

  // Обновление лидерборда
  const handleRefreshLeaderboard = useCallback(async () => {
    if (!currentUser?.telegramId || !challengeId) return

    hapticFeedback('light')
    await refreshLeaderboard(challengeId, currentUser.telegramId)
  }, [currentUser?.telegramId, challengeId, refreshLeaderboard, hapticFeedback])

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
          <p className="text-gray-600 dark:text-gray-400">{error}</p>
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

  const isParticipating = currentUser
    ? isUserParticipating(currentChallenge.id)
    : false
  const canJoin =
    currentUser && currentUser.telegramId
      ? canJoinChallenge(currentChallenge, currentUser.telegramId)
      : { canJoin: false }

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
                {currentLeaderboard.length}
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

          {/* Прогресс пользователя */}
          {isParticipating && currentProgress && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-lg bg-gradient-to-r from-garden-50 to-green-50 p-4 dark:from-garden-900/20 dark:to-green-900/20"
            >
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
                  {Math.round(currentProgress.progressPercentage)}% выполнено
                </span>
                {currentProgress.isCompleted && (
                  <div className="flex items-center space-x-1 text-green-600 dark:text-green-400">
                    <CheckCircle className="h-3 w-3" />
                    <span>Завершено!</span>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* Кнопки действий */}
          <div className="flex space-x-3">
            {!isParticipating && canJoin.canJoin && (
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

            {!isParticipating && !canJoin.canJoin && (
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
    </div>
  )
}
