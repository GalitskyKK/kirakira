import { motion } from 'framer-motion'
import { CheckCircle, Clock, XCircle } from 'lucide-react'
import type { FriendRequest } from '@/hooks'
import { Button, Card, UserAvatar } from '@/components/ui'
import { useTranslation } from '@/hooks/useTranslation'
import { useLocaleStore } from '@/stores/localeStore'

interface RequestsTabProps {
  readonly incomingRequests: readonly FriendRequest[]
  readonly outgoingRequests: readonly FriendRequest[]
  readonly onRespond: (telegramId: number, action: 'accept' | 'decline') => void
}

export function RequestsTab({
  incomingRequests,
  outgoingRequests,
  onRespond,
}: RequestsTabProps) {
  const t = useTranslation()
  const locale = useLocaleStore(state => state.locale)
  return (
    <motion.div
      key="requests"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-4"
    >
      <div className="text-center">
        <h3 className="text-lg font-semibold">{t.friends.requests.title}</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {t.friends.requests.subtitle}
        </p>
      </div>

      {incomingRequests.length > 0 && (
        <div>
          <h4 className="mb-3 text-sm font-semibold text-gray-700">
            {t.friends.requests.incoming} ({incomingRequests.length})
          </h4>
          <div className="space-y-3">
            {incomingRequests.map((request, index) => (
              <motion.div
                key={request.requestId}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="p-4">
                  <div className="flex items-center space-x-4">
                    <UserAvatar
                      photoUrl={request.photoUrl}
                      name={`${request.firstName} ${request.lastName ?? ''}`.trim()}
                      username={request.username}
                      size="md"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center space-x-2">
                        <h4 className="truncate font-semibold">
                          {(request.username ?? '').length > 0
                            ? `@${request.username}`
                            : `${request.firstName} ${request.lastName ?? ''}`}
                        </h4>
                        {!(request.username ?? '').length &&
                          (request.firstName ?? '').length > 0 && (
                            <span className="text-xs text-gray-500">
                              {request.firstName} {request.lastName ?? ''}
                            </span>
                          )}
                      </div>
                      <div className="mt-1 flex items-center space-x-4 text-xs text-gray-500">
                        <span className="flex items-center space-x-1">
                          <span>🌱</span>
                          <span>{request.gardenElements}</span>
                        </span>
                        <span className="flex items-center space-x-1">
                          <span>🔥</span>
                          <span>{request.currentStreak}</span>
                        </span>
                        <span>
                          {new Date(request.requestDate).toLocaleDateString(
                            locale === 'en' ? 'en-US' : 'ru-RU'
                          )}
                        </span>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        onClick={() => onRespond(request.telegramId, 'accept')}
                        className="bg-green-500 hover:bg-green-600"
                      >
                        <CheckCircle className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onRespond(request.telegramId, 'decline')}
                        className="border-red-200 text-red-600 hover:bg-red-50"
                      >
                        <XCircle className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {outgoingRequests.length > 0 && (
        <div>
          <h4 className="mb-3 text-sm font-semibold text-gray-700">
            {t.friends.requests.outgoing} ({outgoingRequests.length})
          </h4>
          <div className="space-y-3">
            {outgoingRequests.map((request, index) => (
              <motion.div
                key={request.requestId}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="bg-gray-50 p-4">
                  <div className="flex items-center space-x-4">
                    <UserAvatar
                      photoUrl={request.photoUrl}
                      name={`${request.firstName} ${request.lastName ?? ''}`.trim()}
                      username={request.username}
                      size="md"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center space-x-2">
                        <h4 className="truncate font-semibold">
                          {(request.username ?? '').length > 0
                            ? `@${request.username}`
                            : `${request.firstName} ${request.lastName ?? ''}`}
                        </h4>
                        {!(request.username ?? '').length &&
                          (request.firstName ?? '').length > 0 && (
                            <span className="text-xs text-gray-500">
                              {request.firstName} {request.lastName ?? ''}
                            </span>
                          )}
                      </div>
                      <div className="mt-1 text-xs text-gray-500">
                        {t.friends.requests.sent}{' '}
                        {new Date(request.requestDate).toLocaleDateString(
                          locale === 'en' ? 'en-US' : 'ru-RU'
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 text-orange-600">
                      <Clock className="h-4 w-4" />
                      <span className="text-sm">
                        {t.friends.requests.waiting}
                      </span>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {incomingRequests.length === 0 && outgoingRequests.length === 0 && (
        <Card className="p-6 text-center">
          <Clock className="mx-auto mb-3 h-8 w-8 text-gray-400" />
          <h4 className="mb-2 font-medium">{t.friends.requests.noRequests}</h4>
          <p className="text-sm text-gray-600">
            {t.friends.requests.useReferralCodes}
          </p>
        </Card>
      )}
    </motion.div>
  )
}
