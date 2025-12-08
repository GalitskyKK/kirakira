import { motion } from 'framer-motion'
import { MessageCircle, QrCode, Users } from 'lucide-react'
import { Button, Card } from '@/components/ui'

interface InvitesTabProps {
  readonly referralCode: string
  readonly friendsCount: number
  readonly onInvite: () => void
  readonly onShareQR: () => void
  readonly onRefetchReferral: () => void
}

export function InvitesTab({
  referralCode,
  friendsCount,
  onInvite,
  onShareQR,
  onRefetchReferral,
}: InvitesTabProps) {
  return (
    <motion.div
      key="invites"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-4"
    >
      <div className="text-center">
        <h3 className="text-lg font-semibold">Пригласить друзей</h3>
        <p className="text-sm text-gray-600">Поделитесь KiraKira с друзьями</p>
      </div>

      <Card className="p-4">
        <div className="flex items-center space-x-4">
          <div className="flex-shrink-0 rounded-lg bg-green-100 p-3 dark:bg-green-900/30">
            <MessageCircle className="h-6 w-6 text-green-600" />
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="font-medium">Отправить приглашение</h4>
            <p className="text-sm text-gray-600">
              Откроется список контактов Telegram для отправки приглашения
            </p>
          </div>
          <Button
            onClick={onInvite}
            className="flex-shrink-0 bg-green-500 hover:bg-green-600"
          >
            📤 Отправить
          </Button>
        </div>
      </Card>

      <Card className="p-4">
        <h4 className="mb-3 font-medium">Ваш реферальный код</h4>
        {referralCode ? (
          <>
            <div className="rounded-lg bg-gray-50 p-3 text-center dark:bg-gray-800">
              <p className="mb-2 text-2xl font-bold text-blue-600">
                {referralCode}
              </p>
              <p className="text-sm text-gray-600">
                https://t.me/KiraKiraBot?start=friend_{referralCode}
              </p>
            </div>
            <p className="mt-2 text-xs text-gray-500">
              Поделитесь этим кодом, чтобы друзья могли легко найти вас
            </p>
            <div className="mt-3 flex items-center justify-center">
              <Button
                onClick={onShareQR}
                variant="outline"
                className="flex items-center space-x-2"
              >
                <QrCode className="h-4 w-4" />
                <span>Поделиться</span>
              </Button>
            </div>
          </>
        ) : (
          <div className="space-y-3">
            <div className="rounded-lg bg-gray-50 p-3 text-center dark:bg-gray-800">
              <p className="mb-2 text-sm text-gray-500">
                Создание реферального кода...
              </p>
              <div className="flex justify-center">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-600 border-t-transparent"></div>
              </div>
            </div>
            <Button
              onClick={onRefetchReferral}
              size="sm"
              variant="outline"
              className="w-full"
            >
              🔄 Обновить данные
            </Button>
            <p className="text-center text-xs text-gray-500">
              Если код не появился, нажмите &quot;Обновить данные&quot;
            </p>
          </div>
        )}
      </Card>

      <Card className="p-4">
        <h4 className="mb-3 font-medium">Статистика приглашений</h4>
        <div className="mb-4 grid grid-cols-2 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-blue-600">
              {friendsCount}
            </div>
            <div className="text-xs text-gray-600">Друзей</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-green-600">5</div>
            <div className="text-xs text-gray-600">Приглашено</div>
          </div>
        </div>
        <div className="rounded-lg bg-purple-50 p-3 text-center text-sm text-purple-700 dark:bg-purple-900/30 dark:text-purple-200">
          <Users className="mx-auto mb-2 h-6 w-6" />
          Поделитесь кодом или отправьте приглашение, чтобы пополнить сад друзей
        </div>
      </Card>
    </motion.div>
  )
}
