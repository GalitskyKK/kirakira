import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { User } from '@/types'
import { updatePrivacySettings } from '@/api'

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
        enabled ? 'bg-garden-500' : 'bg-gray-300 dark:bg-gray-600'
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
}: PrivacySettingProps) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="flex min-w-0 flex-1 items-start gap-3">
        <div className="mt-0.5 flex-shrink-0 text-xl">{emoji}</div>
        <div className="min-w-0 flex-1">
          <div
            className={`font-medium leading-tight ${disabled ? 'text-neutral-400 dark:text-neutral-500' : 'text-neutral-900 dark:text-neutral-100'}`}
          >
            {title}
          </div>
          <div
            className={`mt-0.5 text-sm leading-tight ${disabled ? 'text-neutral-300 dark:text-neutral-600' : 'text-neutral-600 dark:text-neutral-400'}`}
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
    </div>
  )
}

export function ProfilePrivacySettings({ user }: ProfilePrivacySettingsProps) {
  const queryClient = useQueryClient()
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
      const newPrivacySettings = {
        ...safePrivacy,
        [key]: value,
      }

      // Обновляем на сервере если пользователь авторизован
      if (user.telegramId) {
        await updatePrivacySettings(user.telegramId, newPrivacySettings)
        // Инвалидируем кеш для обновления UI
        await queryClient.invalidateQueries({ queryKey: ['user'] })
      }
    } catch (error) {
      console.error('Failed to update privacy settings:', error)
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <div className="space-y-5">
      <PrivacySetting
        emoji="👁️"
        title="Показывать профиль"
        description="Другие пользователи могут видеть ваш профиль"
        enabled={safePrivacy.showProfile}
        onChange={enabled => handlePrivacyChange('showProfile', enabled)}
        disabled={isUpdating}
      />

      <PrivacySetting
        emoji="🌱"
        title="Поделиться садом"
        description="Разрешить просмотр вашего сада другим пользователям"
        enabled={safePrivacy.shareGarden}
        onChange={enabled => handlePrivacyChange('shareGarden', enabled)}
        disabled={isUpdating}
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
      />

      <div className="border-t border-neutral-200 pt-4 dark:border-neutral-700">
        <PrivacySetting
          emoji="☁️"
          title="Синхронизация с облаком"
          description="Сохранять данные в облаке для синхронизации между устройствами"
          enabled={safePrivacy.cloudSync}
          onChange={enabled => handlePrivacyChange('cloudSync', enabled)}
          disabled={isUpdating}
        />
      </div>

      {/* Privacy Info */}
      <div className="rounded-xl border border-kira-200 bg-kira-50 p-3 dark:border-kira-800 dark:bg-kira-900/30">
        <div className="flex items-start gap-3">
          <div className="text-kira-500 dark:text-kira-400">ℹ️</div>
          <div className="flex-1 text-xs">
            <div className="font-medium text-kira-800 dark:text-kira-200">
              О ваших данных
            </div>
            <div className="mt-1 text-kira-700 dark:text-kira-300">
              Данные о настроениях хранятся локально. Облачная синхронизация — только с вашего согласия.
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
