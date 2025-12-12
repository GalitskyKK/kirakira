import { useCallback } from 'react'
import { motion } from 'framer-motion'
import { useQueryClient } from '@tanstack/react-query'
import {
  Settings,
  Palette,
  Sparkles,
  Lock,
  Sprout,
  LogOut,
} from 'lucide-react'
import { useUserSync, useUserClientStore } from '@/hooks/index.v2'
import { useTelegramId } from '@/hooks/useTelegramId'
import { ProfilePrivacySettings } from '@/components/profile/ProfilePrivacySettings'
import { ThemeSettings } from '@/components/settings/ThemeSettings'
import { RoomThemeSettings } from '@/components/settings/RoomThemeSettings'
import { CompanionSettings } from '@/components/settings/CompanionSettings'
import { GardenDisplaySettings } from '@/components/settings/GardenDisplaySettings'
import { FriendGardenDisplaySettings } from '@/components/settings/FriendGardenDisplaySettings'
import { SettingsSection } from '@/components/settings/SettingsSection'
import { PageHeader } from '@/components/layout'
import { useUserContext } from '@/contexts/UserContext'
import { clearJWTToken } from '@/utils/apiClient'

export function SettingsPage() {
  const { isTelegramEnv } = useUserContext()
  const { disableGuestMode } = useUserClientStore()
  const queryClient = useQueryClient()
  const telegramId = useTelegramId()
  const { data: userData } = useUserSync(telegramId, !!telegramId)
  const currentUser = userData?.user

  const handleLogout = useCallback(() => {
    disableGuestMode()
    clearJWTToken()
    queryClient.clear()
    window.location.replace('/auth')
  }, [disableGuestMode, queryClient])

  if (!currentUser) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="glass-card rounded-3xl p-6 text-center">
          <div className="mb-4 text-6xl">😔</div>
          <h2 className="mb-2 text-xl font-bold text-neutral-900 dark:text-neutral-100">
            Пользователь не найден
          </h2>
          <p className="text-neutral-600 dark:text-neutral-400">
            Пожалуйста, авторизуйтесь для просмотра настроек
          </p>
        </div>
      </div>
    )
  }

  return (
    <motion.div
      className="min-h-screen bg-gradient-to-br from-kira-50 via-garden-50 to-neutral-50 dark:from-neutral-900 dark:via-neutral-800 dark:to-neutral-900"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <PageHeader title="Настройки" icon={<Settings className="h-5 w-5" />} />

      <div className="space-y-6 p-4 pb-24">
        {/* Внешний вид */}
        <SettingsSection
          title="Внешний вид"
          description="Персонализируйте внешний вид вашего сада"
          icon={<Palette className="h-5 w-5" />}
          delay={0}
        >
          <ThemeSettings />
        </SettingsSection>

        <SettingsSection
          title="Тема комнаты"
          description="Выберите тему для изометрической комнаты"
          icon={<Palette className="h-5 w-5" />}
          delay={0.02}
        >
          <RoomThemeSettings />
        </SettingsSection>

        {/* Режим отображения сада */}
        <SettingsSection
          title="Режим отображения"
          description="Выберите способ визуализации вашего сада"
          icon={<Sprout className="h-5 w-5" />}
          delay={0.05}
        >
          <GardenDisplaySettings />
        </SettingsSection>

        <SettingsSection
          title="Как друзья видят мой сад"
          description="Выберите вид, который увидят другие при просмотре вашего сада"
          icon={<Sprout className="h-5 w-5" />}
          delay={0.07}
        >
          <FriendGardenDisplaySettings user={currentUser} />
        </SettingsSection>

        {/* Игровые настройки */}
        <SettingsSection
          title="Лумина — дух сада"
          description="Настройки вашего живого спутника"
          icon={<Sparkles className="h-5 w-5" />}
          delay={0.1}
        >
          <CompanionSettings user={currentUser} />
        </SettingsSection>

        {/* Приватность */}
        <SettingsSection
          title="Приватность"
          description="Управление доступом к вашим данным"
          icon={<Lock className="h-5 w-5" />}
          delay={0.2}
        >
          <ProfilePrivacySettings user={currentUser} />
        </SettingsSection>

        {!isTelegramEnv && (
          <SettingsSection
            title="Аккаунт"
            description="Управление входом в браузере"
            icon={<LogOut className="h-5 w-5" />}
            delay={0.25}
          >
            <motion.button
              type="button"
              onClick={handleLogout}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full rounded-2xl bg-red-500 px-4 py-3 text-white shadow-sm transition-colors hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-2"
            >
              Выйти из аккаунта
            </motion.button>
            <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
              Очистим токен браузера и вернём на экран входа.
            </p>
          </SettingsSection>
        )}
      </div>
    </motion.div>
  )
}
