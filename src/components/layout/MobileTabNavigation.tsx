import { motion } from 'framer-motion'
import { clsx } from 'clsx'
import { useNavigate, useLocation } from 'react-router-dom'
import { Leaf, Heart, Users, User, Trophy } from 'lucide-react'
import { useTelegramId } from '@/hooks/useTelegramId'
import { useDailyQuests } from '@/hooks/queries/useDailyQuestQueries'
import { useChallengeList } from '@/hooks/queries/useChallengeQueries'

interface Tab {
  id: string
  path: string
  icon: React.ReactNode
  count?: number
}

interface MobileTabNavigationProps {
  className?: string
}

const TABS: Tab[] = [
  {
    id: 'mood',
    path: '/mobile',
    icon: <Heart className="h-5 w-5" />,
  },
  {
    id: 'garden',
    path: '/mobile/garden',
    icon: <Leaf className="h-5 w-5" />,
  },
  {
    id: 'tasks',
    path: '/mobile/tasks',
    icon: <Trophy className="h-5 w-5" />,
  },
  {
    id: 'community',
    path: '/mobile/community',
    icon: <Users className="h-5 w-5" />,
  },
  {
    id: 'profile',
    path: '/mobile/profile',
    icon: <User className="h-5 w-5" />,
  },
]

export function MobileTabNavigation({ className }: MobileTabNavigationProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const telegramId = useTelegramId()

  // Проверяем наличие доступных наград за квесты
  const hasValidTelegramId = telegramId != null && telegramId > 0
  const { data: questsData } = useDailyQuests(
    hasValidTelegramId ? telegramId : 0,
    hasValidTelegramId
  )

  // Проверяем наличие доступных наград за челленджи
  const { data: challengesData } = useChallengeList(
    hasValidTelegramId ? telegramId : undefined,
    hasValidTelegramId
  )

  // Проверяем наличие доступных наград: квесты со статусом 'completed'
  const hasQuestRewards = questsData
    ? questsData.quests.some(quest => quest.status === 'completed')
    : false

  // Проверяем наличие доступных наград за челленджи
  const hasChallengeRewards = challengesData
    ? challengesData.userParticipations.some(
        (p) => p.canClaimReward === true
      )
    : false

  // Есть ли доступные награды (квесты или челленджи)
  const hasAvailableRewards = hasQuestRewards || hasChallengeRewards

  return (
    <div
      className={clsx(
        'border-t border-neutral-200/50 bg-white/90 backdrop-blur-xl',
        'dark:border-neutral-700/50 dark:bg-neutral-900/90',
        'fixed bottom-0 left-0 right-0 z-[9999]',
        'safe-area-inset-bottom',
        className
      )}
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 9999,
        boxShadow:
          '0 -8px 32px -8px rgba(0, 0, 0, 0.02), 0 -2px 8px rgba(0, 0, 0, 0.04)',
      }}
    >
      <div className="flex">
        {TABS.map(tab => {
          const isActive = location.pathname === tab.path
          const showNotification = tab.id === 'tasks' && hasAvailableRewards

          return (
            <motion.button
              key={tab.id}
              className={clsx(
                'flex flex-1 flex-col items-center justify-center',
                'relative min-h-[56px] px-1 py-2',
                'transition-all duration-300',
                'outline-none focus:ring-0 focus:ring-transparent focus-visible:ring-0',
                isActive
                  ? 'text-kira-500 dark:text-kira-400'
                  : 'hover:text-kira-400 dark:hover:text-kira-300 text-neutral-500 dark:text-neutral-400'
              )}
              onClick={() => navigate(tab.path)}
              whileTap={{ scale: 0.95 }}
            >
              {/* Active indicator - упрощенный без анимации */}
              {isActive && (
                <div className="absolute inset-x-0 top-0 flex justify-center">
                  <div 
                    className="h-1.5 w-16 rounded-b-full shadow-lg"
                    style={{
                      background: 'linear-gradient(135deg, #d946ef 0%, #8b5cf6 50%, #d946ef 100%)',
                    }}
                  />
                </div>
              )}

              {/* Icon - без постоянной анимации */}
              <div className="relative mb-1">
                {tab.icon}
              </div>

              {/* No labels - icons only */}

              {/* Count badge - modern minimal */}
              {tab.count !== undefined && (
                <motion.div
                  className={clsx(
                    'absolute -right-1 -top-1',
                    'h-5 w-5 rounded-full',
                    'bg-kira-500 text-xs text-white',
                    'flex items-center justify-center',
                    'font-bold shadow-lg'
                  )}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{
                    type: 'spring',
                    stiffness: 400,
                    damping: 20,
                  }}
                >
                  {tab.count}
                </motion.div>
              )}

              {/* Notification dot - iridescent glow */}
              {showNotification && tab.count === undefined && (
                <motion.div
                  className={clsx(
                    'absolute right-0 top-0',
                    'h-3 w-3 rounded-full',
                    'bg-kira-500 shadow-lg',
                    'ring-2 ring-white dark:ring-neutral-900'
                  )}
                  initial={{ scale: 0 }}
                  animate={{ scale: [0, 1.3, 1] }}
                  transition={{
                    type: 'spring',
                    stiffness: 400,
                    damping: 25,
                    delay: 0.2,
                  }}
                />
              )}

              {/* Ripple effect - только при нажатии, без постоянной заливки */}
              {false && (
                <motion.div
                  className="absolute inset-0 rounded-lg"
                  whileTap={{
                    backgroundColor: 'rgba(217, 70, 239, 0.15)',
                  }}
                  transition={{ duration: 0.2 }}
                />
              )}
            </motion.button>
          )
        })}
      </div>
    </div>
  )
}
