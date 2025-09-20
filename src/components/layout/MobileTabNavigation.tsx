import { motion } from 'framer-motion'
import { clsx } from 'clsx'
import { Leaf, BarChart3, Heart } from 'lucide-react'

interface Tab {
  id: string
  label: string
  icon: React.ReactNode
  count?: number
}

interface MobileTabNavigationProps {
  activeTab: string
  onTabChange: (tabId: string) => void
  className?: string
}

const TABS: Tab[] = [
  {
    id: 'mood',
    label: 'Настроение',
    icon: <Heart size={20} />,
  },
  {
    id: 'garden',
    label: 'Сад',
    icon: <Leaf size={20} />,
  },
  {
    id: 'stats',
    label: 'Статистика',
    icon: <BarChart3 size={20} />,
  },
]

export function MobileTabNavigation({
  activeTab,
  onTabChange,
  className,
}: MobileTabNavigationProps) {
  return (
    <div
      className={clsx(
        'border-t border-gray-200 bg-white shadow-2xl',
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
          const isActive = activeTab === tab.id

          return (
            <motion.button
              key={tab.id}
              className={clsx(
                'flex flex-1 flex-col items-center justify-center',
                'relative min-h-[60px] px-1 py-2',
                'transition-colors duration-200',
                isActive
                  ? 'text-garden-600'
                  : 'text-gray-500 hover:text-gray-700'
              )}
              onClick={() => onTabChange(tab.id)}
              whileTap={{ scale: 0.95 }}
            >
              {/* Active indicator */}
              {isActive && (
                <motion.div
                  className="absolute left-1/2 top-0 h-1 w-8 rounded-b-full bg-garden-500"
                  layoutId="activeTab"
                  initial={false}
                  style={{ x: '-50%' }}
                  transition={{
                    type: 'spring',
                    stiffness: 300,
                    damping: 30,
                  }}
                />
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

              {/* Label */}
              <span
                className={clsx(
                  'text-xs font-medium leading-tight',
                  isActive && 'font-semibold'
                )}
              >
                {tab.label}
              </span>

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
