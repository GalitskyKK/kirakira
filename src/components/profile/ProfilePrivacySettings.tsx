import { useState } from 'react'
import { motion } from 'framer-motion'
import { User } from '@/types'
import { useUserStore } from '@/stores'
import { useProfile } from '@/hooks'

interface ProfilePrivacySettingsProps {
  readonly user: User
}

interface ToggleSwitchProps {
  readonly enabled: boolean
  readonly onChange: (enabled: boolean) => void
  readonly disabled?: boolean
}

function ToggleSwitch({
  enabled,
  onChange,
  disabled = false,
}: ToggleSwitchProps) {
  return (
    <button
      onClick={() => !disabled && onChange(!enabled)}
      disabled={disabled}
      className={`relative inline-flex h-7 w-12 items-center rounded-full transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-garden-500 focus:ring-offset-2 ${
        enabled ? 'bg-garden-500' : 'bg-gray-300'
      } ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
      type="button"
      role="switch"
      aria-checked={enabled}
    >
      <span
        className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-lg transition-all duration-200 ease-in-out ${
          enabled ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  )
}

interface PrivacySettingProps {
  readonly emoji: string
  readonly title: string
  readonly description: string
  readonly enabled: boolean
  readonly onChange: (enabled: boolean) => void
  readonly disabled?: boolean
  readonly delay?: number
}

function PrivacySetting({
  emoji,
  title,
  description,
  enabled,
  onChange,
  disabled = false,
  delay = 0,
}: PrivacySettingProps) {
  return (
    <motion.div
      className="flex items-start justify-between gap-4 py-1"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay, duration: 0.3 }}
    >
      <div className="flex min-w-0 flex-1 items-start space-x-3">
        <div className="mt-0.5 flex-shrink-0 text-xl">{emoji}</div>
        <div className="min-w-0 flex-1">
          <div
            className={`font-medium leading-tight ${disabled ? 'text-gray-400' : 'text-gray-900'}`}
          >
            {title}
          </div>
          <div
            className={`mt-0.5 text-sm leading-tight ${disabled ? 'text-gray-300' : 'text-gray-600'}`}
          >
            {description}
          </div>
        </div>
      </div>
      <div className="mt-1 flex-shrink-0">
        <ToggleSwitch
          enabled={enabled}
          onChange={onChange}
          disabled={disabled}
        />
      </div>
    </motion.div>
  )
}

export function ProfilePrivacySettings({ user }: ProfilePrivacySettingsProps) {
  const { updatePreferences } = useUserStore()
  const { updatePrivacySettings } = useProfile()
  const [isUpdating, setIsUpdating] = useState(false)

  // Защита от undefined - создаем fallback значения для preferences.privacy
  const safePrivacy = user?.preferences?.privacy || {
    showProfile: true,
    shareGarden: true,
    shareAchievements: true,
    allowFriendRequests: true,
    cloudSync: false,
  }

  const handlePrivacyChange = async (
    key: keyof typeof safePrivacy,
    value: boolean
  ) => {
    setIsUpdating(true)
    try {
      // Update locally first
      const newPrivacySettings = {
        ...safePrivacy,
        [key]: value,
      }

      await updatePreferences({
        privacy: newPrivacySettings,
      })

      // Sync with server if user has Telegram ID
      if (user.telegramId) {
        await updatePrivacySettings(newPrivacySettings)
      }
    } catch (error) {
      console.error('Failed to update privacy settings:', error)
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <motion.div
      className="space-y-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.4 }}
    >
      <h2 className="text-lg font-semibold text-gray-900">🔒 Приватность</h2>

      <div className="rounded-2xl border border-gray-200 bg-white p-6">
        <div className="space-y-6">
          <PrivacySetting
            emoji="👁️"
            title="Показывать профиль"
            description="Другие пользователи могут видеть ваш профиль"
            enabled={safePrivacy.showProfile}
            onChange={enabled => handlePrivacyChange('showProfile', enabled)}
            disabled={isUpdating}
            delay={0.1}
          />

          <PrivacySetting
            emoji="🌱"
            title="Поделиться садом"
            description="Разрешить просмотр вашего сада другим пользователям"
            enabled={safePrivacy.shareGarden}
            onChange={enabled => handlePrivacyChange('shareGarden', enabled)}
            disabled={isUpdating}
            delay={0.15}
          />

          <PrivacySetting
            emoji="🏆"
            title="Показывать достижения"
            description="Делиться вашими достижениями с друзьями"
            enabled={safePrivacy.shareAchievements}
            onChange={enabled =>
              handlePrivacyChange('shareAchievements', enabled)
            }
            disabled={isUpdating}
            delay={0.2}
          />

          <PrivacySetting
            emoji="👥"
            title="Запросы в друзья"
            description="Разрешить другим отправлять запросы в друзья"
            enabled={safePrivacy.allowFriendRequests}
            onChange={enabled =>
              handlePrivacyChange('allowFriendRequests', enabled)
            }
            disabled={isUpdating}
            delay={0.25}
          />

          <div className="border-t border-gray-100 pt-4">
            <PrivacySetting
              emoji="☁️"
              title="Синхронизация с облаком"
              description="Сохранять данные в облаке для синхронизации между устройствами"
              enabled={safePrivacy.cloudSync}
              onChange={enabled => handlePrivacyChange('cloudSync', enabled)}
              disabled={isUpdating}
              delay={0.3}
            />
          </div>
        </div>
      </div>

      {/* Additional Privacy Info */}
      <motion.div
        className="rounded-xl border border-blue-200 bg-blue-50 p-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <div className="flex items-start space-x-3">
          <div className="text-blue-500">ℹ️</div>
          <div className="flex-1">
            <div className="text-sm font-medium text-blue-800">
              О ваших данных
            </div>
            <div className="mt-1 text-xs text-blue-600">
              Мы заботимся о вашей приватности. Данные о настроениях хранятся
              локально на вашем устройстве. Облачная синхронизация используется
              только при вашем согласии.
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}
