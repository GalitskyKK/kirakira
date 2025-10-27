import { motion } from 'framer-motion'
import { ArrowLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useUserSync } from '@/hooks/index.v2'
import { useTelegramId } from '@/hooks/useTelegramId'
import { ProfilePrivacySettings } from '@/components/profile/ProfilePrivacySettings'
import { ThemeSettings } from '@/components/settings/ThemeSettings'

export function SettingsPage() {
  const navigate = useNavigate()
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
      className="from-kira-50 min-h-screen bg-gradient-to-br via-garden-50 to-neutral-50 dark:from-neutral-900 dark:via-neutral-800 dark:to-neutral-900"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Header */}
      <div className="glass-card border-b border-neutral-200/50 shadow-sm dark:border-neutral-700/50">
        <div className="flex items-center px-4 py-4">
          <button
            onClick={() => navigate(-1)}
            className="mr-3 flex items-center justify-center rounded-lg p-2 text-neutral-600 transition-colors hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-700"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-xl font-bold text-neutral-900 dark:text-neutral-100">
            Настройки
          </h1>
        </div>
      </div>

      {/* Content */}
      <div className="space-y-6 p-4">
        <ThemeSettings />
        <ProfilePrivacySettings user={currentUser} />
      </div>
    </motion.div>
  )
}
