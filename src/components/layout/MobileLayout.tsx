import { Outlet } from 'react-router-dom'
import { MobileTabNavigation } from './MobileTabNavigation'
import { TelegramStatus, StreakFreezeModal } from '@/components/ui'
import { useStreakFreeze } from '@/hooks/useStreakFreeze'
import { useCurrencySync } from '@/hooks/useCurrencySync'
import { useUserSync } from '@/hooks/index.v2'
import { useTelegramId } from '@/hooks/useTelegramId'

export function MobileLayout() {
  // Получаем данные пользователя через React Query
  const telegramId = useTelegramId()
  const { data: userData } = useUserSync(telegramId, !!telegramId)
  const currentUser = userData?.user

  // ✅ Автоматически загружаем и синхронизируем валюту через React Query
  useCurrencySync()

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

  return (
    <div
      className="from-kira-50 relative min-h-screen bg-gradient-to-br via-garden-50 to-neutral-50 dark:from-neutral-900 dark:via-neutral-800 dark:to-neutral-900"
      style={{ paddingBottom: 'calc(72px + env(safe-area-inset-bottom, 0px))' }}
    >
      {/* Telegram Status - Absolute positioned */}
      <TelegramStatus />

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
