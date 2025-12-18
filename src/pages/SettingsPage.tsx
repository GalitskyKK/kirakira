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
  Languages,
} from 'lucide-react'
import { useUserSync, useUserClientStore } from '@/hooks/index.v2'
import { useTelegramId } from '@/hooks/useTelegramId'
import { ProfilePrivacySettings } from '@/components/profile/ProfilePrivacySettings'
import { ThemeSettings } from '@/components/settings/ThemeSettings'
import { RoomThemeSettings } from '@/components/settings/RoomThemeSettings'
import { CompanionSettings } from '@/components/settings/CompanionSettings'
import { GardenDisplaySettings } from '@/components/settings/GardenDisplaySettings'
import { FriendGardenDisplaySettings } from '@/components/settings/FriendGardenDisplaySettings'
import { LanguageSettings } from '@/components/settings/LanguageSettings'
import { SettingsSection } from '@/components/settings/SettingsSection'
import { PageHeader } from '@/components/layout'
import { useUserContext } from '@/contexts/UserContext'
import { clearJWTToken } from '@/utils/apiClient'
import { clearAllData, clearGuestData } from '@/utils/storage'
import { useTranslation } from '@/hooks/useTranslation'

export function SettingsPage() {
  const { isTelegramEnv } = useUserContext()
  const { disableGuestMode } = useUserClientStore()
  const queryClient = useQueryClient()
  const telegramId = useTelegramId()
  const { data: userData } = useUserSync(telegramId, !!telegramId)
  const currentUser = userData?.user
  const t = useTranslation()

  const handleLogout = useCallback(() => {
    disableGuestMode()
    clearAllData()
    clearGuestData()
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
            {t.errors.userNotFound}
          </h2>
          <p className="text-neutral-600 dark:text-neutral-400">
            {t.errors.pleaseLogin}
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
      <PageHeader
        title={t.settings.title}
        icon={<Settings className="h-5 w-5" />}
      />

      <div className="space-y-6 p-4 pb-24">
        {/* Язык */}
        <SettingsSection
          title={t.settings.language}
          description={t.settings.languageDescription}
          icon={<Languages className="h-5 w-5" />}
          delay={0}
        >
          <LanguageSettings />
        </SettingsSection>

        {/* Внешний вид */}
        <SettingsSection
          title={t.settings.appearance}
          description={t.settings.appearanceDescription}
          icon={<Palette className="h-5 w-5" />}
          delay={0.02}
        >
          <ThemeSettings />
        </SettingsSection>

        <SettingsSection
          title={t.settings.roomTheme}
          description={t.settings.roomThemeDescription}
          icon={<Palette className="h-5 w-5" />}
          delay={0.03}
        >
          <RoomThemeSettings />
        </SettingsSection>

        {/* Режим отображения сада */}
        <SettingsSection
          title={t.settings.displayMode}
          description={t.settings.displayModeDescription}
          icon={<Sprout className="h-5 w-5" />}
          delay={0.05}
        >
          <GardenDisplaySettings user={currentUser} />
        </SettingsSection>

        <SettingsSection
          title={t.settings.friendGardenDisplay}
          description={t.settings.friendGardenDisplayDescription}
          icon={<Sprout className="h-5 w-5" />}
          delay={0.07}
        >
          <FriendGardenDisplaySettings user={currentUser} />
        </SettingsSection>

        {/* Игровые настройки */}
        <SettingsSection
          title={t.settings.companion}
          description={t.settings.companionDescription}
          icon={<Sparkles className="h-5 w-5" />}
          delay={0.1}
        >
          <CompanionSettings user={currentUser} />
        </SettingsSection>

        {/* Приватность */}
        <SettingsSection
          title={t.settings.privacy}
          description={t.settings.privacyDescription}
          icon={<Lock className="h-5 w-5" />}
          delay={0.2}
        >
          <ProfilePrivacySettings user={currentUser} />
        </SettingsSection>

        {!isTelegramEnv && (
          <SettingsSection
            title={t.settings.account}
            description={t.settings.accountDescription}
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
              {t.settings.logout}
            </motion.button>
            <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
              {t.settings.logoutDescription}
            </p>
          </SettingsSection>
        )}
      </div>
    </motion.div>
  )
}
