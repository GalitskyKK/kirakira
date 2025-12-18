import { motion } from 'framer-motion'
import { CheckCircle, QrCode, Search, User as UserIcon } from 'lucide-react'
import { Button, Card, UserAvatar } from '@/components/ui'
import { useTranslation } from '@/hooks/useTranslation'
import { useLocaleStore } from '@/stores/localeStore'
import type { FriendApiSearchUser } from '@/types/api'
import type { SearchResult } from '@/hooks/useFriendsData'

interface FindTabProps {
  readonly referralSearchQuery: string
  readonly onReferralSearchChange: (value: string) => void
  readonly onSearchByReferral: () => void
  readonly searchResult: SearchResult | null
  readonly isSearching: boolean
  readonly globalSearchQuery: string
  readonly onGlobalSearchChange: (value: string) => void
  readonly onGlobalSearch: () => void
  readonly globalSearchResults: readonly FriendApiSearchUser[]
  readonly hasMoreResults: boolean
  readonly isLoadingMore: boolean
  readonly onLoadMore: () => void
  readonly onSendFriendRequest: (telegramId: number) => void
}

export function FindTab({
  referralSearchQuery,
  onReferralSearchChange,
  onSearchByReferral,
  searchResult,
  isSearching,
  globalSearchQuery,
  onGlobalSearchChange,
  onGlobalSearch,
  globalSearchResults,
  hasMoreResults,
  isLoadingMore,
  onLoadMore,
  onSendFriendRequest,
}: FindTabProps) {
  const t = useTranslation()
  const locale = useLocaleStore(state => state.locale)
  return (
    <motion.div
      key="find"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-4"
    >
      <div className="text-center">
        <h3 className="text-lg font-semibold">{t.friends.find.title}</h3>
        <p className="text-sm text-gray-600">{t.friends.find.subtitle}</p>
      </div>

      <Card className="p-4">
        <div className="space-y-4">
          <div className="flex items-center space-x-4">
            <div className="flex-shrink-0 rounded-lg bg-green-100 p-3 dark:bg-green-900/30">
              <Search className="h-6 w-6 text-green-600" />
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="font-medium">{t.friends.find.userSearch}</h4>
              <p className="text-sm text-gray-600">
                {t.friends.find.userSearchDescription}
              </p>
            </div>
          </div>

          <div className="flex space-x-2">
            <input
              type="text"
              placeholder={t.friends.find.enterNameOrUsername}
              value={globalSearchQuery}
              onChange={e => onGlobalSearchChange(e.target.value)}
              className="flex-1 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800"
            />
            <Button
              onClick={onGlobalSearch}
              disabled={isSearching}
              className="flex items-center space-x-2 bg-green-500 px-4 hover:bg-green-600"
            >
              <Search className="h-4 w-4" />
              <span>{t.friends.find.search}</span>
            </Button>
          </div>

          <div className="space-y-2">
            {globalSearchResults.length === 0 && !isSearching && (
              <p className="text-sm text-gray-500">
                {t.friends.find.enterQuery}
              </p>
            )}

            {globalSearchResults.map(user => (
              <Card key={user.telegram_id} className="p-3">
                <div className="flex items-center space-x-3">
                  <UserAvatar
                    photoUrl={user.photo_url}
                    name={`${user.first_name} ${user.last_name ?? ''}`.trim()}
                    username={user.username}
                    size="md"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center space-x-2">
                      <h4 className="truncate font-semibold">
                        {user.username ? `@${user.username}` : user.first_name}
                      </h4>
                      {user.relationshipStatus === 'accepted' && (
                        <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-700">
                          {t.friends.find.alreadyFriend}
                        </span>
                      )}
                    </div>
                    <div className="mt-1 text-xs text-gray-500">
                      {t.friends.find.registered}{' '}
                      {new Date(user.registration_date).toLocaleDateString(
                        locale === 'en' ? 'en-US' : 'ru-RU'
                      )}
                    </div>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => onSendFriendRequest(user.telegram_id)}
                    disabled={user.relationshipStatus === 'accepted'}
                    className="flex items-center space-x-1"
                  >
                    <UserIcon className="h-4 w-4" />
                    <span>{t.friends.find.add}</span>
                  </Button>
                </div>
              </Card>
            ))}

            {hasMoreResults && (
              <Button
                onClick={onLoadMore}
                disabled={isLoadingMore}
                variant="outline"
                className="w-full"
              >
                {isLoadingMore
                  ? t.friends.find.loading
                  : t.friends.find.showMore}
              </Button>
            )}
          </div>
        </div>
      </Card>

      <Card className="p-4">
        <div className="space-y-3">
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0 rounded-lg bg-blue-100 p-3 dark:bg-blue-900/30">
              <QrCode className="h-6 w-6 text-blue-600" />
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="font-medium">{t.friends.find.referralSearch}</h4>
              <p className="text-sm text-gray-600">
                {t.friends.find.referralSearchDescription}
              </p>
            </div>
          </div>

          <div className="flex space-x-2">
            <input
              type="text"
              placeholder={t.friends.find.enterReferralCode}
              value={referralSearchQuery}
              onChange={e => onReferralSearchChange(e.target.value)}
              className="flex-1 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800"
            />
            <Button
              onClick={onSearchByReferral}
              disabled={isSearching}
              className="flex items-center space-x-2 bg-blue-500 px-4 hover:bg-blue-600"
            >
              <QrCode className="h-4 w-4" />
              <span>{t.friends.find.search}</span>
            </Button>
          </div>

          {searchResult && (
            <Card className="p-3">
              <div className="flex items-center space-x-3">
                <UserAvatar
                  photoUrl={searchResult.user.photoUrl}
                  name={`${searchResult.user.firstName} ${searchResult.user.lastName ?? ''}`.trim()}
                  username={searchResult.user.username}
                  size="md"
                />
                <div className="min-w-0 flex-1">
                  <h4 className="truncate font-semibold">
                    {searchResult.user.username
                      ? `@${searchResult.user.username}`
                      : `${searchResult.user.firstName} ${searchResult.user.lastName ?? ''}`}
                  </h4>
                  <div className="mt-1 flex items-center space-x-2 text-xs text-gray-500">
                    <span>🌱 {searchResult.user.gardenElements}</span>
                    <span>🔥 {searchResult.user.currentStreak}</span>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {searchResult.canSendRequest ? (
                    <Button
                      size="sm"
                      onClick={() =>
                        onSendFriendRequest(searchResult.user.telegramId)
                      }
                      className="flex items-center space-x-1"
                    >
                      <CheckCircle className="h-4 w-4" />
                      <span>{t.friends.find.add}</span>
                    </Button>
                  ) : (
                    <span className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-600">
                      {t.friends.find.requestSent}
                    </span>
                  )}
                </div>
              </div>
            </Card>
          )}
        </div>
      </Card>
    </motion.div>
  )
}
