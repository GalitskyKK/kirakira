import { useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import { MobileTabNavigation } from './MobileTabNavigation'
import { TelegramStatus, StreakFreezeModal } from '@/components/ui'
import { useStreakFreeze } from '@/hooks/useStreakFreeze'
import { useCurrencyStore } from '@/stores/currencyStore'
import { useUserSync } from '@/hooks/index.v2'
import { useTelegramId } from '@/hooks/useTelegramId'

export function MobileLayout() {
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
    <div
      className="from-kira-50 relative min-h-screen bg-gradient-to-br via-garden-50 to-neutral-50 dark:from-neutral-900 dark:via-neutral-800 dark:to-neutral-900"
      style={{ paddingBottom: 'calc(72px + env(safe-area-inset-bottom, 0px))' }}
    >
      {/* Telegram Status - Always visible */}
      <div className="p-3 pb-0 sm:p-4">
        <TelegramStatus />
      </div>

      {/* Content Area - React Router Outlet */}
      <div className="relative overflow-x-hidden">
        <div className="w-full px-3 pb-6 sm:px-4">
          <Outlet />
        </div>
      </div>

      {/* Mobile Tab Navigation */}
      <MobileTabNavigation />

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
