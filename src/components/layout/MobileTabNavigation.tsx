import { motion } from 'framer-motion'
import { clsx } from 'clsx'
import { useNavigate, useLocation } from 'react-router-dom'
import { Leaf, Heart, Users, User, Trophy } from 'lucide-react'

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
  return (
    <div
      className={clsx(
        'border-t border-gray-200 bg-white shadow-2xl',
        'dark:border-gray-700 dark:bg-gray-900',
        'fixed bottom-0 left-0 right-0 z-[9999]',
        'safe-area-inset-bottom backdrop-blur-md', // For iPhone safe area
        className
      )}
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 9999,
      }}
    >
      <div className="flex">
        {TABS.map(tab => {
          const isActive = location.pathname === tab.path

          return (
            <motion.button
              key={tab.id}
              className={clsx(
                'flex flex-1 flex-col items-center justify-center',
                'relative min-h-[48px] px-1 py-2',
                'transition-colors duration-200',
                isActive
                  ? 'text-garden-600 dark:text-garden-400'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
              )}
              onClick={() => navigate(tab.path)}
              whileTap={{ scale: 0.95 }}
            >
              {/* Active indicator */}
              {isActive && (
                <motion.div
                  className="absolute inset-x-0 top-0 flex justify-center"
                  layoutId="activeTab"
                  initial={false}
                  transition={{
                    type: 'spring',
                    stiffness: 300,
                    damping: 30,
                  }}
                >
                  <div className="h-1 w-8 rounded-b-full bg-garden-500" />
                </motion.div>
              )}

              {/* Icon with pulse effect when active */}
              <motion.div
                className="mb-1"
                animate={
                  isActive
                    ? {
                        scale: [1, 1.1, 1],
                      }
                    : {}
                }
                transition={{
                  duration: 0.3,
                }}
              >
                {tab.icon}
              </motion.div>

              {/* No labels - icons only */}

              {/* Count badge */}
              {tab.count !== undefined && (
                <motion.div
                  className={clsx(
                    'absolute -right-1 -top-1',
                    'h-5 w-5 rounded-full',
                    'bg-red-500 text-xs text-white',
                    'flex items-center justify-center',
                    'font-bold'
                  )}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{
                    type: 'spring',
                    stiffness: 300,
                    damping: 20,
                  }}
                >
                  {tab.count}
                </motion.div>
              )}

              {/* Ripple effect */}
              <motion.div
                className="absolute inset-0 rounded-lg"
                whileTap={{
                  backgroundColor: 'rgba(34, 197, 94, 0.1)',
                }}
                transition={{ duration: 0.1 }}
              />
            </motion.button>
          )
        })}
      </div>
    </div>
  )
}
