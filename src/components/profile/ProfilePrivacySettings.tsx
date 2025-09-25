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
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
        enabled ? 'bg-garden-500' : 'bg-gray-300'
      } ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
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
      className="flex items-center justify-between"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay, duration: 0.3 }}
    >
      <div className="flex items-start space-x-3">
        <div className="text-xl">{emoji}</div>
        <div className="flex-1">
          <div
            className={`font-medium ${disabled ? 'text-gray-400' : 'text-gray-900'}`}
          >
            {title}
          </div>
          <div
            className={`text-sm ${disabled ? 'text-gray-300' : 'text-gray-600'}`}
          >
            {description}
          </div>
        </div>
      </div>
      <ToggleSwitch enabled={enabled} onChange={onChange} disabled={disabled} />
    </motion.div>
  )
}

export function ProfilePrivacySettings({ user }: ProfilePrivacySettingsProps) {
  const { updatePreferences } = useUserStore()
  const { updatePrivacySettings } = useProfile()
  const [isUpdating, setIsUpdating] = useState(false)

  const handlePrivacyChange = async (
    key: keyof typeof user.preferences.privacy,
    value: boolean
  ) => {
    setIsUpdating(true)
    try {
      // Update locally first
      const newPrivacySettings = {
        ...user.preferences.privacy,
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
            enabled={user.preferences.privacy.showProfile}
            onChange={enabled => handlePrivacyChange('showProfile', enabled)}
            disabled={isUpdating}
            delay={0.1}
          />

          <PrivacySetting
            emoji="🌱"
            title="Поделиться садом"
            description="Разрешить просмотр вашего сада другим пользователям"
            enabled={user.preferences.privacy.shareGarden}
            onChange={enabled => handlePrivacyChange('shareGarden', enabled)}
            disabled={isUpdating}
            delay={0.15}
          />

          <PrivacySetting
            emoji="🏆"
            title="Показывать достижения"
            description="Делиться вашими достижениями с друзьями"
            enabled={user.preferences.privacy.shareAchievements}
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
            enabled={user.preferences.privacy.allowFriendRequests}
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
              enabled={user.preferences.privacy.cloudSync}
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
