import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { MoodCheckin } from '@/components/mood'
import {
  CurrencyDisplay,
  StreakFreezeIndicator,
  TextTyping,
  PageHint,
} from '@/components/ui'
import { useGardenState, useMoodTracking } from '@/hooks/index.v2'
import { useAnimationConfig } from '@/hooks'
import { useCurrencySync } from '@/hooks/useCurrencySync'
import { useUserSync } from '@/hooks/index.v2'
import { useTelegramId } from '@/hooks/useTelegramId'
import { useTranslation } from '@/hooks/useTranslation'
import { getMaxStreakFreezes } from '@/utils/levelsData'
import { PAGE_HINT_IDS, hasSeenPageHint } from '@/utils/storage'

export function MoodPage() {
  const navigate = useNavigate()
  const { garden, gardenStats } = useGardenState()
  const { canCheckinToday } = useMoodTracking()
  const { transition } = useAnimationConfig()
  const t = useTranslation()
  const [hintVersion, setHintVersion] = useState(0)

  const activeHintId = useMemo(() => {
    const candidates = [PAGE_HINT_IDS.mood, PAGE_HINT_IDS.currency]
    return candidates.find(id => !hasSeenPageHint(id)) ?? null
  }, [hintVersion])

  // Получаем данные пользователя через React Query
  const telegramId = useTelegramId()
  const { data: userData } = useUserSync(telegramId, !!telegramId)
  const currentUser = userData?.user

  // ✅ Автоматически загружаем и синхронизируем валюту через React Query
  useCurrencySync()
  const maxStreakFreezes = getMaxStreakFreezes(currentUser?.level ?? 1)

  const openShop = (tab: 'themes' | 'freezes' = 'themes') => {
    const tabSuffix = tab === 'themes' ? '' : `?tab=${tab}`
    navigate(`/mobile/shop${tabSuffix}`)
  }

  // ✅ Валюта автоматически загружается через useCurrencyBalance() выше

  return (
    <>
      <div className="space-y-6">
        {activeHintId === PAGE_HINT_IDS.mood && (
          <PageHint
            id={PAGE_HINT_IDS.mood}
            title={t.hints.mood.title}
            description={t.hints.mood.description}
            actionLabel={t.hints.dismiss}
            targetSelector='[data-hint-target="mood-checkin"]'
            onDismiss={() => setHintVersion(prev => prev + 1)}
          />
        )}
        {activeHintId === PAGE_HINT_IDS.currency && (
          <PageHint
            id={PAGE_HINT_IDS.currency}
            title={t.hints.currency.title}
            description={t.hints.currency.description}
            actionLabel={t.hints.dismiss}
            targetSelector='[data-hint-target="currency-balance"]'
            onDismiss={() => setHintVersion(prev => prev + 1)}
          />
        )}
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
                data-hint-target="currency-balance"
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
              {currentUser?.stats && (
                <div className="h-6 w-px bg-neutral-300 dark:bg-neutral-600" />
              )}

              {/* 🧊 Заморозки стрика */}
              {currentUser?.stats && (
                <StreakFreezeIndicator
                  manual={currentUser.stats.streakFreezes}
                  auto={currentUser.stats.autoFreezes}
                  max={maxStreakFreezes}
                  showBorder={false}
                />
              )}
            </div>
          </div>
        </div>

        {/* Mood Check-in */}
        <div data-hint-target="mood-checkin">
          <MoodCheckin />
        </div>

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
      </div>
    </>
  )
}
