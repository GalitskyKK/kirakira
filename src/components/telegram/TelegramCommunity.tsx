import { Users, Heart } from 'lucide-react'
import { useTelegram } from '@/hooks'
import { useUserSync } from '@/hooks/index.v2'
import { useTelegramId } from '@/hooks/useTelegramId'
import { Card } from '@/components/ui'
import { FriendsList } from './FriendsList'
import { useTranslation } from '@/hooks/useTranslation'
import type { Garden, MoodEntry } from '@/types'

interface TelegramCommunityProps {
  readonly garden: Garden | null
  readonly recentMoods: readonly MoodEntry[]
}

export function TelegramCommunity({ garden: _garden }: TelegramCommunityProps) {
  const t = useTranslation()
  const { isTelegramEnv } = useTelegram()
  const telegramId = useTelegramId()
  const { data: userData } = useUserSync(telegramId, telegramId != null)
  const currentUser = userData?.user

  if (!isTelegramEnv) {
    return (
      <Card className="p-6 text-center">
        <Users className="mx-auto mb-4 h-12 w-12 text-blue-500" />
        <h3 className="mb-2 text-lg font-semibold">
          {t.pages.community.title}
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          {t.pages.community.telegramOnly}
        </p>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <div className="glass-card flex min-h-[56px] items-center justify-between rounded-2xl px-4 py-3">
        <div className="flex items-center gap-2 text-sm font-medium text-neutral-700 dark:text-neutral-200">
          <Heart className="h-4 w-4 text-kira-500" />
          <span>{t.pages.community.title}</span>
        </div>
        <div className="flex items-center gap-1 text-xs text-neutral-500 dark:text-neutral-400">
          <Users className="h-4 w-4" />
          <span>{t.pages.community.friends}</span>
        </div>
      </div>

      {/* Список друзей */}
      <FriendsList currentUser={currentUser ?? null} />
    </div>
  )
}
