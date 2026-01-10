import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { clsx } from 'clsx'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  Home,
  Trophy,
  Users,
  User,
  ChevronLeft,
  ChevronRight,
  type LucideIcon,
} from 'lucide-react'
import { useTelegramId } from '@/hooks/useTelegramId'
import { useDailyQuests } from '@/hooks/queries/useDailyQuestQueries'
import { useChallengeList } from '@/hooks/queries/useChallengeQueries'
import { useTranslation } from '@/hooks/useTranslation'

interface NavItem {
  id: string
  path: string
  label: string
  icon: LucideIcon
}

export function DesktopNavigation() {
  const navigate = useNavigate()
  const location = useLocation()
  const telegramId = useTelegramId()
  const t = useTranslation()

  // Состояние минимизации сайдбара
  const [isCollapsed, setIsCollapsed] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('sidebarCollapsed')
      return saved === 'true'
    }
    return false
  })

  // Сохраняем состояние в localStorage
  useEffect(() => {
    localStorage.setItem('sidebarCollapsed', String(isCollapsed))
  }, [isCollapsed])

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
    ? challengesData.userParticipations.some(p => p.canClaimReward === true)
    : false

  // Есть ли доступные награды (квесты или челленджи)
  const hasAvailableRewards = hasQuestRewards || hasChallengeRewards

  const navItems: NavItem[] = [
    {
      id: 'home',
      path: '/desktop',
      label: 'Главная',
      icon: Home,
    },
    {
      id: 'profile',
      path: '/desktop/profile',
      label: 'Профиль',
      icon: User,
    },
    {
      id: 'challenges',
      path: '/desktop/challenges',
      label: t.quests.challenges || 'Челленджи',
      icon: Trophy,
    },
    {
      id: 'friends',
      path: '/desktop/friends',
      label: 'Друзья',
      icon: Users,
    },
  ]

  const isActive = (path: string) => {
    if (path === '/desktop') {
      return (
        location.pathname === '/desktop' || location.pathname === '/desktop/'
      )
    }
    return location.pathname.startsWith(path)
  }

  return (
    <motion.nav
      className="flex h-full flex-col border-r border-neutral-200/50 bg-white/90 backdrop-blur-xl dark:border-neutral-700/50 dark:bg-neutral-900/90"
      initial={false}
      animate={{ width: isCollapsed ? 80 : 256 }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
    >
      <div className="flex flex-1 flex-col p-4">
        {/* Toggle Button */}
        <div className="mb-4 flex items-center justify-end">
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="rounded-lg p-2 text-neutral-600 transition-colors hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800"
            title={isCollapsed ? 'Развернуть сайдбар' : 'Свернуть сайдбар'}
          >
            {isCollapsed ? (
              <ChevronRight className="h-5 w-5" />
            ) : (
              <ChevronLeft className="h-5 w-5" />
            )}
          </button>
        </div>

        {/* Logo/Header */}
        <AnimatePresence mode="wait">
          {!isCollapsed && (
            <motion.div
              key="header"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
              className="mb-8 px-2"
            >
              <h2 className="text-xl font-bold text-neutral-900 dark:text-neutral-100">
                KiraKira
              </h2>
              <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                {t.garden.yourDigitalGarden || 'Ваш цифровой сад'}
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Navigation Items */}
        <div className="flex flex-1 flex-col space-y-1">
          {navItems.map(item => {
            const Icon = item.icon
            const active = isActive(item.path)
            const showNotification =
              item.id === 'challenges' && hasAvailableRewards

            return (
              <motion.button
                key={item.id}
                onClick={() => navigate(item.path)}
                className={clsx(
                  'group relative flex items-center rounded-xl text-left transition-all',
                  isCollapsed
                    ? 'justify-center px-3 py-3'
                    : 'space-x-3 px-4 py-3',
                  'outline-none focus:ring-2 focus:ring-kira-500 focus:ring-offset-2',
                  active
                    ? 'bg-gradient-to-r from-kira-500/10 to-garden-500/10 text-kira-600 dark:text-kira-400'
                    : 'text-neutral-600 hover:bg-neutral-100/50 dark:text-neutral-400 dark:hover:bg-neutral-800/50'
                )}
                whileHover={isCollapsed ? { scale: 1.05 } : { x: 2 }}
                whileTap={{ scale: 0.98 }}
                title={isCollapsed ? item.label : undefined}
              >
                {/* Icon */}
                <div
                  className={clsx(
                    'flex-shrink-0',
                    active
                      ? 'text-kira-600 dark:text-kira-400'
                      : 'text-neutral-500 group-hover:text-neutral-700 dark:text-neutral-400 dark:group-hover:text-neutral-200'
                  )}
                >
                  <Icon className="h-5 w-5" />
                </div>

                {/* Label */}
                <AnimatePresence mode="wait">
                  {!isCollapsed && (
                    <motion.span
                      key="label"
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: 'auto' }}
                      exit={{ opacity: 0, width: 0 }}
                      transition={{ duration: 0.2 }}
                      className={clsx(
                        'flex-1 overflow-hidden text-sm font-medium',
                        active
                          ? 'text-kira-600 dark:text-kira-400'
                          : 'text-neutral-700 dark:text-neutral-300'
                      )}
                    >
                      {item.label}
                    </motion.span>
                  )}
                </AnimatePresence>

                {/* Notification dot */}
                {showNotification && (
                  <motion.div
                    className={clsx(
                      'rounded-full bg-kira-500',
                      isCollapsed ? 'absolute right-1 top-1 h-2 w-2' : 'h-2 w-2'
                    )}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{
                      type: 'spring',
                      stiffness: 400,
                      damping: 25,
                    }}
                  />
                )}
              </motion.button>
            )
          })}
        </div>
      </div>
    </motion.nav>
  )
}


