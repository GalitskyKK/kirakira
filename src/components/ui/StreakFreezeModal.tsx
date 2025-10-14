import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import { Button } from './Button'

/**
 * 🧊 Модалка использования заморозки стрика
 * Показывается при пропуске дня
 */

interface StreakFreezeModalProps {
  readonly isOpen: boolean
  readonly onClose: () => void
  readonly missedDays: number
  readonly currentStreak: number
  readonly availableFreezes: {
    readonly manual: number
    readonly auto: number
  }
  readonly onUseFreeze: (freezeType: 'auto' | 'manual') => Promise<void>
  readonly onBuyFreeze?: () => void
  readonly isLoading?: boolean
}

export function StreakFreezeModal({
  isOpen,
  onClose,
  missedDays,
  currentStreak,
  availableFreezes,
  onUseFreeze,
  onBuyFreeze,
  isLoading = false,
}: StreakFreezeModalProps) {
  const hasEnoughManual = availableFreezes.manual >= missedDays
  const hasAuto = availableFreezes.auto > 0
  const canRecover = missedDays <= 7

  // Если пропущено больше 7 дней - стрик потерян безвозвратно
  if (missedDays > 7) {
    return (
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
            onClick={onClose}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="relative w-full max-w-md rounded-2xl bg-gradient-to-b from-gray-800 to-gray-900 p-6 shadow-2xl"
            >
              {/* Закрыть */}
              <button
                onClick={onClose}
                className="absolute right-4 top-4 text-gray-400 transition-colors hover:text-white"
              >
                <X size={24} />
              </button>

              {/* Иконка */}
              <div className="mb-4 text-center">
                <div className="mb-2 text-6xl">😢</div>
                <h3 className="mb-2 text-xl font-bold text-white">
                  Стрик потерян безвозвратно
                </h3>
                <p className="text-sm text-gray-400">
                  Пропущено слишком много дней:{' '}
                  <span className="font-semibold text-red-400">
                    {missedDays}
                  </span>
                </p>
                <p className="mt-2 text-xs text-gray-500">
                  Максимум можно восстановить 7 дней
                </p>
              </div>

              {/* Статистика */}
              <div className="mb-6 rounded-xl bg-gray-800/50 p-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">Был стрик:</span>
                  <span className="font-semibold text-white">
                    {currentStreak} дней
                  </span>
                </div>
                <div className="mt-2 flex items-center justify-between text-sm">
                  <span className="text-gray-400">Новый стрик:</span>
                  <span className="font-semibold text-red-400">0 дней</span>
                </div>
              </div>

              {/* Кнопка */}
              <Button onClick={onClose} fullWidth>
                Понятно
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    )
  }

  // Модалка восстановления стрика
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={e => e.stopPropagation()}
            className="relative w-full max-w-md rounded-2xl bg-gradient-to-b from-gray-800 to-gray-900 p-6 shadow-2xl"
          >
            {/* Закрыть */}
            <button
              onClick={onClose}
              className="absolute right-4 top-4 text-gray-400 transition-colors hover:text-white"
            >
              <X size={24} />
            </button>

            {/* Заголовок */}
            <div className="mb-4 text-center">
              <div className="mb-2 text-6xl">😢</div>
              <h3 className="mb-2 text-xl font-bold text-white">
                Стрик прерван!
              </h3>
              <p className="text-sm text-gray-400">
                Пропущено дней:{' '}
                <span className="font-semibold text-orange-400">
                  {missedDays}
                </span>
              </p>
            </div>

            {/* Статистика стрика */}
            <div className="mb-4 rounded-xl bg-gray-800/50 p-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400">Текущий стрик:</span>
                <span className="font-semibold text-white">
                  {currentStreak} дней
                </span>
              </div>
              <div className="mt-2 flex items-center justify-between text-sm">
                <span className="text-gray-400">После потери:</span>
                <span className="font-semibold text-red-400">0 дней</span>
              </div>
            </div>

            {/* Доступные заморозки */}
            <div className="mb-6 rounded-xl border border-blue-500/30 bg-blue-500/10 p-4">
              <p className="mb-3 text-sm text-gray-300">У вас есть:</p>

              {/* Авто-заморозки */}
              {hasAuto && (
                <div className="mb-2 flex items-center justify-between rounded-lg bg-cyan-500/10 p-2">
                  <div className="flex items-center gap-2">
                    <span className="relative text-2xl">
                      ❄️
                      <span className="absolute -right-1 -top-1 text-xs">
                        ✨
                      </span>
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-cyan-400">
                        Авто-заморозка
                      </p>
                      <p className="text-xs text-gray-400">
                        Срабатывает автоматически
                      </p>
                    </div>
                  </div>
                  <span className="font-bold text-cyan-400">
                    {availableFreezes.auto}
                  </span>
                </div>
              )}

              {/* Обычные заморозки */}
              <div className="flex items-center justify-between rounded-lg bg-blue-500/10 p-2">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">❄️</span>
                  <div>
                    <p className="text-sm font-semibold text-blue-400">
                      Обычные заморозки
                    </p>
                    <p className="text-xs text-gray-400">
                      {missedDays > 1
                        ? `Нужно: ${missedDays}`
                        : 'Используются вручную'}
                    </p>
                  </div>
                </div>
                <span
                  className={`font-bold ${hasEnoughManual ? 'text-blue-400' : 'text-red-400'}`}
                >
                  {availableFreezes.manual}
                </span>
              </div>
            </div>

            {/* Кнопки действий */}
            <div className="space-y-3">
              {/* Авто-заморозка (приоритет) */}
              {hasAuto && missedDays === 1 && (
                <Button
                  onClick={() => onUseFreeze('auto')}
                  disabled={isLoading}
                  fullWidth
                  className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600"
                >
                  {isLoading ? (
                    'Использование...'
                  ) : (
                    <>
                      <span className="mr-2 text-lg">❄️✨</span>
                      Использовать авто-заморозку
                    </>
                  )}
                </Button>
              )}

              {/* Обычная заморозка */}
              {hasEnoughManual && (
                <Button
                  onClick={() => onUseFreeze('manual')}
                  disabled={isLoading}
                  fullWidth
                  variant={hasAuto ? 'secondary' : 'primary'}
                  className={
                    !hasAuto
                      ? 'bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600'
                      : ''
                  }
                >
                  {isLoading ? (
                    'Использование...'
                  ) : (
                    <>
                      <span className="mr-2 text-lg">❄️</span>
                      {missedDays > 1
                        ? `Использовать ${missedDays} заморозок`
                        : 'Использовать заморозку'}
                    </>
                  )}
                </Button>
              )}

              {/* Купить в магазине */}
              {!hasEnoughManual && onBuyFreeze && (
                <Button
                  onClick={onBuyFreeze}
                  disabled={isLoading}
                  fullWidth
                  variant="secondary"
                  className="border border-blue-500/50"
                >
                  <span className="mr-2 text-lg">🛒</span>
                  Купить заморозку в магазине
                </Button>
              )}

              {/* Сбросить стрик */}
              <Button
                onClick={onClose}
                disabled={isLoading}
                fullWidth
                variant="ghost"
              >
                {hasEnoughManual || hasAuto ? 'Отмена' : 'Сбросить стрик'}
              </Button>
            </div>

            {/* Подсказка */}
            {canRecover && (
              <p className="mt-4 text-center text-xs text-gray-500">
                💡 Можно восстановить до 7 пропущенных дней
              </p>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
