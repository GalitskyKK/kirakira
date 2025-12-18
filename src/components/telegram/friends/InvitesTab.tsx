import { motion } from 'framer-motion'
import { MessageCircle, QrCode, Users } from 'lucide-react'
import { Button, Card } from '@/components/ui'
import { useTranslation } from '@/hooks/useTranslation'

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
  const t = useTranslation()
  return (
    <motion.div
      key="invites"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-4"
    >
      <div className="text-center">
        <h3 className="text-lg font-semibold">{t.friends.invites.title}</h3>
        <p className="text-sm text-gray-600">{t.friends.invites.subtitle}</p>
      </div>

      <Card className="p-4">
        <div className="flex items-center space-x-4">
          <div className="flex-shrink-0 rounded-lg bg-green-100 p-3 dark:bg-green-900/30">
            <MessageCircle className="h-6 w-6 text-green-600" />
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="font-medium">{t.friends.invites.sendInvitation}</h4>
            <p className="text-sm text-gray-600">
              {t.friends.invites.sendInvitationDescription}
            </p>
          </div>
          <Button
            onClick={onInvite}
            className="flex-shrink-0 bg-green-500 hover:bg-green-600"
          >
            {t.friends.invites.send}
          </Button>
        </div>
      </Card>

      <Card className="p-4">
        <h4 className="mb-3 font-medium">{t.friends.invites.referralCode}</h4>
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
              {t.friends.invites.shareCode}
            </p>
            <div className="mt-3 flex items-center justify-center">
              <Button
                onClick={onShareQR}
                variant="outline"
                className="flex items-center space-x-2"
              >
                <QrCode className="h-4 w-4" />
                <span>{t.friends.invites.share}</span>
              </Button>
            </div>
          </>
        ) : (
          <div className="space-y-3">
            <div className="rounded-lg bg-gray-50 p-3 text-center dark:bg-gray-800">
              <p className="mb-2 text-sm text-gray-500">
                {t.friends.invites.creatingCode}
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
              {t.friends.invites.refreshData}
            </Button>
            <p className="text-center text-xs text-gray-500">
              {t.friends.invites.ifCodeNotAppeared}
            </p>
          </div>
        )}
      </Card>

      <Card className="p-4">
        <h4 className="mb-3 font-medium">{t.friends.invites.statistics}</h4>
        <div className="mb-4 grid grid-cols-2 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-blue-600">
              {friendsCount}
            </div>
            <div className="text-xs text-gray-600">
              {t.friends.invites.friends}
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-green-600">5</div>
            <div className="text-xs text-gray-600">
              {t.friends.invites.invited}
            </div>
          </div>
        </div>
        <div className="rounded-lg bg-purple-50 p-3 text-center text-sm text-purple-700 dark:bg-purple-900/30 dark:text-purple-200">
          <Users className="mx-auto mb-2 h-6 w-6" />
          {t.friends.invites.shareToGrow}
        </div>
      </Card>
    </motion.div>
  )
}
