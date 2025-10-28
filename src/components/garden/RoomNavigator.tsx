import { motion } from 'framer-motion'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { clsx } from 'clsx'
import type { RoomNavigationState } from '@/types'

interface RoomNavigatorProps {
  readonly navigation: RoomNavigationState
  readonly roomName: string
  readonly onNavigate: (direction: 'prev' | 'next') => void
  readonly className?: string
  readonly isMovingElement?: boolean // Показывает, что элемент перемещается
}

/**
 * Компонент навигации между комнатами сада
 * - Стрелки влево/вправо для переключения
 * - Индикатор текущей комнаты (pagination dots)
 * - Название текущей комнаты
 * - Поддержка жестов свайпа (добавляется в родительском компоненте)
 */
export function RoomNavigator({
  navigation,
  roomName,
  onNavigate,
  className,
  isMovingElement = false,
}: RoomNavigatorProps) {
  const { currentRoomIndex, totalRooms, canNavigatePrev, canNavigateNext } =
    navigation

  return (
    <div
      className={clsx(
        'flex items-center justify-between gap-4',
        'rounded-lg px-4 py-3 shadow-sm backdrop-blur-sm transition-colors',
        isMovingElement
          ? 'bg-blue-50 ring-2 ring-blue-400 dark:bg-blue-900/20 dark:ring-blue-300'
          : 'bg-white/80 dark:bg-gray-800/80',
        className
      )}
    >
      {/* Подсказка при перемещении элемента */}
      {isMovingElement && (
        <motion.div
          className="absolute -top-2 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-blue-500 px-3 py-1 text-xs font-medium text-white shadow-lg"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
        >
          ✨ Можете перейти в другую комнату
        </motion.div>
      )}
      {/* Кнопка "Назад" */}
      <motion.button
        onClick={() => onNavigate('prev')}
        disabled={!canNavigatePrev}
        className={clsx(
          'flex h-10 w-10 items-center justify-center rounded-full transition-all',
          canNavigatePrev
            ? 'bg-garden-100 text-garden-700 hover:bg-garden-200 active:scale-95 dark:bg-garden-800 dark:text-garden-300 dark:hover:bg-garden-700'
            : 'cursor-not-allowed bg-gray-100 text-gray-400 dark:bg-gray-700 dark:text-gray-500'
        )}
        {...(canNavigatePrev ? { whileTap: { scale: 0.9 } } : {})}
        aria-label="Предыдущая комната"
      >
        <ChevronLeft className="h-5 w-5" />
      </motion.button>

      {/* Центральная часть: название и индикаторы */}
      <div className="flex flex-1 flex-col items-center gap-2">
        {/* Название комнаты */}
        <motion.div
          key={roomName}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          transition={{ duration: 0.3 }}
          className="text-sm font-semibold text-gray-900 dark:text-gray-100"
        >
          {roomName}
        </motion.div>

        {/* Индикаторы комнат (pagination dots) */}
        <div className="flex items-center gap-1.5">
          {Array.from({ length: totalRooms }, (_, index) => {
            const isActive = index === currentRoomIndex
            const isPrevious = index < currentRoomIndex
            const isNext = index > currentRoomIndex

            return (
              <motion.button
                key={`room-dot-${index}`}
                onClick={() => {
                  if (index < currentRoomIndex) {
                    onNavigate('prev')
                  } else if (index > currentRoomIndex) {
                    onNavigate('next')
                  }
                }}
                className={clsx(
                  'rounded-full transition-all',
                  isActive && 'h-2 w-6 bg-garden-500',
                  !isActive && 'h-2 w-2 hover:scale-125',
                  isPrevious && 'bg-garden-300',
                  isNext && 'bg-gray-300 dark:bg-gray-600'
                )}
                whileHover={{ scale: isActive ? 1 : 1.2 }}
                whileTap={{ scale: 0.9 }}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: index * 0.05 }}
                aria-label={`Комната ${index + 1}`}
              />
            )
          })}
        </div>

        {/* Счётчик элементов */}
        <div className="text-xs text-gray-500 dark:text-gray-400">
          Комната {currentRoomIndex + 1} из {totalRooms}
        </div>
      </div>

      {/* Кнопка "Вперёд" */}
      <motion.button
        onClick={() => onNavigate('next')}
        disabled={!canNavigateNext}
        className={clsx(
          'flex h-10 w-10 items-center justify-center rounded-full transition-all',
          canNavigateNext
            ? 'bg-garden-100 text-garden-700 hover:bg-garden-200 active:scale-95 dark:bg-garden-800 dark:text-garden-300 dark:hover:bg-garden-700'
            : 'cursor-not-allowed bg-gray-100 text-gray-400 dark:bg-gray-700 dark:text-gray-500'
        )}
        {...(canNavigateNext ? { whileTap: { scale: 0.9 } } : {})}
        aria-label="Следующая комната"
      >
        <ChevronRight className="h-5 w-5" />
      </motion.button>
    </div>
  )
}
