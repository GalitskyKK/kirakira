import { useCallback, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Users,
  Trophy,
  Heart,
  Sparkles,
  Target,
  Zap,
  Eye,
  Clock,
  CheckCircle,
} from 'lucide-react'
import { useTelegram } from '@/hooks'
import { useUserSync } from '@/hooks/index.v2'
import { useTelegramId } from '@/hooks/useTelegramId'
// import { useChallengeIntegration } from '@/hooks/useChallengeIntegration'
import { Button, Card } from '@/components/ui'
import { FriendsList } from './FriendsList'
import { ChallengeDetails } from '@/components/challenges/ChallengeDetails'
import { useChallengeList } from '@/hooks/queries/useChallengeQueries'
import type { Garden, MoodEntry, Challenge } from '@/types'

interface TelegramCommunityProps {
  readonly garden: Garden | null
  readonly recentMoods: readonly MoodEntry[]
}

export function TelegramCommunity({ garden }: TelegramCommunityProps) {
  const { webApp, hapticFeedback, showAlert, isTelegramEnv } = useTelegram()
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

  // TODO: Интеграция с реальными данными требует миграции useChallengeIntegration
  // useChallengeIntegration()

  const [activeTab, setActiveTab] = useState<
    'challenges' | 'social' | 'groups'
  >('challenges')
  const [selectedChallengeId, setSelectedChallengeId] = useState<string | null>(
    null
  )

  // Открыть детали челленджа
  const handleViewChallenge = useCallback(
    (challengeId: string) => {
      hapticFeedback('light')
      setSelectedChallengeId(challengeId)
    },
    [hapticFeedback]
  )

  // Поделиться прогрессом
  const handleShareProgress = useCallback(
    (challengeId: string) => {
      if (!webApp || !garden) return

      const challenge = activeChallenges.find(
        (c: Challenge) => c.id === challengeId
      )
      if (!challenge) return

      const participation = challengesData?.userParticipations.find(
        (p: any) => p.challengeId === challengeId
      )

      if (!challenge || !participation) return

      hapticFeedback('medium')

      const progressText = `🎯 Мой прогресс в челленже "${challenge.title}"\n\n📊 Прогресс: ${participation.currentProgress}/${challenge.requirements.targetValue}\n🌱 Элементов в саду: ${garden.elements.length}\n🔥 Текущий стрик: ${currentUser?.stats.currentStreak || 0}\n\n💪 Присоединяйтесь к KiraKira!`

      webApp.shareMessage({
        text: progressText,
        parse_mode: 'Markdown',
      })
    },
    [
      webApp,
      hapticFeedback,
      garden,
      activeChallenges,
      challengesData,
      currentUser,
    ]
  )

  // Создать групповой сад
  const handleCreateGroupGarden = useCallback(() => {
    if (!webApp) return

    hapticFeedback('medium')
    showAlert('Выберите группу или чат для создания общего сада!')

    webApp.switchInlineQuery('group_garden_create', ['groups'])
  }, [webApp, hapticFeedback, showAlert])

  // Если выбран конкретный челлендж, показываем его детали
  if (selectedChallengeId) {
    return (
      <ChallengeDetails
        challengeId={selectedChallengeId}
        onBack={() => setSelectedChallengeId(null)}
      />
    )
  }

  if (!isTelegramEnv) {
    return (
      <Card className="p-6 text-center">
        <Users className="mx-auto mb-4 h-12 w-12 text-blue-500" />
        <h3 className="mb-2 text-lg font-semibold">Комьюнити</h3>
        <p className="text-gray-600">
          Социальные функции доступны только в Telegram Mini App
        </p>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Заголовок */}
      <div className="text-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200 }}
          className="mb-4"
        >
          <Users className="mx-auto h-16 w-16 text-blue-500" />
        </motion.div>
        <h2 className="mb-2 text-2xl font-bold">Комьюнити</h2>
        <p className="text-gray-600">
          Делитесь эмоциями, участвуйте в челленджах, поддерживайте друзей
        </p>
      </div>

      {/* Табы */}
      <div className="flex space-x-1 rounded-lg bg-gray-100 p-1 dark:bg-gray-800">
        {[
          { id: 'challenges', label: 'Челленджи', icon: Target },
          { id: 'social', label: 'Социальные', icon: Heart },
          { id: 'groups', label: 'Группы', icon: Users },
        ].map(tab => {
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              onClick={() =>
                setActiveTab(tab.id as 'challenges' | 'social' | 'groups')
              }
              className={`flex flex-1 items-center justify-center space-x-1 rounded-md px-2 py-2 text-xs font-medium transition-colors sm:space-x-2 sm:px-3 sm:text-sm ${
                activeTab === tab.id
                  ? 'bg-white text-blue-600 shadow-sm dark:bg-gray-700 dark:text-blue-400'
                  : 'text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-gray-100'
              }`}
            >
              <Icon className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden xs:inline sm:inline">{tab.label}</span>
            </button>
          )
        })}
      </div>

      {/* Контент табов */}
      <AnimatePresence mode="wait">
        {activeTab === 'challenges' && (
          <motion.div
            key="challenges"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-4"
          >
            <div className="mb-4 text-center">
              <h3 className="text-lg font-semibold">Активные челленджи</h3>
              <p className="text-sm text-gray-600">
                Участвуйте в вызовах и достигайте целей вместе с друзьями
              </p>
            </div>

            {isLoading && (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <Card key={i} className="p-4">
                    <div className="space-y-3">
                      <div className="h-6 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
                      <div className="h-4 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
                      <div className="h-4 w-2/3 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
                    </div>
                  </Card>
                ))}
              </div>
            )}

            {error && (
              <Card className="p-4 text-center">
                <div className="text-sm text-red-500">
                  ❌ {error.message || 'Произошла ошибка'}
                </div>
              </Card>
            )}

            {!isLoading && !error && activeChallenges.length === 0 && (
              <Card className="p-6 text-center">
                <Target className="mx-auto mb-4 h-12 w-12 text-gray-400" />
                <h3 className="mb-2 text-lg font-medium">
                  Нет активных челленджей
                </h3>
                <p className="text-gray-600">
                  Новые вызовы появятся скоро. Следите за обновлениями!
                </p>
              </Card>
            )}

            {!isLoading &&
              activeChallenges.map((challenge: Challenge, index: number) => {
                const isParticipating = challengesData?.userParticipations.some(
                  (p: any) => p.challengeId === challenge.id
                )
                const participation = challengesData?.userParticipations.find(
                  (p: any) => p.challengeId === challenge.id
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
                  Math.floor(
                    (timeRemaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
                  )
                )

                return (
                  <motion.div
                    key={challenge.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card className="p-3 sm:p-4">
                      <div className="space-y-3">
                        {/* Верхняя часть: иконка, заголовок и тип */}
                        <div className="flex items-start space-x-3">
                          <div className="text-2xl sm:text-3xl">
                            {challenge.emoji}
                          </div>
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
                          </div>
                        )}

                        {/* Статистика */}
                        <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                          <span className="flex items-center space-x-1">
                            <Clock className="h-3 w-3" />
                            <span>
                              {daysLeft > 0
                                ? `${daysLeft} дн.`
                                : `${hoursLeft} ч.`}
                            </span>
                          </span>
                          <span className="flex items-center space-x-1">
                            <Target className="h-3 w-3" />
                            <span>
                              Цель: {challenge.requirements.targetValue}
                            </span>
                          </span>
                          {challenge.rewards.title && (
                            <span className="flex items-center space-x-1">
                              <Trophy className="h-3 w-3" />
                              <span className="truncate">
                                {challenge.rewards.title}
                              </span>
                            </span>
                          )}
                        </div>

                        {/* Кнопки действий */}
                        <div className="flex justify-end space-x-2 border-t border-gray-100 pt-2 dark:border-gray-700">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleViewChallenge(challenge.id)}
                          >
                            <Eye className="mr-1 h-3 w-3" />
                            <span className="text-xs">Детали</span>
                          </Button>

                          {isParticipating ? (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleShareProgress(challenge.id)}
                              className="dark:border-gray-600 dark:hover:bg-gray-700"
                            >
                              <span className="text-xs">Поделиться</span>
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              onClick={() => handleViewChallenge(challenge.id)}
                              className="bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700"
                            >
                              <span className="text-xs">Участвовать</span>
                            </Button>
                          )}
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                )
              })}
          </motion.div>
        )}

        {activeTab === 'social' && (
          <motion.div
            key="social"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-4"
          >
            {/* Полная система друзей */}
            <FriendsList currentUser={currentUser ?? null} />
          </motion.div>
        )}

        {activeTab === 'groups' && (
          <motion.div
            key="groups"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-4"
          >
            <div className="mb-4 text-center">
              <h3 className="text-lg font-semibold">Групповые активности</h3>
              <p className="text-sm text-gray-600">
                Создавайте совместные сады и групповые челленджи
              </p>
            </div>

            {/* Создать групповой сад */}
            <Card className="p-4">
              <div className="flex items-center space-x-4">
                <div className="flex-shrink-0 rounded-lg bg-purple-100 p-3 dark:bg-purple-900/30">
                  <Sparkles className="h-6 w-6 text-purple-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="font-medium">Создать групповой сад</h4>
                  <p className="text-sm text-gray-600">
                    Пригласите семью или друзей создать общий эмоциональный сад
                  </p>
                </div>
                <Button
                  onClick={handleCreateGroupGarden}
                  className="flex-shrink-0 bg-purple-500 hover:bg-purple-600"
                >
                  Создать
                </Button>
              </div>
            </Card>

            {/* Информация о групповых функциях */}
            <Card className="border-dashed p-4">
              <div className="text-center">
                <Zap className="mx-auto mb-3 h-8 w-8 text-yellow-500" />
                <h4 className="mb-2 font-medium">Скоро появится!</h4>
                <p className="text-sm text-gray-600">
                  Мы работаем над групповыми садами, семейными челленджами и
                  совместной статистикой
                </p>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
