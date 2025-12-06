import { motion } from 'framer-motion'
import { Settings, Palette, Sparkles, Lock, Sprout } from 'lucide-react'
import { useUserSync } from '@/hooks/index.v2'
import { useTelegramId } from '@/hooks/useTelegramId'
import { ProfilePrivacySettings } from '@/components/profile/ProfilePrivacySettings'
import { ThemeSettings } from '@/components/settings/ThemeSettings'
import { RoomThemeSettings } from '@/components/settings/RoomThemeSettings'
import { CompanionSettings } from '@/components/settings/CompanionSettings'
import { GardenDisplaySettings } from '@/components/settings/GardenDisplaySettings'
import { SettingsSection } from '@/components/settings/SettingsSection'
import { PageHeader } from '@/components/layout'

export function SettingsPage() {
  const telegramId = useTelegramId()
  const { data: userData } = useUserSync(telegramId, !!telegramId)
  const currentUser = userData?.user

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
      </div>
    </motion.div>
  )
}
