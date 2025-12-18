import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { MoodCheckin } from '@/components/mood'
import {
  CurrencyDisplay,
  StreakFreezeIndicator,
  StreakFreezeModal,
  TextTyping,
} from '@/components/ui'
import { useGardenState, useMoodTracking } from '@/hooks/index.v2'
import { useAnimationConfig } from '@/hooks'
import { useStreakFreeze } from '@/hooks/useStreakFreeze'
import { useCurrencySync } from '@/hooks/useCurrencySync'
import { useCurrencyClientStore } from '@/stores/currencyStore'
import { useUserSync } from '@/hooks/index.v2'
import { useTelegramId } from '@/hooks/useTelegramId'
import { useTranslation } from '@/hooks/useTranslation'

export function MoodPage() {
  const navigate = useNavigate()
  const { garden, gardenStats } = useGardenState()
  const { canCheckinToday } = useMoodTracking()
  const { transition } = useAnimationConfig()
  const t = useTranslation()

  // Получаем данные пользователя через React Query
  const telegramId = useTelegramId()
  const { data: userData } = useUserSync(telegramId, !!telegramId)
  const currentUser = userData?.user

  // ✅ Автоматически загружаем и синхронизируем валюту через React Query
  useCurrencySync()
  // Получаем валюту из v2 store (синхронизируется через useCurrencySync)
  const { userCurrency } = useCurrencyClientStore()

  const openShop = (tab: 'themes' | 'freezes' = 'themes') => {
    const tabSuffix = tab === 'themes' ? '' : `?tab=${tab}`
    navigate(`/mobile/shop${tabSuffix}`)
  }

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
      <div className="space-y-6">
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
            {!canCheckinToday()
              ? t.mood.alreadyCheckedIn
              : t.mood.howAreYouToday}
          </p>

          {/* Currency Display + Streak Freezes - общий контейнер - modern glass */}
          <div className="mt-4 flex items-center justify-center">
            <div className="glass-card flex items-center gap-3 rounded-2xl px-4 py-2 text-sm">
              <div
                className="dark:hover:bg-kira-950/30 cursor-pointer rounded-xl px-2 py-1 transition-all hover:bg-kira-50"
                onClick={() => openShop('themes')}
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

        {/* Quick Stats Cards - soft pastels - оптимизировано */}
        <div className="grid grid-cols-2 gap-3">
          <motion.div
            className="glass-card rounded-3xl bg-gradient-to-br from-garden-100/50 to-garden-200/30 p-5 dark:from-garden-900/40 dark:to-garden-800/40"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={transition}
          >
            <div className="text-3xl font-bold text-garden-600 dark:text-garden-400">
              {gardenStats.totalElements}
            </div>
            <div className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
              {t.garden.plants}
            </div>
          </motion.div>

          <motion.div
            className="glass-card rounded-3xl bg-gradient-to-br from-kira-100/50 to-kira-200/30 p-5 dark:from-kira-900/40 dark:to-kira-800/40"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={transition}
          >
            <div className="text-3xl font-bold text-kira-600 dark:text-kira-400">
              {garden?.streak ?? 0}
            </div>
            <div className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
              {t.garden.daysInRow}
            </div>
          </motion.div>
        </div>

        {/* Quick Actions - glass cards - оптимизировано без hover анимаций */}
        <div className="space-y-3">
          <button
            onClick={() => navigate('/mobile/garden')}
            className="glass-card w-full rounded-3xl p-4 text-left transition-all active:scale-95"
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="font-semibold text-neutral-900 dark:text-neutral-100">
                  {t.pages.garden.myGarden}
                </div>
                <div className="text-sm text-neutral-600 dark:text-neutral-400">
                  {gardenStats.totalElements > 0
                    ? `${gardenStats.totalElements} ${t.garden.plants}`
                    : t.pages.mood.growFirstPlant}
                </div>
              </div>
              <div className="text-3xl">🌱</div>
            </div>
          </button>

          <button
            onClick={() => navigate('/mobile/tasks')}
            className="glass-card w-full rounded-3xl p-4 text-left transition-all active:scale-95"
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="font-semibold text-neutral-900 dark:text-neutral-100">
                  {t.pages.mood.dailyQuests}
                </div>
                <div className="text-sm text-neutral-600 dark:text-neutral-400">
                  {t.pages.mood.completeQuests}
                </div>
              </div>
              <div className="text-3xl">🏆</div>
            </div>
          </button>

          <button
            onClick={() => navigate('/mobile/community')}
            className="glass-card w-full rounded-3xl p-4 text-left transition-all active:scale-95"
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="font-semibold text-neutral-900 dark:text-neutral-100">
                  {t.pages.mood.community}
                </div>
                <div className="text-sm text-neutral-600 dark:text-neutral-400">
                  {t.pages.mood.challengesAndFriends}
                </div>
              </div>
              <div className="text-3xl">👥</div>
            </div>
          </button>

          <button
            onClick={() => navigate('/mobile/stats')}
            className="glass-card w-full rounded-3xl p-4 text-left transition-all active:scale-95"
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="font-semibold text-neutral-900 dark:text-neutral-100">
                  {t.pages.mood.statistics}
                </div>
                <div className="text-sm text-neutral-600 dark:text-neutral-400">
                  {t.pages.mood.moodAnalytics}
                </div>
              </div>
              <div className="text-3xl">📊</div>
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
            onBuyFreeze={() => {
              closeModal()
              openShop('freezes')
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
    </>
  )
}
