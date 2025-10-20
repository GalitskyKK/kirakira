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
        <div className="text-center">
          <div className="mb-4 text-6xl">😔</div>
          <h2 className="mb-2 text-xl font-bold text-gray-900 dark:text-gray-100">
            Пользователь не найден
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Пожалуйста, авторизуйтесь для просмотра настроек
          </p>
        </div>
      </div>
    )
  }

  return (
    <motion.div
      className="min-h-screen bg-gray-50 dark:bg-gray-900"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Header */}
      <div className="border-b bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <div className="flex items-center px-4 py-4">
          <button
            onClick={() => navigate(-1)}
            className="mr-3 flex items-center justify-center rounded-lg p-2 text-gray-600 transition-colors hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">
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
