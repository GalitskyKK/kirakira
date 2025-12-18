import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import { Button } from './Button'
import { useTranslation } from '@/hooks/useTranslation'

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
  readonly onResetStreak?: (() => Promise<void>) | undefined
  readonly onBuyFreeze?: () => void
  readonly isLoading?: boolean
  readonly userCurrency?: {
    readonly sprouts: number
    readonly gems: number
  }
}

export function StreakFreezeModal({
  isOpen,
  onClose,
  missedDays,
  currentStreak,
  availableFreezes,
  onUseFreeze,
  onResetStreak,
  onBuyFreeze,
  isLoading = false,
  userCurrency,
}: StreakFreezeModalProps) {
  const t = useTranslation()
  const hasEnoughManual = availableFreezes.manual >= missedDays
  const hasAuto = availableFreezes.auto > 0
  const canRecover = missedDays <= 7

  // Проверяем, хватает ли денег на покупку заморозки
  // Стоимость: 500 sprouts за ручную, 1000 за авто
  const manualFreezeCost = 500
  const canAffordManualFreeze =
    userCurrency && userCurrency.sprouts >= manualFreezeCost * missedDays
  const showBuyButton = !hasEnoughManual && !hasAuto && canAffordManualFreeze

  // Если пропущено больше 7 дней - стрик потерян безвозвратно
  if (missedDays > 7) {
    return (
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={onClose}
            style={{ paddingBottom: '72px' }}
          >
            {/* Overlay */}
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="relative z-10 w-full max-w-md rounded-2xl bg-gradient-to-b from-gray-800 to-gray-900 p-6 shadow-2xl"
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
                  {t.streakFreeze.lostForever}
                </h3>
                <p className="text-sm text-gray-400">
                  {t.streakFreeze.tooManyDaysMissed}:{' '}
                  <span className="font-semibold text-red-400">
                    {missedDays}
                  </span>
                </p>
                <p className="mt-2 text-xs text-gray-500">
                  {t.streakFreeze.maxRestore}
                </p>
              </div>

              {/* Статистика */}
              <div className="mb-6 rounded-xl bg-gray-800/50 p-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">
                    {t.streakFreeze.wasStreak}:
                  </span>
                  <span className="font-semibold text-white">
                    {currentStreak} {t.streakFreeze.days}
                  </span>
                </div>
                <div className="mt-2 flex items-center justify-between text-sm">
                  <span className="text-gray-400">
                    {t.streakFreeze.newStreak}:
                  </span>
                  <span className="font-semibold text-red-400">
                    0 {t.streakFreeze.days}
                  </span>
                </div>
              </div>

              {/* Кнопка */}
              <Button onClick={onClose} fullWidth>
                {t.streakFreeze.understood}
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
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={onClose}
          style={{ paddingBottom: '72px' }}
        >
          {/* Overlay */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={e => e.stopPropagation()}
            className="relative z-10 w-full max-w-md rounded-2xl bg-gradient-to-b from-gray-800 to-gray-900 p-6 shadow-2xl"
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
                {t.streakFreeze.interrupted}
              </h3>
              <p className="text-sm text-gray-400">
                {t.streakFreeze.missedDays}:{' '}
                <span className="font-semibold text-orange-400">
                  {missedDays}
                </span>
              </p>
            </div>

            {/* Статистика стрика */}
            <div className="mb-4 rounded-xl bg-gray-800/50 p-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400">
                  {t.streakFreeze.currentStreak}:
                </span>
                <span className="font-semibold text-white">
                  {currentStreak} {t.streakFreeze.days}
                </span>
              </div>
              <div className="mt-2 flex items-center justify-between text-sm">
                <span className="text-gray-400">
                  {t.streakFreeze.afterLoss}:
                </span>
                <span className="font-semibold text-red-400">
                  0 {t.streakFreeze.days}
                </span>
              </div>
            </div>

            {/* Доступные заморозки */}
            <div className="mb-6 rounded-xl border border-blue-500/30 bg-blue-500/10 p-4">
              <p className="mb-3 text-sm text-gray-300">
                {t.streakFreeze.youHave}
              </p>

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
                        {t.streakFreeze.autoFreeze}
                      </p>
                      <p className="text-xs text-gray-400">
                        {t.streakFreeze.triggersAutomatically}
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
                      {t.streakFreeze.regularFreezes}
                    </p>
                    <p className="text-xs text-gray-400">
                      {missedDays > 1
                        ? `${t.streakFreeze.needToUse}: ${missedDays}`
                        : t.freezes.manualUse}
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
                  onClick={() => void onUseFreeze('auto')}
                  disabled={isLoading}
                  fullWidth
                  className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600"
                >
                  {isLoading ? (
                    t.streakFreeze.using
                  ) : (
                    <>
                      <span className="mr-2 text-lg">❄️✨</span>
                      {t.streakFreeze.useAutoFreeze}
                    </>
                  )}
                </Button>
              )}

              {/* Обычная заморозка */}
              {hasEnoughManual && (
                <Button
                  onClick={() => void onUseFreeze('manual')}
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
                    t.streakFreeze.using
                  ) : (
                    <>
                      <span className="mr-2 text-lg">❄️</span>
                      {missedDays > 1
                        ? `${t.streakFreeze.useFreezes} ${missedDays} ${t.freezes.manual}`
                        : t.streakFreeze.useFreeze}
                    </>
                  )}
                </Button>
              )}

              {/* Купить в магазине */}
              {showBuyButton && onBuyFreeze && (
                <Button
                  onClick={onBuyFreeze}
                  disabled={isLoading}
                  fullWidth
                  variant="secondary"
                  className="border border-green-500/50 bg-green-500/10 hover:bg-green-500/20 dark:border-green-400/50 dark:bg-green-400/10 dark:hover:bg-green-400/20"
                >
                  <span className="mr-2 text-lg">🛒</span>
                  {t.streakFreeze.buyFreezes}{' '}
                  {missedDays > 1
                    ? `${missedDays} ${t.freezes.manual}`
                    : t.freezes.manual}{' '}
                  ({manualFreezeCost * missedDays} 🌿)
                </Button>
              )}

              {/* Сбросить стрик */}
              <Button
                onClick={
                  hasEnoughManual || hasAuto
                    ? onClose
                    : onResetStreak
                      ? () => {
                          void onResetStreak()
                        }
                      : onClose
                }
                disabled={isLoading}
                fullWidth
                variant="ghost"
                className={
                  !hasEnoughManual && !hasAuto && onResetStreak
                    ? 'border border-red-500/50 text-red-400 hover:bg-red-500/10'
                    : ''
                }
              >
                {hasEnoughManual || hasAuto
                  ? t.streakFreeze.cancel
                  : t.streakFreeze.resetStreak}
              </Button>
            </div>

            {/* Подсказка */}
            {canRecover && (
              <p className="mt-4 text-center text-xs text-gray-500">
                {t.streakFreeze.tip}
              </p>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
