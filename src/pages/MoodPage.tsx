import { useEffect } from 'react'
import { motion } from 'framer-motion'
import { MoodCheckin } from '@/components/mood'
import {
  CurrencyDisplay,
  StreakFreezeIndicator,
  StreakFreezeModal,
} from '@/components/ui'
import { useGardenState, useMoodTracking } from '@/hooks/index.v2'
import { useStreakFreeze } from '@/hooks/useStreakFreeze'
import { useCurrencyStore } from '@/stores/currencyStore'
import { useUserSync } from '@/hooks/index.v2'
import { useTelegramId } from '@/hooks/useTelegramId'

export function MoodPage() {
  const { garden, gardenStats } = useGardenState()
  const { canCheckinToday } = useMoodTracking()
  // Получаем данные пользователя через React Query
  const telegramId = useTelegramId()
  const { data: userData } = useUserSync(telegramId, !!telegramId)
  const currentUser = userData?.user
  const { loadCurrency } = useCurrencyStore()

  // 🧊 Заморозки стрика
  const {
    freezeData,
    missedDays,
    showModal,
    isLoading: freezeLoading,
    autoUsedMessage,
    useFreeze,
    resetStreak,
    closeModal,
  } = useStreakFreeze()

  // Загружаем баланс валюты при монтировании
  useEffect(() => {
    if (currentUser?.telegramId != null) {
      void loadCurrency(currentUser.telegramId)
    }
  }, [currentUser?.telegramId, loadCurrency])

  return (
    <div className="space-y-6 p-4">
      {/* Quick Status */}
      <div className="text-center">
        <h1 className="mb-2 text-2xl font-bold text-gray-900 dark:text-gray-100">
          🌸 KiraKira
        </h1>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {!canCheckinToday() ? 'Настроение отмечено' : 'Как дела сегодня?'}
        </p>

        {/* Currency Display + Streak Freezes - общий контейнер */}
        <div className="mt-3 flex items-center justify-center">
          <div className="flex items-center gap-3 rounded-lg bg-gradient-to-r from-green-500/10 via-purple-500/10 to-blue-500/10 px-4 py-2 text-sm">
            <CurrencyDisplay
              size="md"
              showAnimation={false}
              variant="compact"
              showBorder={false}
            />

            {/* Разделитель */}
            {freezeData && (
              <div className="h-6 w-px bg-gray-300 dark:bg-gray-600" />
            )}

            {/* 🧊 Заморозки стрика */}
            {freezeData && (
              <StreakFreezeIndicator
                manual={freezeData.manual}
                auto={freezeData.auto}
                max={freezeData.max}
                showBorder={false}
              />
            )}
          </div>
        </div>

        {/* Сообщение об авто-использовании заморозки */}
        {autoUsedMessage != null && autoUsedMessage.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mt-2 text-center text-xs text-cyan-400"
          >
            {autoUsedMessage}
          </motion.div>
        )}
      </div>

      {/* Mood Check-in */}
      <MoodCheckin />

      {/* Quick Stats Cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-gradient-to-br from-garden-50 to-green-50 p-4 dark:from-garden-900/30 dark:to-green-900/30">
          <div className="text-2xl font-bold text-garden-600 dark:text-garden-400">
            {gardenStats.totalElements}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Растений
          </div>
        </div>

        <div className="rounded-2xl bg-gradient-to-br from-orange-50 to-yellow-50 p-4 dark:from-orange-900/30 dark:to-yellow-900/30">
          <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
            {garden?.streak ?? 0}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Дней подряд
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="space-y-3">
        <button
          onClick={() => (window.location.href = '/mobile/garden')}
          className="w-full rounded-2xl border border-gray-200 bg-white p-4 text-left transition-colors hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700"
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-gray-900 dark:text-gray-100">
                Мой сад
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {gardenStats.totalElements > 0
                  ? `${gardenStats.totalElements} растений`
                  : 'Вырастите первое растение'}
              </div>
            </div>
            <div className="text-2xl">🌱</div>
          </div>
        </button>

        <button
          onClick={() => (window.location.href = '/mobile/tasks')}
          className="w-full rounded-2xl border border-gray-200 bg-white p-4 text-left transition-colors hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700"
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-gray-900 dark:text-gray-100">
                Ежедневные задания
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Выполняйте и получайте награды
              </div>
            </div>
            <div className="text-2xl">🎯</div>
          </div>
        </button>

        <button
          onClick={() => (window.location.href = '/mobile/community')}
          className="w-full rounded-2xl border border-gray-200 bg-white p-4 text-left transition-colors hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700"
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-gray-900 dark:text-gray-100">
                Комьюнити
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Челленджи и друзья
              </div>
            </div>
            <div className="text-2xl">👥</div>
          </div>
        </button>

        <button
          onClick={() => (window.location.href = '/mobile/stats')}
          className="w-full rounded-2xl border border-gray-200 bg-white p-4 text-left transition-colors hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700"
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-gray-900 dark:text-gray-100">
                Статистика
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Аналитика настроения
              </div>
            </div>
            <div className="text-2xl">📊</div>
          </div>
        </button>
      </div>

      {/* 🧊 Модалка заморозки стрика */}
      {freezeData && (
        <StreakFreezeModal
          isOpen={showModal}
          onClose={closeModal}
          missedDays={missedDays}
          currentStreak={currentUser?.stats.currentStreak ?? 0}
          availableFreezes={{
            manual: freezeData.manual,
            auto: freezeData.auto,
          }}
          onUseFreeze={useFreeze}
          onResetStreak={resetStreak as (() => Promise<void>) | undefined}
          isLoading={freezeLoading}
        />
      )}
    </div>
  )
}
