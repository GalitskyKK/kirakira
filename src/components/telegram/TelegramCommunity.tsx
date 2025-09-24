import { useCallback, useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Users,
  Trophy,
  Heart,
  Sparkles,
  Target,
  Zap,
  Calendar,
} from 'lucide-react'
import { useTelegram } from '@/hooks'
import { Button, Card } from '@/components/ui'
import { FriendsList } from './FriendsList'
import { useUserStore } from '@/stores'
import type { Garden, MoodEntry } from '@/types'

interface Challenge {
  id: string
  title: string
  description: string
  emoji: string
  duration: number // в днях
  participants: number
  isActive: boolean
  type: 'personal' | 'group' | 'competitive'
  reward?: string
}

interface TelegramCommunityProps {
  garden: Garden | null
  recentMoods: readonly MoodEntry[]
}

const ACTIVE_CHALLENGES: Challenge[] = [
  {
    id: 'mood_streak_7',
    title: '7 дней эмоций',
    description: 'Отмечайте настроение каждый день в течение недели',
    emoji: '🔥',
    duration: 7,
    participants: 42,
    isActive: true,
    type: 'personal',
    reward: 'Особый элемент сада',
  },
  {
    id: 'garden_competition',
    title: 'Битва садов',
    description: 'Соревнование: кто вырастит больше элементов за неделю?',
    emoji: '🏆',
    duration: 7,
    participants: 18,
    isActive: true,
    type: 'competitive',
    reward: 'Титул "Садовник недели"',
  },
  {
    id: 'mindfulness_week',
    title: 'Неделя осознанности',
    description: 'Групповая практика: каждый день новое упражнение',
    emoji: '🧘‍♀️',
    duration: 7,
    participants: 156,
    isActive: true,
    type: 'group',
    reward: 'Групповое достижение',
  },
]

// Реакции перенесены в FriendsList компонент

export function TelegramCommunity({
  garden,
  recentMoods,
}: TelegramCommunityProps) {
  const { webApp, hapticFeedback, showAlert, isTelegramEnv } = useTelegram()
  const { currentUser } = useUserStore()
  const [activeTab, setActiveTab] = useState<
    'challenges' | 'social' | 'groups'
  >('challenges')
  const [joinedChallenges, setJoinedChallenges] = useState<string[]>([])

  // Загружаем информацию о присоединенных челленджах
  useEffect(() => {
    // Здесь можно загрузить данные о челленджах пользователя
    // Пока используем mock данные
    setJoinedChallenges(['mood_streak_7'])
  }, [])

  // Присоединиться к челленджу
  const handleJoinChallenge = useCallback(
    (challenge: Challenge) => {
      if (!webApp) return

      hapticFeedback('light')

      // Используем inline query для приглашения друзей к челленджу
      webApp.switchInlineQuery(
        `challenge_${challenge.id}`,
        challenge.type === 'group' ? ['groups', 'users'] : ['users']
      )

      // Локально отмечаем что присоединились
      setJoinedChallenges(prev => [...prev, challenge.id])
      showAlert(`Отлично! Вы присоединились к челленджу "${challenge.title}"!`)
    },
    [webApp, hapticFeedback, showAlert]
  )

  // Поделиться своим прогрессом
  const handleShareProgress = useCallback(
    (challenge: Challenge) => {
      if (!webApp || !garden) return

      hapticFeedback('medium')

      const progressText = `🎯 Мой прогресс в челленже "${challenge.title}"\n\n🌱 Элементов в саду: ${garden.elements.length}\n📈 Дней подряд: ${recentMoods.length}\n\n💪 Присоединяйтесь к KiraKira!`

      webApp.shareMessage({
        text: progressText,
        parse_mode: 'Markdown',
      })
    },
    [webApp, hapticFeedback, garden, recentMoods]
  )

  // Создать групповой сад
  const handleCreateGroupGarden = useCallback(() => {
    if (!webApp) return

    hapticFeedback('medium')
    showAlert('Выберите группу или чат для создания общего сада!')

    webApp.switchInlineQuery('group_garden_create', ['groups'])
  }, [webApp, hapticFeedback, showAlert])

  // Реакции теперь обрабатываются в FriendsList компоненте

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
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex flex-1 items-center justify-center space-x-2 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-white text-blue-600 shadow-sm dark:bg-gray-700 dark:text-blue-400'
                  : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200'
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

            {ACTIVE_CHALLENGES.map((challenge, index) => (
              <motion.div
                key={challenge.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="p-4">
                  <div className="flex items-start space-x-4">
                    <div className="text-3xl">{challenge.emoji}</div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center space-x-2">
                        <h4 className="font-semibold">{challenge.title}</h4>
                        <span
                          className={`rounded-full px-2 py-1 text-xs ${
                            challenge.type === 'competitive'
                              ? 'bg-red-100 text-red-700'
                              : challenge.type === 'group'
                                ? 'bg-blue-100 text-blue-700'
                                : 'bg-green-100 text-green-700'
                          }`}
                        >
                          {challenge.type === 'competitive'
                            ? 'Соревнование'
                            : challenge.type === 'group'
                              ? 'Групповой'
                              : 'Личный'}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-gray-600">
                        {challenge.description}
                      </p>
                      <div className="mt-2 flex items-center space-x-4 text-xs text-gray-500">
                        <span className="flex items-center space-x-1">
                          <Users className="h-3 w-3" />
                          <span>{challenge.participants} участников</span>
                        </span>
                        <span className="flex items-center space-x-1">
                          <Calendar className="h-3 w-3" />
                          <span>{challenge.duration} дней</span>
                        </span>
                        {challenge.reward && (
                          <span className="flex items-center space-x-1">
                            <Trophy className="h-3 w-3" />
                            <span>{challenge.reward}</span>
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col space-y-2">
                      {joinedChallenges.includes(challenge.id) ? (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            className="bg-green-50 text-green-700 hover:bg-green-100"
                            disabled
                          >
                            Участвую ✓
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleShareProgress(challenge)}
                          >
                            Поделиться
                          </Button>
                        </>
                      ) : (
                        <Button
                          size="sm"
                          onClick={() => handleJoinChallenge(challenge)}
                          className="bg-blue-500 hover:bg-blue-600"
                        >
                          Участвовать
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
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
            <FriendsList currentUser={currentUser} />
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
