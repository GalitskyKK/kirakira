import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Users, Heart, Sparkles, Zap } from 'lucide-react'
import { useTelegram } from '@/hooks'
import { useUserSync } from '@/hooks/index.v2'
import { useTelegramId } from '@/hooks/useTelegramId'
import { Button, Card } from '@/components/ui'
import { FriendsList } from './FriendsList'
import type { Garden, MoodEntry } from '@/types'

interface TelegramCommunityProps {
  readonly garden: Garden | null
  readonly recentMoods: readonly MoodEntry[]
}

export function TelegramCommunity({ garden: _garden }: TelegramCommunityProps) {
  const { webApp, hapticFeedback, showAlert, isTelegramEnv } = useTelegram()
  const telegramId = useTelegramId()
  const { data: userData } = useUserSync(telegramId, telegramId != null)
  const currentUser = userData?.user

  const [activeTab, setActiveTab] = useState<'social' | 'groups'>('social')

  // Создать групповой сад
  const handleCreateGroupGarden = () => {
    if (!webApp) return

    hapticFeedback('medium')
    showAlert('Выберите группу или чат для создания общего сада!')

    webApp.switchInlineQuery('group_garden_create', ['groups'])
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
    <div className="space-y-4">
      {/* Упрощенные табы - только 2 */}
      <div className="flex space-x-1 rounded-lg bg-gray-100 p-1 dark:bg-gray-800">
        {[
          { id: 'social', label: 'Социальные', icon: Heart },
          { id: 'groups', label: 'Группы', icon: Users },
        ].map(tab => {
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as 'social' | 'groups')}
              className={`flex flex-1 items-center justify-center space-x-2 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-white text-blue-600 shadow-sm dark:bg-gray-700 dark:text-blue-400'
                  : 'text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-gray-100'
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
