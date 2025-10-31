import { useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { MoodCheckin } from '@/components/mood'
import {
  CurrencyDisplay,
  StreakFreezeIndicator,
  StreakFreezeModal,
  Shop,
  TextTyping,
} from '@/components/ui'
import { useGardenState, useMoodTracking } from '@/hooks/index.v2'
import { useStreakFreeze } from '@/hooks/useStreakFreeze'
import { useCurrencySync } from '@/hooks/useCurrencySync'
import { useCurrencyClientStore } from '@/stores/currencyStore'
import { useUserSync } from '@/hooks/index.v2'
import { useTelegramId } from '@/hooks/useTelegramId'

export function MoodPage() {
  const navigate = useNavigate()
  const { garden, gardenStats } = useGardenState()
  const { canCheckinToday } = useMoodTracking()
  // Получаем данные пользователя через React Query
  const telegramId = useTelegramId()
  const { data: userData } = useUserSync(telegramId, !!telegramId)
  const currentUser = userData?.user
  
  // ✅ Автоматически загружаем и синхронизируем валюту через React Query
  useCurrencySync()
  
  // Получаем валюту из v2 store (синхронизируется через useCurrencySync)
  const { userCurrency } = useCurrencyClientStore()
  
  const [isThemeShopOpen, setIsThemeShopOpen] = useState(false)
  const [shopInitialTab, setShopInitialTab] = useState<'themes' | 'freezes'>(
    'themes'
  )

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

  // ✅ Валюта автоматически загружается через useCurrencyBalance() выше

  return (
    <>
      <div className="space-y-6 p-4">
        {/* Quick Status - serene minimalism */}
        <div className="text-center">
          <motion.div
            className="mb-2 text-3xl font-bold"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <TextTyping className="" />
          </motion.div>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            {!canCheckinToday() ? 'Настроение отмечено' : 'Как дела сегодня?'}
          </p>

          {/* Currency Display + Streak Freezes - общий контейнер - modern glass */}
          <div className="mt-4 flex items-center justify-center">
            <div className="glass-card flex items-center gap-3 rounded-2xl px-4 py-2 text-sm">
              <div
                className="dark:hover:bg-kira-950/30 cursor-pointer rounded-xl px-2 py-1 transition-all hover:bg-kira-50"
                onClick={() => setIsThemeShopOpen(true)}
              >
                <CurrencyDisplay
                  size="md"
                  showAnimation={false}
                  variant="compact"
                  showBorder={false}
                />
              </div>

              {/* Разделитель */}
              {freezeData && (
                <div className="h-6 w-px bg-neutral-300 dark:bg-neutral-600" />
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

        {/* Quick Stats Cards - soft pastels */}
        <div className="grid grid-cols-2 gap-3">
          <motion.div
            className="glass-card rounded-3xl bg-gradient-to-br from-garden-100/50 to-garden-200/30 p-5 dark:from-garden-900/40 dark:to-garden-800/40"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div className="text-3xl font-bold text-garden-600 dark:text-garden-400">
              {gardenStats.totalElements}
            </div>
            <div className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
              Растений
            </div>
          </motion.div>

          <motion.div
            className="glass-card rounded-3xl bg-gradient-to-br from-kira-100/50 to-kira-200/30 p-5 dark:from-kira-900/40 dark:to-kira-800/40"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <div className="text-3xl font-bold text-kira-600 dark:text-kira-400">
              {garden?.streak ?? 0}
            </div>
            <div className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
              Дней подряд
            </div>
          </motion.div>
        </div>

        {/* Quick Actions - glass cards */}
        <div className="space-y-3">
          <motion.button
            onClick={() => navigate('/mobile/garden')}
            className="glass-card w-full rounded-3xl p-4 text-left transition-all hover:bg-white/90 dark:hover:bg-neutral-900/90"
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="font-semibold text-neutral-900 dark:text-neutral-100">
                  Мой сад
                </div>
                <div className="text-sm text-neutral-600 dark:text-neutral-400">
                  {gardenStats.totalElements > 0
                    ? `${gardenStats.totalElements} растений`
                    : 'Вырастите первое растение'}
                </div>
              </div>
              <div className="text-3xl">🌱</div>
            </div>
          </motion.button>

          <motion.button
            onClick={() => navigate('/mobile/tasks')}
            className="glass-card w-full rounded-3xl p-4 text-left transition-all hover:bg-white/90 dark:hover:bg-neutral-900/90"
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="font-semibold text-neutral-900 dark:text-neutral-100">
                  Ежедневные задания
                </div>
                <div className="text-sm text-neutral-600 dark:text-neutral-400">
                  Выполняйте и получайте награды
                </div>
              </div>
              <div className="text-3xl">🏆</div>
            </div>
          </motion.button>

          <motion.button
            onClick={() => navigate('/mobile/community')}
            className="glass-card w-full rounded-3xl p-4 text-left transition-all hover:bg-white/90 dark:hover:bg-neutral-900/90"
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="font-semibold text-neutral-900 dark:text-neutral-100">
                  Комьюнити
                </div>
                <div className="text-sm text-neutral-600 dark:text-neutral-400">
                  Челленджи и друзья
                </div>
              </div>
              <div className="text-3xl">👥</div>
            </div>
          </motion.button>

          <motion.button
            onClick={() => navigate('/mobile/stats')}
            className="glass-card w-full rounded-3xl p-4 text-left transition-all hover:bg-white/90 dark:hover:bg-neutral-900/90"
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="font-semibold text-neutral-900 dark:text-neutral-100">
                  Статистика
                </div>
                <div className="text-sm text-neutral-600 dark:text-neutral-400">
                  Аналитика настроения
                </div>
              </div>
              <div className="text-3xl">📊</div>
            </div>
          </motion.button>
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
            onBuyFreeze={() => {
              closeModal()
              setShopInitialTab('freezes')
              setIsThemeShopOpen(true)
            }}
            isLoading={freezeLoading}
            {...(userCurrency && {
              userCurrency: {
                sprouts: userCurrency.sprouts,
                gems: userCurrency.gems,
              },
            })}
          />
        )}
      </div>

      {/* Shop Modal - вынесен за пределы space-y-6 */}
      <Shop
        isOpen={isThemeShopOpen}
        onClose={() => {
          setIsThemeShopOpen(false)
          setShopInitialTab('themes')
        }}
        initialTab={shopInitialTab}
      />
    </>
  )
}
